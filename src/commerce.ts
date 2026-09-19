import { findHarbor, type Harbor } from './settlements.ts';
import type { Progress } from './progression.ts';

export const GOODS = {
  tea: { name: 'Orchard tea', description: 'Light crates from the Hearthside gardens.' },
  paper: { name: 'Mill paper', description: 'Fresh sheets for letters and repairs.' },
  copper: { name: 'Copper spools', description: 'Motor windings from Coppervein.' },
  glass: { name: 'Lens glass', description: 'Fine optical glass from Bellwether.' },
  cells: { name: 'Charge cells', description: 'Sealed batteries from the waterworks.' },
};
export type Good = keyof typeof GOODS;
const values: Record<string, number[]> = {
  house: [5, 9, 18, 24, 22], mill: [8, 4, 16, 23, 20], depot: [17, 13, 5, 24, 22],
  post: [14, 12, 14, 12, 18], market: [15, 14, 16, 7, 19], 'canal-house': [14, 12, 13, 11, 16],
  lock: [20, 17, 19, 17, 6], 'ridge-inn': [27, 22, 26, 24, 26], observatory: [26, 25, 28, 32, 30],
};
export function dockedHarbor(p: Progress): Harbor | undefined {
  const h = findHarbor(p.dockedHub);
  return h && Math.hypot(p.flight.x - h.x, p.flight.y - h.y, p.flight.z - h.z) < 10 && p.flight.speed === 0 ? h : undefined;
}
export const cargoCapacity = (p: Progress) => 4 + p.upgrades.cargo * 3;
export const cargoUsed = (p: Progress) => Object.values(p.cargo).reduce((a, b) => a + b, 0) + (p.freight ? CONTRACTS.find(c => c.id === p.freight)?.slots ?? 0 : 0);
export function quote(hub: string, good: Good) {
  const base = (values[hub] ?? values.post)[Object.keys(GOODS).indexOf(good)];
  return { buy: Math.ceil(base * 1.2), sell: Math.floor(base * .85) };
}
export const marketStock = (p: Progress, hub: string, good: Good) => p.marketStock[hub + ':' + good] ?? 12;
export function trade(p: Progress, good: Good, action: 'buy' | 'sell'): boolean {
  const hub = dockedHarbor(p); if (!hub?.market || !Object.hasOwn(GOODS, good)) return false;
  const price = quote(hub.id, good), key = hub.id + ':' + good, stock = marketStock(p, hub.id, good);
  if (action === 'buy') {
    if (stock <= 0 || cargoUsed(p) >= cargoCapacity(p) || p.parts < price.buy) return false;
    p.parts -= price.buy; p.cargo[good]++; p.marketStock[key] = stock - 1;
  } else {
    if (p.cargo[good] <= 0) return false;
    p.cargo[good]--; p.parts += price.sell; p.marketStock[key] = stock + 1;
  }
  return true;
}
export interface Contract { id: string; name: string; from: string; to: string; slots: number; fee: number; kind: 'freight' | 'passenger'; description: string; requires?: string }
export const CONTRACTS: Contract[] = [
  { id: 'tea-for-rowan', name: 'Tea for the late shift', from: 'house', to: 'mill', slots: 2, fee: 18, kind: 'freight', description: 'Carry two sealed tea crates west along Orchard Lane.' },
  { id: 'paper-post', name: 'Tomorrow’s letters', from: 'mill', to: 'post', slots: 3, fee: 48, kind: 'freight', description: 'Fresh paper for Mira. Follow Bellwether Road to the postal sorting hall.' },
  { id: 'miner-home', name: 'Bram’s day off', from: 'depot', to: 'house', slots: 3, fee: 55, kind: 'passenger', description: 'Give the tiny paper foreman a seat back to Hearthside.' },
  { id: 'city-copper', name: 'Wind the canal engines', from: 'depot', to: 'canal-house', slots: 4, fee: 62, kind: 'freight', description: 'Copper coils for the canal repair yard west of Bellwether.' },
  { id: 'pilgrim', name: 'A pilgrim’s passage', from: 'post', to: 'temple', slots: 2, fee: 45, kind: 'passenger', description: 'Carry a paper traveler to the sheltered temple cloister.' },
  { id: 'sela-cells', name: 'Keep the inn alight', from: 'lock', to: 'ridge-inn', slots: 4, fee: 88, kind: 'freight', description: 'Four charged cells for the mountain inn. Improved wings and a motor are advised.' },
  { id: 'orin-glass', name: 'Handle with care', from: 'market', to: 'observatory', slots: 5, fee: 145, kind: 'freight', description: 'Lens glass for Starfall. Fit a cargo cradle and prepare for the storm.' },
  { id: 'astronomer-return', name: 'The astronomer returns', from: 'ridge-inn', to: 'observatory', slots: 3, fee: 95, kind: 'passenger', requires: 'boss-tempest', description: 'Orin will travel once the Tempest Roc is defeated above the observatory.' },
];
export function takeContract(p: Progress, id: string): boolean {
  const job = CONTRACTS.find(c => c.id === id), hub = dockedHarbor(p);
  if (!job || hub?.id !== job.from || p.freight || p.deliveries.includes(id) || cargoUsed(p) + job.slots > cargoCapacity(p) || (job.requires && !p.defeated.includes(job.requires))) return false;
  p.freight = id;
  const destination = findHarbor(job.to)!;
  if (!p.heard.includes(destination.region)) p.heard.push(destination.region);
  return true;
}
export function deliverContract(p: Progress): string | null {
  const job = CONTRACTS.find(c => c.id === p.freight);
  if (!job || dockedHarbor(p)?.id !== job.to || p.deliveries.includes(job.id)) return null;
  p.parts += job.fee; p.deliveries.push(job.id); p.freight = null;
  return `${job.name} delivered · +${job.fee} scrap`;
}
export function service(p: Progress, kind: 'repair' | 'charge' | 'ammo'): boolean {
  const h = dockedHarbor(p); if (!h) return false;
  if (kind === 'repair' && h.repair) { p.health = 100; return true; }
  if (kind === 'charge' && h.charge && p.fan) { p.charge = 100 + p.upgrades.battery * 60; return true; }
  if (kind === 'ammo' && p.parts >= 3 && p.ammo <= 87) { p.parts -= 3; p.ammo += 12; return true; }
  return false;
}
