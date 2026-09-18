import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialFlight, stepFlight, START, BASE_TUNING, segmentSphere, type FlightInput } from './flight.ts';
import { newProgress, flightTuning } from './progression.ts';
const neutral: FlightInput = { left: false, right: false, up: false, down: false, boost: false };
function fly(input: Partial<FlightInput>, seconds = 2, speed = 27, lift = 0) {
  const state = initialFlight(); state.speed = speed; state.y = 200;
  for (let i = 0; i < seconds * 60; i++) stepFlight(state, { ...neutral, ...input }, 1 / 60, lift);
  return state;
}
test('unpowered flight loses meaningful altitude without stopping in mid-air', () => {
  const s = fly({}, 30); assert.ok(s.y < 154 && s.y > 145); assert.ok(s.speed > 20); assert.ok(s.z < START.z - 640);
});
test('diving gains far more speed than a climb and spends altitude', () => {
  const up = fly({ up: true }, 1.5), down = fly({ down: true }, 1.5); assert.ok(down.speed - up.speed > 15); assert.ok(up.y > 210 && down.y < 175);
});
test('left/right bank and turn symmetrically', () => {
  const left = fly({ left: true }), right = fly({ right: true }); assert.ok(left.x < -20 && right.x > 20); assert.ok(left.roll > 0 && right.roll < 0); assert.ok(Math.abs(left.x + right.x) < .001);
});
test('a fast entry completes a full unpowered loop without stalling', () => {
  const s = initialFlight(); s.y = 200; s.speed = 48;
  for (let i = 0; i < 420 && s.pitch < Math.PI * 2; i++) { stepFlight(s, { ...neutral, up: true }, 1 / 60); assert.equal(s.stalled, false); assert.ok(s.y > 150); }
  assert.ok(s.pitch >= Math.PI * 2); assert.ok(s.speed < 48 && s.speed > 30);
});
test('a slow nose-up climb stalls, drops the nose and recovers speed', () => {
  const s = initialFlight(); s.y = 150; s.speed = 14; let stalled = false;
  for (let i = 0; i < 150; i++) { stepFlight(s, { ...neutral, up: true }, 1 / 60); stalled ||= s.stalled; }
  assert.equal(stalled, true); const height = s.y;
  for (let i = 0; i < 300; i++) stepFlight(s, neutral, 1 / 60);
  assert.equal(s.stalled, false); assert.ok(s.speed > 16); assert.ok(s.y < height);
});
test('thermal lift overcomes sink; upgraded wings extend glide time', () => {
  assert.ok(fly({}, 2, 27, 8).y > 211); const p = newProgress(); p.upgrades.glide = 3; const s = initialFlight(); s.y = 200;
  for (let i = 0; i < 1200; i++) stepFlight(s, neutral, 1 / 60, 0, false, flightTuning(p)); assert.ok(s.y > fly({}, 20).y + 12);
});
test('Shift has no unlimited boost: only supplied motor thrust adds power', () => {
  assert.equal(fly({ boost: true }, 3).speed, fly({}, 3).speed); const s = initialFlight();
  for (let i = 0; i < 180; i++) stepFlight(s, { ...neutral, boost: true }, 1 / 60, 0, false, { ...BASE_TUNING, thrust: 7.5 }); assert.ok(s.speed > 40);
});
test('pitch inversion and bounded time steps behave correctly', () => {
  const s = initialFlight(); for (let i = 0; i < 60; i++) stepFlight(s, { ...neutral, up: true }, 1 / 60, 0, true); assert.ok(s.y < START.y - 11);
  const gap = initialFlight(); stepFlight(gap, neutral, 10); assert.ok(Math.abs(gap.z - START.z) < 2);
});
test('fast projectiles use swept collision rather than skipping enemies', () => {
  assert.equal(segmentSphere({ x: 0, y: 0, z: 30 }, { x: 0, y: 0, z: -30 }, { x: 0, y: 0, z: 0 }, 5), true);
  assert.equal(segmentSphere({ x: 8, y: 0, z: 30 }, { x: 8, y: 0, z: -30 }, { x: 0, y: 0, z: 0 }, 5), false);
});
