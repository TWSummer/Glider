import { relocate } from './architecture-data.ts';
import type { Point3 } from './flight.ts';
import type { Drop, Progress } from './progression.ts';

export interface Region extends Point3 { id: string; name: string; subtitle: string; tier: number; color: string; radius: number; advice: string }
export const REGIONS: Region[] = [
  { id: 'hearthside', name: 'Hearthside', subtitle: 'A four-storey lakeside house: cellar, conservatory, library and attic', tier: 1, x: 0, y: 91, z: 112, color: '#efb675', radius: 260, advice: 'Gentle air. A good place to learn the winds and find your first parts.' },
  { id: 'mill', name: 'Willow Mill', subtitle: 'Waterwheel hall, workshop, granary and a high repair loft', tier: 1, x: -390, y: 56, z: 355, color: '#d8c88b', radius: 210, advice: 'Look west of the lake. The old mechanic left something unfinished.' },
  { id: 'cavern', name: 'Echo Caverns', subtitle: 'Crystal galleries, flooded grotto and an ancient listening chamber', tier: 2, x: -450, y: 69, z: -332, color: '#91d8d0', radius: 230, advice: 'Longer wings help between vents. Follow the river into the western rock.' },
  { id: 'temple', name: 'Skyheart Temple', subtitle: 'Terraced gardens, bell court, archive and a sealed sanctuary', tier: 3, x: 310, y: 158, z: -985, color: '#d9b4ff', radius: 200, advice: 'Three valley sigils awaken the sanctuary. Look beyond these ruins.' },
  { id: 'mine', name: 'Coppervein Mine', subtitle: 'Rail depot, timbered shafts, pump room and deep ore workings', tier: 3, x: -920, y: 104, z: -1040, color: '#dba379', radius: 540, advice: 'Turn control and a charged fan help in the deeper workings. Find the rail line.' },
  { id: 'city', name: 'Bellwether City', subtitle: 'Canals, market arcades, warehouses, clocktower and rooftop gardens', tier: 2, x: 960, y: 92, z: -1400, color: '#e1c59b', radius: 550, advice: 'A harbor beyond the eastern headland. There are jobs at the post office.' },
  { id: 'aqueduct', name: 'The Sunken Aqueduct', subtitle: 'An old waterway linking the city, mines and mountain gardens', tier: 3, x: 90, y: 143, z: -2150, color: '#9bbcc7', radius: 420, advice: 'Exposed crossings. Better wings and a larger battery make the trip easier.' },
  { id: 'observatory', name: 'Starfall Observatory', subtitle: 'Storm ridge, ruined astronomers’ village and the great sky lens', tier: 4, x: -250, y: 320, z: -3230, color: '#c7c3f1', radius: 490, advice: 'Strong descending air. Prepare advanced wings, folds, battery and fan.' },
];
export interface Site extends Point3 { id: string; name: string; region: string; text: string; kind: 'board' | 'landmark' | 'mechanism'; }
export const SITES: Site[] = [
  { id: 'keeper', name: 'Ada’s field desk', region: 'hearthside', x: 27, y: 49, z: 176, kind: 'board', text: 'Ada, estate keeper: “This valley used to be one place. The rail carried copper, the canal carried letters, and the temple kept the weather. My field notes are still somewhere around the estate.”' },
  { id: 'library', name: 'The flight archive', region: 'hearthside', x: -26, y: 62, z: 40, kind: 'landmark', text: 'An old route map shows a river running west into crystal caves, and east to a city of bells. Pencil notes mention a mechanic at Willow Mill, beyond the western orchard.' },
  { id: 'millwright', name: 'Rowan’s repair bench', region: 'mill', x: -327, y: 51, z: 302, kind: 'board', text: 'Rowan’s note: “The little fan is nearly ready. I left the housing in the loft, a coil by the wheel, and the propeller in the highest repair loft. Bring them here and we can put it together.”' },
  { id: 'orchard', name: 'The old orchard', region: 'mill', x: -480, y: 42, z: 455, kind: 'landmark', text: 'A stone path connects the mill to the conservatory gardens. Fallen apples and scraps of paper collect beneath the trees.' },
  { id: 'echo-keeper', name: 'Iona’s listening camp', region: 'cavern', x: -462, y: 74, z: -408, kind: 'board', text: 'Iona, sound cartographer: “The main tunnel isn’t the whole cave. Beyond its north mouth, turn west into the blue gallery. Three tuning stones tell a much older story.”' },
  { id: 'grotto', name: 'The flooded grotto', region: 'cavern', x: -734, y: 84, z: -700, kind: 'landmark', text: 'Light pools under the limestone. A worn carving shows three sigils—echo, copper and bell—around the temple’s sleeping heart.' },
  { id: 'mine-foreman', name: 'Bram’s depot log', region: 'mine', x: -859, y: 106, z: -1080, kind: 'board', text: 'Bram, last shift foreman: “Three emergency valves shut down the air pumps. Open them again and this mine can breathe. The narrow side workings hold the old impeller plans.”' },
  { id: 'valve-entry', name: 'Intake valve', region: 'mine', x: -920, y: 102, z: -1255, kind: 'mechanism', text: 'The intake shutter turns. Copper pipes carry the sound toward the pump room.' },
  { id: 'valve-deep', name: 'Deep workings valve', region: 'mine', x: -1020, y: 94, z: -1690, kind: 'mechanism', text: 'Pressure returns to the lowest pipe. Two lamps blink on the old control panel.' },
  { id: 'valve-pump', name: 'Pump room valve', region: 'mine', x: -760, y: 127, z: -1585, kind: 'mechanism', text: 'The pump shaft opens. Return to Bram’s depot log to finish restoring the ventilation.' },
  { id: 'rail-end', name: 'The broken railway', region: 'mine', x: -960, y: 108, z: -1870, kind: 'landmark', text: 'The line ends above a chasm. City stamps on the crates reveal where the copper once went.' },
  { id: 'postmaster', name: 'Mira’s post office', region: 'city', x: 860, y: 94, z: -1450, kind: 'board', text: 'Mira, postmaster: “A glider! At last. Three bundles still need delivering: the market, the dock warehouse and the clocktower. Take whichever streets you like.”' },
  { id: 'market', name: 'Market arcade', region: 'city', x: 1030, y: 93, z: -1580, kind: 'board', text: 'The market’s letter box is tucked beside the tea stall. Canvas awnings ripple over a street of copper lanterns.' },
  { id: 'warehouse', name: 'Dock warehouse', region: 'city', x: 1130, y: 88, z: -1870, kind: 'board', text: 'Crates of lens glass, ore and paper fill the warehouse. A letter box stands by the loading doors.' },
  { id: 'clocktower', name: 'Clockkeeper’s loft', region: 'city', x: 845, y: 190, z: -2000, kind: 'board', text: 'The clockkeeper points to a bell-shaped sigil beneath the roof. “The temple and this city were built together. Perhaps you can make them speak again.”' },
  { id: 'city-watch', name: 'The harbor watch', region: 'city', x: 1170, y: 96, z: -1340, kind: 'board', text: 'The watch board asks for help with six clockwork sentries patrolling the canal. Their spare parts might still serve the city.' },
  { id: 'canal', name: 'The old canal lock', region: 'city', x: 735, y: 86, z: -1790, kind: 'landmark', text: 'The canal branches west toward the aqueduct. Its stone arches once fed the high temple gardens.' },
  { id: 'waterkeeper', name: 'Sela’s lock house', region: 'aqueduct', x: 305, y: 144, z: -2040, kind: 'board', text: 'Sela’s journal: “The three survey plates show how to cross the descending air. Restore the wind lanterns along the waterway and the high route will open.”' },
  { id: 'lantern-east', name: 'Eastern wind lantern', region: 'aqueduct', x: 370, y: 158, z: -2240, kind: 'mechanism', text: 'The eastern lantern lights. Warm air begins to gather inside the old stonework.' },
  { id: 'lantern-west', name: 'Western wind lantern', region: 'aqueduct', x: -195, y: 158, z: -2240, kind: 'mechanism', text: 'The western lantern lights. Across the valley, another lantern answers.' },
  { id: 'lantern-north', name: 'Northern wind lantern', region: 'aqueduct', x: 80, y: 188, z: -2420, kind: 'mechanism', text: 'The northern lantern shines toward Starfall Ridge. Return to Sela’s lock house to restore the entire air channel.' },
  { id: 'temple-scholar', name: 'The bell court inscription', region: 'temple', x: 405, y: 159, z: -1090, kind: 'board', text: '“The echo below. The copper within. The bell beyond. Bring the valley’s three memories to the two altars, and wake the heart.”' },
  { id: 'altar-west', name: 'Garden altar', region: 'temple', x: 180, y: 158, z: -1140, kind: 'mechanism', text: 'The garden altar remembers your visit. Its carved sigil catches the light.' },
  { id: 'altar-east', name: 'Archive altar', region: 'temple', x: 440, y: 169, z: -1220, kind: 'mechanism', text: 'The archive altar remembers your visit. The sanctuary waits for the valley’s three sigils.' },
  { id: 'astronomer', name: 'Orin’s last transmission', region: 'observatory', x: -245, y: 320, z: -3190, kind: 'board', text: 'Orin’s recorded voice: “The sky lens scattered in the storm. Three fragments, one living heart. If someone hears this, bring the light home.”' },
  { id: 'ridge-village', name: 'Astronomers’ village', region: 'observatory', x: -80, y: 255, z: -2800, kind: 'landmark', text: 'Abandoned homes huddle in the lee of the ridge. Their paper star charts still point toward the observatory dome.' },
  { id: 'summit', name: 'The north lookout', region: 'observatory', x: -520, y: 360, z: -3500, kind: 'landmark', text: 'From here the entire valley is a memory in the mist: mill, river, city, mine and temple. You made it this far on a sheet of paper.' },
];

SITES.forEach((s, i) => { SITES[i] = relocate(s); });

export const EXTRA_SUPPLIES: (Drop & { name: string })[] = [
  ['estate-note-a', 'Botany notebook', -32, 50, 179, { parts: 5 }], ['estate-note-b', 'Garden notebook', 152, 38, 322, { parts: 6 }], ['estate-note-c', 'Library notebook', -34, 66, 41, { parts: 5 }],
  ['fan-housing', 'Fan housing', -375, 73, 274, { parts: 4 }], ['fan-coil', 'Copper winding', -307, 39, 397, { parts: 4 }], ['fan-blades', 'Carved propeller', -453, 72, 191, { parts: 4 }],
  ['echo-one', 'First tuning stone', -484, 85, -498, { parts: 8 }], ['echo-two', 'Second tuning stone', -656, 97, -808, { parts: 8 }], ['echo-three', 'Third tuning stone', -790, 92, -616, { parts: 8, cores: 1 }],
  ['sigil-echo', 'The echo sigil', -735, 91, -711, { cores: 1 }],
  ['mine-ledger-a', 'Intake shift ledger', -932, 105, -1320, { parts: 10 }], ['mine-ledger-b', 'Deep shift ledger', -1038, 91, -1740, { parts: 12 }], ['mine-ledger-c', 'Pump shift ledger', -744, 127, -1540, { parts: 12 }],
  ['sigil-copper', 'The copper sigil', -966, 113, -1835, { cores: 2 }],
  ['sigil-bell', 'The bell sigil', 845, 194, -2026, { cores: 2 }],
  ['survey-east', 'Eastern survey plate', 361, 155, -2255, { parts: 10 }], ['survey-west', 'Western survey plate', -195, 156, -2200, { parts: 10 }], ['survey-north', 'Northern survey plate', 60, 187, -2380, { cores: 1, parts: 12 }],
  ['lens-west', 'Western lens fragment', -540, 308, -3010, { cores: 1, parts: 18 }], ['lens-east', 'Eastern lens fragment', 100, 310, -3290, { cores: 1, parts: 18 }], ['lens-summit', 'Summit lens fragment', -520, 363, -3500, { cores: 2, parts: 20 }],
  ['garden-cache', 'Gardeners’ lockbox', 186, 40, 267, { parts: 8, ammo: 10 }], ['mill-cache', 'Mill supply crate', -360, 44, 420, { ammo: 16, parts: 8 }],
  ['grotto-cache', 'Grotto supply chest', -683, 86, -736, { ammo: 20, charge: 55 }], ['depot-cache', 'Depot supply crate', -873, 108, -1120, { ammo: 20, charge: 65 }],
  ['pump-cache', 'Pump service battery', -774, 128, -1530, { charge: 90, parts: 12 }], ['ore-cache', 'Copper seam cache', -991, 100, -1620, { ammo: 20, parts: 14 }],
  ['market-cache', 'Market spare parts', 1024, 99, -1615, { parts: 16, ammo: 12 }], ['warehouse-cache', 'Glassworkers’ crate', 1150, 107, -1900, { charge: 80, parts: 14 }],
  ['roof-cache', 'Rooftop garden chest', 1050, 157, -1780, { cores: 1, parts: 15 }], ['canal-cache', 'Lock keeper’s provisions', 725, 94, -1804, { ammo: 20, charge: 90 }],
  ['temple-archive', 'Archive cache', 444, 170, -1180, { parts: 20, ammo: 20 }], ['temple-garden', 'Garden cache', 180, 161, -1080, { charge: 80, parts: 10 }],
  ['ridge-cache', 'Storm shelter supplies', -55, 257, -2790, { charge: 150, ammo: 24 }], ['star-cache', 'Astronomer’s provisions', -210, 323, -3300, { charge: 150, ammo: 24 }],
].map(([id, name, x, y, z, reward]) => ({ id, name, x, y, z, reward })) as (Drop & { name: string })[];

EXTRA_SUPPLIES.forEach((s, i) => { EXTRA_SUPPLIES[i] = relocate(s); });

// Flattened shoulders form a continuous inhabited valley; the water remains the river/lake.
export const LAND = [
  { x: 0, z: 110, rx: 335, rz: 385, h: 59 }, { x: 165, z: 285, rx: 115, rz: 110, h: 17 },
  { x: 300, z: 360, rx: 79, rz: 111, h: 18 },
  { x: -352, z: 340, rx: 190, rz: 180, h: 19 }, { x: -448, z: 198, rx: 70, rz: 65, h: 43 },
  { x: -483, z: -491, rx: 155, rz: 252, h: 27 }, { x: -720, z: -730, rx: 207, rz: 186, h: 42 },
  { x: -904, z: -1335, rx: 280, rz: 620, h: 61 }, { x: -762, z: -1560, rx: 155, rz: 185, h: 85 },
  { x: 310, z: -1112, rx: 228, rz: 245, h: 128 },
  { x: 970, z: -1690, rx: 420, rz: 650, h: 59 },
  { x: 665, z: -971, rx: 183, rz: 324, h: 39 },
  { x: 92, z: -2170, rx: 457, rz: 362, h: 112 },
  { x: -108, z: -2770, rx: 260, rz: 260, h: 222 },
  { x: -257, z: -3240, rx: 264, rz: 255, h: 288 },
  { x: -539, z: -3010, rx: 107, rz: 115, h: 275 },
  { x: 100, z: -3290, rx: 115, rz: 130, h: 278 },
  { x: -520, z: -3500, rx: 110, rz: 138, h: 332 },
];
export function landHeight(x: number, z: number): number {
  let h = valleyFloor(x, z);
  for (const l of LAND) { const r = Math.hypot((x - l.x) / l.rx, (z - l.z) / l.rz); if (r < 1) h = Math.max(h, l.h * (r < .73 ? 1 : Math.pow((1 - r) / .27, .65))); }
  return h;
}
export function valleyFloor(x: number, z: number): number {
  if (z > -390) return 0;
  const r = Math.hypot(x / 1530, (z + 2150) / 1980);
  if (r >= 1) return 0;
  const river = 30 + 90 * Math.sin(z * .0033), bank = Math.min(1, Math.max(0, (Math.abs(x - river) - 73) / 78));
  const coast = Math.min(1, (1 - r) * 7), south = Math.min(1, (-z - 390) / 170);
  return (9 + Math.min(3000, -z - 390) * .022 + Math.sin(x * .01) * 2) * bank * coast * south;
}
export function regionAt(p: Point3): Region {
  return REGIONS.find(r => r.id === 'observatory' && p.z < -2570) ?? [...REGIONS].sort((a, b) => Math.hypot(p.x - a.x, p.z - a.z) - Math.hypot(p.x - b.x, p.z - b.z))[0];
}
export interface Air { sink: number; headwind: number; crosswind: number; name: string }
export function airAt(p: Point3): Air {
  if (p.z < -2530) return { sink: 3.4, headwind: 22, crosswind: 5, name: 'STORM RIDGE · DESCENDING AIR' };
  if (p.z < -1920 && p.x < 560) return { sink: 1.8, headwind: 11, crosswind: 3, name: 'AQUEDUCT · EXPOSED CROSSING' };
  if (p.x < -680 && p.z < -1130) return { sink: 1.1, headwind: 5, crosswind: .5, name: 'MINE · COLD DRAFT' };
  return { sink: 0, headwind: 0, crosswind: 0, name: '' };
}
export function applyAir(p: Point3, progress: Progress, heading: number, dt: number, time: number) {
  const air = airAt(p), wings = Math.pow(.7, progress.upgrades.glide), folds = Math.pow(.8, progress.upgrades.speed);
  // A southerly wind resists travel up-valley; speed upgrades reduce its effect on the craft.
  p.y -= air.sink * wings * dt;
  p.z += air.headwind * folds * Math.max(.15, Math.cos(heading)) * dt;
  p.x += Math.sin(time * .43 + p.z * .009) * air.crosswind / (1 + progress.upgrades.turn * .45) * dt;
}
export function sanctuaryOpen(p: Progress) { return ['sigil-echo', 'sigil-copper', 'sigil-bell'].every(id => p.collected.includes(id)) && ['altar-west', 'altar-east'].every(id => p.discovered.includes('site:' + id)); }
