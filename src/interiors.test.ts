import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, groundHeight } from './world.ts';
import { Adventure, liftAt } from './adventure.ts';
import { BUILDINGS, TUNNEL_LAYOUT } from './architecture-data.ts';
import { initialFlight, stepFlight, BASE_TUNING } from './flight.ts';
import { newProgress } from './progression.ts';
import { tunnelSection, inTunnel } from './valley.ts';
import * as THREE from 'three';

const world = new World(), adventure = new Adventure(world.scene, world.plane);
function fullTurn(x: number, y: number, z: number, name: string, useLift: boolean) {
  const radius = 28 / BASE_TUNING.turn;
  const s = { ...initialFlight(), x: x - radius, y, z }, p = newProgress();
  for (let frame = 0; frame < 900 && s.heading < Math.PI * 2; frame++) {
    const before = { ...s };
    stepFlight(s, { left: false, right: true, up: false, down: false, boost: false }, 1 / 60, useLift ? liftAt(s, p) : 0);
    assert.equal(adventure.pathBlocked(before, s, 4), false, `${name}: full wingspan at ${s.x},${s.y},${s.z}`);
    assert.ok(s.y > groundHeight(s.x, s.z) + 3, `${name}: terrain`);
    assert.equal(world.hitsObstacle(s.x, s.y, s.z), false, `${name}: scenery`);
  }
  assert.ok(s.heading >= Math.PI * 2, `${name}: completed a full stock-rudder turn`);
}
test('every inhabited destination allows a full stock-glider turn with wing clearance', () => {
  for (const b of BUILDINGS) fullTurn(b.x, b.floors[0] + 25, b.z, b.id, true);
});
test('Hearthside side rooms allow full turns away from the atrium on all four floors', () => {
  for (const floor of [3, 63, 133, 203]) for (const x of [-90, 90]) fullTurn(x, floor + 53, 235, `house ${floor}/${x}`, false);
});
test('cavern galleries and mine workings have room to reverse direction', () => {
  fullTurn(-465, 96, -420, 'Echo gallery', false);
  fullTurn(-920, 120, -1240, 'Mine intake', false);
});
test('foundations meet terrain at every corner and leave interiors excavated', () => {
  for (const b of BUILDINGS) {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const x = b.x + sx * (b.width / 2 + 1), z = b.z + sz * (b.depth / 2 + 1);
      assert.ok(Math.abs(groundHeight(x, z) - (b.ground - 4)) < 7, `${b.id}: unsupported corner`);
    }
    assert.ok(groundHeight(b.x, b.z) < b.floors[0], `${b.id}: buried lowest floor`);
  }
});
test('every floor can be reached through an unobstructed updraft shaft', () => {
  for (const b of BUILDINGS) {
    const bottom = { x: b.x, y: b.floors[0] + 12, z: b.z }, top = { ...bottom, y: b.floors.at(-1)! + 30 };
    assert.equal(adventure.pathBlocked(bottom, top, 4), false, b.id);
    assert.ok(liftAt({ ...top, y: top.y - 5 }) > 5, b.id);
  }
});
test('cave and mine each offer an upper branch and a connected return loop', () => {
  for (const kind of ['crystal', 'mine']) {
    const passages = TUNNEL_LAYOUT.filter(t => t.kind === kind);
    assert.ok(passages.length >= 3);
    assert.ok(passages.some(t => Math.max(...t.points.map(p => p[1])) - Math.min(...t.points.map(p => p[1])) > 45));
    for (const tunnel of passages) for (let i = 1; i < tunnel.points.length; i++) {
      const [x, y, z] = tunnel.points[i - 1], [xx, yy, zz] = tunnel.points[i];
      assert.equal(adventure.pathBlocked({ x, y, z }, { x: xx, y: yy, z: zz }, 4), false, `${kind}: blocked connection`);
    }
  }
});

test('cave formations meet the floor or ceiling and have collidable surfaces inside the cave', () => {
  const formations = adventure.valley.formations;
  assert.ok(formations.length > 20);
  assert.ok(formations.some(f => f.ceiling)); assert.ok(formations.some(f => !f.ceiling));
  for (const f of formations) {
    const c = tunnelSection(f.x, f.z, 'crystal');
    assert.ok(f.ceiling ? f.bounds.max.y >= c.ceiling && f.bounds.min.y < c.ceiling - 3 : f.bounds.min.y <= c.floor && f.bounds.max.y > c.floor + 3, 'formation must grow out of a surface');
    const points = adventure.solids.filter(s => f.bounds.containsBox(s)).map(s => s.getCenter(new THREE.Vector3())).filter(p => inTunnel(p, .5));
    assert.ok(points.length > 0, 'a formation must have exposed geometry inside the cave');
    for (const point of points) assert.equal(adventure.hitsSolid(point, .2), true, 'exposed crystal/stone must collide');
  }
});
