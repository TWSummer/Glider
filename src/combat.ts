import type { Point3 } from './flight.ts';
import type { Progress } from './progression.ts';
import type { EnemyKind } from './game-visuals.ts';

export interface Boss extends Point3 { id: string; name: string; kind: EnemyKind; tier: number; hp: number; region: string; hint: string; reward: number }
export const BOSSES: Boss[] = [
  { id: 'boss-copper', name: 'The Copper Colossus', kind: 'rotor', tier: 3, hp: 26, x: -1180, y: 166, z: -1560, region: 'mine', hint: 'Upper western workings · bank around the orange volley, then hit the blue cooling core.', reward: 60 },
  { id: 'boss-heart', name: 'The Heartwarden', kind: 'warden', tier: 3, hp: 40, x: 310, y: 176, z: -1130, region: 'temple', hint: 'Central temple atrium · the shield drops after each three-way volley.', reward: 85 },
  { id: 'boss-tempest', name: 'The Tempest Roc', kind: 'kite', tier: 4, hp: 64, x: -250, y: 555, z: -3250, region: 'observatory', hint: 'Above the sky lens · climb the observatory updraft. Save fan charge to evade the storm fan.', reward: 120 },
];
export const enemyHealth = (tier: number) => [0, 2, 5, 9, 14][tier] ?? 14;
export const bandDamage = (p: Progress) => 1 + p.upgrades.bands;
export const receivedDamage = (p: Progress, amount: number) => amount * Math.pow(.82, p.upgrades.hull);
export type BossPhase = 'warning' | 'volley' | 'cooling';
export function bossPhase(clock: number): BossPhase {
  const t = clock % 7.2;
  return t < 1.8 ? 'warning' : t < 3.5 ? 'volley' : 'cooling';
}
export const bossVulnerable = (clock: number) => bossPhase(clock) === 'cooling';
export function lootUnlocked(p: Progress, id: string) {
  return id !== 'sigil-copper' || p.defeated.includes('boss-copper');
}
