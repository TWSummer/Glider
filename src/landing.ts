import { HARBORS, findHarbor, type Harbor } from './settlements.ts';
import { angleDifference, type FlightState, type Point3 } from './flight.ts';
import type { Progress } from './progression.ts';
import { CubicBezierCurve3, CurvePath, Vector3 } from 'three';
export function landingCandidate(at: FlightState): Harbor | undefined {
  return HARBORS.filter(h => Math.hypot(at.x-h.x, at.z-h.z) < 80 && at.y >= h.y-2 && at.y < h.y+50).sort((a,b) => Math.hypot(at.x-a.x,at.z-a.z)-Math.hypot(at.x-b.x,at.z-b.z))[0];
}
export function canLand(at: FlightState, h: Harbor, pathClear: (a: Point3,b: Point3) => boolean) {
  return landingCandidate(at)?.id === h.id && at.speed <= 38 && !at.stalled && pathClear(at,h);
}
export function dock(p: Progress, at: FlightState, h: Harbor) {
  Object.assign(at, { x:h.x,y:h.y,z:h.z,heading:0,pitch:0,roll:0,speed:0,stalled:false });
  p.flight = {...at}; p.dockedHub = h.id;
  if (!p.discovered.includes(h.region)) p.discovered.push(h.region);
  if (!p.discovered.includes('harbor:' + h.id)) p.discovered.push('harbor:' + h.id);
}
export interface Takeoff {
  hub: Harbor; parked: FlightState; path: CurvePath<Vector3>;
  length: number; duration: number; elapsed: number;
}
const TURN_TIME = .6, ACCEL_TIME = .9, LAUNCH_SPEED = 32;
export function depart(p: Progress, at: FlightState): Takeoff | null {
  const h = findHarbor(p.dockedHub); if (!h) return null;
  // Climb straight through the doorway and hand over at the crest.
  const exitY=h.y+(h.id==='mill'?74:h.id==='depot'?50:42);
  const exitZ=h.id==='depot'?45:65;
  const start = new Vector3(h.x,h.y,h.z), exit = new Vector3(h.x,exitY,h.z+exitZ);
  const path = new CurvePath<Vector3>();
  path.add(new CubicBezierCurve3(start, new Vector3(h.x,h.y,h.z+10), new Vector3(h.x,exitY,h.z+exitZ-25), exit));
  // Clear the depot's doorway before climbing above the nearby cave ridge.
  if(h.id==='depot') path.add(new CubicBezierCurve3(exit, new Vector3(h.x,exitY,h.z+53), new Vector3(h.x,h.y+120,h.z+65), new Vector3(h.x,h.y+120,h.z+78)));
  const length = path.getLength();
  const takeoff = {hub:h,parked:{...at},path,length,duration:TURN_TIME+ACCEL_TIME/2+length/LAUNCH_SPEED,elapsed:0};
  p.dockedHub = null;
  return takeoff;
}
export function takeoffFlight(t: Takeoff, elapsed: number): FlightState {
  if (elapsed <= TURN_TIME) {
    const u = Math.max(0,elapsed/TURN_TIME), ease=u*u*(3-2*u);
    return {...t.parked, heading:t.parked.heading+angleDifference(Math.PI,t.parked.heading)*ease};
  }
  const seconds = Math.min(t.duration,elapsed)-TURN_TIME;
  const distance = LAUNCH_SPEED*(seconds<ACCEL_TIME ? seconds*seconds/(2*ACCEL_TIME) : seconds-ACCEL_TIME/2);
  // CurvePath.getPoint uses distance along its child curves.
  const u=Math.min(1,distance/t.length), point=t.path.getPoint(u), tangent=t.path.getTangent(u);
  return {x:point.x,y:point.y,z:point.z,heading:Math.PI,pitch:Math.atan2(tangent.y,Math.hypot(tangent.x,tangent.z)),roll:0,speed:Math.min(LAUNCH_SPEED,seconds/ACCEL_TIME*LAUNCH_SPEED),stalled:false};
}
