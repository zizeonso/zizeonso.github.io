(function () {
  "use strict";
  const T = window.THREE;
  const D = window.Orbit3DDynamics;
  const originalArt = window.OrbitOriginalArt;
  const realisticCraft = window.OrbitRealisticSpacecraft;
  if (!T || !D || !window.Orbit3DSpacecraft) return;
  const texturePromises = new Map();
  const worlds = new Map();
  let renderer, stage, panel, camera, controls, current, transition, targets, blend;
  let width = 0, height = 0, pixelRatio = 0, frame, elapsed = 0, previousTime = 0, lastRender = 0, raf = 0;
  let paused = false, contextLost = false, busy = false, textRects = [];
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const tangent = new T.Vector3(), radial = new T.Vector3(), normal = new T.Vector3();
  const basis = new T.Matrix4(), projected = new T.Vector3();

  function loadTexture(key) {
    if (!texturePromises.has(key)) {
      const source = originalArt ? originalArt.source(key) : Promise.resolve(window.Orbit3DTextures?.[key]);
      texturePromises.set(key, source.then(function (value) { return new Promise(function (resolve, reject) {
        if (!value) return reject(new Error("Planet texture unavailable"));
        new T.TextureLoader().load(value, function (texture) {
          texture.colorSpace = T.SRGBColorSpace;
          texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
          resolve(texture);
        }, undefined, reject);
      }); }).catch(function (error) { texturePromises.delete(key); throw error; }));
    }
    return texturePromises.get(key);
  }

  function starfield() {
    const positions = [], colors = [];
    let seed = 2917;
    function random() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    for (let i = 0; i < 170; i++) {
      positions.push((random() - 0.5) * 12, (random() - 0.5) * 2.5, -22);
      const value = 0.1 + random() * 0.46;
      colors.push(value * 0.89, value * 0.95, value);
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
    return new T.Points(geometry, new T.PointsMaterial({ size: 1.1, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.75, depthWrite: false }));
  }

  function atmosphere(color, strength) {
    return new T.Mesh(new T.SphereGeometry(1.0035, 96, 48), new T.ShaderMaterial({
      transparent: true, depthWrite: false, side: T.BackSide, blending: T.AdditiveBlending,
      uniforms: { tint: { value: new T.Color(color) }, strength: { value: strength } },
      vertexShader: "varying vec3 normalV; varying vec3 viewV; void main(){vec4 p=modelViewMatrix*vec4(position,1.0); normalV=normalize(normalMatrix*normal);viewV=normalize(-p.xyz);gl_Position=projectionMatrix*p;}",
      fragmentShader: "uniform vec3 tint;uniform float strength;varying vec3 normalV;varying vec3 viewV;void main(){float rim=pow(1.0-abs(dot(normalize(normalV),normalize(viewV))),5.0);gl_FragColor=vec4(tint,rim*strength);}",
      toneMapped: false
    }));
  }

  async function makeWorld(id) {
    const cacheKey = originalArt ? originalArt.key(id) : id;
    if (worlds.has(cacheKey)) return worlds.get(cacheKey);
    const settings = D.scenes[id];
    if (!settings) throw new Error("Unsupported scene");
    const request = (async function () {
      const scene = new T.Scene(); scene.name = id; scene.background = new T.Color(0x000000);
      scene.add(new T.HemisphereLight(0xd7e1f2, 0x42404a, 1.15));
      const sun = new T.DirectionalLight(0xfff4e7, 2.6); sun.position.set(5, 11, 17); scene.add(sun);
      let art;
      const planet = new T.Group(); scene.add(planet);
      const orientation = new T.Group(); planet.add(orientation);
      let surface, clouds;
      if (originalArt) art = await originalArt.create(cacheKey, scene, loadTexture);
      else {
        scene.add(starfield());
        const map = await loadTexture(settings.map);
        surface = new T.Mesh(new T.SphereGeometry(1, 128, 96), new T.MeshStandardMaterial({ map, roughness: 0.98, metalness: 0 }));
        orientation.add(surface);
        if (id === "earth-orbit") {
          const cloudMap = await loadTexture("clouds");
          clouds = new T.Mesh(new T.SphereGeometry(1.0018, 96, 64), new T.MeshStandardMaterial({ color: 0xe1e7ed, alphaMap: cloudMap, transparent: true, opacity: 0.36, roughness: 1, depthWrite: false }));
          orientation.add(clouds);
        }
        if (settings.atmosphere) planet.add(atmosphere(settings.atmosphere, id === "earth-orbit" ? 0.52 : 0.13));
      }
      const fleet = [];
      const specifications = realisticCraft ? realisticCraft.fleet(id, settings.fleet) : settings.fleet;
      for (const spec of specifications) {
        const attitude = new T.Group();
        const model = realisticCraft ? await realisticCraft.create(spec.kind, renderer) : window.Orbit3DSpacecraft.create(spec.kind);
        model.rotation.set(0.4, 0.3, -0.12);
        attitude.add(model); scene.add(attitude);
        fleet.push({ spec, attitude, model, visibility: 1 });
      }
      return { id, settings, scene, planet, orientation, surface, clouds, fleet, art };
    }());
    worlds.set(cacheKey, request);
    request.catch(function () { worlds.delete(cacheKey); });
    return request;
  }

  async function prepareWorld(id) {
    let world;
    do { world = await makeWorld(id); } while (originalArt && world.art.value !== originalArt.key(id));
    return world;
  }

  function updateTextRects() {
    textRects = [...document.querySelectorAll(".profile, .intro > p, .topic-list, .section-heading, .news-list > li, .research-entry h3, .research-entry p, .publication-body, .timeline article, .capabilities > div, .research-abstract, .detail-header, .insight-entry")]
      .map(function (element) { const r = element.getBoundingClientRect(); return { left: r.left - 8, right: r.right + 8, top: r.top - 8, bottom: r.bottom + 8, profile: element.classList.contains("profile") }; })
      .filter(function (r) { return r.bottom > 0 && r.top < height; });
  }

  function updateWorld(world, delta) {
    let sceneFrame = frame;
    if (world.art) sceneFrame = originalArt.update(world.art, width, height, elapsed);
    else {
    world.planet.position.y = frame.centerY;
    world.planet.scale.setScalar(frame.radius);
    const lat = world.settings.latitude * Math.PI / 180;
    const lon = world.settings.longitude * Math.PI / 180;
    const location = new T.Vector3(Math.cos(lon) * Math.cos(lat), Math.sin(lat), -Math.sin(lon) * Math.cos(lat));
    world.orientation.quaternion.setFromUnitVectors(location, new T.Vector3(0, 0.958, 0.287).normalize());
    world.surface.rotation.y = D.spin(elapsed, world.settings.period);
    if (world.clouds) world.clouds.rotation.y = D.spin(elapsed, world.settings.period * 0.83) + 0.015;
    }
    world.fleet.forEach(function (craft) {
      const orbitSpec = realisticCraft ? { ...craft.spec, phase: realisticCraft.phase(craft.spec, sceneFrame, width) } : craft.spec;
      const p = D.orbit(elapsed, orbitSpec, sceneFrame);
      craft.attitude.position.set(p.x, p.y, p.z);
      tangent.set(...p.tangent).normalize(); radial.set(...p.radial).normalize();
      normal.crossVectors(tangent, radial).normalize();
      basis.makeBasis(tangent, radial, normal);
      craft.attitude.quaternion.setFromRotationMatrix(basis);
      const mobile = width <= 820;
      const pixels = realisticCraft ? realisticCraft.size(craft.spec, width) : craft.spec.size * (mobile ? 0.59 : 1) * (originalArt ? 0.76 : 1);
      const distanceFactor = 0.88 + 0.14 * Math.cos((p.phase - 0.5) * Math.PI);
      craft.attitude.scale.setScalar(pixels * 2 / height / craft.model.userData.width * distanceFactor);
      projected.copy(craft.attitude.position).project(camera);
      const x = (projected.x + 1) * width / 2, y = (1 - projected.y) * height / 2;
      const underText = textRects.find(function (r) { return x + pixels / 2 > r.left && x - pixels / 2 < r.right && y + pixels / 3 > r.top && y - pixels / 3 < r.bottom; });
      const target = underText ? (underText.profile ? 0 : 0.12) : 1;
      craft.visibility += (target - craft.visibility) * (1 - Math.exp(-Math.max(delta, 0.016) * 5));
      craft.model.visible = craft.visibility > 0.025;
      if (realisticCraft) realisticCraft.update(craft.model, craft.spec, p);
      craft.model.userData.materials.forEach(function (material) {
        material.transparent = !!craft.model.userData.realistic || craft.visibility < 0.99;
        material.opacity = craft.visibility;
      });
    });
  }

  function render(delta = 0) {
    if (!current || contextLost) return;
    updateWorld(current, delta);
    if (transition) {
      updateWorld(transition.from, delta);
      renderer.setRenderTarget(targets[0]); renderer.render(transition.from.scene, camera);
      renderer.setRenderTarget(targets[1]); renderer.render(current.scene, camera);
      renderer.setRenderTarget(null);
      blend.material.uniforms.progress.value = transition.progress;
      renderer.render(blend.scene, blend.camera);
    } else { renderer.setRenderTarget(null); renderer.render(current.scene, camera); }
  }

  function schedule() {
    if (!raf && !document.hidden && !contextLost && (transition || (!paused && !motion.matches))) raf = requestAnimationFrame(tick);
  }
  function tick(time) {
    raf = 0;
    const delta = previousTime ? Math.min((time - previousTime) / 1000, 0.08) : 0;
    previousTime = time;
    if (!paused && !motion.matches) elapsed += delta;
    if (transition) {
      transition.progress = Math.min(1, transition.progress + delta / 1.6);
      if (transition.progress >= 1) {
        const complete = transition.complete;
        transition = null;
        complete();
      }
    }
    if (time - lastRender >= 1000 / 30) { render((time - lastRender) / 1000); lastRender = time; }
    schedule();
  }

  function resize() {
    if (!renderer) return;
    const rect = stage.getBoundingClientRect();
    const nextWidth = Math.max(1, rect.width), nextHeight = Math.max(1, rect.height);
    const nextRatio = Math.min(window.devicePixelRatio || 1, realisticCraft ? 2 : nextWidth <= 820 ? 1.25 : 1.5);
    if (width === nextWidth && height === nextHeight && pixelRatio === nextRatio) { updateTextRects(); return; }
    width = nextWidth; height = nextHeight; pixelRatio = nextRatio;
    frame = D.framing(width, height);
    camera.left = -frame.aspect; camera.right = frame.aspect;
    camera.top = 1; camera.bottom = -1; camera.updateProjectionMatrix();
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    const size = renderer.getDrawingBufferSize(new T.Vector2());
    targets.forEach(function (target) { target.setSize(size.x, size.y); });
    updateTextRects(); render();
    if (originalArt && current && current.art.value !== originalArt.key(current.id)) {
      const id = current.id;
      makeWorld(id).then(function (world) {
        if (current.id === id && world.art.value === originalArt.key(id)) { current = world; render(); }
      }).catch(function () { /* Retain the decoded image until another resize. */ });
    }
  }

  function updatePause() {
    const button = document.getElementById("orbit3DMotionToggle");
    const stopped = paused || motion.matches;
    button.disabled = !current || motion.matches || contextLost;
    button.setAttribute("aria-pressed", String(stopped));
    const label = motion.matches ? "Motion reduced by system preferences" : originalArt ? (paused ? "Resume scene motion" : "Pause scene motion") : paused ? "Resume orbital motion and planet rotation" : "Pause orbital motion and planet rotation";
    button.setAttribute("aria-label", label); button.title = label;
    const nodes = window.PlanetaryIcons?.[stopped ? "Play" : "Pause"];
    if (nodes) {
      const namespace = "http://www.w3.org/2000/svg", icon = document.createElementNS(namespace, "svg");
      Object.entries({ viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "1.6", "stroke-linecap": "round", "stroke-linejoin": "round", class: "icon", "aria-hidden": "true" }).forEach(function ([key, value]) { icon.setAttribute(key, value); });
      nodes.forEach(function ([tag, attributes]) { const item = document.createElementNS(namespace, tag); Object.entries(attributes).forEach(function ([key, value]) { item.setAttribute(key, value); }); icon.appendChild(item); });
      button.replaceChildren(icon);
    }
    if (stopped || document.hidden || contextLost) { if (raf) cancelAnimationFrame(raf); raf = 0; previousTime = 0; }
    schedule();
  }

  function initialize(config) {
    stage = document.getElementById("orbit3DStage");
    panel = document.querySelector(".scene-panel");
    if (!stage || !panel) return false;
    try {
      renderer = new T.WebGLRenderer({ alpha: false, antialias: true, powerPreference: "low-power" });
      renderer.outputColorSpace = T.SRGBColorSpace;
      camera = new T.OrthographicCamera(-1, 1, 1, -1, 0.1, 160);
      camera.position.set(0, 0, 50); camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();
      stage.appendChild(renderer.domElement);
      renderer.domElement.setAttribute("aria-hidden", "true");
      targets = [new T.WebGLRenderTarget(1, 1), new T.WebGLRenderTarget(1, 1)];
      const scene = new T.Scene(), blendCamera = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const material = new T.ShaderMaterial({ depthTest: false, depthWrite: false, uniforms: { previous: { value: targets[0].texture }, next: { value: targets[1].texture }, progress: { value: 0 } },
        vertexShader: "varying vec2 uvV;void main(){uvV=uv;gl_Position=vec4(position.xy,0.0,1.0);}",
        fragmentShader: "uniform sampler2D previous;uniform sampler2D next;uniform float progress;varying vec2 uvV;void main(){float p=smoothstep(0.0,1.0,progress);gl_FragColor=mix(texture2D(previous,uvV),texture2D(next,uvV),p);\n#include <colorspace_fragment>\n}" });
      scene.add(new T.Mesh(new T.PlaneGeometry(2, 2), material));
      blend = { scene, camera: blendCamera, material };
      controls = config;
      resize();
    } catch { renderer?.dispose(); stage.replaceChildren(); return false; }

    config.button.addEventListener("pointerenter", function () { makeWorld(config.nextScene()).catch(function () {}); });
    config.button.addEventListener("focus", function () { makeWorld(config.nextScene()).catch(function () {}); });
    config.button.addEventListener("click", async function () {
      if (busy || !current || contextLost) return;
      busy = true;
      config.button.setAttribute("aria-busy", "true"); config.button.setAttribute("aria-disabled", "true");
      try {
        const id = config.nextScene();
        const next = await prepareWorld(id);
        const from = current; current = next;
        config.setScene(id);
        if (motion.matches || document.hidden) render();
        else await new Promise(function (complete) { transition = { from, progress: 0, complete }; previousTime = 0; schedule(); });
      } catch { config.button.setAttribute("aria-label", "Scene unavailable. Try again"); }
      finally { busy = false; config.button.setAttribute("aria-busy", "false"); config.button.setAttribute("aria-disabled", "false"); }
    });
    document.getElementById("orbit3DMotionToggle").addEventListener("click", function () { paused = !paused; updatePause(); });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden && transition) { const complete = transition.complete; transition = null; complete(); }
      updatePause();
    });
    motion.addEventListener("change", function () {
      if (motion.matches && transition) { const complete = transition.complete; transition = null; complete(); render(); }
      updatePause();
    });
    let rectFrame = 0;
    window.addEventListener("scroll", function () { if (!rectFrame) rectFrame = requestAnimationFrame(function () { rectFrame = 0; updateTextRects(); if (paused || motion.matches) render(); }); }, { passive: true });
    window.addEventListener("resize", resize, { passive: true });
    window.visualViewport?.addEventListener("resize", resize, { passive: true });
    renderer.domElement.addEventListener("webglcontextlost", function (event) {
      event.preventDefault(); contextLost = true;
      panel.removeAttribute("data-webgl-ready");
      if (transition) { const complete = transition.complete; transition = null; complete(); }
      updatePause();
    });
    renderer.domElement.addEventListener("webglcontextrestored", function () { contextLost = false; panel.dataset.webglReady = "true"; resize(); updatePause(); });
    prepareWorld(config.getScene()).then(function (world) {
      current = world; render(); panel.dataset.webglReady = "true"; updatePause();
    }).catch(function () {
      panel.removeAttribute("data-webgl-ready");
      config.button.disabled = false;
      config.button.addEventListener("click", function () { if (!current) config.setScene(config.nextScene()); });
    });
    return true;
  }
  window.Orbit3DPreview = Object.freeze({ connect: initialize });
}());
