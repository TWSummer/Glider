import { buildSettlements } from './settlement-scenery.ts';
import * as THREE from 'three';
import { LAND, SITES, EXTRA_SUPPLIES, landHeight, valleyFloor } from './atlas.ts';
import type { Point3 } from './flight.ts';
import { TUNNEL_LAYOUT, BUILDINGS, nearBuilding } from './architecture-data.ts';
import { buildArchitecture } from './architecture.ts';
import { interactionBadge } from './game-visuals.ts';
import { groundHeight } from './world.ts';

export const VALLEY_STATIONS = [
  { id: 'mill', name: 'Willow landing', x: -390, y: 51, z: 545 },
  { id: 'grotto', name: 'Blue gallery camp', x: -620, y: 107, z: -670 },
  { id: 'mine', name: 'Coppervein depot', x: -690, y: 105, z: -990 },
  { id: 'pump', name: 'Pump room shelter', x: -760, y: 127, z: -1580 },
  { id: 'headland', name: 'East headland', x: 646, y: 142, z: -960 },
  { id: 'city', name: 'Bellwether quay', x: 920, y: 94, z: -1240 },
  { id: 'canal', name: 'Canal lock', x: 740, y: 89, z: -1730 },
  { id: 'aqueduct', name: 'Waterkeeper’s landing', x: 302, y: 143, z: -2010 },
  { id: 'ridge-village', name: 'Starfall shelter', x: -110, y: 256, z: -2710 },
  { id: 'observatory', name: 'Astronomers’ mooring', x: -250, y: 320, z: -3050 },
];
export const VALLEY_LIFTS = [
  [-390, 545, 18, 96, 42, 12], [-350, 350, 20, 110, 34, 12], [-455, 194, 43, 105, 30, 12],
  [150, 320, 18, 90, 30, 11], [-608, -669, 40, 145, 37, 15], [-732, -704, 43, 109, 20, 12],
  [-690, -950, 1, 152, 38, 15], [-690, -990, 61, 118, 34, 9], [-920, -1240, 70, 120, 18, 9],
  [-1000, -1620, 65, 116, 17, 9], [-760, -1595, 94, 148, 16, 10],
  [515, -825, 1, 155, 40, 15], [646, -960, 113, 185, 43, 13], [920, -1240, 60, 159, 34, 13],
  [970, -1490, 62, 170, 26, 13], [740, -1730, 60, 154, 28, 13], [845, -1930, 61, 224, 32, 17], [1110, -1775, 62, 190, 30, 13],
  [536, -1935, 0, 180, 39, 14], [305, -2040, 113, 204, 28, 14], [-195, -2240, 112, 206, 30, 14],
  [370, -2240, 112, 206, 30, 14], [80, -2400, 98, 238, 32, 17],
  [-110, -2710, 223, 285, 38, 16], [-250, -3050, 180, 340, 34, 17],
  [-535, -3010, 276, 341, 26, 15], [100, -3290, 279, 348, 24, 15], [-520, -3480, 333, 394, 28, 17],
].map(([x, z, base, ceiling, radius, strength]) => ({ x, z, base, ceiling, radius, strength, kind: base < 10 ? 'thermal' : 'vent' }));

export const TUNNELS = TUNNEL_LAYOUT;
interface Segment { a: THREE.Vector3; b: THREE.Vector3; radius: number; height: number; kind: string; }
const segments: Segment[] = TUNNELS.flatMap(t => t.points.slice(1).map((p, i) => ({ a: new THREE.Vector3(...t.points[i]), b: new THREE.Vector3(...p), radius: t.radius, height: t.height, kind: t.kind })));
interface CaveSection { floor: number; ceiling: number; field: number; center: number }
export function tunnelSection(x: number, z: number, kind?: string): CaveSection {
  let floor = Infinity, ceiling = -Infinity, field = -Infinity, center = 0;
  for (const s of segments) {
    if (kind && s.kind !== kind) continue;
    // The entrance is a deliberately open cross-section, not a capped tube.
    if (z > (s.kind === 'mine' ? -1060 : -300)) continue;
    const dx = s.b.x - s.a.x, dz = s.b.z - s.a.z;
    const t = Math.max(0, Math.min(1, ((x - s.a.x) * dx + (z - s.a.z) * dz) / (dx * dx + dz * dz)));
    const r = Math.hypot(x - s.a.x - dx * t, z - s.a.z - dz * t) / s.radius, cy = s.a.y + (s.b.y - s.a.y) * t;
    if (1 - r > field) { field = 1 - r; center = cy; }
    if (r <= 1) { const h = Math.sqrt(Math.max(0, 1 - r * r)) * s.height; floor = Math.min(floor, cy - h); ceiling = Math.max(ceiling, cy + h); }
  }
  return { floor: Number.isFinite(floor) ? floor : center, ceiling: Number.isFinite(ceiling) ? ceiling : center, field, center };
}
export function inTunnel(p: Point3, margin = 0) {
  const c = tunnelSection(p.x, p.z); return c.field > margin / 80 && p.y > c.floor + margin && p.y < c.ceiling - margin;
}
export function tunnelCeiling(p: Point3) { const c = tunnelSection(p.x, p.z); return c.field > 0 && p.y > c.floor - 2 && p.y < c.ceiling + 2 ? c.ceiling : Infinity; }
export function tunnelWall(p: Point3, margin: number) {
  const c = tunnelSection(p.x, p.z);
  if (c.field < -margin / 80 || p.y < c.floor - 10 - margin || p.y > c.ceiling + 19 + margin) return false;
  return !inTunnel(p, margin);
}

// Static details are instanced by material. Hundreds of rooms/details add few draw calls.
class Builder {
  scene: THREE.Scene; solids: THREE.Box3[]; batches = new Map<string, { matrix: THREE.Matrix4; color: THREE.Color }[]>();
  constructor(scene: THREE.Scene, solids: THREE.Box3[]) { this.scene = scene; this.solids = solids; }
  box(x: number, y: number, z: number, w: number, h: number, d: number, color: string, solid = true, ry = 0, rz = 0) {
    const o = new THREE.Object3D(); o.position.set(x, y, z); o.scale.set(w, h, d); o.rotation.set(0, ry, rz); o.updateMatrix();
    const key = 'box'; if (!this.batches.has(key)) this.batches.set(key, []); this.batches.get(key)!.push({ matrix: o.matrix.clone(), color: new THREE.Color(color) });
    if (solid) { const b = new THREE.Box3(new THREE.Vector3(-.5, -.5, -.5), new THREE.Vector3(.5, .5, .5)); b.applyMatrix4(o.matrix); this.solids.push(b); }
  }
  flush() {
    for (const [, list] of this.batches) { const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: .87 }), list.length); list.forEach((b, i) => { mesh.setMatrixAt(i, b.matrix); mesh.setColorAt(i, b.color); }); mesh.castShadow = true; mesh.receiveShadow = true; this.scene.add(mesh); }
  }
  beam(a: THREE.Vector3, b: THREE.Vector3, width: number, color: string) {
    const o = new THREE.Object3D(), delta = b.clone().sub(a); o.position.copy(a).add(b).multiplyScalar(.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.clone().normalize()); o.scale.set(width, delta.length(), width); o.updateMatrix();
    if (!this.batches.has('box')) this.batches.set('box', []); this.batches.get('box')!.push({ matrix: o.matrix.clone(), color: new THREE.Color(color) });
  }
  road(points: number[][], width: number, color = '#b5ad8e', rail = false) {
    for (let i = 1; i < points.length; i++) {
      const a = new THREE.Vector3(...points[i - 1]), b = new THREE.Vector3(...points[i]), delta = b.clone().sub(a), len = delta.length(), n = Math.ceil(len / 14);
      for (let j = 0; j <= n; j++) {
        const p = a.clone().lerp(b, j / n), yaw = Math.atan2(delta.x, delta.z);
        this.box(p.x, p.y, p.z, width, 1, 16, color, false, yaw);
        if (rail) { for (const side of [-1, 1]) this.box(p.x + Math.cos(yaw) * side * 4, p.y + .8, p.z - Math.sin(yaw) * side * 4, .6, .7, 17, '#646e67', false, yaw); this.box(p.x, p.y + .45, p.z, 12, .5, 2, '#685948', false, yaw); }
        if (j % 4 === 0) for (const side of [-1, 1]) { const x = p.x + Math.cos(yaw) * side * (width / 2 - 2), z = p.z - Math.sin(yaw) * side * (width / 2 - 2); this.box(x, p.y / 2, z, 3, p.y, 3, '#858675'); }
      }
    }
  }
}

export function buildValley(scene: THREE.Scene, solids: THREE.Box3[], label: (name: string, color?: string) => THREE.Object3D) {
  const b = new Builder(scene, solids);
  buildArchitecture(scene, solids, label);
  // Every rendered terrain sample uses the same grading as ground collision.
  const terrain = (cx: number, cz: number, w: number, d: number, sx: number, sz: number) => {
    const geo = new THREE.PlaneGeometry(w, d, sx, sz); geo.rotateX(-Math.PI / 2);
    const pos = geo.getAttribute('position'), colors: number[] = [];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + cx, z = pos.getZ(i) + cz, h = groundHeight(x, z);
      pos.setXYZ(i, x, h > .2 ? h - .12 : -1.2, z);
      const c = new THREE.Color(h < 6 ? '#aca989' : z < -2600 ? '#91a391' : '#8b9f73'); c.multiplyScalar(.97 + Math.sin(x * .31 + z * .42) * .035); colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); geo.computeVertexNormals(); const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true })); mesh.receiveShadow = true; scene.add(mesh);
  };
  terrain(0, -1500, 3300, 4700, 220, 314);
  // Fine sampling at foundations prevents coarse landscape triangles protruding
  // through cellar walls or leaving visible gaps under terraces.
  for (const site of BUILDINGS) terrain(site.x, site.z, site.width + 120, site.depth + 120, Math.ceil((site.width + 120) / 6), Math.ceil((site.depth + 120) / 6));
  for (let i = 0; i < 12; i++) { const x = 235 + i % 4 * 52, z = 560 + Math.floor(i / 4) * 30;
    const heights=[[-20,-11],[-20,11],[20,-11],[20,11]].map(([dx,dz])=>groundHeight(x+dx,z+dz));
    if(Math.max(...heights)-Math.min(...heights)>1.2)continue;
    const y=Math.max(...heights); b.box(x, y + 2, z, 40, 4, 22, '#8b7355'); for (let j = 0; j < 5; j++) b.box(x - 15 + j * 7, y + 6, z, 4, 5, 18, '#779767', false); }
  const wheel = new THREE.Group(); wheel.position.set(-260, 52, 382); wheel.rotation.y = Math.PI / 2;
  const wheelMat = new THREE.MeshStandardMaterial({ color: '#806443' });
  for (const offset of [-5, 5]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(29, 2, 6, 24), wheelMat); ring.position.z = offset; wheel.add(ring); }
  for (let i = 0; i < 12; i++) { const spoke = new THREE.Mesh(new THREE.BoxGeometry(3, 58, 10), wheelMat); spoke.rotation.z = i / 12 * Math.PI; wheel.add(spoke); } scene.add(wheel);
  const wheels = [wheel];

  // Broad streets, a continuous quay and the old canal connect larger civic halls.


  b.box(695, 60, -1670, 50, 2, 1050, '#6b9c93', false);
  for (const x of [665, 725]) b.box(x, 61, -1670, 4, 6, 1050, '#b4b399');
  // Clock faces on a tower with three flyable floors, not a solid pedestal.
  for (const end of [-1, 1]) { const clock = new THREE.Mesh(new THREE.CircleGeometry(24, 32), new THREE.MeshStandardMaterial({ color: '#f2dfaf', side: THREE.DoubleSide })); clock.position.set(790, 251, -2070 + end * 117); scene.add(clock); b.box(790, 259, clock.position.z + end, 2, 17, 1, '#4b6d64', false); b.box(798, 251, clock.position.z + end, 17, 2, 1, '#4b6d64', false); }
  // The aqueduct joins wind houses through wide, open arches above the valley.
  b.road([[-300, 124, -2260], [90, 124, -2260], [450, 124, -2250], [580, 90, -1990], [695, 63, -1790]], 34, '#bdbea8');
  for (const x of [-280, -170, -60, 50, 160, 270, 380]) {
    b.box(x, 61, -2260, 12, 122, 34, '#a6af97');
    const arch = new THREE.Mesh(new THREE.TorusGeometry(46, 4, 6, 20, Math.PI), new THREE.MeshStandardMaterial({ color: '#ced0b6' })); arch.position.set(x + 55, 75, -2260); scene.add(arch);
  }

  const dome = new THREE.Mesh(new THREE.SphereGeometry(172, 32, 16, 0, Math.PI * 1.6, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#658c89', side: THREE.DoubleSide, roughness: .4, metalness: .4 })); dome.position.set(-250, 521, -3250); scene.add(dome);
  const ribs = new THREE.Mesh(dome.geometry, new THREE.MeshBasicMaterial({ color: '#bdab7c', wireframe: true })); ribs.position.copy(dome.position); ribs.scale.setScalar(1.002); scene.add(ribs);
  const lens = new THREE.Mesh(new THREE.TorusGeometry(48, 3, 8, 48), new THREE.MeshStandardMaterial({ color: '#d8bd84', metalness: .7, roughness: .3 })); lens.position.set(-250, 492, -3310); scene.add(lens);
  const skybeam = new THREE.Mesh(new THREE.CylinderGeometry(4, 37, 800, 20, 1, true), new THREE.MeshBasicMaterial({ color: '#e5e6bc', transparent: true, opacity: .18, side: THREE.DoubleSide, depthWrite: false })); skybeam.position.set(-250, 870, -3310); skybeam.visible = false; scene.add(skybeam);
  const siteObjects = new Map<string, THREE.Object3D>();
  for (const site of SITES) {
    const marker = new THREE.Group(); marker.position.set(site.x, site.y, site.z);
    const badgeStates = { return: ['? TURN IN', 'gold'], request: ['! REQUEST', 'gold'], objective: [site.kind === 'mechanism' ? 'USE' : 'DELIVER / READ', 'gold'], visited: ['✓ READ', 'green'], read: [site.kind === 'mechanism' ? 'USE' : 'READ', 'blue'] } as const;
    for (const [status, [text, tone]] of Object.entries(badgeStates)) { const badge = interactionBadge(text, tone); badge.name = 'badge:' + status; badge.position.y = 5; marker.add(badge); }
    const sign = label(site.name, '#e1eee3'); sign.position.y = 11; sign.scale.multiplyScalar(.66); marker.add(sign);
    if (site.id.startsWith('valve-')) {
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(3.4, .45, 6, 16), new THREE.MeshStandardMaterial({ color: '#b5664c' })); wheel.position.y = -3; marker.add(wheel);
      for (let i = 0; i < 3; i++) { const spoke = new THREE.Mesh(new THREE.BoxGeometry(.4, 6.8, .4), new THREE.MeshStandardMaterial({ color: '#b5664c' })); spoke.position.y = -3; spoke.rotation.z = i * Math.PI / 3; marker.add(spoke); }
    }
    scene.add(marker); siteObjects.set(site.id, marker);
  }
  buildTunnels(scene, b); const formations = buildCaveFormations(scene, solids); b.flush();
  const settlements = buildSettlements(scene, solids, label);
  return { siteObjects, wheels, lens, skybeam, formations, settlements };
}

function buildTunnels(scene: THREE.Scene, b: Builder) {
  const positions: number[] = [], colors: number[] = [];
  // A single union surface avoids overlapping tube walls and jagged seams at
  // forks. Floor and roof are sampled from the exact same section as collision.
  for (const kind of ['crystal', 'mine']) {
    const ss = segments.filter(s => s.kind === kind), step = 8;
    const minX = Math.floor(Math.min(...ss.flatMap(s => [s.a.x - s.radius, s.b.x - s.radius])) / step) * step;
    const maxX = Math.ceil(Math.max(...ss.flatMap(s => [s.a.x + s.radius, s.b.x + s.radius])) / step) * step;
    const minZ = Math.floor(Math.min(...ss.flatMap(s => [s.a.z - s.radius, s.b.z - s.radius])) / step) * step;
    const maxZ = kind === 'mine' ? -1060 : -300;
    type Sample = { x: number; z: number; c: CaveSection };
    const sample = (x: number, z: number): Sample => ({ x, z, c: tunnelSection(x, z, kind) });
    const triangle = (vertices: Sample[]) => {
      const clipped: Sample[] = [];
      for (let i = 0; i < 3; i++) {
        const a = vertices[i], bb = vertices[(i + 1) % 3]; if (a.c.field >= 0) clipped.push(a);
        if ((a.c.field >= 0) !== (bb.c.field >= 0)) {
          const t = a.c.field / (a.c.field - bb.c.field), x = a.x + (bb.x - a.x) * t, z = a.z + (bb.z - a.z) * t, cy = tunnelSection(x, z, kind).center;
          clipped.push({ x, z, c: { floor: cy, ceiling: cy, field: 0, center: cy } });
        }
      }
      for (let k = 1; k < clipped.length - 1; k++) for (const layer of ['floor', 'ceiling', 'rock'] as const) {
        const top = layer !== 'floor';
        const tri = top ? [clipped[0], clipped[k + 1], clipped[k]] : [clipped[0], clipped[k], clipped[k + 1]];
        for (const v of tri) { positions.push(v.x, top ? v.c.ceiling + (layer === 'rock' ? 18 : 0) : v.c.floor, v.z); const color = new THREE.Color(layer === 'rock' ? (kind === 'mine' ? '#8d947a' : '#819b80') : kind === 'mine' ? '#8d826e' : top ? '#829392' : '#868c80'); color.multiplyScalar(.92 + Math.sin(v.x * .07 + v.z * .05) * .06); colors.push(color.r, color.g, color.b); }
      }
    };
    for (let x = minX; x < maxX; x += step) {
      const left = sample(x, maxZ), right = sample(x + step, maxZ);
      if (left.c.field <= 0 || right.c.field <= 0) continue;
      for (const [xx, yy] of [[x,left.c.ceiling],[x+step,right.c.ceiling],[x+step,right.c.ceiling+18],[x,left.c.ceiling],[x+step,right.c.ceiling+18],[x,left.c.ceiling+18]]) { positions.push(xx,yy,maxZ); colors.push(.39,.44,.35); }
    }
    for (let z = minZ; z < maxZ; z += step) for (let x = minX; x < maxX; x += step) {
      const a = sample(x,z), bb = sample(x+step,z), c = sample(x+step,Math.min(maxZ,z+step)), d = sample(x,Math.min(maxZ,z+step)); triangle([a,bb,c]); triangle([a,c,d]);
    }
  }
  segments.forEach(s => {
    const dir = s.b.clone().sub(s.a), length = dir.length(), axis = dir.clone().normalize(), right = new THREE.Vector3(0, 1, 0).cross(axis).normalize(), up = axis.clone().cross(right).normalize();
    if (s.kind === 'mine') {
      for (let k = 0; k <= length; k += 32) {
        const p = s.a.clone().addScaledVector(axis, k);
        for (const side of [-1, 1]) { const foot = p.clone().addScaledVector(right, side * (s.radius - 10)); b.beam(foot.clone().addScaledVector(up, -s.height + 7), foot.clone().addScaledVector(up, s.height - 7), 2.3, '#856743'); }
        b.beam(p.clone().addScaledVector(right, -(s.radius - 10)).addScaledVector(up, s.height - 7), p.clone().addScaledVector(right, s.radius - 10).addScaledVector(up, s.height - 7), 2.7, '#9b8054');
        const lamp = new THREE.Mesh(new THREE.OctahedronGeometry(1.3), new THREE.MeshBasicMaterial({ color: '#ffd398' })); lamp.position.copy(p).addScaledVector(right, s.radius - 13).addScaledVector(up, 8); scene.add(lamp);
        b.box(p.x, p.y - 25, p.z, 12, .8, 2, '#695d48', false, Math.atan2(axis.x, axis.z));
      }
      const floorA = s.a.clone().addScaledVector(up, -25), floorB = s.b.clone().addScaledVector(up, -25);
      for (const side of [-1, 1]) b.beam(floorA.clone().addScaledVector(right, side * 4), floorB.clone().addScaledVector(right, side * 4), .8, '#667c72');
    }
  });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); geo.computeVertexNormals(); const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: .98, emissive: '#486568', emissiveIntensity: .25 })); mesh.receiveShadow = true; scene.add(mesh);
}

function buildCaveFormations(scene: THREE.Scene, solids: THREE.Box3[]) {
  const formations: { x: number; y: number; z: number; ceiling: boolean; bounds: THREE.Box3 }[] = [];
  const crystal = new THREE.LatheGeometry([new THREE.Vector2(2.8, 0), new THREE.Vector2(2.5, 10), new THREE.Vector2(0, 14)], 6);
  const limestone = new THREE.LatheGeometry([new THREE.Vector2(5, 0), new THREE.Vector2(3.2, 3), new THREE.Vector2(2.4, 7), new THREE.Vector2(1.3, 13), new THREE.Vector2(.2, 18)], 7);
  const rock = new THREE.DodecahedronGeometry(1, 0);
  const batches = [crystal, limestone, rock].map(geometry => ({ geometry, items: [] as { matrix: THREE.Matrix4; color: THREE.Color }[] }));
  let count = 0;
  for (let z = -953; z < -325; z += 33) for (let x = -986; x < -355; x += 37) {
    const c = tunnelSection(x, z, 'crystal');
    // Only the wall-side shelves: all branch centers and turning bays stay clear.
    if (c.field < .2 || c.field > .36 || [...SITES, ...EXTRA_SUPPLIES].some(s => Math.hypot(s.x - x, s.z - z) < 27)) continue;
    const ceiling = count++ % 4 === 0, base = ceiling ? c.ceiling + 3 : c.floor - 3, mineral = count % 3 !== 0;
    const groupBounds = new THREE.Box3();
    // A broad rock socket visibly joins the cluster to the surrounding limestone.
    const socket = new THREE.Object3D(); socket.position.set(x, ceiling ? c.ceiling + 1 : c.floor - 1, z); socket.scale.set(9, 5, 8); socket.rotation.y = count; socket.updateMatrix(); rock.computeBoundingBox();
    const socketBounds = rock.boundingBox!.clone().applyMatrix4(socket.matrix); solids.push(socketBounds); groupBounds.union(socketBounds); batches[2].items.push({ matrix: socket.matrix.clone(), color: new THREE.Color('#939a87') });
    for (let i = 0; i < (mineral ? 4 : 2); i++) {
      const px = x + Math.sin(i * 2.4) * 4, pz = z + Math.cos(i * 2.4) * 4, section = tunnelSection(px, pz, 'crystal');
      const o = new THREE.Object3D(); o.position.set(px, ceiling ? section.ceiling + 4 : section.floor - 4, pz);
      o.rotation.set(ceiling ? Math.PI : 0, i * 1.7 + count, (i - 1.5) * .08);
      const scale = .65 + ((count * 7 + i * 3) % 9) / 13; o.scale.setScalar(scale); o.updateMatrix();
      const batch = batches[mineral ? 0 : 1]; batch.geometry.computeBoundingBox();
      const bounds = batch.geometry.boundingBox!.clone().applyMatrix4(o.matrix); solids.push(bounds); groupBounds.union(bounds);
      batch.items.push({ matrix: o.matrix.clone(), color: new THREE.Color(mineral ? ['#7ca9af', '#a5c9c1', '#8799b2'][count % 3] : '#b2ad93') });
    }
    formations.push({ x, y: base, z, ceiling, bounds: groupBounds });
  }
  for (const { geometry, items } of batches) {
    const mesh = new THREE.InstancedMesh(geometry, new THREE.MeshStandardMaterial({ roughness: geometry === crystal ? .3 : .95, metalness: .12, flatShading: true }), items.length);
    items.forEach((o, i) => { mesh.setMatrixAt(i, o.matrix); mesh.setColorAt(i, o.color); }); mesh.castShadow = true; mesh.receiveShadow = true; mesh.name = geometry === crystal ? 'Anchored quartz clusters' : 'Limestone formations'; scene.add(mesh);
  }
  return formations;
}
