import * as THREE from 'three';
import { buildingAt, INTERIOR_LIFTS, relocate } from './architecture-data.ts';
import { type Point3, type FlightState, forwardVector, segmentSphere } from './flight.ts';
import { REGIONS, EXTRA_SUPPLIES, sanctuaryOpen, regionAt } from './atlas.ts';
import { buildValley, VALLEY_LIFTS, VALLEY_STATIONS, inTunnel, tunnelWall, tunnelCeiling } from './valley.ts';
import { type Progress, type Reward, type Drop, collect, enemyReward, recharge } from './progression.ts';

import { makePickup, pickupName, makeEnemy, enemyKind, animateEnemy, type EnemyKind } from './game-visuals.ts';
import { siteQuestStatus } from './quests.ts';

export const PLACES = REGIONS;
export const STATIONS = [
  { id: 'home', name: 'Hearthside front terrace', x: 0, y: 87, z: 370 },
  { id: 'west', name: 'West crossing', x: -70, y: 67, z: -210 },
  { id: 'cave', name: 'Cavern camp', x: -405, y: 83, z: -305 },
  { id: 'ridge', name: 'Highland relay', x: 360, y: 108, z: -750 },
  { id: 'north', name: 'Northwatch camp', x: -120, y: 115, z: -840 },
  { id: 'temple', name: 'Temple anchorage', x: 310, y: 155, z: -945 },
  ...VALLEY_STATIONS,
];
export const LIFTS = [
  ...INTERIOR_LIFTS,
  { x: 0, z: 370, base: 58, ceiling: 108, radius: 40, strength: 11, kind: 'vent' },
  { x: -965, z: -1480, base: 65, ceiling: 124, radius: 23, strength: 18, kind: 'vent', requires: 'mine-air' },
  { x: -790, z: -1580, base: 90, ceiling: 150, radius: 24, strength: 18, kind: 'vent', requires: 'mine-air' },
  { x: -10, z: -2560, base: 1, ceiling: 304, radius: 52, strength: 23, kind: 'thermal', requires: 'waterways' },
  { x: -260, z: -2910, base: 1, ceiling: 365, radius: 44, strength: 23, kind: 'thermal', requires: 'waterways' },
  ...VALLEY_LIFTS,
  { x: 45, z: -240, base: 1, ceiling: 108, radius: 45, strength: 12, kind: 'thermal' },
  { x: 292, z: -270, base: 1, ceiling: 100, radius: 35, strength: 12, kind: 'thermal' },
  { x: -70, z: -210, base: 1, ceiling: 115, radius: 37, strength: 14, kind: 'thermal' },
  { x: -335, z: -235, base: 1, ceiling: 132, radius: 43, strength: 15, kind: 'thermal' },
  { x: -405, z: -305, base: 1, ceiling: 110, radius: 33, strength: 13, kind: 'vent' },
  { x: -462, z: -403, base: 37, ceiling: 89, radius: 23, strength: 12, kind: 'vent' },
  { x: -520, z: -558, base: 57, ceiling: 107, radius: 19, strength: 14, kind: 'vent' },
  { x: 305, z: -375, base: 1, ceiling: 105, radius: 40, strength: 13, kind: 'thermal' },
  { x: 350, z: -570, base: 1, ceiling: 143, radius: 42, strength: 16, kind: 'thermal' },
  { x: 360, z: -750, base: 55, ceiling: 167, radius: 34, strength: 17, kind: 'vent' },
  { x: -120, z: -840, base: 45, ceiling: 163, radius: 49, strength: 17, kind: 'vent' },
  { x: 310, z: -945, base: 92, ceiling: 181, radius: 31, strength: 18, kind: 'vent' },
  { x: 285, z: -1085, base: 132, ceiling: 190, radius: 21, strength: 16, kind: 'vent' },
  { x: 335, z: -1180, base: 133, ceiling: 192, radius: 20, strength: 16, kind: 'vent' },
];
export const SUPPLIES: (Drop & { name: string })[] = [
  { id: 'cellar-tin', name: 'The cellar’s sewing tin', x: -100, y: 21, z: 251, reward: { parts: 9, ammo: 12 } },
  { id: 'boiler-parts', name: 'Boiler service parts', x: 100, y: 25, z: -24, reward: { parts: 8, charge: 50 } },
  { id: 'nursery-box', name: 'The nursery toy box', x: 98, y: 165, z: 251, reward: { parts: 8, ammo: 12 } },
  { id: 'attic-trunk', name: 'The forgotten attic trunk', x: 100, y: 231, z: -26, reward: { cores: 1, parts: 12 } },
  { id: 'mill-granary', name: 'Granary repair kit', x: -390, y: 184, z: 255, reward: { parts: 12, ammo: 10 } },
  { id: 'crystal-balcony', name: 'High gallery geode', x: -900, y: 150, z: -780, reward: { cores: 1, parts: 12 } },
  { id: 'mine-upper', name: 'Upper workings tool chest', x: -1180, y: 166, z: -1560, reward: { parts: 16, charge: 70 } },
  { id: 'depot-loft', name: 'Dispatcher’s strongbox', x: -690, y: 157, z: -1175, reward: { parts: 12, ammo: 14 } },
  { id: 'post-gallery', name: 'Undelivered repair parcel', x: 850, y: 160, z: -1480, reward: { parts: 14, charge: 60 } },
  { id: 'clock-lower', name: 'Clockmaker’s spare springs', x: 835, y: 94, z: -2120, reward: { parts: 14, ammo: 16 } },
  { id: 'temple-choir', name: 'Wind choir offering', x: 130, y: 240, z: -1260, reward: { cores: 1, parts: 18 } },
  { id: 'lock-archive', name: 'Waterkeeper’s reserve', x: 305, y: 211, z: -2110, reward: { charge: 90, parts: 12 } },
  { id: 'cistern-vault', name: 'Cistern maintenance chest', x: 60, y: 183, z: -2540, reward: { parts: 16, ammo: 20 } },
  { id: 'observatory-library', name: 'Celestial instrument case', x: -340, y: 401, z: -3120, reward: { cores: 1, charge: 120 } },
  ...EXTRA_SUPPLIES,
  { id: 'starter-scrap', name: 'A pocketful of possibilities', x: 0, y: 43, z: 300, reward: { parts: 6, ammo: 8 } },
  { id: 'foyer-supply', name: 'Conservatory supplies', x: 0, y: 50, z: 173, reward: { parts: 4, ammo: 12 } },
  { id: 'library-plans', name: 'Long-span wing plans', x: -28, y: 58, z: 42, reward: { parts: 8 } },
  { id: 'east-shelf', name: 'The gardener’s stash', x: 32, y: 52, z: 126, reward: { parts: 14, charge: 50 } },
  { id: 'west-supply', name: 'Relay supplies', x: -70, y: 69, z: -190, reward: { parts: 12, charge: 65, ammo: 12 } },
  { id: 'cavern-entrance', name: 'Cavern supplies', x: -450, y: 68, z: -357, reward: { parts: 15, ammo: 15, charge: 70 } },
  { id: 'cavern-core', name: 'Resonant wind core', x: -490, y: 77, z: -475, reward: { cores: 2, parts: 20, charge: 60 } },
  { id: 'cavern-folds', name: 'Ancient flight plans', x: -535, y: 100, z: -630, reward: { cores: 1, parts: 12, charge: 45 } },
  { id: 'ridge-supply', name: 'Highland supplies', x: 360, y: 111, z: -725, reward: { parts: 16, charge: 90, ammo: 16 } },
  { id: 'temple-gate', name: 'Guardian cache', x: 310, y: 154, z: -1018, reward: { parts: 22, charge: 90, ammo: 18 } },
  { id: 'temple-rudder', name: 'Skyweaver rudder', x: 270, y: 155, z: -1090, reward: { cores: 1, parts: 10 } },
  { id: 'skyheart', name: 'The Skyheart', x: 310, y: 171, z: -1210, reward: { relic: true, cores: 3, parts: 45, charge: 100 } },
];
SUPPLIES.forEach((s, i) => { SUPPLIES[i] = relocate(s); });
export function liftAt(p: Point3, progress?: Progress): number {
  let lift = 0; const roof = tunnelCeiling(p) - 8;
  for (const v of LIFTS) if ((!('requires' in v) || !v.requires || progress?.completed.includes(v.requires)) && p.y > v.base - 2 && p.y < v.ceiling) {
    const r = Math.hypot(p.x - v.x, p.z - v.z) / v.radius;
    if (r < 1) lift = Math.max(lift, v.strength * Math.min(1, (1 - r) * 3) * Math.max(0, Math.min(1, (Math.min(v.ceiling, roof) - p.y) / 12)));
  }
  return lift;
}
export function placeAt(p: Point3): typeof PLACES[number] | null {
  const site = buildingAt(p); if (site) return REGIONS.find(r => r.id === site.region)!;
  return inTunnel(p) ? regionAt(p) : null;
}
export function difficultyAt(p: Point3): number { return regionAt(p).tier; }
const material = (color: string, props = {}) => new THREE.MeshStandardMaterial({ color, roughness: .88, ...props });
const distance = (a: Point3, b: Point3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
export interface Enemy { id: string; tier: number; hp: number; home: THREE.Vector3; mesh: THREE.Group; cooldown: number; index: number; kind: EnemyKind; moving: THREE.Object3D[]; name: string }
interface Shot { mesh: THREE.Mesh; velocity: THREE.Vector3; life: number; hostile: boolean; damage: number }

export class Adventure {
  scene: THREE.Scene;
  solids: THREE.Box3[] = [];
  pickups = new Map<string, { data: Drop; mesh: THREE.Group }>();
  enemies: Enemy[] = [];
  shots: Shot[] = [];
  propellers: THREE.Object3D[] = [];
  labels: THREE.Object3D[] = [];
  fan: THREE.Group;
  particles: THREE.Points;
  valley: ReturnType<typeof buildValley>;
  solidGrid = new Map<string, THREE.Box3[]>();
  sanctuary: THREE.Mesh;
  markerState = '';
  shotCooldown = 0;
  enemyMaterial = material('#ad5954');
  bandGeometry = new THREE.TorusGeometry(.65, .14, 4, 8);
  bandMaterial = material('#ffdc85', { emissive: '#b2792f', emissiveIntensity: .7 });
  dangerMaterial = material('#ff8c76', { emissive: '#ed563f', emissiveIntensity: 1 });

  constructor(scene: THREE.Scene, plane: THREE.Group) {
    this.scene = scene;
    this.valley = buildValley(scene, this.solids, (text, color) => this.label(text, color));
    this.buildLifts(); this.buildStations();
    this.sanctuary = new THREE.Mesh(new THREE.SphereGeometry(12, 20, 12), material('#c2a3e8', { transparent: true, opacity: .35, wireframe: true, emissive: '#986ac2', emissiveIntensity: .7 })); this.sanctuary.position.set(310, 171, -1210); scene.add(this.sanctuary);
    for (const box of this.solids) for (let x = Math.floor(box.min.x / 64); x <= Math.floor(box.max.x / 64); x++) for (let z = Math.floor(box.min.z / 64); z <= Math.floor(box.max.z / 64); z++) { const key = x + ',' + z; if (!this.solidGrid.has(key)) this.solidGrid.set(key, []); this.solidGrid.get(key)!.push(box); }
    SUPPLIES.forEach(supply => this.addPickup(supply)); this.buildEnemies();
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(LIFTS.length * 70 * 3), 3));
    this.particles = new THREE.Points(geometry, new THREE.PointsMaterial({ color: '#ffdd9a', size: .65, transparent: true, opacity: .7, depthWrite: false }));
    this.particles.frustumCulled = false; scene.add(this.particles);
    this.fan = new THREE.Group(); this.fan.position.set(0, -.6, 2.5);
    const shroud = new THREE.Mesh(new THREE.TorusGeometry(.85, .18, 6, 16), material('#576761', { metalness: .65 })); this.fan.add(shroud);
    const blades = new THREE.Group(); for (let i = 0; i < 3; i++) { const blade = new THREE.Mesh(new THREE.BoxGeometry(.22, 1.3, .09), material('#c69e61', { metalness: .5 })); blade.rotation.z = i * Math.PI / 3; blades.add(blade); } this.fan.add(blades); plane.add(this.fan); this.propellers.push(blades);
  }
  box(x: number, y: number, z: number, w: number, h: number, d: number, mat: THREE.Material, solid = true) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; this.scene.add(mesh);
    if (solid) this.solids.push(new THREE.Box3(new THREE.Vector3(x - w / 2, y - h / 2, z - d / 2), new THREE.Vector3(x + w / 2, y + h / 2, z + d / 2)));
    return mesh;
  }
  label(text: string, color = '#fff0ce'): THREE.Sprite | THREE.Group {
    if (typeof document === 'undefined') return new THREE.Group();
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 96;
    const ctx = canvas.getContext('2d')!; ctx.fillStyle = 'rgba(25,44,42,.78)'; ctx.beginPath(); ctx.roundRect(0, 0, 512, 96, 18); ctx.fill(); ctx.fillStyle = color; let fontSize = 25; do { ctx.font = `500 ${fontSize--}px sans-serif`; } while (ctx.measureText(text).width > 480 && fontSize > 14); ctx.textAlign = 'center'; ctx.fillText(text, 256, 57);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, sizeAttenuation: false })); sprite.scale.set(.38, .0713, 1); this.labels.push(sprite); return sprite;
  }
  gate(z: number, x: number, center: number, width: number, floor: number, roof: number, opening: number, mat: THREE.Material) {
    const min = x - width / 2, max = x + width / 2;
    const left = center - opening / 2, right = center + opening / 2;
    if (left > min) this.box((left + min) / 2, (floor + roof) / 2, z, left - min, roof - floor, 2.5, mat);
    if (right < max) this.box((right + max) / 2, (floor + roof) / 2, z, max - right, roof - floor, 2.5, mat);
    this.box(center, roof - 4, z, opening, 8, 3, mat);
  }
  buildLifts() {
    const iron = material('#58645b'), glow = material('#e9ac58', { emissive: '#f1ae4d', emissiveIntensity: 1.2 });
    LIFTS.forEach(v => {
      if (v.kind === 'vent') { this.box(v.x, v.base, v.z, 15, 2, 15, iron); for (let i = -5; i <= 5; i += 2) this.box(v.x + i, v.base + 1.05, v.z, .7, .2, 12, glow, false); }
      const ring = new THREE.Mesh(new THREE.TorusGeometry(v.radius * .52, .15, 5, 40), new THREE.MeshBasicMaterial({ color: '#eac077', transparent: true, opacity: .3 })); ring.rotation.x = -Math.PI / 2; ring.position.set(v.x, v.base + 3, v.z); this.scene.add(ring);
    });
  }
  buildStations() {
    STATIONS.forEach(station => {
      const floor = station.y - 22;
      for (const dx of [-12, 12]) for (const dz of [-12, 12]) this.box(station.x + dx, floor / 2, station.z + dz, 3, floor, 3, material('#78644e'));
      this.box(station.x, floor, station.z, 32, 3, 32, material('#8b8063'));
      const beacon = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 6, 8), material('#acdcb4', { emissive: '#65a98b', emissiveIntensity: 2 })); beacon.position.set(station.x + 12, station.y, station.z); this.scene.add(beacon);
      this.box(station.x + 12, floor + 10, station.z, 1.4, 20, 1.4, material('#8b8063'));
      const light = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 1, 40, 1, true), new THREE.MeshBasicMaterial({ color: '#addfac', transparent: true, opacity: .35, side: THREE.DoubleSide })); light.position.set(station.x, floor + 3, station.z); this.scene.add(light);
      const label = this.label('⚡ ' + station.name.toUpperCase(), '#bbf2d2'); label.position.set(station.x, station.y + 21, station.z); label.scale.multiplyScalar(.67); this.scene.add(label);
    });
  }
  addPickup(data: Drop) {
    const existing = this.pickups.get(data.id);
    if (existing) { existing.data = data; existing.mesh.position.set(data.x, data.y, data.z); existing.mesh.visible = true; return; }
    const mesh = makePickup(data); mesh.position.set(data.x, data.y, data.z);
    const tag = this.label(pickupName(data) + ' · FLY THROUGH', '#ffe0a3'); tag.name = 'pickup-label'; tag.position.y = 9; tag.scale.multiplyScalar(.8); mesh.add(tag);
    this.scene.add(mesh); this.pickups.set(data.id, { data, mesh });
  }
  buildEnemies() {
    const spawns = [
      [40, 94, 257, 1], [-90, 164, 22, 1], [92, 225, 58, 1],
      [-438, 69, -390, 2], [-490, 88, -475, 2], [-535, 95, -601, 2], [-412, 98, -306, 2],
      [339, 130, -789, 2], [312, 167, -1038, 3], [284, 166, -1100, 3], [329, 176, -1187, 3], [300, 175, -1215, 3],
      [-408, 64, 390, 1], [-466, 76, 209, 1], [350, 52, 430, 1],
      [-635, 102, -766, 2], [-698, 90, -735, 2], [-778, 100, -640, 2],
      [-920, 105, -1180, 3], [-928, 105, -1340, 3], [-968, 106, -1520, 3], [-1020, 98, -1700, 3], [-780, 128, -1540, 3], [-964, 116, -1830, 3],
      [950, 99, -1420, 2], [1170, 105, -1590, 2], [745, 109, -1650, 2], [1143, 101, -1850, 2], [875, 164, -1790, 3], [835, 236, -2090, 3],
      [295, 147, -2070, 3], [-190, 165, -2240, 3], [450, 163, -2380, 3], [60, 195, -2500, 3],
      [-80, 259, -2810, 3], [-525, 313, -3010, 4], [100, 314, -3290, 4], [-245, 330, -3205, 4], [-280, 334, -3300, 4], [-520, 365, -3500, 4],
    ];
    spawns.forEach(([x, y, z, tier], index) => {
      const visual = makeEnemy(enemyKind(index)), mesh = visual.mesh; mesh.position.set(x, y, z);
      const tag = this.label(visual.name.toUpperCase() + ' · TIER ' + tier, '#ffb4a1'); tag.position.y = 8; tag.scale.multiplyScalar(.58); mesh.add(tag); mesh.userData.tag = tag;
      this.scene.add(mesh); this.enemies.push({ ...visual, id: `guardian-${index}`, tier, hp: tier, home: new THREE.Vector3(x, y, z), cooldown: 2 + index % 3, index });
    });
  }
  sync(p: Progress) {
    this.markerState = '';
    for (const { data, mesh } of this.pickups.values()) mesh.visible = !p.collected.includes(data.id) && (!data.id.startsWith('loot-') || p.drops.some(drop => drop.id === data.id));
    p.drops.filter(drop => !p.collected.includes(drop.id)).forEach(drop => this.addPickup(drop));
    this.enemies.forEach(enemy => { enemy.mesh.visible = !p.defeated.includes(enemy.id); enemy.hp = enemy.tier; });
    this.fan.visible = p.fan;
    this.shots.forEach(shot => this.scene.remove(shot.mesh)); this.shots = [];
    this.shotCooldown = 0;
  }
  hitsSolid(p: Point3, margin = 1.5): boolean {
    const nearby = new Set<THREE.Box3>();
    for (let x = Math.floor((p.x - margin) / 64); x <= Math.floor((p.x + margin) / 64); x++) for (let z = Math.floor((p.z - margin) / 64); z <= Math.floor((p.z + margin) / 64); z++) this.solidGrid.get(x + ',' + z)?.forEach(b => nearby.add(b));
    for (const box of nearby) if (p.x > box.min.x - margin && p.x < box.max.x + margin && p.y > box.min.y - margin && p.y < box.max.y + margin && p.z > box.min.z - margin && p.z < box.max.z + margin) return true;
    return tunnelWall(p, margin);
  }
  pathBlocked(a: Point3, b: Point3, margin = 1): boolean {
    const steps = Math.max(1, Math.ceil(distance(a, b) / 1.4));
    for (let i = 1; i <= steps; i++) { const t = i / steps; if (this.hitsSolid({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t }, margin)) return true; }
    return false;
  }
  clipCamera(plane: THREE.Vector3, camera: THREE.Vector3): void {
    const delta = camera.clone().sub(plane), length = delta.length();
    for (let d = 2; d < length; d += 1.4) { const point = plane.clone().addScaledVector(delta, d / length); if (this.hitsSolid(point, .8)) { camera.copy(plane).addScaledVector(delta, Math.max(2, d - 2) / length); return; } }
  }
  fire(state: FlightState, p: Progress): boolean {
    if (this.shotCooldown > 0 || p.ammo <= 0) return false;
    const origin = new THREE.Vector3(state.x, state.y, state.z), forward = forwardVector(state);
    const direction = new THREE.Vector3(forward.x, forward.y, forward.z);
    // A small aim assist helps hit moving paper enemies without mouse aiming.
    const candidates = this.enemies.filter(e => e.mesh.visible && e.mesh.position.distanceTo(origin) < 125).sort((a, b) => a.mesh.position.distanceTo(origin) - b.mesh.position.distanceTo(origin));
    for (const enemy of candidates) { const target = enemy.mesh.position.clone().sub(origin).normalize(); if (target.dot(direction) > .976 && !this.pathBlocked(origin, enemy.mesh.position, .1)) { direction.copy(target); break; } }
    this.spawnShot(origin.addScaledVector(direction, 5), direction.multiplyScalar(110 + state.speed * .4), false, 1); p.ammo--; this.shotCooldown = .28; return true;
  }
  spawnShot(origin: THREE.Vector3, velocity: THREE.Vector3, hostile: boolean, damage: number) {
    const mesh = new THREE.Mesh(this.bandGeometry, hostile ? this.dangerMaterial : this.bandMaterial); mesh.position.copy(origin); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), velocity.clone().normalize()); this.scene.add(mesh);
    this.shots.push({ mesh, velocity, life: hostile ? 5 : 2.8, hostile, damage });
  }
  update(dt: number, time: number, state: FlightState, p: Progress, active: boolean, onEvent: (message: string, save: boolean) => void, onDamage: (damage: number) => void, powered = false) {
    this.labels.forEach(label => { const at = label.getWorldPosition(new THREE.Vector3()); label.visible = active && distance(at, state) < 170; });
    this.valley.wheels.forEach(w => w.rotation.z += dt * .15);
    const markerState = [p.accepted.length,p.completed.length,p.collected.length,p.discovered.length,p.defeated.length,p.relic].join(':');
    this.valley.siteObjects.forEach((o, id) => { o.visible = active && distance(state, o.position) < 105; if (markerState !== this.markerState) { const status = siteQuestStatus(p, id); o.children.forEach(child => { if (child.name.startsWith('badge:')) child.visible = child.name === 'badge:' + status; }); } }); this.markerState = markerState;
    this.sanctuary.visible = !sanctuaryOpen(p) && !p.relic; this.sanctuary.rotation.y = time * .2;
    this.valley.lens.rotation.z += dt * (p.completed.includes('starfall') ? .8 : .035);
    this.valley.skybeam.visible = p.completed.includes('starfall');
    this.fan.visible = p.fan; this.propellers.forEach(propeller => propeller.rotation.z += dt * (powered ? 65 : 1.5));
    const attr = this.particles.geometry.getAttribute('position');
    LIFTS.forEach((v, k) => { const enabled = !('requires' in v) || !v.requires || p.completed.includes(v.requires); for (let i = 0; i < 70; i++) { const a = i * 2.4 + time * .5, h = ((i * 1.73 + time * 7) % (v.ceiling - v.base)), r = (4 + i % 15) / 20 * v.radius; attr.setXYZ(k * 70 + i, v.x + Math.cos(a) * r, enabled ? v.base + h : -100, v.z + Math.sin(a) * r); } }); attr.needsUpdate = true;
    for (const { data, mesh } of this.pickups.values()) {
      mesh.rotation.y = Math.sin(time * .6 + data.x) * .32; const tag = mesh.getObjectByName('pickup-label'); if (tag) tag.visible = active && distance(state, mesh.position) < 55; mesh.position.y = data.y + Math.sin(time * 1.7 + data.x) * .9;
      if (data.id === 'skyheart' && !sanctuaryOpen(p) && !p.relic) continue;
      if (active && mesh.visible && distance(state, mesh.position) < (data.reward.fan ? 14 : 11) && !this.pathBlocked(state, mesh.position, .1)) {
        const message = collect(p, data.id, data.reward); mesh.visible = false; if (message) onEvent(`${pickupName(data)} · ${message}`, true);
      }
    }
    if (!active) return;
    this.shotCooldown = Math.max(0, this.shotCooldown - dt);
    STATIONS.forEach(station => { if (distance(state, station) < 22) { recharge(p, dt); if (!p.discovered.includes('station-' + station.id)) p.discovered.push('station-' + station.id); if (p.checkpoint !== station.id) { p.checkpoint = station.id; onEvent(`${station.name} reached · checkpoint saved`, true); } } });
    const place = regionAt(state); if (Math.hypot(place.x - state.x, place.z - state.z) < place.radius && !p.discovered.includes(place.id)) { p.discovered.push(place.id); onEvent(`${place.name} discovered · region ${place.tier}`, true); }
    for (const enemy of this.enemies) {
      if (!enemy.mesh.visible) continue;
      enemy.mesh.position.copy(enemy.home).add(new THREE.Vector3(Math.sin(time * .35 + enemy.index) * (enemy.tier === 1 ? 4 : 7), Math.sin(time * .7 + enemy.index) * 2.8, Math.cos(time * .35 + enemy.index) * 5));
      enemy.mesh.lookAt(state.x, state.y, state.z); animateEnemy(enemy.kind, enemy.moving, time + enemy.index); enemy.mesh.userData.tag.visible = distance(state, enemy.mesh.position) < 70;
      const d = distance(enemy.mesh.position, state); enemy.cooldown -= dt;
      if (d < 90 + enemy.tier * 10 && enemy.cooldown <= 0 && !this.pathBlocked(enemy.mesh.position, state, .1)) { const dir = new THREE.Vector3(state.x, state.y, state.z).sub(enemy.mesh.position).normalize(); this.spawnShot(enemy.mesh.position.clone().addScaledVector(dir, 5), dir.multiplyScalar(20 + enemy.tier * 5), true, 6 + enemy.tier * 4); enemy.cooldown = 4.5 - enemy.tier * .65; }
      if (d < 5.5) onDamage(12);
    }
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const shot = this.shots[i], before = shot.mesh.position.clone(); shot.mesh.position.addScaledVector(shot.velocity, dt); shot.life -= dt;
      if (this.pathBlocked(before, shot.mesh.position, .1)) shot.life = 0;
      if (shot.life > 0 && shot.hostile && segmentSphere(before, shot.mesh.position, state, 3.8)) { onDamage(shot.damage); shot.life = 0; }
      if (shot.life > 0 && !shot.hostile) for (const enemy of this.enemies) {
        if (!enemy.mesh.visible || !segmentSphere(before, shot.mesh.position, enemy.mesh.position, 5.5)) continue;
        enemy.hp--; shot.life = 0;
        if (enemy.hp <= 0) {
          enemy.mesh.visible = false; p.defeated.push(enemy.id);
          const drop: Drop = { id: 'loot-' + enemy.id, x: enemy.mesh.position.x, y: enemy.mesh.position.y, z: enemy.mesh.position.z, reward: enemyReward(enemy.index, enemy.tier) };
          p.drops.push(drop); this.addPickup(drop); onEvent(`${enemy.name} defeated · fly through the supply drop`, true);
        } else onEvent(`${enemy.name} hit · ${enemy.hp} band${enemy.hp === 1 ? '' : 's'} to go`, false);
        break;
      }
      if (shot.life <= 0) { this.scene.remove(shot.mesh); this.shots.splice(i, 1); }
    }
  }
}
