(function () {
  "use strict";
  const base = window.OrbitRealisticSpacecraft;
  if (!base) return;
  const fleets = new Map();
  const wrap = value => ((value % 1) + 1) % 1;

  function fleet(id, original) {
    if (fleets.has(id)) return fleets.get(id);
    const count = id === "earth-orbit" ? 4 : 3;
    const periods = [112, 146, 134, 124];
    const offset = Math.random();
    const items = Array.from({ length: count }, function (_, index) {
      const item = { ...original[index % original.length] };
      item.kind = id === "earth-orbit" ? (index % 2 ? "sentinel-2" : "sentinel-1") : id === "lunar-orbit" ? "change-2" : "tianwen-inspired";
      item.period = periods[index] * (0.92 + Math.random() * 0.16) * (index % 2 ? -1 : 1);
      item.phase = wrap(offset + index / count + (Math.random() - 0.5) * 0.12);
      item.size = index === 0 ? (id === "lunar-orbit" ? 112 : 124) : index === 1 ? 70 : index === 2 ? 78 : 60;
      item.lane = index === 0 ? "left" : index === 1 ? "right" : "center";
      item.anchor = Math.random();
      item.roll = (Math.random() - 0.5) * 0.18;
      if (index === 1) { item.radius = 1.04; item.inclination = 14; }
      if (index === 3) { item.radius = 1.075; item.inclination = 20; }
      item.radius += (Math.random() - 0.5) * 0.004;
      item.inclination += (Math.random() - 0.5) * 1.5;
      return item;
    });
    fleets.set(id, items);
    return items;
  }

  function phase(spec, frame, width) {
    if (spec.lane === "center") return spec.phase;
    const gutter = width <= 1100 ? 40 : (width - Math.min(1040, width - 96)) / 2;
    const inset = base.size(spec, width) * 0.515 + 8;
    const room = Math.max(0, gutter - inset * 2);
    const edge = width <= 820 ? width * (0.16 + spec.anchor * 0.12) : room ? inset + spec.anchor * room : gutter / 2;
    const pixels = spec.lane === "left" ? edge : width - edge;
    const x = (pixels / width * 2 - 1) * frame.aspect;
    const angle = Math.asin(Math.max(-0.9, Math.min(0.9, x / (frame.radius * spec.radius))));
    return (angle / (frame.arcExtent || 0.32) + 1) / 2;
  }

  // Keep random choices stable while resizing and switching scene orientation.
  window.OrbitRealisticSpacecraft = Object.freeze({ ...base, fleet, phase });
}());
