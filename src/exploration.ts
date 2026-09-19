import type { Point3 } from './flight.ts';
import type { Progress } from './progression.ts';
import { REGIONS } from './atlas.ts';
import { QUESTS, questSteps } from './quests.ts';

export const CHART_CELL = 100, REVEAL_RADIUS = 240;
export function revealNearby(p: Progress, at: Point3): boolean {
  const known = new Set(p.charted); let changed = false;
  const cx = Math.floor(at.x / CHART_CELL), cz = Math.floor(at.z / CHART_CELL);
  for (let x = cx - 3; x <= cx + 3; x++) for (let z = cz - 3; z <= cz + 3; z++) {
    if (Math.hypot((x + .5) * CHART_CELL - at.x, (z + .5) * CHART_CELL - at.z) > REVEAL_RADIUS) continue;
    const key = x + ',' + z;
    if (!known.has(key)) { known.add(key); changed = true; }
  }
  if (changed) p.charted = [...known];
  return changed;
}
export function isCharted(p: Progress, x: number, z: number) { return p.charted.includes(Math.floor(x / CHART_CELL) + ',' + Math.floor(z / CHART_CELL)); }
// Hearing a story adds a marker, never terrain. Unknown destinations stay absent.
export function knownRegions(p: Progress): Set<string> {
  const known = new Set(REGIONS.filter(r => p.discovered.includes(r.id)).map(r => r.id));
  known.add('hearthside'); known.add('mill'); // Rowan's workshop is the opening rumor.
  for (const q of QUESTS) if (p.accepted.includes(q.id)) {
    known.add(q.region);
    questSteps(p, q).forEach(s => known.add(s.region));
  }
  for (const id of p.heard) known.add(id);
  return known;
}
