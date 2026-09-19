import { BUILDINGS, building } from './architecture-data.ts';
import type { Point3 } from './flight.ts';

export interface Road { id: string; name: string; width: number; kind: 'lane' | 'street' | 'rail' | 'causeway'; points: [number, number][] }
// These centerlines are shared by scenery, tree clearance and both maps.
export const ROADS: Road[] = [
  { id: 'estate', name: 'Orchard Lane', width: 76, kind: 'lane', points: [[-560, 545], [-390, 570], [-220, 550], [0, 440], [220, 550], [350, 550], [600, 515], [740, 515], [750, 450]] },
  { id: 'east-road', name: 'Bellwether Road', width: 76, kind: 'lane', points: [[750, 450], [820, 100], [770, -300], [710, -650], [660, -960], [710, -1115], [1015, -1120], [1015, -2200]] },
  { id: 'west-road', name: 'Copper Road', width: 44, kind: 'rail', points: [[-220, 550], [-225, 180], [-280, -200], [-405, -270], [-665, -240], [-1000, -440], [-1130, -970], [-920, -1000], [-690, -950]] },
  { id: 'temple-road', name: 'Pilgrim Way', width: 72, kind: 'lane', points: [[710, -650], [650, -815], [310, -815], [-120, -840], [-400, -980], [-690, -950]] },
  { id: 'north-road', name: 'The High Road', width: 76, kind: 'causeway', points: [[1015, -2200], [750, -2230], [620, -2200], [650, -1900], [450, -1900], [305, -1880], [70, -1880], [-355, -2070], [-355, -2390], [-110, -2650], [-250, -2600], [-520, -2600], [-710, -2730], [-750, -2980], [-740, -3440], [-550, -3410]] },
  { id: 'star-road', name: 'Astronomers’ Walk', width: 68, kind: 'lane', points: [[-250, -2600], [100, -2650], [210, -2800], [210, -2980], [320, -2990], [330, -3100], [120, -3125]] },
  { id: 'canal-walk', name: 'Canal Towpath', width: 76, kind: 'street', points: [[710, -1115], [710, -1255], [710, -1590], [710, -1900], [620, -2200]] },
  { id: 'city-post', name: 'Post Office Square', width: 88, kind: 'street', points: [[710, -1255], [850, -1260], [1015, -1270], [1015, -1120], [1380, -1120]] },
  { id: 'city-garden', name: 'Garden Street', width: 72, kind: 'street', points: [[710, -1590], [875, -1615], [1015, -1615]] },
  { id: 'city-market', name: 'Lantern Street', width: 88, kind: 'street', points: [[1015, -1435], [1170, -1435], [1380, -1435], [1380, -1750], [1190, -1750], [1015, -1750]] },
  { id: 'city-clock', name: 'Clockmaker Lane', width: 76, kind: 'street', points: [[710, -1900], [835, -1905], [1015, -1905]] },
];
const approaches: Record<string, [number, number][]> = {
  house: [[0, 440]], mill: [[-390, 570]], garden: [[350, 550]], 'estate-archive': [[600, 515]],
  depot: [[-690, -950]], post: [[850, -1260]], market: [[1170, -1435]], warehouse: [[1190, -1750]], watch: [[1170, -1120], [1015, -1120]],
  rooftop: [[875, -1615]], clock: [[835, -1905]], 'canal-house': [[560, -1590], [710, -1590]], temple: [[310, -815]],
  lock: [[305, -1880]], 'west-lantern': [[-195, -2080], [-355, -2070]], 'east-lantern': [[450, -2200], [620, -2200]],
  cistern: [[60, -2080], [-355, -2070]], 'ridge-home': [[-80, -2650], [-110, -2650]], 'ridge-inn': [[-350, -2600], [-250, -2600]],
  observatory: [[-250, -3000], [210, -2980]], 'west-lookout': [[-560, -2830], [-710, -2730]], 'east-lookout': [[120, -3125]], summit: [[-550, -3410]],
};
for (const b of BUILDINGS) ROADS.push({ id: 'approach-' + b.id, name: b.name, width: 76, kind: 'lane', points: [[b.x, b.z + b.depth / 2 + 46], ...approaches[b.id]] });
export function roadDistance(x: number, z: number) {
  let distance = Infinity;
  for (const road of ROADS) for (let i = 1; i < road.points.length; i++) {
    const [ax, az] = road.points[i - 1], [bx, bz] = road.points[i], dx = bx - ax, dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
    const px=ax+dx*t,pz=az+dz*t;
    distance = Math.min(distance, Math.hypot(x-px,z-pz)-roadWidthAt(road,px,pz)/2);
  }
  return distance;
}
// Broad avenues narrow only where existing courtyards form a genuine alley.
export function roadWidthAt(road: Road,x: number,z: number) {
  let clearance=Infinity;
  for(const b of BUILDINGS) clearance=Math.min(clearance,Math.max(Math.abs(x-b.x)-b.width/2,Math.abs(z-b.z)-b.depth/2));
  return Math.max(12,Math.min(road.width,(clearance-6)*2));
}

export interface Harbor extends Point3 { id: string; building: string; name: string; region: string; description: string; workshop: boolean; repair: boolean; charge: boolean; market: boolean; launch: Point3 }
const harbor = (id: string, name: string, description: string, workshop: boolean, repair = true, charge = true, market = true): Harbor => {
  const b = building(id);
  return { id, building: id, name, description, region: b.region, workshop, repair, charge, market,
    x: b.x, y: b.ground + 5, z: b.z + b.depth / 2 - 25,
    launch: { x: b.x, y: b.ground + 26, z: b.z + b.depth / 2 + 65 } };
};
export const HARBORS: Harbor[] = [
  harbor('house', 'Hearthside Flight House', 'Ada keeps a quiet landing table inside the front hall. Orchard tea and paper leave here for the valley.', true),
  harbor('mill', 'Rowan’s Mill Workshop', 'The wheel drives the charging bench. Rowan folds wings, winds motors and packs paper for the city.', true),
  harbor('depot', 'Coppervein Freight Depot', 'Ore wagons meet the Copper Road. Miners trade copper for tea, lamp cells and news from home.', true),
  harbor('post', 'Bellwether Air Post', 'The sorting hall is the valley’s courier exchange. Rest beneath the postal banners or take a delivery.', false),
  harbor('market', 'Lantern Market', 'Tea merchants, glassworkers and travelers share the covered arcade. Local prices reward a well-chosen route.', false),
  harbor('canal-house', 'Canal Repair Yard', 'A proper bench for advanced equipment and a charge before the exposed northern crossing.', true),
  harbor('temple', 'Pilgrim Rest', 'A sheltered cloister and a repair table. The temple has no generator; bring your own charged cells.', false, true, false, false),
  harbor('lock', 'Waterkeeper’s Supply House', 'Sela trades charged cells and keeps the high-road freight moving.', true),
  harbor('ridge-inn', 'The Lantern & Lens', 'A mountain inn for tired wings. Travelers pay well for tea and supplies carried through the storm.', false),
  harbor('observatory', 'Starfall Instrument Hall', 'The last workshop on the ridge. Lens glass is precious this far above the valley.', true),
];
export const findHarbor = (id: string | null) => HARBORS.find(h => h.id === id);
