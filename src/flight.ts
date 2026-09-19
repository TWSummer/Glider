export interface Point3 { x: number; y: number; z: number }
export interface FlightState extends Point3 { heading: number; pitch: number; roll: number; speed: number; stalled: boolean }
export interface FlightInput { left: boolean; right: boolean; up: boolean; down: boolean; boost: boolean; brake?: boolean }
export interface FlightTuning { drag: number; sink: number; turn: number; pitchRate: number; maxSpeed: number; thrust: number }
export const BASE_TUNING: FlightTuning = { drag: .00135, sink: 1.65, turn: .82, pitchRate: 1.16, maxSpeed: 76, thrust: 0 };
export const START: Point3 = { x: 0, y: 86, z: 450 };
export function initialFlight(): FlightState { return { ...START, heading: 0, pitch: 0, roll: 0, speed: 27, stalled: false }; }
export function angleDifference(a: number, b: number) { return Math.atan2(Math.sin(a - b), Math.cos(a - b)); }
export function forwardVector(state: Pick<FlightState, 'heading' | 'pitch'>): Point3 {
  return { x: Math.sin(state.heading) * Math.cos(state.pitch), y: Math.sin(state.pitch), z: -Math.cos(state.heading) * Math.cos(state.pitch) };
}
export function stepFlight(state: FlightState, input: FlightInput, dt: number, lift = 0, invertPitch = false, tuning: FlightTuning = BASE_TUNING): void {
  dt = Math.max(0, Math.min(dt, 0.05));
  const turn = Number(input.right) - Number(input.left);
  const pitch = (Number(input.up) - Number(input.down)) * (invertPitch ? -1 : 1);
  if (state.speed < 10.5 && Math.sin(state.pitch) > .2) state.stalled = true;
  if (state.stalled && state.speed > 16 && Math.sin(state.pitch) < .15) state.stalled = false;
  const authority = Math.max(.2, Math.min(1.18, state.speed / 28));
  state.heading += turn * tuning.turn * authority * dt;
  if (state.stalled) {
    // With little airflow, the nose falls regardless of an attempted climb.
    state.pitch += Math.max(-1.35, Math.min(1.35, angleDifference(-.62, state.pitch) * 2)) * dt;
  } else if (pitch) {
    // Unbounded pitch is intentional: enough kinetic energy permits full loops.
    state.pitch += pitch * tuning.pitchRate * authority * dt;
  } else {
    const level = Math.round(state.pitch / (Math.PI * 2)) * Math.PI * 2;
    state.pitch += Math.max(-.65, Math.min(.65, (level - state.pitch) * 1.4)) * dt;
  }
  state.roll += (-turn * 0.62 - state.roll) * (1 - Math.exp(-3.5 * dt));
  const sink = tuning.sink * (1 + Math.abs(state.roll) * .28) + (state.stalled ? 7 : 0);
  const gravity = -9.8 * Math.sin(state.pitch);
  const glideEnergy = 9.8 * tuning.sink / Math.max(state.speed, 10);
  const drag = (input.brake ? 8 : 0) + tuning.drag * state.speed * state.speed + Math.abs(turn) * .12;
  state.speed = Math.max(4, Math.min(tuning.maxSpeed, state.speed + (gravity + glideEnergy - drag + (input.boost ? tuning.thrust : 0)) * dt));
  const forward = forwardVector(state);
  state.x += forward.x * state.speed * dt;
  state.z += forward.z * state.speed * dt;
  state.y += (forward.y * state.speed - sink + lift) * dt;
}

/** Swept collision prevents fast rubber bands from skipping thin targets. */
export function segmentSphere(from: Point3, to: Point3, center: Point3, radius: number): boolean {
  const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
  const length2 = dx * dx + dy * dy + dz * dz;
  const t = length2 ? Math.max(0, Math.min(1, ((center.x - from.x) * dx + (center.y - from.y) * dy + (center.z - from.z) * dz) / length2)) : 0;
  return Math.hypot(from.x + dx * t - center.x, from.y + dy * t - center.y, from.z + dz * t - center.z) <= radius;
}
