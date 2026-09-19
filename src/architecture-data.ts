import type { Point3 } from './flight.ts';

export interface Building {
  id: string; region: string; name: string; x: number; z: number; width: number; depth: number;
  floors: number[]; ground: number; color: string; style: 'house' | 'mill' | 'archive' | 'store' | 'temple';
  rooms: string[];
}
// Dimensions are in flight units. A stock glider needs roughly 70 units to turn
// through a full circle; the furnished bays retain at least 90 units of clear air.
export const BUILDINGS: Building[] = [
  { id: 'house', region: 'hearthside', name: 'HEARTHSIDE HOUSE', x: 0, z: 112, width: 360, depth: 420, floors: [3, 63, 133, 203], ground: 63, color: '#d5c5a2', style: 'house', rooms: ['ROOT CELLAR', 'BOILER ROOM', 'THE KITCHEN', 'CONSERVATORY', 'DRAWING ROOM', 'ADA’S STUDY', 'THE LIBRARY', 'MAP ROOM', 'NURSERY', 'GUEST CHAMBER', 'THE ATTIC', 'STAR CHART LOFT'] },
  { id: 'mill', region: 'mill', name: 'WILLOW MILL', x: -390, z: 355, width: 240, depth: 300, floors: [21, 91, 161], ground: 21, color: '#c5b491', style: 'mill', rooms: ['WHEEL HALL', 'REPAIR WORKSHOP', 'THE GRANARY', 'ROWAN’S LOFT'] },
  { id: 'garden', region: 'hearthside', name: 'THE GARDEN HOUSE', x: 350, z: 390, width: 200, depth: 220, floors: [20, 90], ground: 20, color: '#c6cfaa', style: 'house', rooms: ['POTTING HALL', 'SEED LIBRARY'] },
  { id: 'estate-archive', region: 'hearthside', name: 'THE OLD SCHOOLHOUSE', x: 600, z: 350, width: 200, depth: 230, floors: [20, 90], ground: 20, color: '#cbbb98', style: 'archive', rooms: ['CLASSROOM', 'READING GALLERY'] },
  { id: 'depot', region: 'mine', name: 'COPPERVEIN DEPOT', x: -690, z: -1140, width: 240, depth: 220, floors: [65, 135], ground: 65, color: '#b2a17e', style: 'store', rooms: ['RAIL FREIGHT HALL', 'DISPATCH OFFICE'] },
  { id: 'post', region: 'city', name: 'BELLWETHER POST OFFICE', x: 850, z: -1420, width: 210, depth: 220, floors: [65, 135], ground: 65, color: '#e0c6a1', style: 'archive', rooms: ['LETTER SORTING HALL', 'POSTMASTER’S GALLERY'] },
  { id: 'market', region: 'city', name: 'THE COVERED MARKET', x: 1170, z: -1600, width: 240, depth: 250, floors: [65, 135], ground: 65, color: '#d5b890', style: 'house', rooms: ['TEA ARCADE', 'MERCHANTS’ GALLERY'] },
  { id: 'warehouse', region: 'city', name: 'GLASSWORKERS’ WAREHOUSE', x: 1190, z: -1930, width: 250, depth: 270, floors: [65, 135], ground: 65, color: '#b5ab8e', style: 'store', rooms: ['LOADING HALL', 'LENS STORE'] },
  { id: 'watch', region: 'city', name: 'HARBOR WATCH', x: 1170, z: -1290, width: 210, depth: 210, floors: [65, 135], ground: 65, color: '#bcc5ad', style: 'store', rooms: ['WATCH HALL', 'SIGNAL ROOM'] },
  { id: 'clock', region: 'city', name: 'THE CLOCK HOUSE', x: 835, z: -2070, width: 210, depth: 230, floors: [65, 135, 205], ground: 65, color: '#cbbf9d', style: 'archive', rooms: ['PENDULUM HALL', 'GEAR GALLERY', 'CLOCKKEEPER’S LOFT'] },
  { id: 'rooftop', region: 'city', name: 'THE HANGING GARDENS', x: 875, z: -1770, width: 220, depth: 220, floors: [65, 135], ground: 65, color: '#b8c4a4', style: 'house', rooms: ['GARDEN COURT', 'PALM HOUSE'] },
  { id: 'canal-house', region: 'city', name: 'CANAL WORKSHOP', x: 560, z: -1750, width: 190, depth: 230, floors: [65, 135], ground: 65, color: '#ceb699', style: 'mill', rooms: ['BOATWORKS', 'SAIL LOFT'] },
  { id: 'temple', region: 'temple', name: 'SKYHEART TEMPLE', x: 310, z: -1130, width: 520, depth: 460, floors: [132, 212], ground: 132, color: '#c8c5ad', style: 'temple', rooms: ['GARDEN CLOISTER', 'BELL COURT', 'THE SANCTUARY', 'ARCHIVE GALLERY', 'THE WIND CHOIR', 'SCHOLAR’S RETREAT'] },
  { id: 'lock', region: 'aqueduct', name: 'WATERKEEPER’S HOUSE', x: 305, z: -2040, width: 220, depth: 240, floors: [115, 185], ground: 115, color: '#b9c1ad', style: 'archive', rooms: ['LOCK CONTROL HALL', 'SURVEY ARCHIVE'] },
  { id: 'west-lantern', region: 'aqueduct', name: 'WESTERN WIND HOUSE', x: -195, z: -2260, width: 210, depth: 230, floors: [130, 200], ground: 130, color: '#c3c6b0', style: 'temple', rooms: ['WESTERN GALLERY', 'LANTERN CHAMBER'] },
  { id: 'east-lantern', region: 'aqueduct', name: 'EASTERN WIND HOUSE', x: 450, z: -2370, width: 210, depth: 240, floors: [130, 200], ground: 130, color: '#c3c6b0', style: 'temple', rooms: ['EASTERN GALLERY', 'LANTERN CHAMBER'] },
  { id: 'cistern', region: 'aqueduct', name: 'THE GREAT CISTERN', x: 60, z: -2480, width: 250, depth: 250, floors: [157, 227], ground: 157, color: '#bac8b9', style: 'temple', rooms: ['RESERVOIR HALL', 'NORTHERN WIND GALLERY'] },
  { id: 'ridge-home', region: 'observatory', name: 'ASTRONOMERS’ VILLAGE', x: -80, z: -2800, width: 220, depth: 230, floors: [228, 298], ground: 228, color: '#bec3b2', style: 'archive', rooms: ['STORM SHELTER', 'STAR CHART LIBRARY'] },
  { id: 'ridge-inn', region: 'observatory', name: 'THE RIDGE INN', x: -350, z: -2780, width: 210, depth: 220, floors: [220, 290], ground: 220, color: '#bdb4a3', style: 'house', rooms: ['COMMON ROOM', 'TRAVELERS’ LOFT'] },
  { id: 'observatory', region: 'observatory', name: 'STARFALL OBSERVATORY', x: -250, z: -3250, width: 340, depth: 380, floors: [291, 371, 451], ground: 291, color: '#becac0', style: 'archive', rooms: ['ARRIVAL HALL', 'INSTRUMENT WORKSHOP', 'CELESTIAL LIBRARY', 'THE SKY LENS'] },
  { id: 'west-lookout', region: 'observatory', name: 'WESTERN LOOKOUT', x: -560, z: -3010, width: 190, depth: 210, floors: [280, 350], ground: 280, color: '#bfc9bd', style: 'temple', rooms: ['STORM REFUGE', 'LENS GALLERY'] },
  { id: 'east-lookout', region: 'observatory', name: 'EASTERN LOOKOUT', x: 120, z: -3290, width: 190, depth: 220, floors: [282, 352], ground: 282, color: '#bfc9bd', style: 'temple', rooms: ['STORM REFUGE', 'LENS GALLERY'] },
  { id: 'summit', region: 'observatory', name: 'NORTH LOOKOUT', x: -550, z: -3570, width: 210, depth: 210, floors: [337, 407], ground: 337, color: '#bfc9bd', style: 'temple', rooms: ['SUMMIT HALL', 'THE LAST WATCH'] },
];
export const building = (id: string) => BUILDINGS.find(b => b.id === id)!;
export const roofHeight = (b: Building) => b.floors.at(-1)! + 70;
export function buildingAt(p: Point3) { return BUILDINGS.find(b => Math.abs(p.x - b.x) < b.width / 2 && Math.abs(p.z - b.z) < b.depth / 2 && p.y > b.floors[0] && p.y < roofHeight(b) + 30); }
export function nearBuilding(x: number, z: number, margin = 25) { return BUILDINGS.some(b => Math.abs(x - b.x) < b.width / 2 + margin && Math.abs(z - b.z) < b.depth / 2 + margin); }

export const TUNNEL_LAYOUT = [
  { kind: 'crystal', radius: 100, height: 36, points: [[-450, 74, -300], [-470, 80, -470], [-535, 107, -680], [-656, 98, -808], [-735, 91, -711], [-790, 93, -596]] },
  { kind: 'crystal', radius: 95, height: 36, points: [[-470, 80, -470], [-655, 92, -495], [-790, 93, -596], [-684, 86, -736], [-535, 107, -680]] },
  { kind: 'crystal', radius: 86, height: 33, points: [[-656, 98, -808], [-790, 145, -920], [-910, 152, -765], [-790, 93, -596]] },
  { kind: 'mine', radius: 85, height: 32, points: [[-920, 104, -1060], [-920, 104, -1300], [-960, 100, -1490], [-1030, 94, -1720], [-966, 112, -1880]] },
  { kind: 'mine', radius: 85, height: 32, points: [[-950, 101, -1440], [-760, 127, -1550], [-760, 127, -1760], [-966, 112, -1880]] },
  { kind: 'mine', radius: 90, height: 36, points: [[-920, 104, -1300], [-1130, 160, -1370], [-1200, 165, -1590], [-1030, 94, -1720]] },
];
// The same grading is used by render meshes and ground collision. Foundations
// meet a landscaped apron; a basement is excavated only inside its outer walls.
export function courtDistance(b: Building, x: number, z: number) {
  const dx = Math.max(0, Math.abs(x-b.x)-b.width/2-8);
  const dz = Math.max(0, b.z-b.depth/2-8-z, z-(b.z+b.depth/2+64));
  return Math.hypot(dx,dz);
}
export const inBuildingCourt = (x: number,z: number) => BUILDINGS.some(b=>courtDistance(b,x,z)===0);
export function landscapeHeight(x: number,z: number,height: number) {
  let weight=0, level=0, influence=0;
  for(const b of BUILDINGS) {
    const d=courtDistance(b,x,z), reach=Math.max(200,Math.min(300,b.ground));
    if(d===0) return b.ground-4;
    if(d>=reach) continue;
    const u=d/reach, fade=1-u*u*(3-2*u), w=fade/Math.max(.0001,d*d);
    weight+=w; level+=(b.ground-4)*w; influence=Math.max(influence,fade);
  }
  return weight ? height+(level/weight-height)*influence : height;
}
export function gradeTerrain(x: number, z: number, height: number, excavated = true): number {
  for (const b of BUILDINGS) {
    const dx = Math.abs(x - b.x) - b.width / 2, dz = Math.abs(z - b.z) - b.depth / 2;
    if (dx < 0 && dz < 0) return excavated ? b.floors[0] - 2 : b.ground - 4;
  }
  const h = landscapeHeight(x,z,height);
  if(inBuildingCourt(x,z)) return h;
  let tunnelFloor = Infinity, tunnelRoof = -Infinity, ridge = h;
  for (const tunnel of TUNNEL_LAYOUT) for (let i = 1; i < tunnel.points.length; i++) {
    if (z > (tunnel.kind === 'mine' ? -1060 : -300)) continue;
    const a = tunnel.points[i - 1], b = tunnel.points[i], dx = b[0] - a[0], dz = b[2] - a[2];
    const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[2]) * dz) / (dx * dx + dz * dz)));
    const r = Math.hypot(x - a[0] - dx * t, z - a[2] - dz * t) / tunnel.radius, cy = a[1] + (b[1] - a[1]) * t;
    if (r < 1) { tunnelFloor = Math.min(tunnelFloor, cy - tunnel.height - 3); tunnelRoof = Math.max(tunnelRoof, cy + Math.sqrt(1-r*r) * tunnel.height + 18); }
    else if (r < 1.65) ridge = Math.max(ridge, h + (Math.max(h, cy + 18) - h) * (1 - (r - 1) / .65));
  }
  if (Number.isFinite(tunnelFloor)) return excavated ? Math.min(h, tunnelFloor) : tunnelRoof;
  return landscapeHeight(x,z,ridge);
}
export const INTERIOR_LIFTS = BUILDINGS.map(b => ({ x: b.x, z: b.z, base: b.floors[0] + 2, ceiling: roofHeight(b) + 35, radius: Math.min(54, b.width * .22), strength: 11, kind: 'vent' }));

// IDs remain stable so existing discoveries/quest progress survive the new layouts.
export const LOCATION_OVERRIDES: Record<string, number[]> = {
  keeper: [100, 91, 238], library: [-95, 157, -12],
  'estate-note-a': [-120, 90, 235], 'estate-note-b': [300, 48, 435], 'estate-note-c': [-110, 226, -14],
  'starter-scrap': [0, 85, 390], 'foyer-supply': [0, 91, 276], 'library-plans': [-95, 160, -22], 'east-shelf': [125, 95, 120],
  millwright: [-440, 51, 430], 'fan-housing': [-450, 116, 260], 'fan-coil': [-290, 47, 402], 'fan-blades': [-415, 187, 435],
  'mill-cache': [-415, 52, 465], orchard: [-560, 42, 530], 'garden-cache': [390, 46, 445],
  'mine-foreman': [-655, 101, -1080], 'depot-cache': [-640, 100, -1200],
  postmaster: [865, 95, -1365], market: [1185, 96, -1540], warehouse: [1240, 95, -1870], clocktower: [875, 233, -2130],
  'city-watch': [1210, 100, -1250], 'sigil-bell': [785, 235, -2130],
  'market-cache': [1220, 160, -1670], 'warehouse-cache': [1240, 163, -2010], 'roof-cache': [915, 165, -1820],
  'waterkeeper': [355, 144, -1980], 'lantern-east': [495, 229, -2400], 'survey-east': [410, 160, -2420],
  'lantern-west': [-235, 229, -2310], 'survey-west': [-145, 161, -2300],
  'lantern-north': [105, 256, -2530], 'survey-north': [10, 188, -2540],
  'temple-gate': [310, 163, -950],
  'temple-scholar': [485, 163, -1010], 'altar-west': [150, 160, -1190], 'altar-east': [485, 243, -1260],
  'temple-archive': [480, 242, -1010], 'temple-garden': [145, 163, -1030],
  astronomer: [-340, 322, -3130], 'star-cache': [-345, 481, -3360], 'lens-west': [-590, 380, -3060],
  'lens-east': [150, 381, -3340], 'lens-summit': [-595, 436, -3620], summit: [-500, 437, -3620],
  'ridge-cache': [-70, 258, -2720],
};
export function relocate<T extends Point3 & { id: string }>(point: T): T {
  const p = LOCATION_OVERRIDES[point.id]; return p ? { ...point, x: p[0], y: p[1], z: p[2] } : point;
}

export function nearTunnel(x: number, z: number, margin = 20) {
  return TUNNEL_LAYOUT.some(t => t.points.slice(1).some((b, i) => {
    const a = t.points[i], dx = b[0] - a[0], dz = b[2] - a[2], u = Math.max(0, Math.min(1, ((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz)));
    return Math.hypot(x-a[0]-dx*u,z-a[2]-dz*u) < t.radius + margin;
  }));
}
