(function () {
  "use strict";
  const T = window.THREE;
  const base = window.OrbitOriginalArt;
  if (!T || !base) return;
  const settings = Object.freeze({
    "earth-orbit": { drift: 0.06, lift: 0.007, light: 0.14, haze: 0.022, tint: 0x9bcfff, clouds: 0.18 },
    "lunar-orbit": { drift: 0.05, lift: 0.0055, light: 0.16, haze: 0, tint: 0xc9d5e6, clouds: 0 },
    "mars-orbit": { drift: 0.055, lift: 0.006, light: 0.15, haze: 0.012, tint: 0xffbd94, clouds: 0 }
  });
  const cloudKey = "cinematic-clouds";
  let cloudRequest;
  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  function state(value, elapsed, width, height) {
    const time = elapsed * 0.8;
    const scene = settings[value.split("/")[0]];
    const quiet = width <= 820 ? 0.8 : 1;
    return {
      drift: (Math.sin(time / 26) + 0.12 * Math.sin(time / 103)) * scene.drift * quiet,
      lift: Math.sin(time / 48) * scene.lift * quiet,
      approach: (1 - Math.cos(time / 76)) * 0.012 * quiet,
      daylight: 0.42 + 0.58 * (0.5 - 0.5 * Math.cos(time / 34)),
      sun: 0.15 + 0.4 * Math.sin(time / 78),
      cloudOffset: time / 1600,
      cloudOpacity: scene.clouds * (width <= 820 ? 0.8 : 1),
      liftPixels: Math.sin(time / 48) * scene.lift * quiet * base.layout(value, width, height).drawHeight
    };
  }

  function sample(value, width, height, x, y, time = 0) {
    const fit = base.layout(value, width, height), motion = state(value, time, width, height);
    const u = (x + (fit.drawWidth - width) / 2) / fit.drawWidth;
    const imageY = (y - (height - fit.drawHeight + fit.shift)) / fit.drawHeight;
    const horizon = u => { const d = u - 0.5; return fit.curve.center + fit.curve.quadratic * d * d + fit.curve.linear * d; };
    const depth = imageY - horizon(u) - motion.lift;
    const ground = smooth(0, 0.16, depth);
    const edge = smooth(0, 0.085, u) * (1 - smooth(0.915, 1, u));
    const curve = Math.sqrt(Math.max(0.1, 1 - (u - 0.5) ** 2 * 2.2));
    const planetU = u + motion.drift * ground * edge * curve;
    const planetY = horizon(planetU) + depth * (1 - motion.approach);
    return { u, v: 1 - imageY, planetU, planetV: 1 - planetY, depth, layer: smooth(-0.045, 0.02, depth) };
  }

  function frame(value, width, height, time = 0) {
    const pose = base.frame(value, width, height), motion = state(value, time, width, height);
    return { ...pose, centerY: pose.centerY - motion.liftPixels * 2 / height, horizon: pose.horizon + motion.liftPixels / height };
  }

  function source(value) {
    if (value !== cloudKey) return base.source(value);
    if (window.OrbitCinematicCloudFrame) return Promise.resolve(window.OrbitCinematicCloudFrame);
    if (!cloudRequest) {
      cloudRequest = new Promise(function (resolve, reject) {
        const script = document.createElement("script");
        const timer = setTimeout(function () { script.remove(); reject(new Error("Cloud texture loading timed out")); }, 12000);
        script.src = "assets/js/orbit-cinematic-cloud-data.js?v=1";
        script.onload = function () {
          clearTimeout(timer); script.remove();
          if (window.OrbitCinematicCloudFrame) resolve(window.OrbitCinematicCloudFrame);
          else reject(new Error("Cloud texture unavailable"));
        };
        script.onerror = function () { clearTimeout(timer); script.remove(); reject(new Error("Cloud texture unavailable")); };
        document.head.appendChild(script);
      }).catch(function (error) { cloudRequest = null; throw error; });
    }
    return cloudRequest;
  }

  const fragmentShader = `
uniform sampler2D artwork;
uniform sampler2D cloudMap;
uniform vec2 viewport;
uniform vec2 drawing;
uniform float shift;
uniform vec3 limb;
uniform float time;
uniform vec4 travel;
uniform vec4 sunlight;
uniform vec3 rimTint;
uniform vec2 cloudMotion;
varying vec2 imagePosition;

float horizon(float u) {
  float d = u - 0.5;
  return limb.x + limb.y * d * d + limb.z * d;
}

void main() {
  vec2 uv = vec2((imagePosition.x * viewport.x + (drawing.x - viewport.x) * 0.5) / drawing.x,
                 (imagePosition.y * viewport.y + shift) / drawing.y);
  if (uv.y < 0.0 || uv.y > 1.0) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
  vec3 color = texture2D(artwork, uv).rgb;
  float depth = 1.0 - uv.y - horizon(uv.x) - travel.y;

  // Leave the distant sky unchanged; advect only the curved foreground layer.
  if (depth > -0.045) {
    float ground = smoothstep(0.0, 0.16, depth);
    float edge = smoothstep(0.0, 0.085, uv.x) * (1.0 - smoothstep(0.915, 1.0, uv.x));
    float d = uv.x - 0.5;
    float u = uv.x + travel.x * ground * edge * sqrt(max(0.1, 1.0 - d * d * 2.2));
    float v = 1.0 - (horizon(u) + depth * (1.0 - travel.z));
    vec3 surface = texture2D(artwork, clamp(vec2(u, v), vec2(0.001), vec2(0.999))).rgb;
    float layer = smoothstep(-0.045, 0.02, depth);
    color = mix(color, surface, layer);

    float lightDistance = (uv.x - sunlight.x) / 0.43;
    float side = exp(-lightDistance * lightDistance);
    float terrain = smoothstep(0.0, 0.055, depth);
    color *= 1.0 + side * sunlight.y * travel.w * terrain;

    // Luna has reflected side light only, never an atmospheric halo.
    float rimDistance = depth / 0.012;
    float rim = exp(-rimDistance * rimDistance) * side;
    color += rimTint * sunlight.z * travel.w * rim;

    if (cloudMotion.y > 0.0 && depth > 0.008) {
      vec2 cloudUV = vec2(0.18 + u * 0.62 + travel.x * 0.35 + cloudMotion.x,
                          0.16 + sqrt(max(0.0, depth)) * 0.58);
      float clouds = texture2D(cloudMap, cloudUV).r;
      float opacity = smoothstep(0.08, 0.62, clouds) * cloudMotion.y * terrain;
      color = mix(color, vec3(0.73, 0.81, 0.9), opacity);
    }
  }
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}`;

  async function create(value, scene, loadTexture) {
    const art = await base.create(value, scene, loadTexture);
    const profile = settings[value.split("/")[0]];
    let clouds = art.material.uniforms.artwork.value;
    let opacity = profile.clouds;
    if (opacity) {
      try { clouds = await loadTexture(cloudKey); clouds.wrapS = T.RepeatWrapping; clouds.needsUpdate = true; }
      catch { opacity = 0; }
    }
    Object.assign(art.material.uniforms, {
      cloudMap: { value: clouds },
      travel: { value: new T.Vector4(0, 0, 0, 0.35) },
      sunlight: { value: new T.Vector4(0.15, profile.light, profile.haze, 0) },
      rimTint: { value: new T.Color(profile.tint) },
      cloudMotion: { value: new T.Vector2(0, opacity) }
    });
    art.cloudsAvailable = opacity > 0;
    art.material.fragmentShader = fragmentShader;
    art.material.needsUpdate = true;
    return art;
  }

  function update(art, width, height, time) {
    base.update(art, width, height, time);
    const motion = state(art.value, time, width, height), pose = frame(art.value, width, height, time);
    art.material.uniforms.travel.value.set(motion.drift, motion.lift, motion.approach, motion.daylight);
    art.material.uniforms.sunlight.value.x = motion.sun;
    art.material.uniforms.cloudMotion.value.set(motion.cloudOffset, art.cloudsAvailable ? motion.cloudOpacity : 0);
    art.planet.position.y = pose.centerY;
    return pose;
  }

  window.OrbitCinematicMotion = Object.freeze({ settings, state, sample, frame, fragmentShader });
  window.OrbitOriginalArt = Object.freeze({ ...base, source, create, update, frame });
}());
