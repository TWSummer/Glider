import { BASE_TUNING, initialFlight, type FlightState, type FlightTuning, type Point3 } from './flight.ts';

export type Upgrade = 'speed' | 'turn' | 'glide' | 'battery' | 'motor';
export const UPGRADE_INFO: Record<Upgrade, { name: string; description: string; effect: string }> = {
  speed: { name: 'Streamlined folds', description: 'Cleaner folds cut drag and preserve dive energy.', effect: '−14% drag · +8 m/s limit / level' },
  turn: { name: 'Responsive rudder', description: 'Bank tighter and pull through loops faster.', effect: '+18% turning · +8% pitch / level' },
  glide: { name: 'Long-span wings', description: 'Stay aloft longer between rising air currents.', effect: '−18% sink / level' },
  battery: { name: 'High-density cell', description: 'Store more charge for the electric fan.', effect: '+60 charge / level' },
  motor: { name: 'Fan impeller', description: 'Get more thrust from each powered burst.', effect: '+2.5 m/s² thrust / level' },
};
export interface Reward { parts?: number; cores?: number; ammo?: number; charge?: number; fan?: boolean; upgrade?: Upgrade; relic?: boolean }
export interface Drop extends Point3 { id: string; reward: Reward }
export interface Progress {
  parts: number; cores: number; ammo: number; fan: boolean; charge: number; health: number;
  upgrades: Record<Upgrade, number>; collected: string[]; defeated: string[]; discovered: string[];
  drops: Drop[]; checkpoint: string; relic: boolean; flight: FlightState; distance: number; seconds: number;
  accepted: string[]; completed: string[]; blueprints: Upgrade[]; trackedQuest: string | null;
}
export interface SaveFile { version: 1; savedAt: string; progress: Progress }
export const SAVE_KEY = 'glider-adventure-v1';
export function newProgress(): Progress {
  return { parts: 0, cores: 0, ammo: 16, fan: false, charge: 0, health: 100, upgrades: { speed: 0, turn: 0, glide: 0, battery: 0, motor: 0 }, collected: [], defeated: [], discovered: ['hearthside'], drops: [], checkpoint: 'home', relic: false, flight: initialFlight(), distance: 0, seconds: 0, accepted: [], completed: [], blueprints: [], trackedQuest: null };
}
export const capacity = (p: Progress) => 100 + p.upgrades.battery * 60;
export function flightTuning(p: Progress): FlightTuning {
  return { ...BASE_TUNING, drag: BASE_TUNING.drag * Math.pow(.86, p.upgrades.speed), sink: BASE_TUNING.sink * Math.pow(.82, p.upgrades.glide), turn: BASE_TUNING.turn * (1 + p.upgrades.turn * .18), pitchRate: BASE_TUNING.pitchRate * (1 + p.upgrades.turn * .08), maxSpeed: BASE_TUNING.maxSpeed + p.upgrades.speed * 8, thrust: p.fan && p.charge > 0 ? 7.5 + p.upgrades.motor * 2.5 : 0 };
}
export function spendCharge(p: Progress, seconds: number): number {
  if (!p.fan || p.charge <= 0 || seconds <= 0) return 0;
  const actual = Math.min(seconds, p.charge / 6); p.charge = Math.max(0, p.charge - actual * 6); return actual;
}
export function recharge(p: Progress, dt: number) { if (p.fan) p.charge = Math.min(capacity(p), p.charge + dt * 24); p.health = Math.min(100, p.health + dt * 18); p.ammo = Math.max(p.ammo, 12); }
export function upgradeCost(p: Progress, kind: Upgrade) { const level = p.upgrades[kind]; return { parts: [20, 50, 90][level] ?? 90, cores: level === 2 ? 2 : level === 1 ? 1 : 0 }; }
export function upgradeProblem(p: Progress, kind: Upgrade): string | null {
  if (p.upgrades[kind] >= 3) return 'Fully upgraded';
  if ((kind === 'motor' || kind === 'battery') && !p.fan) return 'Discover the electric fan first';
  if (p.upgrades[kind] >= 1 && !p.blueprints.includes(kind)) return 'Find the advanced schematic through valley quests';
  const cost = upgradeCost(p, kind);
  if (p.parts < cost.parts || p.cores < cost.cores) return 'Find more scrap or wind cores';
  return null;
}
export function buyUpgrade(p: Progress, kind: Upgrade): boolean {
  if (upgradeProblem(p, kind)) return false;
  const cost = upgradeCost(p, kind); p.parts -= cost.parts; p.cores -= cost.cores; p.upgrades[kind]++; return true;
}
export function applyReward(p: Progress, reward: Reward): string {
  const labels: string[] = [];
  if (reward.parts) { p.parts += reward.parts; labels.push(`+${reward.parts} scrap`); }
  if (reward.cores) { p.cores += reward.cores; labels.push(`+${reward.cores} wind core`); }
  if (reward.ammo) { p.ammo = Math.min(99, p.ammo + reward.ammo); labels.push(`+${reward.ammo} rubber bands`); }
  if (reward.fan && !p.fan) { p.fan = true; p.charge = capacity(p); labels.push('Electric fan discovered! Hold Shift to power it.'); }
  if (reward.charge && p.fan) { p.charge = Math.min(capacity(p), p.charge + reward.charge); labels.push(`+${reward.charge} charge`); }
  if (reward.upgrade) { if (p.upgrades[reward.upgrade] < 3) { p.upgrades[reward.upgrade]++; labels.push(`${UPGRADE_INFO[reward.upgrade].name} improved!`); } else { p.parts += 12; labels.push('+12 duplicate-part scrap'); } }
  if (reward.relic) { p.relic = true; labels.push('The Skyheart awakens. An old observatory waits beyond the storm ridge.'); }
  return labels.join(' · ');
}
export function collect(p: Progress, id: string, reward: Reward): string | null {
  if (p.collected.includes(id)) return null;
  p.collected.push(id); p.drops = p.drops.filter(drop => drop.id !== id); return applyReward(p, reward);
}
export function enemyReward(index: number, tier: number): Reward {
  return { parts: 3 + tier * 2, ammo: 3 + tier, charge: tier > 1 ? 15 : 0, cores: tier >= 3 && index % 4 === 2 ? 1 : 0 };
}

function finite(value: unknown, min: number, max: number): value is number { return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max; }
function strings(value: unknown): value is string[] { return Array.isArray(value) && value.length <= 2000 && value.every(v => typeof v === 'string' && v.length < 100); }
function point(value: any) { return value && finite(value.x, -10000, 10000) && finite(value.y, -1000, 2000) && finite(value.z, -10000, 10000); }
function rewardValid(r: any): boolean {
  return !!r && typeof r === 'object' && ['parts', 'cores', 'ammo', 'charge'].every(k => r[k] === undefined || finite(r[k], 0, 10000)) && ['fan', 'relic'].every(k => r[k] === undefined || typeof r[k] === 'boolean') && (r.upgrade === undefined || Object.hasOwn(UPGRADE_INFO, r.upgrade));
}
export function parseSave(text: string): SaveFile | null {
  try {
    if (text.length > 1_000_000) return null;
    const save = JSON.parse(text), p = save?.progress;
    if (save.version !== 1 || typeof save.savedAt !== 'string' || !Number.isFinite(Date.parse(save.savedAt)) || !p) return null;
    if (!['parts', 'cores', 'ammo'].every(k => Number.isInteger(p[k]) && finite(p[k], 0, 100000))) return null;
    if (!finite(p.charge, 0, 280) || !finite(p.health, 0, 100) || typeof p.fan !== 'boolean' || typeof p.relic !== 'boolean') return null;
    if (!p.upgrades || !Object.keys(UPGRADE_INFO).every(k => Number.isInteger(p.upgrades[k]) && finite(p.upgrades[k], 0, 3))) return null;
    if (!['collected', 'defeated', 'discovered'].every(k => strings(p[k])) || typeof p.checkpoint !== 'string' || p.checkpoint.length > 50) return null;
    if (!Array.isArray(p.drops) || p.drops.length > 100 || !p.drops.every((d: any) => point(d) && typeof d.id === 'string' && d.id.length < 100 && rewardValid(d.reward))) return null;
    if (!point(p.flight) || !finite(p.flight.heading, -1e8, 1e8) || !finite(p.flight.pitch, -1e8, 1e8) || !finite(p.flight.roll, -2, 2) || !finite(p.flight.speed, 0, 200) || typeof p.flight.stalled !== 'boolean') return null;
    if (!finite(p.distance, 0, 1e10) || !finite(p.seconds, 0, 1e10)) return null;
    if (['accepted', 'completed', 'blueprints'].some(k => p[k] !== undefined && !strings(p[k]))) return null;
    if (p.blueprints?.some((k: string) => !Object.hasOwn(UPGRADE_INFO, k))) return null;
    if (p.trackedQuest !== undefined && p.trackedQuest !== null && (typeof p.trackedQuest !== 'string' || p.trackedQuest.length > 99)) return null;
    // Copy only known data; arbitrary imported properties never enter game state.
    const clean = newProgress();
    for (const k of Object.keys(clean) as (keyof Progress)[]) if (p[k] !== undefined) (clean as any)[k] = p[k];
    clean.upgrades = Object.fromEntries(Object.keys(UPGRADE_INFO).map(k => [k, p.upgrades[k]])) as Record<Upgrade, number>;
    clean.flight = Object.fromEntries(['x', 'y', 'z', 'heading', 'pitch', 'roll', 'speed', 'stalled'].map(k => [k, p.flight[k]])) as unknown as FlightState;
    if (clean.charge > capacity(clean)) return null;
    return { version: 1, savedAt: save.savedAt, progress: clean };
  } catch { return null; }
}
export function serializeSave(progress: Progress): string { return JSON.stringify({ version: 1, savedAt: new Date().toISOString(), progress } satisfies SaveFile); }
export interface SaveStorage { getItem(key: string): string | null; setItem(key: string, value: string): void }
export function readSave(storage: SaveStorage): { save: SaveFile | null; recovered: boolean } {
  try { const current = parseSave(storage.getItem(SAVE_KEY) ?? ''); if (current) return { save: current, recovered: false }; const backup = parseSave(storage.getItem(SAVE_KEY + '-backup') ?? ''); return { save: backup, recovered: !!backup }; } catch { return { save: null, recovered: false }; }
}
export function writeSave(storage: SaveStorage, progress: Progress): boolean {
  try { const previous = storage.getItem(SAVE_KEY); if (previous && parseSave(previous)) storage.setItem(SAVE_KEY + '-backup', previous); storage.setItem(SAVE_KEY, serializeSave(progress)); return true; } catch { return false; }
}
