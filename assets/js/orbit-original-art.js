(function () {
  "use strict";
  const T = window.THREE;
  if (!T) return;
  const records = {
    "earth-orbit": { desktop: { filename: "terra-hong-kong-v1.png", width: 1672, height: 941, limb: [0.727949, 0.699256, 0.718385] }, portrait: { filename: "terra-hong-kong-mobile-v1.png", width: 887, height: 1774, limb: [0.780722, 0.772266, 0.783540] } },
    "lunar-orbit": { desktop: { filename: "luna-orbit-aligned-v1.png", width: 1672, height: 941, limb: [0.731137, 0.697131, 0.723698] }, portrait: { filename: "luna-orbit-aligned-mobile-v1.png", width: 887, height: 1774, limb: [0.784667, 0.775648, 0.786922] } },
    "mars-orbit": { desktop: { filename: "mars-orbit-aligned-v1.png", width: 1672, height: 941, limb: [0.719447, 0.688629, 0.714134] }, portrait: { filename: "mars-orbit-aligned-mobile-v1.png", width: 887, height: 1774, limb: [0.778467, 0.769448, 0.781285] } }
  };
  const payloads = new Map();
  function orientation() { return window.matchMedia("(max-aspect-ratio: 3/4)").matches ? "portrait" : "desktop"; }
  function key(id) { return `${id}/${orientation()}`; }
  function record(value) { const [id, format] = value.split("/"); return records[id][format]; }
  function curve(value) {
    const [left, center, right] = record(value).limb;
    return { center, quadratic: ((left + right) / 2 - center) / 0.09, linear: (right - left) / 0.6 };
  }
  function layout(value, width, height) {
    const image = record(value), portrait = value.endsWith("/portrait");
    const scale = Math.max(width / image.width, height / image.height);
    const drawWidth = image.width * scale, drawHeight = image.height * scale;
    const shift = portrait ? Math.max(0.02 * height, 0.44 * width - 0.2 * height) : Math.max(0.07 * height, 0.16875 * width - 0.23 * height);
    return { width, height, drawWidth, drawHeight, shift, curve: curve(value) };
  }
  function imageUV(value, width, height, x, y, time = 0) {
    const fit = layout(value, width, height);
    let u = (x + (fit.drawWidth - width) / 2) / fit.drawWidth;
    let v = 1 - (y - (height - fit.drawHeight + fit.shift)) / fit.drawHeight;
    const d = u - 0.5, horizon = fit.curve.center + fit.curve.quadratic * d * d + fit.curve.linear * d;
    const level = Math.max(0, Math.min(1, ((1 - v) - horizon - 0.02) / 0.07));
    const inside = level * level * (3 - 2 * level);
    const curvature = Math.sqrt(Math.max(0.1, 1 - d * d * 2.2));
    u += Math.sin(time / 115) * 0.008 * inside * curvature;
    return { u, v, inside };
  }
  function frame(value, width, height) {
    const fit = layout(value, width, height), aspect = width / height;
    const horizonY = height - fit.drawHeight + fit.shift + fit.curve.center * fit.drawHeight;
    const dx = width / (2 * fit.drawWidth);
    const sag = fit.curve.quadratic * dx * dx * fit.drawHeight * 2 / height;
    const radius = Math.max(3, (aspect * aspect + sag * sag) / (2 * Math.max(0.01, sag)));
    const arcExtent = Math.asin(Math.min(0.8, aspect * 1.6 / (radius * 1.065)));
    return { aspect, radius, arcExtent, centerY: 1 - horizonY * 2 / height - radius, horizon: horizonY / height };
  }
  function source(value) {
    if (window.OrbitOriginalFrames?.[value]) return Promise.resolve(window.OrbitOriginalFrames[value]);
    if (!payloads.has(value)) {
      payloads.set(value, new Promise(function (resolve, reject) {
        const script = document.createElement("script");
        const timer = setTimeout(function () { script.remove(); reject(new Error("Artwork loading timed out")); }, 12000);
        script.src = `assets/js/orbit-original-data/${value.replace("/", "-")}.js`;
        script.onload = function () {
          clearTimeout(timer); script.remove();
          const data = window.OrbitOriginalFrames?.[value];
          if (data) resolve(data); else reject(new Error("Artwork payload unavailable"));
        };
        script.onerror = function () { clearTimeout(timer); script.remove(); reject(new Error("Artwork unavailable")); };
        document.head.appendChild(script);
      }).catch(function (error) { payloads.delete(value); throw error; }));
    }
    return payloads.get(value);
  }

  async function create(value, scene, loadTexture) {
    const map = await loadTexture(value);
    const fit = curve(value);
    const material = new T.ShaderMaterial({
      depthWrite: false, depthTest: false,
      uniforms: { artwork: { value: map }, viewport: { value: new T.Vector2(1, 1) }, drawing: { value: new T.Vector2(1, 1) }, shift: { value: 0 }, limb: { value: new T.Vector3(fit.center, fit.quadratic, fit.linear) }, time: { value: 0 } },
      vertexShader: "varying vec2 imagePosition;void main(){imagePosition=uv;gl_Position=vec4(position.xy,0.999,1.0);}",
      fragmentShader: `uniform sampler2D artwork;
uniform vec2 viewport;uniform vec2 drawing;uniform float shift;uniform vec3 limb;uniform float time;
varying vec2 imagePosition;
void main(){
  vec2 uv=vec2((imagePosition.x*viewport.x+(drawing.x-viewport.x)*0.5)/drawing.x,(imagePosition.y*viewport.y+shift)/drawing.y);
  if(uv.y<0.0||uv.y>1.0){gl_FragColor=vec4(0.0,0.0,0.0,1.0);return;}
  float d=uv.x-0.5;
  float horizon=limb.x+limb.y*d*d+limb.z*d;
  float inside=smoothstep(horizon+0.02,horizon+0.09,1.0-uv.y);
  // Keep the sky and the limb untouched; only the inner terrain moves gently.
  uv.x+=sin(time/115.0)*0.008*inside*sqrt(max(0.1,1.0-d*d*2.2));
  gl_FragColor=texture2D(artwork,uv);
  #include <colorspace_fragment>
}`
    });
    const artwork = new T.Mesh(new T.PlaneGeometry(2, 2), material);
    artwork.frustumCulled = false; artwork.renderOrder = -1000; scene.add(artwork);
    // Depth only: this sphere never supplies visible terrain or shading.
    const planet = new T.Mesh(new T.SphereGeometry(1, 128, 96), new T.MeshBasicMaterial({ colorWrite: false, depthWrite: true }));
    planet.renderOrder = -500; scene.add(planet);
    return { value, artwork, planet, material };
  }
  function update(art, width, height, time) {
    const fit = layout(art.value, width, height), pose = frame(art.value, width, height);
    art.material.uniforms.viewport.value.set(width, height);
    art.material.uniforms.drawing.value.set(fit.drawWidth, fit.drawHeight);
    art.material.uniforms.shift.value = fit.shift;
    art.material.uniforms.time.value = time;
    art.planet.position.y = pose.centerY; art.planet.scale.setScalar(pose.radius);
    return pose;
  }
  window.OrbitOriginalArt = Object.freeze({ key, orientation, record, curve, layout, imageUV, frame, source, create, update });
}());
