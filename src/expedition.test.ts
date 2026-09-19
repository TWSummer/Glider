import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, groundHeight } from './world.ts';
import { Adventure, liftAt, placeAt } from './adventure.ts';
import { initialFlight, stepFlight, angleDifference } from './flight.ts';
import { newProgress, flightTuning, spendCharge, type Progress } from './progression.ts';
import { applyAir, airAt } from './atlas.ts';
const world = new World(), adventure = new Adventure(world.scene, world.plane);
function fly(p: Progress, start: number[], course: number[][], powered = true) {
  const s = { ...initialFlight(), x: start[0], y: start[1], z: start[2], heading: start[3] ?? 0 }; adventure.sync(p); let leg = 0;
  for (let frame = 0; frame < 60 * 240 && leg < course.length; frame++) {
    const [x, y, z] = course[leg], dx = x - s.x, dz = z - s.z, d = Math.hypot(dx, dz), lift = liftAt(s, p), tuning = flightTuning(p);
    const air = airAt(s), groundSpeed = Math.max(10, s.speed - air.headwind * Math.pow(.8, p.upgrades.speed));
    const yaw = angleDifference(Math.atan2(dx, -dz), s.heading);
    const climb = (y - s.y) / Math.max(1, d / groundSpeed);
    const desired = Math.max(-.55, Math.min(s.speed < 17 ? -.1 : .5, Math.asin(Math.max(-.8, Math.min(.8, (climb + tuning.sink + air.sink * Math.pow(.7, p.upgrades.glide) - lift) / s.speed)))));
    const pitch = angleDifference(desired, s.pitch), boost = powered && p.fan && p.charge > 0 && s.speed < 38 && d > 35 && !placeAt(s);
    if (boost) tuning.thrust *= spendCharge(p, 1 / 60) * 60;
    const before = { ...s }; stepFlight(s, { left: yaw < -.025, right: yaw > .025, up: pitch > .03, down: pitch < -.03, boost }, 1 / 60, lift, false, tuning); applyAir(s, p, s.heading, 1 / 60, frame / 60);
    const info = `leg ${leg + 1} at ${s.x.toFixed(1)},${s.y.toFixed(1)},${s.z.toFixed(1)} speed ${s.speed.toFixed(1)}`;
    assert.ok(s.y > groundHeight(s.x, s.z) + 2, 'terrain: ' + info);
    assert.equal(adventure.pathBlocked(before, s, 1), false, 'wall: ' + info);
    assert.equal(world.hitsObstacle(s.x, s.y, s.z), false, 'obstacle: ' + info);
    adventure.update(1 / 60, frame / 60, s, p, true, () => {}, () => {});
    if (Math.hypot(dx, y - s.y, dz) < (leg === course.length - 1 ? 7 : 12)) leg++;
  }
  assert.equal(leg, course.length, `reached ${leg}/${course.length}`); return s;
}
test('a starter glider can reach the mill loft and find a component without a motor', () => {
  const p = newProgress();
  fly(p, [-390, 60, 550], [[-390, 62, 445], [-390, 118, 355], [-450, 116, 260]], false);
  assert.ok(p.collected.includes('fan-housing')); assert.equal(p.fan, false);
});
test('an equipped glider can cross the restored high route with finite charge', () => {
  const p = newProgress(); p.fan = true; p.upgrades = { ...p.upgrades, speed: 2, glide: 2, turn: 2, motor: 2, battery: 2 }; p.charge = 220; p.completed = ['waterways'];
  fly(p, [302, 150, -2010], [[305, 160, -2160], [305, 215, -2215], [60, 245, -2300], [60, 250, -2480], [60, 265, -2630], [-80, 275, -2630], [-80, 272, -2710], [-80, 270, -2770], [-80, 330, -2800], [-80, 330, -2960], [-250, 330, -3050], [-250, 327, -3190]]);
  assert.ok(p.discovered.includes('observatory')); assert.ok(p.charge >= 0 && p.charge <= 220);
});
