import * as THREE from 'three';
import type { Drop } from './progression.ts';

const materials = new Map<string, THREE.MeshStandardMaterial>();
function mat(color: string, glow = false) {
  const key = color + glow;
  if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: .55, metalness: .25, emissive: glow ? color : '#000000', emissiveIntensity: glow ? .6 : 0, side: THREE.DoubleSide }));
  return materials.get(key)!;
}
function part(g: THREE.Object3D, geo: THREE.BufferGeometry, color: string, x = 0, y = 0, z = 0, glow = false) {
  const m = new THREE.Mesh(geo, mat(color, glow)); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m;
}
const box = (g: THREE.Object3D, x: number, y: number, z: number, w: number, h: number, d: number, c: string) => part(g, new THREE.BoxGeometry(w, h, d), c, x, y, z);
const ring = (g: THREE.Object3D, r: number, tube: number, c: string, x = 0, y = 0, z = 0) => part(g, new THREE.TorusGeometry(r, tube, 5, 20), c, x, y, z);

export function pickupKind(data: Drop) {
  if (/estate-note|mine-ledger|plans|folds/.test(data.id) || data.reward.upgrade) return 'notebook';
  if (data.id === 'fan-housing' || data.reward.fan) return 'fan';
  if (data.id === 'fan-coil') return 'coil';
  if (data.id === 'fan-blades') return 'propeller';
  if (data.id.startsWith('sigil-')) return 'sigil';
  if (data.id.startsWith('echo-')) return 'stone';
  if (data.id.startsWith('survey-')) return 'plate';
  if (data.reward.relic) return 'relic';
  if (data.id.startsWith('lens-') || data.reward.cores) return 'lens';
  if (data.reward.charge && (data.reward.charge >= 65 || !data.reward.parts)) return 'battery';
  if (data.reward.ammo && !data.reward.parts) return 'bands';
  return 'parts';
}
export function pickupName(data: Drop & { name?: string }) {
  if (data.name) return data.name;
  return { notebook: 'Upgrade plans', fan: 'Electric fan', coil: 'Copper winding', propeller: 'Carved propeller', sigil: 'Valley sigil', stone: 'Tuning stone', plate: 'Survey plate', relic: 'The Skyheart', lens: 'Wind core & salvage', battery: 'Charge cell & supplies', bands: 'Rubber bands', parts: 'Spare parts & supplies' }[pickupKind(data)];
}
/** Small, recognizable physical objects. Interaction pins use a separate 2D language. */
export function makePickup(data: Drop) {
  const g = new THREE.Group(), kind = pickupKind(data); g.name = 'pickup:' + kind;
  if (kind === 'notebook') {
    box(g, 0, 0, 0, 5.7, 6.8, 1.5, '#588e6f'); box(g, .3, 0, .8, 4.8, 6.1, .45, '#f4e5b9');
    box(g, -2.5, 0, .8, .7, 6.8, .7, '#c49952');
    for (let i = 0; i < 4; i++) box(g, .5, 1.8 - i, 1.06, 3 - i % 2, .16, .1, '#63715c');
    box(g, 1.7, -3.6, .4, .65, 1.5, .4, '#b66552'); g.rotation.z = -.15;
  } else if (kind === 'parts') {
    box(g, 0, -1, 0, 6, 3.8, 4, '#ac7b44'); box(g, 0, 1, 0, 6.5, .6, 4.4, '#d4a456');
    for (const x of [-2, 2]) box(g, x, -.6, 2.1, .55, 4, .2, '#526f69');
    const cog = ring(g, 1.6, .65, '#d8d1aa', 0, 2, 0); cog.rotation.x = -.6;
    for (let i = 0; i < 6; i++) box(g, Math.cos(i * Math.PI / 3) * 2, 2 + Math.sin(i * Math.PI / 3) * 2, 0, 1, 1, .7, '#d8d1aa');
  } else if (kind === 'battery') {
    part(g, new THREE.CylinderGeometry(2.4, 2.4, 6.5, 12), '#5d9c87');
    for (const y of [-3.1, 3.1]) part(g, new THREE.CylinderGeometry(2.5, 2.5, .7, 12), '#d2d9b5', 0, y);
    box(g, 0, 3.8, 0, 2.4, .9, 2, '#d3b16c'); box(g, 0, .4, 2.42, 2.5, .45, .25, '#f9efb5'); box(g, 0, .4, 2.42, .45, 2.5, .25, '#f9efb5');
  } else if (kind === 'bands') {
    for (let i = 0; i < 4; i++) { const r = ring(g, 2.6, .3, '#dfa65d', 0, i * .5 - .75, 0); r.scale.y = .7; r.rotation.set(.9, i * .15, i * .5); }
    box(g, 0, 0, 0, 1.4, 4.5, 1.5, '#f2e0b5');
  } else if (kind === 'coil') {
    const spool = part(g, new THREE.CylinderGeometry(1.2, 1.2, 5, 10), '#657d75'); spool.rotation.x = Math.PI / 2;
    for (let i = 0; i < 7; i++) ring(g, 2.7, .36, '#c5814e', 0, 0, -2 + i * .65);
  } else if (kind === 'fan' || kind === 'propeller') {
    if (kind === 'fan') { ring(g, 4, .65, '#879b8c'); ring(g, 3.2, .2, '#d7d7ba', 0, 0, .8); }
    for (let i = 0; i < 3; i++) { const blade = new THREE.Group(); blade.rotation.z = i * Math.PI * 2 / 3; box(blade, 0, 2, 0, 1.4, 4.5, .45, kind === 'fan' ? '#d4d7b8' : '#bf945c'); g.add(blade); }
    part(g, new THREE.SphereGeometry(1, 8, 6), '#62786d');
  } else if (kind === 'sigil' || kind === 'plate') {
    if (kind === 'sigil') { const coin = part(g, new THREE.CylinderGeometry(3.4, 3.4, .7, 24), '#c6a565'); coin.rotation.x = Math.PI / 2; ring(g, 2.7, .2, '#f5dc9a', 0, 0, .45); }
    else box(g, 0, 0, 0, 5.7, 6.5, .8, '#baab78');
    for (const side of [-1, 1]) { const line = box(g, side * .75, 0, .5, .4, 3.3, .3, '#546d71'); line.rotation.z = side * -.55; }
    box(g, 0, -1, .5, 2.9, .35, .3, '#546d71');
  } else if (kind === 'stone') {
    const rock = part(g, new THREE.IcosahedronGeometry(3.3, 0), '#87b9c0'); rock.scale.set(.75, 1.25, .7);
    for (const x of [-1, 0, 1]) box(g, x, 0, 2, .22, 2.8 - Math.abs(x), .2, '#e3eecf');
  } else {
    const lens = part(g, new THREE.SphereGeometry(2.7, 12, 8), kind === 'relic' ? '#d5b3ee' : '#a3d1dc', 0, 0, 0, true); lens.scale.z = .4;
    ring(g, 3.3, .55, '#ccb57a');
    if (kind === 'relic') for (let i = 1; i <= 2; i++) { const r = ring(g, 4 + i, .22, '#eed590'); r.rotation.set(i * 1.1, i * .7, 0); }
    else box(g, 0, -4, 0, .8, 2.4, .8, '#c6aa73');
  }
  return g;
}

export type EnemyKind = 'moth' | 'bat' | 'rotor' | 'beetle' | 'warden' | 'kite';
export const ENEMY_NAMES: Record<EnemyKind, string> = { moth: 'Paper wasp', bat: 'Echo bat', rotor: 'Mine drone', beetle: 'Clockwork sentry', warden: 'Temple warden', kite: 'Storm kite' };
export function enemyKind(index: number): EnemyKind {
  return index < 3 || index >= 12 && index <= 14 ? 'moth' : index >= 3 && index <= 6 || index >= 15 && index <= 17 ? 'bat' : index >= 18 && index <= 23 ? 'rotor' : index >= 24 && index <= 29 ? 'beetle' : index >= 34 ? 'kite' : 'warden';
}
function wing(g: THREE.Group, points: number[], c: string) {
  const shape = new THREE.Shape(); shape.moveTo(points[0], points[1]); for (let i = 2; i < points.length; i += 2) shape.lineTo(points[i], points[i + 1]); shape.closePath();
  const m = part(g, new THREE.ShapeGeometry(shape), c); m.rotation.x = -Math.PI / 2; return m;
}
export function makeEnemy(kind: EnemyKind) {
  const g = new THREE.Group(), moving: THREE.Object3D[] = []; g.name = 'enemy:' + kind;
  const dark = '#394950', red = '#e36d54';
  if (kind === 'moth' || kind === 'bat' || kind === 'kite') {
    const body = part(g, new THREE.SphereGeometry(2.2, 8, 6), kind === 'moth' ? '#b78043' : dark); body.scale.set(.75, .7, 1.6);
    for (const side of [-1, 1]) {
      const flap = new THREE.Group(); g.add(flap); moving.push(flap);
      wing(flap, kind === 'bat' ? [0,0,side*3,4,side*9,1,side*7,0,side*6,-2,side*4,-1,side*2,-3] : kind === 'kite' ? [0,3,side*9,-1,side*4,-2,side*2,-5,0,-3] : [0,0,side*5,4,side*7,2,side*5,-2,0,-1], kind === 'bat' ? '#887b9c' : kind === 'kite' ? '#647e91' : '#ead8a5');
      const vein = box(flap, side * 3.8, .1, -.6, 6, .12, .35, kind === 'moth' ? '#a55743' : '#424e68'); vein.rotation.y = side * -.4;
      if (kind === 'bat') part(g, new THREE.ConeGeometry(.8, 2.6, 4), '#90809d', side * 1.3, 1.7, 1.8);
    }
    if (kind === 'moth') for (let i = 0; i < 3; i++) box(g, 0, 1.45, -1.8 + i * 1.3, 2.3, .18, .4, '#574d3b');
    if (kind === 'kite') for (const side of [-1, 1]) { const tail = box(g, side, -.2, -5, .6, .2, 7, '#b68171'); tail.rotation.y = side * .15; }
  } else if (kind === 'rotor') {
    box(g, 0, 0, 0, 5, 3.4, 5, '#a89555'); box(g, 0, 1.8, 0, 4, .7, 4, '#525c56');
    for (const side of [-1, 1]) {
      box(g, side * 4, 1, 0, 5, .6, .6, '#58645b'); const rotor = new THREE.Group(); rotor.position.set(side * 5.3, 1.5, 0); g.add(rotor); moving.push(rotor);
      ring(rotor, 2.6, .35, '#617169').rotation.x = Math.PI / 2; box(rotor, 0, 0, 0, 4.6, .2, .55, '#dcd4a9');
      box(g, side * 2.4, -2.3, 0, .5, 2, 4.6, '#475754');
    }
    for (let i = -1; i <= 1; i++) box(g, i * 1.3, 0, 2.6, .5, 2.3, .15, '#433f33');
  } else if (kind === 'beetle') {
    const shell = part(g, new THREE.SphereGeometry(3.5, 12, 8), '#ac8a50'); shell.scale.set(1, .65, 1.2);
    box(g, 0, 2.25, 0, .3, .3, 6.4, '#4e625b');
    for (const side of [-1, 1]) { const foil = new THREE.Group(); g.add(foil); moving.push(foil); wing(foil, [side*2,2,side*7,0,side*7,-3,side*2,-2], '#81a6a0'); for (let i = 0; i < 3; i++) { const leg = box(g, side * 3.6, -1, 1.9 - i * 1.8, 3, .5, .5, '#655a43'); leg.rotation.z = side * -.4; } }
  } else {
    part(g, new THREE.CylinderGeometry(1.5, 3.2, 5, 8), '#b3a884'); part(g, new THREE.SphereGeometry(1.5, 8, 6), '#636d64', 0, -2.4);
    const crown = new THREE.Group(); g.add(crown); moving.push(crown);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; const blade = part(crown, new THREE.ConeGeometry(1.2, 5, 3), '#a4bca5', Math.cos(a) * 4.6, 1, Math.sin(a) * 4.6); blade.rotation.z = -.7; }
  }
  // All hostile silhouettes share paired red eyes, never pickup-colored halos.
  for (const x of [-.9, .9]) part(g, new THREE.SphereGeometry(.48, 8, 6), red, x, .3, kind === 'beetle' ? 3.8 : 2.9, true);
  return { mesh: g, moving, kind, name: ENEMY_NAMES[kind] };
}
export function animateEnemy(kind: EnemyKind, moving: THREE.Object3D[], time: number) {
  moving.forEach((o, i) => { if (kind === 'rotor' || kind === 'warden') o.rotation.y = time * (kind === 'rotor' ? 23 : 1.4); else o.rotation.z = Math.sin(time * (kind === 'bat' ? 9 : kind === 'moth' ? 16 : 5)) * (i ? 1 : -1) * .35; });
}

/** Screen-facing signposts: key + action, with shape as well as color differentiation. */
export function interactionBadge(text: string, tone: 'gold' | 'blue' | 'green' = 'blue') {
  if (typeof document === 'undefined') return new THREE.Group();
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
  const c = canvas.getContext('2d')!, colors = { gold: ['#f3d693', '#443f2b'], blue: ['#d8e9e4', '#294c52'], green: ['#bcd8ad', '#314a36'] }[tone];
  c.fillStyle = colors[1]; c.beginPath(); c.roundRect(3, 3, 506, 103, 16); c.fill(); c.strokeStyle = colors[0]; c.lineWidth = 3; c.stroke();
  c.beginPath(); c.moveTo(242, 106); c.lineTo(256, 125); c.lineTo(270, 106); c.fill();
  c.fillStyle = colors[0]; c.beginPath(); c.roundRect(17, 20, 63, 65, 10); c.fill(); c.fillStyle = colors[1]; c.font = 'bold 38px sans-serif'; c.textAlign = 'center'; c.fillText('E', 49, 66);
  c.fillStyle = colors[0]; c.textAlign = 'left'; let size = 27; do { c.font = `600 ${size--}px sans-serif`; } while (c.measureText(text).width > 396 && size > 15); c.fillText(text, 96, 63);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, sizeAttenuation: false })); sprite.scale.set(.3, .075, 1); return sprite;
}
