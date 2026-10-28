(function () {
  "use strict";
  const tau = Math.PI * 2;
  const scenes = {
    "earth-orbit": { map: "earth", longitude: 114.17, latitude: 22.3, period: 1080, atmosphere: 0x347aca,
      fleet: [
        { kind: "sentinel-1", period: 118, phase: 0.24, radius: 1.065, inclination: 18, size: 68 },
        { kind: "sentinel-2", period: 151, phase: 0.74, radius: 1.0509, inclination: -18, size: 46 },
        { kind: "sentinel-3", period: 179, phase: 0.4, radius: 1.095, inclination: 26, size: 38 }
      ] },
    "lunar-orbit": { map: "moon", longitude: -20, latitude: 22, period: 1560, atmosphere: null,
      fleet: [
        { kind: "change-2", period: 139, phase: 0.24, radius: 1.065, inclination: 18, size: 64 },
        { kind: "change-1", period: 173, phase: 0.74, radius: 1.0509, inclination: -18, size: 42 },
        { kind: "queqiao-inspired", period: 199, phase: 0.44, radius: 1.095, inclination: 26, size: 30 }
      ] },
    "mars-orbit": { map: "mars", longitude: -65, latitude: -10, period: 1260, atmosphere: 0xba7855,
      fleet: [
        { kind: "tianwen-inspired", period: 149, phase: 0.24, radius: 1.065, inclination: 18, size: 66 },
        { kind: "tianwen-inspired", period: 181, phase: 0.74, radius: 1.0509, inclination: -18, size: 40 }
      ] }
  };
  function framing(width, height) {
    const aspect = width / height;
    const radius = Math.max(3, aspect * 5);
    return { aspect, radius, centerY: -radius - 0.54, horizon: 0.77 };
  }
  function orbit(time, craft, frame) {
    // A visible section of a circular 3D orbit; its repeat is outside the viewport.
    const phase = ((time / craft.period + craft.phase) % 1 + 1) % 1;
    const extent = frame.arcExtent || 0.32;
    const angle = -extent + phase * extent * 2;
    const inclination = craft.inclination * Math.PI / 180;
    const ratio = frame.arcExtent && inclination < 0 ? 1 / Math.sqrt(1 - Math.sin(inclination) ** 2 * Math.cos(extent * 0.28) ** 2) : craft.radius;
    const radius = frame.radius * ratio;
    const x = Math.sin(angle) * radius;
    const y = Math.cos(angle) * radius * Math.cos(inclination);
    const z = Math.cos(angle) * radius * Math.sin(inclination);
    const dx = Math.cos(angle);
    const dy = -Math.sin(angle) * Math.cos(inclination);
    const dz = -Math.sin(angle) * Math.sin(inclination);
    return { x, y: y + frame.centerY, z, radial: [x / radius, y / radius, z / radius], tangent: [dx, dy, dz], phase };
  }
  function occluded(position, frame) {
    const y = position.y - frame.centerY;
    const distance = position.x ** 2 + y ** 2;
    return distance < frame.radius ** 2 && position.z < Math.sqrt(frame.radius ** 2 - distance);
  }
  function spin(time, period) { return time * tau / period; }
  window.Orbit3DDynamics = Object.freeze({ scenes, framing, orbit, occluded, spin });
}());
