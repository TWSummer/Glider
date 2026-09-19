import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Adventure, liftAt, STATIONS, SUPPLIES } from './adventure.ts';
import { World, groundHeight } from './world.ts';
import { initialFlight, stepFlight, type Point3 } from './flight.ts';
import { newProgress } from './progression.ts';
const world = new World(), adventure = new Adventure(world.scene, world.plane);
const neutral = { left: false, right: false, up: false, down: false, boost: false };
test('starter route is forgiving but never awards the fan without exploration', () => {
  const p = newProgress(), s = initialFlight(); adventure.sync(p);
  for (let i = 0; i < 650 && !p.fan; i++) {
    const before = { ...s }; stepFlight(s, neutral, 1 / 60, liftAt(s)); assert.equal(adventure.pathBlocked(before, s), false, `starter path hit a wall at ${s.z}`);
    assert.ok(s.y > groundHeight(s.x, s.z) + 2); assert.equal(world.hitsObstacle(s.x, s.y, s.z), false);
    adventure.update(1 / 60, i / 60, s, p, true, () => {}, () => {});
  }
  assert.equal(p.fan, false); assert.ok(p.parts >= 10); assert.ok(p.ammo >= 30); assert.equal(p.completed.length, 0);
});
test('the house has a connected four-storey atrium with solid floors and room boundaries', () => {
  for (const y of [25, 90, 160, 230]) {
    assert.equal(adventure.pathBlocked({ x: 95, y, z: 250 }, { x: 95, y, z: -25 }), false);
    assert.equal(adventure.hitsSolid({ x: 180, y, z: 200 }), true);
  }
  assert.equal(adventure.pathBlocked({ x: 0, y: 15, z: 112 }, { x: 0, y: 300, z: 112 }), false);
  assert.equal(adventure.hitsSolid({ x: 95, y: 133, z: 250 }), true);
  assert.equal(adventure.hitsSolid({ x: 138, y: 95, z: 279 }), true);
  assert.equal(adventure.pathBlocked({ x: 138, y: 78, z: 310 }, { x: 138, y: 78, z: 250 }, 4), false, 'fly beneath a full-size desk');
});
test('expanded caves and temple retain physical walls', () => {
  assert.equal(adventure.pathBlocked({ x: -450, y: 74, z: -300 }, { x: -470, y: 80, z: -470 }), false);
  assert.equal(adventure.hitsSolid({ x: -450, y: 115, z: -310 }), true);
  assert.equal(adventure.pathBlocked({ x: 310, y: 163, z: -950 }, { x: 310, y: 163, z: -1310 }), false);
  assert.equal(adventure.hitsSolid({ x: 570, y: 160, z: -1010 }), true);
});
test('recharge camps and pickups are above terrain and clear of obstacles', () => {
  for (const p of [...STATIONS, ...SUPPLIES]) { assert.equal(adventure.hitsSolid(p), false, p.id); assert.ok(p.y > groundHeight(p.x, p.z) + 2, p.id); assert.equal(world.hitsObstacle(p.x, p.y, p.z), false, p.id); }
});
test('vents have a ceiling and radius rather than infinite global lift', () => {
  assert.ok(liftAt({ x: 0, y: 85, z: 370 }) > 8); assert.equal(liftAt({ x: 0, y: 120, z: 370 }), 0); assert.equal(liftAt({ x: 90, y: 85, z: 370 }), 0);
});
test('rubber bands kill guardians and leave collectible persistent loot', () => {
  const p = newProgress(); adventure.sync(p); const enemy = adventure.enemies[0], s = initialFlight(); Object.assign(s, { x: enemy.home.x, y: enemy.home.y, z: enemy.home.z + 35 });
  adventure.update(1 / 60, 0, s, p, true, () => {}, () => {}); assert.equal(adventure.fire(s, p), true); assert.equal(p.ammo, 15);
  for (let i = 0; i < 150 && enemy.mesh.visible; i++) { adventure.fire(s,p); adventure.update(1 / 60, i / 60, s, p, true, () => {}, () => {}); }
  assert.equal(enemy.mesh.visible, false); assert.ok(p.defeated.includes(enemy.id)); assert.equal(p.drops.length, 1);
  const drop = p.drops[0], parts = p.parts; Object.assign(s, { x: drop.x, y: drop.y, z: drop.z }); adventure.update(1 / 60, 1, s, p, true, () => {}, () => {}); assert.ok(p.parts > parts); assert.equal(p.drops.length, 0);
  adventure.sync(p); assert.equal(enemy.mesh.visible, false); assert.equal(adventure.pickups.get(drop.id)?.mesh.visible, false);
});
test('new adventures do not resurrect loot from a previous save', () => {
  adventure.sync(newProgress()); for (const [id, pickup] of adventure.pickups) if (id.startsWith('loot-')) assert.equal(pickup.mesh.visible, false);
});
test('imported or newly earned loot replaces stale drop positions in the same session', () => {
  const p = newProgress(); p.defeated = ['guardian-0']; p.drops = [{ id: 'loot-guardian-0', x: 310, y: 164, z: -1010, reward: { parts: 7 } }]; adventure.sync(p);
  const item = adventure.pickups.get('loot-guardian-0')!; assert.equal(item.mesh.visible, true); assert.equal(item.data.x, 310); assert.equal(item.mesh.position.z, -1010);
  adventure.sync(newProgress()); assert.equal(item.mesh.visible, false);
  adventure.addPickup({ id: 'loot-guardian-0', x: 12, y: 50, z: 5, reward: { parts: 7 } }); assert.equal(item.mesh.visible, true); assert.equal(item.data.x, 12);
});
test('projectiles cannot pass through room partitions', () => {
  assert.equal(adventure.pathBlocked({ x: 160, y: 90, z: 192 }, { x: 160, y: 90, z: 172 }, .1), true);
  assert.equal(adventure.pathBlocked({ x: 95, y: 90, z: 192 }, { x: 95, y: 90, z: 172 }, .1), false);
});
