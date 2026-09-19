import { BOSSES } from './combat.ts';
import { SITES, REGIONS, sanctuaryOpen } from './atlas.ts';
import { applyReward, type Progress, type Reward, type Upgrade } from './progression.ts';
import type { Point3 } from './flight.ts';

interface Goal { label: string; kind: 'collect' | 'visit' | 'defeat' | 'regions' | 'relic' | 'upgrade'; ids?: string[]; count?: number; }
export interface Quest { id: string; title: string; giver: string; region: string; story: string; clue: string; goals: Goal[]; reward: Reward; blueprint?: Upgrade; after?: string; }
export const QUESTS: Quest[] = [
  { id: 'copper-colossus', title: 'The machine that never slept', giver: 'mine-foreman', region: 'mine', story: 'The Copper Colossus still guards the upper western workings. Its lock holds the copper sigil in the deep vault.', clue: 'Take the upper western rail branch. Fit a tension launcher and reinforced paper at a workshop. Dodge the orange volley; fire at the blue cooling core.', goals: [{ label: 'Defeat the Copper Colossus', kind: 'defeat', ids: ['boss-copper'] }], reward: { parts: 55, cores: 2, ammo: 18 } },
  { id: 'heartwarden', title: 'The keeper of the heart', giver: 'temple-scholar', region: 'temple', story: 'The Heartwarden has forgotten the pilgrims. The central atrium must be quiet before the sanctuary will open.', clue: 'The guardian patrols the central temple atrium. Its core turns blue after each volley. A level II launcher and laminated paper make this a fairer fight.', goals: [{ label: 'Defeat the Heartwarden', kind: 'defeat', ids: ['boss-heart'] }], reward: { parts: 80, cores: 3 } },

  { id: 'field-notes', title: 'A keeper’s scattered pages', giver: 'keeper', region: 'hearthside', story: 'Ada wants to piece together the estate’s old flight studies.', clue: 'Search the main-floor conservatory, the attic archive and the garden house east of the estate. The warm atrium connects all four floors.', goals: [{ label: 'Recover Ada’s three notebooks', kind: 'collect', ids: ['estate-note-a', 'estate-note-b', 'estate-note-c'] }], reward: { parts: 24, ammo: 12 }, blueprint: 'glide' },
  { id: 'little-engine', title: 'A little push from the wind', giver: 'millwright', region: 'mill', story: 'An unfinished electric fan waits on Rowan’s repair bench.', clue: 'The housing is in the granary above the workshop. Look for the coil near the waterwheel and the propeller in the highest repair loft. Ride the mill’s warm central shaft.', goals: [{ label: 'Find the housing, winding and propeller', kind: 'collect', ids: ['fan-housing', 'fan-coil', 'fan-blades'] }], reward: { fan: true, parts: 18, charge: 100 } },
  { id: 'valley-survey', title: 'A valley worth remembering', giver: 'keeper', region: 'hearthside', story: 'Ada’s new atlas needs first-hand accounts of the valley.', clue: 'Explore the mill, caverns, mine, city, temple and aqueduct. No prescribed route.', goals: [{ label: 'Discover six regions beyond the estate', kind: 'regions', count: 6 }], reward: { parts: 65, cores: 3 } },
  { id: 'echoes', title: 'What the mountain remembers', giver: 'echo-keeper', region: 'cavern', story: 'Iona believes three tuning stones can reveal the old air routes.', clue: 'One stone is in the main cave. Two lie in the blue gallery west of the north entrance; search both branches.', goals: [{ label: 'Recover three tuning stones', kind: 'collect', ids: ['echo-one', 'echo-two', 'echo-three'] }, { label: 'Read the flooded grotto inscription', kind: 'visit', ids: ['grotto'] }], reward: { parts: 40, cores: 2 }, blueprint: 'speed' },
  { id: 'mine-air', title: 'Let Coppervein breathe', giver: 'mine-foreman', region: 'mine', story: 'The abandoned mine’s ventilation system can be brought back online.', clue: 'Use E at the intake, deep workings and eastern pump-room valves. The rails split halfway down the main shaft.', goals: [{ label: 'Open the three emergency valves', kind: 'visit', ids: ['valve-entry', 'valve-deep', 'valve-pump'] }], reward: { parts: 45, cores: 2, charge: 150 }, blueprint: 'motor' },
  { id: 'last-shift', title: 'The last shift', giver: 'mine-foreman', region: 'mine', story: 'The shift ledgers explain why the mine fell silent.', clue: 'Look in the intake store, deep ore chamber and pump room, then follow the rails to their broken northern end.', goals: [{ label: 'Recover three shift ledgers', kind: 'collect', ids: ['mine-ledger-a', 'mine-ledger-b', 'mine-ledger-c'] }, { label: 'Inspect the broken railway', kind: 'visit', ids: ['rail-end'] }], reward: { parts: 50, cores: 3 } },
  { id: 'city-post', title: 'Letters on the breeze', giver: 'postmaster', region: 'city', story: 'Mira entrusts you with the letters that never reached their neighbors.', clue: 'Visit the market arcade, dock warehouse and high clockkeeper’s loft. Use E at each letter box after taking the job.', goals: [{ label: 'Deliver the three bundles', kind: 'visit', ids: ['delivery:market', 'delivery:warehouse', 'delivery:clocktower'] }], reward: { parts: 45, cores: 2 }, blueprint: 'turn' },
  { id: 'harbor-watch', title: 'Quiet over the canal', giver: 'city-watch', region: 'city', story: 'The harbor’s clockwork sentries have forgotten whom they protect.', clue: 'Six wardens patrol the canal and rooftops. Collect their spare parts as you go.', goals: [{ label: 'Unfold six harbor wardens', kind: 'defeat', ids: ['guardian-24', 'guardian-25', 'guardian-26', 'guardian-27', 'guardian-28', 'guardian-29'] }], reward: { parts: 60, cores: 3, ammo: 24 } },
  { id: 'waterways', title: 'Lanterns along the water', giver: 'waterkeeper', region: 'aqueduct', story: 'Restore the old waterway’s wind lanterns to open a safer route toward Starfall.', clue: 'Visit the eastern and western galleries, then the taller northern tower. Survey plates lie near each lantern.', goals: [{ label: 'Light three wind lanterns', kind: 'visit', ids: ['lantern-east', 'lantern-west', 'lantern-north'] }, { label: 'Find the three survey plates', kind: 'collect', ids: ['survey-east', 'survey-west', 'survey-north'] }], reward: { parts: 55, cores: 3, charge: 150 }, blueprint: 'battery' },
  { id: 'three-memories', title: 'The valley’s three memories', giver: 'temple-scholar', region: 'temple', story: 'The temple was built to connect the entire valley, not stand apart from it.', clue: 'Find an echo sigil in the western grotto, a copper sigil at the far end of the mine and a bell sigil in the city clocktower. Visit both temple altars.', goals: [{ label: 'Recover the three valley sigils', kind: 'collect', ids: ['sigil-echo', 'sigil-copper', 'sigil-bell'] }, { label: 'Awaken the garden and archive altars', kind: 'visit', ids: ['altar-west', 'altar-east'] }], reward: { parts: 60, cores: 3 } },
  { id: 'skyheart', title: 'A heart for the high places', giver: 'temple-scholar', region: 'temple', after: 'three-memories', story: 'The valley’s memories are reunited. Defeat the Heartwarden to release the living lens.', clue: 'Defeat the Heartwarden in the central atrium, then enter the inner sanctuary and recover the Skyheart, then return to the bell court inscription.', goals: [{ label: 'Recover the Skyheart', kind: 'relic' }], reward: { parts: 50, cores: 3 } },
  { id: 'starfall', title: 'Bring the light home', giver: 'astronomer', region: 'observatory', story: 'Orin’s last transmission still echoes inside the great dome.', clue: 'Find the lens fragments at the western shelter, eastern platform and north lookout. Defeat the Tempest Roc above the observatory dome. Return with the Skyheart to restore the sky lens.', goals: [{ label: 'Recover three lens fragments', kind: 'collect', ids: ['lens-west', 'lens-east', 'lens-summit'] }, { label: 'Carry the living Skyheart', kind: 'relic' }, { label: 'Defeat the Tempest Roc above the dome', kind: 'defeat', ids: ['boss-tempest'] }], reward: { parts: 120, cores: 6 } },
  { id: 'old-roads', title: 'The roads between us', giver: 'postmaster', region: 'city', story: 'Mira wants proof that the valley’s forgotten routes can be traveled again.', clue: 'Read the orchard marker, the broken railway, the canal lock and the astronomers’ village sign.', goals: [{ label: 'Record four old connections', kind: 'visit', ids: ['orchard', 'rail-end', 'canal', 'ridge-village'] }], reward: { parts: 70, cores: 3 } },
];
export function goalProgress(p: Progress, goal: Goal): [number, number] {
  if (goal.kind === 'regions') return [REGIONS.filter(r => r.id !== 'hearthside' && p.discovered.includes(r.id)).length, goal.count!];
  if (goal.kind === 'relic') return [Number(p.relic), 1];
  if (goal.kind === 'upgrade') return [Object.values(p.upgrades).reduce((a, b) => a + b, 0), goal.count!];
  const have = goal.kind === 'collect' ? p.collected : goal.kind === 'defeat' ? p.defeated : p.discovered;
  return [goal.ids!.filter(id => have.includes(goal.kind === 'visit' ? 'site:' + id : id)).length, goal.ids!.length];
}
export function questReady(p: Progress, quest: Quest) { return quest.goals.every(g => { const [n, total] = goalProgress(p, g); return n >= total; }); }
export function questKnown(p: Progress, quest: Quest) { return (p.discovered.includes('site:' + quest.giver) || p.accepted.includes(quest.id) || p.completed.includes(quest.id)) && (!quest.after || p.completed.includes(quest.after)); }
export function acceptQuest(p: Progress, id: string): boolean { const q = QUESTS.find(q => q.id === id); if (!q || !questKnown(p, q) || p.accepted.includes(id) || p.completed.includes(id)) return false; p.accepted.push(id); p.trackedQuest = id; return true; }
export function nearSite(position: Point3, id: string) { const s = SITES.find(s => s.id === id); return !!s && Math.hypot(position.x - s.x, position.y - s.y, position.z - s.z) < 25; }
export function finishQuest(p: Progress, id: string, position: Point3): string | null {
  const q = QUESTS.find(q => q.id === id);
  if (!q || !p.accepted.includes(id) || p.completed.includes(id) || !questReady(p, q) || !nearSite(position, q.giver)) return null;
  p.completed.push(id); if (q.blueprint && !p.blueprints.includes(q.blueprint)) p.blueprints.push(q.blueprint);
  if (p.trackedQuest === id) p.trackedQuest = null;
  return `${q.title} complete · ${applyReward(p, q.reward)}${q.blueprint ? ' · Advanced schematic learned' : ''}`;
}
export function interactSite(p: Progress, id: string): string {
  const s = SITES.find(s => s.id === id); if (!s) return '';
  if (!p.discovered.includes('site:' + id)) p.discovered.push('site:' + id);
  if (p.accepted.includes('city-post') && ['market', 'warehouse', 'clocktower'].includes(id)) {
    const delivery = 'site:delivery:' + id; if (!p.discovered.includes(delivery)) { p.discovered.push(delivery); return 'Letter bundle delivered. ' + s.text; }
  }
  return s.text;
}
export function rumor(p: Progress): { name: string; detail: string } {
  if (p.trackedQuest) { const q = QUESTS.find(q => q.id === p.trackedQuest); if (q && !p.completed.includes(q.id)) { const step = nextQuestStep(p, q); return { name: q.title, detail: `${step.title}. ${step.hint}` }; } }
  if (p.completed.includes('starfall')) return { name: 'The valley is yours', detail: 'The great lens shines again. There are still quiet corners to find.' };
  if (!p.fan) return { name: 'Follow your curiosity', detail: 'There’s talk of an old repair workshop west of the lake. J opens your journal.' };
  if (!p.discovered.includes('city')) return { name: 'A wider world', detail: 'Caves follow the western river. Bells sometimes drift across the eastern headland.' };
  if (!sanctuaryOpen(p)) return { name: 'Stories travel together', detail: 'City letters, old mine logs and temple inscriptions share pieces of the same story.' };
  return { name: 'Beyond the high gardens', detail: 'A distant observatory still waits above the storm ridge.' };
}

export interface QuestStep { id: string; title: string; hint: string; region: string; done: boolean }
// Landmarks and floors give a useful search area, never a route or exact coordinate.
const LEADS: Record<string, [string, string, string]> = {
  'estate-note-a': ['Botany notebook', 'Hearthside main floor · western conservatory. Fly through the green notebook.', 'hearthside'],
  'estate-note-b': ['Garden notebook', 'Garden house east of Hearthside · ground floor, beside the planting tables.', 'hearthside'],
  'estate-note-c': ['Library notebook', 'Hearthside attic · rear archive. Ride the warm central atrium up three floors from the cellar.', 'hearthside'],
  'fan-housing': ['Fan housing', 'Willow Mill · middle-floor granary, rear western corner. Ride the central updraft.', 'mill'],
  'fan-coil': ['Copper winding', 'Willow Mill · ground floor, eastern waterwheel side. Look for a copper spool.', 'mill'],
  'fan-blades': ['Carved propeller', 'Willow Mill · highest repair loft, toward the front. Fly through the wooden blades.', 'mill'],
  'echo-one': ['First tuning stone', 'Echo Caverns · main passage beyond Iona’s camp. Look for a carved blue stone.', 'cavern'],
  'echo-two': ['Second tuning stone', 'Echo Caverns · northern bend where the main cave meets the western blue gallery.', 'cavern'],
  'echo-three': ['Third tuning stone', 'Echo Caverns · far western branch of the lower gallery.', 'cavern'],
  grotto: ['Read the grotto inscription', 'Echo Caverns · western flooded chamber. Press E at the sign.', 'cavern'],
  'valve-entry': ['Open the intake valve', 'Coppervein · follow the rails into the first main chamber. Press E at the red valve wheel.', 'mine'],
  'valve-deep': ['Open the deep valve', 'Coppervein · continue north along the main rails into the lowest workings. Press E.', 'mine'],
  'valve-pump': ['Open the pump valve', 'Coppervein · take the eastern branch at the rail junction. Press E in the pump room.', 'mine'],
  'mine-ledger-a': ['Intake shift ledger', 'Coppervein · first storage chamber north of the entrance.', 'mine'],
  'mine-ledger-b': ['Deep shift ledger', 'Coppervein · lowest ore chamber near the northern end of the main line.', 'mine'],
  'mine-ledger-c': ['Pump shift ledger', 'Coppervein · eastern pump-room branch, near the shelter.', 'mine'],
  'rail-end': ['Inspect the broken railway', 'Coppervein · follow the main rails to their northern end. Press E at the sign.', 'mine'],
  'delivery:market': ['Deliver the market letters', 'Bellwether · striped market arcade, ground floor. Press E at the letter box.', 'city'],
  'delivery:warehouse': ['Deliver the dock letters', 'Bellwether · brick dock warehouse, ground floor loading hall. Press E at the letter box.', 'city'],
  'delivery:clocktower': ['Deliver the clockkeeper’s letters', 'Bellwether · clocktower’s highest floor, rear loft. Press E at the letter box.', 'city'],
  'lantern-east': ['Light the eastern lantern', 'Aqueduct · eastern gallery, upper floor. Ride the atrium and press E.', 'aqueduct'],
  'lantern-west': ['Light the western lantern', 'Aqueduct · western gallery, upper floor. Ride the atrium and press E.', 'aqueduct'],
  'lantern-north': ['Light the northern lantern', 'Aqueduct · tall northern cistern, upper floor. Press E.', 'aqueduct'],
  'survey-east': ['Eastern survey plate', 'Aqueduct · eastern gallery, ground floor toward the rear.', 'aqueduct'],
  'survey-west': ['Western survey plate', 'Aqueduct · western gallery, ground floor toward the rear.', 'aqueduct'],
  'survey-north': ['Northern survey plate', 'Aqueduct · northern cistern, ground floor western archive.', 'aqueduct'],
  'sigil-echo': ['Echo sigil', 'Echo Caverns · western flooded grotto, near the inscription. Look for a round engraved medallion.', 'cavern'],
  'sigil-copper': ['Copper sigil', 'Coppervein · far northern ore chamber, before the broken railway. Defeat the Copper Colossus in the upper western workings to release its lock.', 'mine'],
  'sigil-bell': ['Bell sigil', 'Bellwether · clocktower’s highest floor, western side of the rear loft.', 'city'],
  'altar-west': ['Awaken the garden altar', 'Skyheart Temple · ground-floor western garden. Press E at the altar.', 'temple'],
  'altar-east': ['Awaken the archive altar', 'Skyheart Temple · upper-floor eastern archive. Ride the atrium and press E.', 'temple'],
  'lens-west': ['Western lens fragment', 'Starfall · western lookout, upper gallery toward the rear.', 'observatory'],
  'lens-east': ['Eastern lens fragment', 'Starfall · eastern lookout, upper gallery toward the rear.', 'observatory'],
  'lens-summit': ['Summit lens fragment', 'Starfall · northernmost lookout, upper gallery toward the rear.', 'observatory'],
  orchard: ['Read the orchard marker', 'Willow Mill · southwest of the mill, beside the old garden path. Press E.', 'mill'],
  canal: ['Read the canal marker', 'Bellwether · western canal, south of the bridge. Press E.', 'city'],
  'ridge-village': ['Read the village sign', 'Starfall · southern astronomers’ village, inside the chart house. Press E.', 'observatory'],
};
export function questSteps(p: Progress, q: Quest): QuestStep[] {
  return q.goals.flatMap((g): QuestStep[] => {
    if (g.kind === 'defeat' && g.ids?.some(id => id.startsWith('boss-'))) return g.ids.map(id => { const b = BOSSES.find(b => b.id === id)!; return { id, title: `Defeat ${b.name}`, hint: b.hint, region: b.region, done: p.defeated.includes(id) }; });
    if (g.kind === 'defeat') { const [n, total] = goalProgress(p, g); return [{ id: 'wardens', title: `Unfold harbor wardens (${n}/${total})`, hint: 'Bellwether · red-eyed brass sentries around the canal, market and clocktower. Aim and fire with X.', region: 'city', done: n >= total }]; }
    if (g.kind === 'regions') return REGIONS.filter(r => r.id !== 'hearthside').map(r => ({ id: r.id, title: `Explore ${r.name}`, hint: r.subtitle, region: r.id, done: p.discovered.includes(r.id) }));
    if (g.kind === 'relic') return [{ id: 'skyheart', title: 'Recover the Skyheart', hint: sanctuaryOpen(p) ? 'Skyheart Temple · ground-floor inner sanctuary. Fly through the golden armillary.' : 'The sanctuary opens with three sigils, both awakened altars and the Heartwarden defeated.', region: 'temple', done: p.relic }];
    if (!g.ids) { const [n, total] = goalProgress(p, g); return [{ id: g.kind, title: g.label, hint: q.clue, region: q.region, done: n >= total }]; }
    return g.ids.map(id => { const lead = LEADS[id]; return { id, title: (g.kind === 'collect' ? 'Collect ' : '') + (lead?.[0] ?? g.label), hint: lead?.[1] ?? q.clue, region: lead?.[2] ?? q.region, done: (g.kind === 'collect' ? p.collected : p.discovered).includes((g.kind === 'visit' ? 'site:' : '') + id) }; });
  });
}
export function nextQuestStep(p: Progress, q: Quest): QuestStep {
  if (questReady(p, q)) { const s = SITES.find(s => s.id === q.giver)!; return { id: s.id, title: `Return to ${s.name}`, hint: `${REGIONS.find(r => r.id === s.region)!.name} · press E and turn in the request.`, region: s.region, done: false }; }
  return questSteps(p, q).find(s => !s.done)!;
}
export function siteQuestStatus(p: Progress, id: string): 'return' | 'request' | 'objective' | 'visited' | 'read' {
  const quests = QUESTS.filter(q => q.giver === id && (!q.after || p.completed.includes(q.after)) && !p.completed.includes(q.id));
  if (quests.some(q => p.accepted.includes(q.id) && questReady(p, q))) return 'return';
  if (quests.some(q => !p.accepted.includes(q.id))) return 'request';
  if (QUESTS.some(q => p.accepted.includes(q.id) && !p.completed.includes(q.id) && questSteps(p, q).some(s => !s.done && (s.id === id || s.id === 'delivery:' + id)))) return 'objective';
  return p.discovered.includes('site:' + id) ? 'visited' : 'read';
}
