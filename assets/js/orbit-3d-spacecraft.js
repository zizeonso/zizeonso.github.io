(function () {
  "use strict";
  const T = window.THREE;
  if (!T) return;
  let panelTexture;

  function solarTexture() {
    if (panelTexture) return panelTexture;
    const canvas = document.createElement("canvas");
    canvas.width = 384; canvas.height = 192;
    const context = canvas.getContext("2d");
    context.fillStyle = "#182d4d"; context.fillRect(0, 0, 384, 192);
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 12; x++) {
        context.fillStyle = (x + y) % 3 === 0 ? "#29496d" : "#213b60";
        context.fillRect(x * 32 + 2, y * 32 + 2, 28, 28);
        context.fillStyle = "#61728a";
        context.fillRect(x * 32 + 15, y * 32 + 2, 1, 28);
      }
    }
    panelTexture = new T.CanvasTexture(canvas);
    panelTexture.colorSpace = T.SRGBColorSpace;
    return panelTexture;
  }

  function create(kind) {
    const group = new T.Group();
    group.name = kind;
    const gold = new T.MeshStandardMaterial({ color: 0xae8951, metalness: 0.55, roughness: 0.48 });
    const silver = new T.MeshStandardMaterial({ color: 0xc9cbd0, metalness: 0.6, roughness: 0.43 });
    const dark = new T.MeshStandardMaterial({ color: 0x17202c, metalness: 0.3, roughness: 0.6 });
    const solar = new T.MeshStandardMaterial({ map: solarTexture(), metalness: 0.35, roughness: 0.55 });
    const white = new T.MeshStandardMaterial({ color: 0xd5d5cf, metalness: 0.15, roughness: 0.65, side: T.DoubleSide });

    function mesh(geometry, material, x = 0, y = 0, z = 0) {
      const item = new T.Mesh(geometry, material);
      item.position.set(x, y, z);
      group.add(item);
      return item;
    }
    function box(w, h, d, material, x = 0, y = 0, z = 0) { return mesh(new T.BoxGeometry(w, h, d), material, x, y, z); }
    function rod(a, b, thickness = 0.018) {
      const from = new T.Vector3(...a), to = new T.Vector3(...b);
      const item = mesh(new T.CylinderGeometry(thickness, thickness, from.distanceTo(to), 6), silver);
      item.position.copy(from).add(to).multiplyScalar(0.5);
      item.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), to.sub(from).normalize());
      return item;
    }
    function wing(side, length, height = 0.62) {
      const x = side * (0.55 + length / 2);
      rod([side * 0.3, 0, 0], [side * 0.62, 0, 0]);
      box(length + 0.035, height + 0.035, 0.035, silver, x);
      box(length, height, 0.039, solar, x, 0, 0.007);
      for (let i = 1; i < 3; i++) box(0.012, height, 0.048, silver, side * (0.55 + length * i / 3));
    }
    function dish(radius, x = 0, y = 0.36, z = 0.4) {
      const points = [];
      for (let i = 0; i <= 14; i++) {
        const r = radius * i / 14;
        points.push(new T.Vector2(r, r * r * 0.85));
      }
      const item = mesh(new T.LatheGeometry(points, 28), white, x, y, z);
      item.rotation.x = Math.PI / 2;
      rod([x, y, z], [x, y, z + radius * 0.8], 0.015);
      rod([x - radius * 0.75, y, z + radius * 0.18], [x, y, z + radius * 0.8], 0.01);
      rod([x + radius * 0.75, y, z + radius * 0.18], [x, y, z + radius * 0.8], 0.01);
    }
    function sensor(x, y, z, radius = 0.12) {
      const barrel = mesh(new T.CylinderGeometry(radius, radius, 0.2, 16), dark, x, y, z);
      barrel.rotation.x = Math.PI / 2;
      const lens = mesh(new T.CircleGeometry(radius * 0.76, 16), new T.MeshStandardMaterial({ color: 0x19243b, metalness: 0.8, roughness: 0.18 }), x, y, z + 0.105);
      return lens;
    }

    if (kind === "sentinel-1") {
      box(0.7, 0.75, 0.62, gold);
      box(0.55, 0.06, 0.5, silver, 0, 0.42);
      wing(-1, 1.75, 0.54); wing(1, 1.75, 0.54);
      const radar = box(3.1, 0.34, 0.045, white, 0, -0.27, 0.61);
      radar.rotation.x = -0.22;
      for (let i = -2; i <= 2; i++) box(0.012, 0.34, 0.052, silver, i * 0.59, -0.27, 0.64);
      rod([-0.3, -0.15, 0.3], [-1.2, -0.27, 0.6]);
      rod([0.3, -0.15, 0.3], [1.2, -0.27, 0.6]);
      sensor(0.15, 0.12, 0.38, 0.08);
    } else if (kind === "sentinel-2") {
      box(0.75, 0.82, 0.65, gold);
      box(0.65, 0.04, 0.5, white, 0, 0.44);
      wing(-1, 2.2, 0.82);
      box(0.42, 0.46, 0.25, silver, 0.12, -0.13, 0.43);
      sensor(0.12, -0.13, 0.62, 0.16);
      rod([0.28, 0.35, 0.05], [0.4, 0.83, 0.08], 0.015);
    } else if (kind === "sentinel-3") {
      box(0.68, 1.05, 0.62, gold);
      box(0.62, 0.28, 0.14, white, 0, 0.35, 0.38);
      wing(-1, 2, 0.85);
      dish(0.28, 0.2, -0.22, 0.42);
      sensor(-0.14, 0.23, 0.49, 0.1);
      rod([0.22, 0.35, 0], [0.28, 0.95, 0], 0.015);
    } else {
      if (kind === "tianwen-inspired") {
        const bus = mesh(new T.CylinderGeometry(0.48, 0.48, 0.72, 6), gold);
        bus.rotation.x = Math.PI / 2;
        wing(-1, 1.65, 0.76); wing(1, 1.65, 0.76);
        dish(0.4, 0, 0.25, 0.43);
        rod([-0.25, -0.3, 0], [-2.25, -0.4, 0.02], 0.012);
        rod([0.25, -0.3, 0], [2.25, -0.4, 0.02], 0.012);
        rod([0.1, 0.35, -0.1], [0.2, 1.1, -0.15], 0.018);
      } else {
        box(0.76, 0.75, 0.68, gold);
        wing(-1, 1.6, 0.66); wing(1, 1.6, 0.66);
        dish(kind === "queqiao-inspired" ? 0.65 : 0.4, 0, 0.26, 0.43);
        sensor(0.23, -0.2, 0.45, kind === "change-2" ? 0.16 : 0.1);
        rod([-0.2, 0.35, 0], [-0.26, 0.95, -0.15], 0.016);
      }
    }
    group.updateMatrixWorld(true);
    group.userData.width = new T.Box3().setFromObject(group).getSize(new T.Vector3()).x;
    group.userData.materials = [];
    group.traverse(function (item) {
      if (item.isMesh && !group.userData.materials.includes(item.material)) group.userData.materials.push(item.material);
    });
    return group;
  }
  window.Orbit3DSpacecraft = Object.freeze({ create });
}());
