(function () {
  "use strict";
  const base = window.OrbitRealisticSpacecraft;
  if (!base) return;
  const fleets = new Map();
  const flightRate = 0.55;
  const wrap = value => ((value % 1) + 1) % 1;

  function fleet(id, original) {
    if (fleets.has(id)) return fleets.get(id);
    const previous = base.fleet(id, original);
    const count = id === "earth-orbit" ? 6 : 5;
    const offset = Math.random();
    const items = previous.map(spec => ({ ...spec, period: spec.period * 0.62 / flightRate }));
    for (let index = items.length; index < count; index++) {
      const slot = index - previous.length;
      items.push({
        ...previous[slot % previous.length],
        kind: id === "earth-orbit" ? (slot % 2 ? "sentinel-2" : "sentinel-1") : id === "lunar-orbit" ? "change-2" : "tianwen-inspired",
        period: (slot ? -88 : 76) * (0.94 + Math.random() * 0.12) / flightRate,
        phase: wrap(offset + slot * 0.47 + (Math.random() - 0.5) * 0.08),
        lane: "center",
        size: slot ? 46 : 54,
        radius: 1.045 + slot * 0.02 + Math.random() * 0.006,
        inclination: 16 + slot * 9 + (Math.random() - 0.5) * 2,
        roll: (Math.random() - 0.5) * 0.16
      });
    }
    fleets.set(id, items);
    return items;
  }

  window.OrbitRealisticSpacecraft = Object.freeze({ ...base, fleet });
}());
