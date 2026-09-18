import * as THREE from 'three';
import { buildingTheme, palette, themedWall, themedFurniture, specialRoof } from './building-themes.ts';
import { BUILDINGS, roofHeight, type Building } from './architecture-data.ts';

/** One instanced mesh for the masonry, furniture and joinery of the whole valley. */
export class ArchitectureBuilder {
  matrices: THREE.Matrix4[] = []; colors: THREE.Color[] = [];
  scene: THREE.Scene; solids: THREE.Box3[];
  constructor(scene: THREE.Scene, solids: THREE.Box3[]) { this.scene = scene; this.solids = solids; }
  box(x: number, y: number, z: number, w: number, h: number, d: number, color: string, solid = true, ry = 0, rz = 0) {
    const o = new THREE.Object3D(); o.position.set(x, y, z); o.scale.set(w, h, d); o.rotation.set(0, ry, rz); o.updateMatrix();
    this.matrices.push(o.matrix.clone()); this.colors.push(new THREE.Color(color));
    if (solid) this.solids.push(new THREE.Box3(new THREE.Vector3(-.5, -.5, -.5), new THREE.Vector3(.5, .5, .5)).applyMatrix4(o.matrix));
  }
  flush() {
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: .87 }), this.matrices.length);
    this.matrices.forEach((m, i) => { mesh.setMatrixAt(i, m); mesh.setColorAt(i, this.colors[i]); }); mesh.castShadow = true; mesh.receiveShadow = true; this.scene.add(mesh);
  }
  // A real opening, with matching visual and collision geometry.
  wall(x: number, z: number, floor: number, height: number, length: number, opening: number, color: string, alongX = true) {
    const put = (offset: number, y: number, w: number, h: number, c: string, thickness = 4) => this.box(x + (alongX ? offset : 0), y, z + (alongX ? 0 : offset), alongX ? w : thickness, h, alongX ? thickness : w, c);
    const wing = (length - opening) / 2;
    for (const side of [-1, 1]) {
      put(side * (opening / 2 + wing / 2), floor + height / 2, wing, height, color);
      put(side * (opening / 2 + 2), floor + (height - 12) / 2, 3, height - 12, '#887653', 6);
    }
    put(0, floor + height - 6, opening, 12, color); put(0, floor + height - 13, opening + 7, 2, '#a28d63', 6);
  }
  desk(x: number, floor: number, z: number, color = '#896648') {
    this.box(x, floor + 32, z, 58, 3, 42, color);
    for (const dx of [-25, 25]) for (const dz of [-17, 17]) this.box(x + dx, floor + 15, z + dz, 3, 30, 3, color);
    this.box(x + 14, floor + 35, z - 8, 18, 3, 12, '#e7d8b5', false);
    for (let i = 0; i < 3; i++) this.box(x - 20 + i * 5, floor + 36 + i, z + 7, 4, 7 + i * 2, 10, ['#72917c', '#b48665', '#a6aa79'][i], false);
  }
  shelf(x: number, floor: number, z: number, width: number, style: string) {
    this.box(x, floor + 24, z, width, 48, 8, '#725a43');
    for (let row = 0; row < 4; row++) {
      this.box(x, floor + 5 + row * 11, z + 6, width + 2, 1.5, 15, '#9a7e54');
      for (let k = 0; k < Math.floor(width / 6); k++) this.box(x - width / 2 + 4 + k * 6, floor + 10 + row * 11, z + 6, 4, style === 'store' ? 7 : 5 + k % 5, 8, ['#7d9b8a', '#b99e68', '#ad715e', '#d2c9a0'][k % 4], false);
    }
  }
}

export function buildArchitecture(scene: THREE.Scene, solids: THREE.Box3[], label: (s: string, c?: string) => THREE.Object3D) {
  const a = new ArchitectureBuilder(scene, solids);
  for (const b of BUILDINGS) buildBuilding(a, b, label);
  a.flush();
}
function buildBuilding(a: ArchitectureBuilder, b: Building, label: (s: string, c?: string) => THREE.Object3D) {
  const { x, z, width: w, depth: d } = b, halfW = w / 2, halfD = d / 2, roof = roofHeight(b);
  const hole = b.id === 'house' || b.id === 'temple' || b.id === 'observatory' ? 144 : 116;
  const theme = buildingTheme(b), colors = palette(b), wood = colors.trim, floorColor = colors.floor;
  // Continuous foundations, with a stone basement in Hearthside and a wide,
  // landscaped terrace at every other destination (never a suspended slab).
  if (b.floors[0] > 3) a.box(x, (b.floors[0] - 2) / 2, z, w + 8, b.floors[0] - 2, d + 8, '#929582');
  a.box(x, b.floors[0], z, w, 2, d, floorColor);
  for (let level = 0; level < b.floors.length; level++) {
    const y = b.floors[level], h = (b.floors[level + 1] ?? roof) - y;
    if (level) {
      for (const side of [-1, 1]) {
        a.box(x + side * (halfW + hole / 2) / 2, y, z, halfW - hole / 2, 2, d, floorColor);
        a.box(x, y, z + side * (halfD + hole / 2) / 2, hole, 2, halfD - hole / 2, floorColor);
      }
      // Atrium balconies have low rails and generous corner approaches.
      for (const side of [-1, 1]) {
        a.box(x + side * (hole / 2 + 1), y + 5, z, 2, 2, hole - 22, wood);
        a.box(x, y + 5, z + side * (hole / 2 + 1), hole - 22, 2, 2, wood);
        for (const o of [-.35, 0, .35]) {
          a.box(x + side * (hole / 2 + 1), y + 2.5, z + o * hole, 1.5, 5, 1.5, wood);
          a.box(x + o * hole, y + 2.5, z + side * (hole / 2 + 1), 1.5, 5, 1.5, wood);
        }
      }
    }
    const wallColor = b.id === 'house' && level === 0 ? '#969785' : colors.wall;
    for (const side of [-1, 1]) {
      if (b.id === 'house') a.wall(x, z + side * halfD, y + 1, h - 1, w, 104, wallColor); else themedWall(a, b, x, z + side * halfD, y + 1, h - 1, w, b.id === 'temple' ? 130 : 104, true);
      if (b.id === 'house') a.wall(x + side * halfW, z, y + 1, h - 1, d, 104, wallColor, false); else themedWall(a, b, x + side * halfW, z, y + 1, h - 1, d, 104, false);
      // Broad stone/string courses and timber corners tie all storeys together.
      a.box(x, y + h - 1, z + side * halfD, w + 8, 3, 8, colors.trim);
      a.box(x + side * halfW, y + h - 1, z, 8, 3, d + 8, colors.trim);
      for (const end of [-1, 1]) a.box(x + side * (halfW - 1), y + h / 2, z + end * (halfD - 1), 6, h, 6, wood);
    }
    // Separate, roomy wings around the central stair/thermal hall. Double
    // portals allow laps through different rooms instead of a single corridor.
    if (w >= 330) {
      for (const side of [-1, 1]) {
        for (const end of [-1, 1]) a.wall(x + side * (w / 4 + 18), z + end * d / 6, y + 1, h - 1, w / 2 - 36, 102, wallColor);
        for (const aisle of [-1, 1]) a.wall(x + aisle * 28, z + side * d / 3, y + 1, h - 1, d / 3 - 60, Math.min(80, d / 3 - 66), wallColor, false);
      }
    } else {
      // Side alcoves frame the hall without pinching its turning circle.
      for (const side of [-1, 1]) a.box(x + side * (halfW - 18), y + h / 2, z, 30, h, 3, wallColor);
    }
    themedFurniture(a, b, y, level);
    // Domestic windows, shutters and plants belong to inhabited homes, not every ruin.
    if (['manor','library','lodge','post'].includes(theme)) for (const side of [-1, 1]) {
      for (let j = 0; j < 3; j++) {
        const zz = z - halfD + 38 + j * (d - 76) / 2;
        a.box(x + side * (halfW - 8), y + 10, zz, 12, 20, 13, '#b3825d');
        a.box(x + side * (halfW - 8), y + 24, zz, 14, 12, 15, '#749375', false);
      }
      for (const end of [-1, 1]) {
        a.box(x + side * (halfW - 40), y + h * .57, z + end * (halfD + 2.2), 33, 30, .3, '#537d78', false);
        a.box(x + side * (halfW - 40), y + h * .57, z + end * (halfD + 2.6), 1.5, 30, .6, '#e3d2ab', false);
        a.box(x + side * (halfW - 40), y + h * .57, z + end * (halfD + 2.6), 33, 1.5, .6, '#e3d2ab', false);
        for (const shutter of [-1,1]) a.box(x+side*(halfW-40)+shutter*21,y+h*.57,z+end*(halfD+3),8,32,2,colors.roof,false);
      }
    }
    // Inlaid floor boards/tiles and rugs establish scale without collision clutter.
    for (let zz = -halfD + 10; zz < halfD; zz += 12) for (const side of [-1, 1]) a.box(x + side * (halfW + hole / 2) / 2, y + 1.05, z + zz, halfW - hole / 2 - 4, .1, .5, '#a8916b', false);
    if (['manor','library','lodge','post'].includes(theme)) for (const side of [-1, 1]) a.box(x + side * w / 4, y + 1.12, z + halfD * .62, Math.min(100, w / 2 - 28), .12, 70, b.style === 'temple' ? '#7a9487' : '#9e6f57', false);
    if (level < b.floors.length - 1) {
      // A stair along the rear wall makes the floor plan read as a lived-in place;
      // the adjacent 116–144 unit atrium is the glider's vertical route.
      for (let step = 0; step < 20; step++) a.box(x - halfW + 20, y + (step + 1) * h / 20 / 2, z - halfD + 15 + step * 4, 16, (step + 1) * h / 20, 4, wood);
    }
    const roomNames = b.id === 'house' ? b.rooms.slice(level * 3, level * 3 + 3) : [b.rooms[level % b.rooms.length]];
    roomNames.forEach((name, index) => { const sign = label(name, '#ffe3ac'); sign.position.set(x + (index % 2 ? 1 : -1) * (halfW - 40), y + h - 20, z + (index - 1) * d / 3); sign.scale.multiplyScalar(.8); a.scene.add(sign); });
    // Warm lights in the open hall; the meshes themselves remain cheap.
    for (const side of [-1, 1]) {
      a.box(x + side * (halfW - 5), y + h - 17, z + 20, 6, 9, 7, '#f3cc84', false);
    }
    if (b.id === 'house' || b.id === 'observatory') { const light = new THREE.PointLight('#ffd79a', 700, w * .7, 1.5); light.position.set(x, y + h - 8, z); a.scene.add(light); }
  }
  // A continuous pitched slate roof surrounds a single square atrium skylight.
  // The gables meet the walls; the chimney and eaves give a recognizable house silhouette.
  if (!specialRoof(a, b, hole)) {
  const roofColor = colors.roof, pitch = theme === 'lodge' ? .6 : theme === 'timber' ? .48 : .32;
  for (const side of [-1, 1]) {
    const span = halfW - hole / 2, xx = side * (halfW + hole / 2) / 2;
    a.box(x + xx, roof, z, span + 10, 3, d + 20, roofColor);
    a.box(x, roof, z + side * (halfD + hole / 2) / 2, hole, 3, halfD - hole / 2 + 10, roofColor);
    a.box(x + xx, roof + (halfW - Math.abs(xx)) * pitch, z, span / Math.cos(Math.atan(pitch)) + 10, 3, d + 22, roofColor, false, 0, -side * Math.atan(pitch));
    for (const end of [-1, 1]) a.box(x + side * hole / 4, roof + (halfW - hole / 4) * pitch, z + end * (halfD + hole / 2) / 2, hole / 2 / Math.cos(Math.atan(pitch)), 3, halfD - hole / 2 + 10, roofColor, false, 0, -side * Math.atan(pitch));
    for (let zz = -halfD; zz < halfD; zz += 13) a.box(x + xx, roof + (halfW - Math.abs(xx)) * pitch + 2, z + zz, span + 10, .8, 1, '#739080', false, 0, -side * Math.atan(pitch));
    // Skylight curb stays outside the clear shaft.
    a.box(x + side * (hole / 2 + 3), roof + 10, z, 5, 20, hole + 6, '#6b826d');
    a.box(x, roof + 10, z + side * (hole / 2 + 3), hole + 6, 20, 5, '#6b826d');
  }
  for (const end of [-1, 1]) {
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute([x - halfW, roof, z + end * halfD, x, roof + halfW * pitch, z + end * halfD, x + halfW, roof, z + end * halfD], 3)); geometry.computeVertexNormals();
    const gable = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: colors.wall, side: THREE.DoubleSide, roughness: 1 })); gable.castShadow = true; a.scene.add(gable);
  }
  a.box(x - halfW + 24, roof + 23, z - halfD + 30, 19, 60, 21, '#a79275');
  a.box(x - halfW + 24, roof + 53, z - halfD + 30, 24, 4, 26, '#d0c2a0');
  }
  // Front terrace, masonry steps and flower beds visually embed the building.
  a.box(x, b.ground - 1, z + halfD + 16, 130, 4, 32, '#b4ad92');
  for (let s = 0; s < 6; s++) a.box(x, b.ground - 2 - s * .55, z + halfD + 34 + s * 3, 124 + s * 3, 2, 4, '#c6bda0');
  for (const side of [-1, 1]) {
    a.box(x + side * (halfW - 24), b.ground + 2, z + halfD + 14, 38, 7, 24, '#a49b7f');
    a.box(x + side * (halfW - 24), b.ground + 9, z + halfD + 14, 33, 10, 21, '#78956e', false);
  }
  const title = label(b.name, '#f7dfac'); title.position.set(x, b.ground + 53, z + halfD + 4); title.scale.multiplyScalar(1.4); a.scene.add(title);
  const atrium = label(b.id === 'house' ? 'WARM AIR · CELLAR / HOUSE / UPSTAIRS / ATTIC' : 'RISING AIR · UPPER GALLERIES', '#f9d28b'); atrium.position.set(x, b.floors[0] + 14, z); atrium.scale.multiplyScalar(.85); a.scene.add(atrium);
  if (b.style === 'temple') {
    // Colonnades and stepped masonry distinguish sanctuaries from timber homes.
    const stone = new THREE.MeshStandardMaterial({ color: '#d1c7aa', roughness: .9 });
    for (const side of [-1, 1]) for (const offset of [-.36, -.2, .2, .36]) {
      const px = x + side * (halfW + 13), pz = z + d * offset, height = roof - b.ground;
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(5, 7, height, 12), stone); pillar.position.set(px, b.ground + height / 2, pz); pillar.castShadow = true; a.scene.add(pillar);
      a.solids.push(new THREE.Box3(new THREE.Vector3(px - 7, b.ground, pz - 7), new THREE.Vector3(px + 7, roof, pz + 7)));
      a.box(px, b.ground - 1, pz, 18, 12, 18, '#b4b397'); a.box(px, roof - 2, pz, 17, 5, 17, '#d9ccaa');
    }
    for (const side of [-1, 1]) a.box(x + side * (halfW + 13), roof + 2, z, 22, 5, d + 20, '#b9b79e');
    if (b.id === 'temple') {
      for (const side of [-1, 1]) for (const spread of [.29, .43]) {
        const px = x + side * w * spread, pz = z + halfD + 18, height = roof - b.ground;
        const column = new THREE.Mesh(new THREE.CylinderGeometry(7, 10, height, 16), stone); column.position.set(px, b.ground + height / 2, pz); column.castShadow = true; a.scene.add(column);
        a.solids.push(new THREE.Box3(new THREE.Vector3(px - 10, b.ground - 5, pz - 10), new THREE.Vector3(px + 10, roof, pz + 10)));
        a.box(px, b.ground - 1, pz, 28, 12, 28, '#b6b296'); a.box(px, roof, pz, 26, 7, 26, '#d4c6a2');
      }
      a.box(x, roof + 3, z + halfD + 18, w - 24, 7, 28, '#c4bda1');
      for (const [px, pz, floor] of [[310, -1210, 132], [150, -1190, 132], [485, -1260, 212]]) {
        a.box(px, floor + 4, pz, 48, 8, 44, '#899c8b'); a.box(px, floor + 10, pz, 30, 4, 28, '#c8b78d');
        const halo = new THREE.Mesh(new THREE.TorusGeometry(25, .5, 5, 40), new THREE.MeshStandardMaterial({ color: '#b49a63', metalness: .5 })); halo.rotation.x = -Math.PI / 2; halo.position.set(px, floor + 1.2, pz); a.scene.add(halo);
      }
    }
  }
  if (b.style === 'store' || b.style === 'mill') {
    for (let i = 0; i < 8; i++) {
      const side = i % 2 ? 1 : -1, zz = z - halfD + 44 + Math.floor(i / 2) * 25, yy = b.floors[0];
      a.box(x + side * (halfW - 14), yy + 9, zz, 19, 18, 20, '#aa875a');
      for (const band of [-6, 6]) a.box(x + side * (halfW - 14) + band, yy + 9, zz + 10.1, 1.4, 18, .4, '#5c6e61', false);
    }
  }
  if (b.id === 'house') {
    // Low furniture keeps the flying lanes clear while giving each floor a purpose.
    a.box(-116, 76, 120, 50, 20, 28, '#927258'); a.box(-116, 88, 130, 50, 15, 5, '#8c6450');
    a.box(108, 142, 242, 52, 16, 34, '#866b51'); a.box(108, 152, 242, 48, 5, 32, '#c5bd99'); a.box(108, 156, 231, 37, 4, 9, '#ece0bb');
    a.box(149, 22, -58, 25, 36, 28, '#76867b'); a.box(153, 40, -58, 6, 70, 6, '#956d4e');
    for (let i = 0; i < 5; i++) { a.box(-156, 216 + i % 2 * 7, -55 + i * 23, 25, 22 + i % 2 * 14, 19, '#9b7d52'); }
  }
}
