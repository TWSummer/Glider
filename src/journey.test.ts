import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, groundHeight } from './world.ts';
import { Adventure, liftAt, placeAt, SUPPLIES } from './adventure.ts';
import { initialFlight, stepFlight, angleDifference, TRAIL_START, ROUTE, crossedRing, ringNormal } from './flight.ts';
import { newProgress, flightTuning, spendCharge, buyUpgrade } from './progression.ts';

test('the scenic twelve-ring trail clears the expanded estate and remains flyable', () => {
  const world = new World(), adventure = new Adventure(world.scene, world.plane), s = initialFlight(), p = newProgress();
  Object.assign(s, TRAIL_START);
  let ring = 0;
  for (let frame = 0; frame < 60 * 180 && ring < ROUTE.length; frame++) {
    const goal = ROUTE[ring], d = Math.hypot(goal.x - s.x, goal.z - s.z), lift = liftAt(s), tuning = flightTuning(p);
    const yaw = angleDifference(Math.atan2(goal.x - s.x, -(goal.z - s.z)), s.heading);
    const desired = Math.max(-.75, Math.min(.6, Math.asin(Math.max(-.9, Math.min(.9, ((goal.y - s.y) / Math.max(.8, d / s.speed) + tuning.sink - lift) / s.speed)))));
    const pitch = angleDifference(desired, s.pitch), before = { ...s };
    stepFlight(s, { left: yaw < -.025, right: yaw > .025, up: pitch > .03, down: pitch < -.03, boost: false }, 1 / 60, lift);
    assert.ok(s.y > groundHeight(s.x, s.z) + 2, `ring ${ring + 1} terrain ${JSON.stringify(s)}`);
    assert.equal(world.hitsObstacle(s.x, s.y, s.z), false, `ring ${ring + 1} obstacle`);
    assert.equal(adventure.pathBlocked(before, s), false, `ring ${ring + 1} interior ${JSON.stringify(s)}`);
    if (crossedRing(before, s, goal, ringNormal(ring))) ring++;
  }
  assert.equal(ring, 12);
});
