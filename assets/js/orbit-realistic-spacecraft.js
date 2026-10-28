(function () {
  "use strict";
  const T = window.THREE;
  if (!T) return;
  const textures = new Map(), payloads = new Map();

  function family(kind) {
    if (kind.startsWith("sentinel-2")) return "sentinel-2";
    if (kind.startsWith("sentinel")) return "sentinel-1";
    if (kind.startsWith("tianwen")) return "tianwen";
    return "change";
  }
  function source(key) {
    if (window.OrbitRealisticFrames?.[key]) return Promise.resolve(window.OrbitRealisticFrames[key]);
    if (!payloads.has(key)) {
      payloads.set(key, new Promise(function (resolve, reject) {
        const script = document.createElement("script");
        const timeout = setTimeout(function () { script.remove(); reject(new Error("Spacecraft loading timed out")); }, 12000);
        function finish(error) {
          clearTimeout(timeout); script.remove();
          if (error) reject(error);
          else {
            const value = window.OrbitRealisticFrames?.[key];
            if (value) resolve(value); else reject(new Error("Spacecraft image unavailable"));
          }
        }
        script.src = `assets/js/orbit-realistic-data/${key}.js`;
        script.onload = function () { finish(); };
        script.onerror = function () { finish(new Error("Spacecraft image unavailable")); };
        document.head.appendChild(script);
      }).catch(function (error) { payloads.delete(key); throw error; }));
    }
    return payloads.get(key);
  }
  function texture(key, renderer) {
    if (!textures.has(key)) {
      textures.set(key, source(key).then(function (data) {
        return new Promise(function (resolve, reject) {
          new T.TextureLoader().load(data, function (map) {
            map.colorSpace = T.SRGBColorSpace;
            map.minFilter = T.LinearMipmapLinearFilter;
            map.magFilter = T.LinearFilter;
            map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
            resolve(map);
          }, undefined, reject);
        });
      }).catch(function (error) { textures.delete(key); throw error; }));
    }
    return textures.get(key);
  }
  function fleet(id, original) {
    const selected = id === "lunar-orbit" ? original.slice(0, 2) : original;
    return selected.map(function (value, index) {
      const item = { ...value };
      item.period = value.period * 1.6;
      if (id === "earth-orbit") item.kind = index === 1 ? "sentinel-2" : "sentinel-1";
      item.size = index === 0 ? (id === "lunar-orbit" ? 136 : 148) : index === 1 ? 88 : 58;
      if (index === 1) item.phase = 0.78;
      item.lane = index === 0 ? "left" : index === 1 ? "right" : "center";
      item.roll = index === 0 ? -0.045 : 0.07;
      return item;
    });
  }
  function gutter(width) { return width <= 1100 ? 40 : (width - Math.min(1040, width - 96)) / 2; }
  function size(spec, width) {
    if (width <= 820) return spec.size * 0.59;
    return Math.min(spec.size, Math.max(24, gutter(width) - 16));
  }
  function phase(spec, frame, width) {
    if (width <= 820 || spec.lane === "center") return spec.phase;
    const edge = gutter(width) / 2;
    const pixels = spec.lane === "left" ? edge : width - edge;
    const x = (pixels / width * 2 - 1) * frame.aspect;
    const angle = Math.asin(Math.max(-0.9, Math.min(0.9, x / (frame.radius * spec.radius))));
    return (angle / (frame.arcExtent || 0.32) + 1) / 2;
  }
  async function create(kind, renderer) {
    const key = family(kind), map = await texture(key, renderer);
    const material = new T.SpriteMaterial({ map, color: 0xffffff, transparent: true, depthTest: true, depthWrite: false, alphaTest: 0.12, toneMapped: false });
    const sprite = new T.Sprite(material);
    sprite.scale.set(1, map.image.height / map.image.width, 1);
    const group = new T.Group(); group.name = `${key}-photoreal`; group.add(sprite);
    group.userData.width = 1;
    group.userData.materials = [material];
    group.userData.realistic = true;
    group.userData.sprite = sprite;
    return group;
  }
  function update(model, spec, position) {
    const material = model.userData.sprite.material;
    material.rotation = (spec.roll || 0) + Math.atan2(position.tangent[1], position.tangent[0]) * 0.28;
    // Lighting is baked into the detailed cutout; keep its original volume.
    const exposure = 0.8 + 0.1 * Math.cos((position.phase - 0.45) * Math.PI);
    material.color.setScalar(exposure);
  }
  window.OrbitRealisticSpacecraft = Object.freeze({ family, fleet, phase, size, create, update });
}());
