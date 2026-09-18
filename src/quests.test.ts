import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newProgress, collect, buyUpgrade, parseSave, serializeSave, flightTuning } from './progression.ts';
import { QUESTS, acceptQuest, finishQuest, interactSite, questReady, questKnown, questSteps, nextQuestStep, siteQuestStatus, rumor } from './quests.ts';
import { SITES, REGIONS, sanctuaryOpen, applyAir } from './atlas.ts';
import { liftAt, Adventure, SUPPLIES } from './adventure.ts';
import { World, groundHeight } from './world.ts';
import { TUNNELS, inTunnel } from './valley.ts';
const site = (id: string) => SITES.find(s => s.id === id)!;

test('fan requires discovering the mill, all three components, and returning to the mechanic', () => {
  const p = newProgress(); assert.equal(acceptQuest(p, 'little-engine'), false);
  interactSite(p, 'millwright'); assert.equal(acceptQuest(p, 'little-engine'), true); assert.equal(finishQuest(p, 'little-engine', site('millwright')), null);
  for (const id of ['fan-housing', 'fan-coil', 'fan-blades']) collect(p, id, SUPPLIES.find(s => s.id === id)!.reward);
  assert.equal(p.fan, false); assert.equal(finishQuest(p, 'little-engine', site('keeper')), null);
  assert.ok(finishQuest(p, 'little-engine', site('millwright'))); assert.equal(p.fan, true); assert.equal(p.charge, 100);
  const parts = p.parts; assert.equal(finishQuest(p, 'little-engine', site('millwright')), null); assert.equal(p.parts, parts);
});
test('advanced equipment is earned from regional quests, with currency still required', () => {
  const p = newProgress(); p.parts = 300; p.cores = 6; buyUpgrade(p, 'glide');
  assert.equal(buyUpgrade(p, 'glide'), false);
  interactSite(p, 'keeper'); acceptQuest(p, 'field-notes'); p.collected.push('estate-note-a', 'estate-note-b', 'estate-note-c');
  assert.ok(finishQuest(p, 'field-notes', site('keeper'))); assert.ok(p.blueprints.includes('glide'));
  const before = flightTuning(p).sink; assert.equal(buyUpgrade(p, 'glide'), true); assert.ok(flightTuning(p).sink < before);
});
test('mail deliveries only count after accepting the job and each recipient counts once', () => {
  const p = newProgress(), q = QUESTS.find(q => q.id === 'city-post')!;
  for (const id of ['market', 'warehouse', 'clocktower']) interactSite(p, id);
  interactSite(p, 'postmaster'); acceptQuest(p, q.id); assert.equal(questReady(p, q), false);
  for (const id of ['market', 'warehouse', 'clocktower']) { interactSite(p, id); interactSite(p, id); }
  assert.equal(questReady(p, q), true); assert.equal(p.discovered.filter(s => s.startsWith('site:delivery:')).length, 3);
  assert.ok(finishQuest(p, q.id, site('postmaster')));
});
test('restoring the mine and aqueduct changes the real lift field and survives saving', () => {
  const p = newProgress(), mine = { x: -965, y: 110, z: -1480 }, ridge = { x: -10, y: 255, z: -2560 };
  assert.equal(liftAt(mine, p), 0); assert.equal(liftAt(ridge, p), 0);
  interactSite(p, 'mine-foreman'); acceptQuest(p, 'mine-air'); ['valve-entry', 'valve-deep', 'valve-pump'].forEach(id => interactSite(p, id));
  assert.ok(finishQuest(p, 'mine-air', site('mine-foreman'))); assert.ok(liftAt(mine, p) > 10);
  interactSite(p, 'waterkeeper'); acceptQuest(p, 'waterways'); ['lantern-east', 'lantern-west', 'lantern-north'].forEach(id => interactSite(p, id)); p.collected.push('survey-east', 'survey-west', 'survey-north');
  assert.ok(finishQuest(p, 'waterways', site('waterkeeper'))); const saved = parseSave(serializeSave(p))!.progress;
  assert.ok(liftAt(ridge, saved) > 20); assert.ok(saved.blueprints.includes('battery'));
});
test('three distant sigils and both temple altars are needed to unseal the Skyheart', () => {
  const p = newProgress(); assert.equal(sanctuaryOpen(p), false);
  p.collected.push('sigil-echo', 'sigil-copper', 'sigil-bell'); assert.equal(sanctuaryOpen(p), false);
  interactSite(p, 'altar-west'); interactSite(p, 'altar-east'); assert.equal(sanctuaryOpen(p), true);
});
test('old saves migrate without deleting equipment, and new quest state round-trips', () => {
  const original = newProgress(); original.fan = true; original.upgrades.glide = 2; original.collected.push('electric-fan');
  const old = JSON.parse(serializeSave(original)); delete old.progress.accepted; delete old.progress.completed; delete old.progress.blueprints; delete old.progress.trackedQuest;
  const p = parseSave(JSON.stringify(old))!.progress; assert.equal(p.fan, true); assert.equal(p.upgrades.glide, 2); assert.deepEqual(p.completed, []);
  p.accepted.push('little-engine'); p.trackedQuest = 'little-engine'; assert.deepEqual(parseSave(serializeSave(p))!.progress, p);
});
test('storm ridge imposes real range costs and wing/fold upgrades reduce them', () => {
  const base = newProgress(), upgraded = newProgress(); upgraded.upgrades.glide = 3; upgraded.upgrades.speed = 3;
  const a = { x: 0, y: 330, z: -3000 }, b = { ...a };
  applyAir(a, base, 0, 20, 1); applyAir(b, upgraded, 0, 20, 1);
  assert.ok(b.y - a.y > 40); assert.ok(a.z - b.z > 200);
});
test('every story contact and objective is reachable outside physical geometry', () => {
  const world = new World(), adventure = new Adventure(world.scene, world.plane);
  for (const s of [...SITES, ...SUPPLIES]) {
    assert.equal(adventure.hitsSolid(s, .8), false, `${s.id} inside a solid`);
    assert.ok(s.y > groundHeight(s.x, s.z) + 2, `${s.id} below terrain`);
  }
  for (const t of TUNNELS) for (let i = 1; i < t.points.length; i++) {
    const [x, y, z] = t.points[i - 1], [xx, yy, zz] = t.points[i];
    assert.equal(adventure.pathBlocked({ x, y, z }, { x: xx, y: yy, z: zz }, 1), false, `${t.kind} branch ${i} blocked`);
    assert.ok(inTunnel({ x: (x + xx) / 2, y: (y + yy) / 2, z: (z + zz) / 2 }));
  }
  assert.ok(adventure.enemies.length >= 40); assert.ok(SUPPLIES.length >= 45); assert.equal(REGIONS.length, 8);
});
test('the final observatory story needs both the three fragments and the living heart', () => {
  const p = newProgress(), q = QUESTS.find(q => q.id === 'starfall')!;
  assert.equal(questKnown(p, q), false); interactSite(p, 'astronomer'); acceptQuest(p, q.id);
  p.collected.push('lens-west', 'lens-east', 'lens-summit'); assert.equal(questReady(p, q), false);
  p.relic = true; assert.ok(finishQuest(p, q.id, site('astronomer'))); assert.ok(p.completed.includes('starfall'));
});

test('acceptance follows a story and its clue advances past items found in any order', () => {
  const p = newProgress(), q = QUESTS.find(q => q.id === 'little-engine')!;
  p.collected.push('fan-blades'); interactSite(p, 'millwright'); acceptQuest(p, q.id);
  assert.equal(p.trackedQuest, q.id); assert.equal(nextQuestStep(p, q).id, 'fan-housing');
  assert.match(rumor(p).detail, /middle-floor granary/);
  p.collected.push('fan-housing'); assert.equal(nextQuestStep(p, q).id, 'fan-coil');
  assert.match(rumor(p).detail, /waterwheel/);
  p.collected.push('fan-coil'); assert.equal(nextQuestStep(p, q).id, 'millwright');
  assert.match(rumor(p).detail, /press E and turn in/);
  assert.equal(parseSave(serializeSave(p))!.progress.trackedQuest, q.id);
});

test('interaction signs distinguish new requests, pending deliveries and reward turn-ins', () => {
  const p = newProgress(); assert.equal(siteQuestStatus(p, 'keeper'), 'request');
  interactSite(p, 'postmaster'); acceptQuest(p, 'city-post');
  assert.equal(siteQuestStatus(p, 'market'), 'objective'); interactSite(p, 'market');
  assert.equal(siteQuestStatus(p, 'market'), 'visited');
  interactSite(p, 'warehouse'); interactSite(p, 'clocktower');
  assert.equal(siteQuestStatus(p, 'postmaster'), 'return');
  finishQuest(p, 'city-post', site('postmaster')); assert.notEqual(siteQuestStatus(p, 'postmaster'), 'return');
});

test('all story leads name a real region, and completion leaves no pending required steps', () => {
  for (const q of QUESTS) {
    const p = newProgress();
    for (const step of questSteps(p, q)) { assert.ok(REGIONS.some(r => r.id === step.region), `${q.id}/${step.id}`); assert.ok(step.hint.length > 30); }
    for (const goal of q.goals) {
      if (goal.kind === 'collect') p.collected.push(...goal.ids!);
      if (goal.kind === 'visit') p.discovered.push(...goal.ids!.map(id => 'site:' + id));
      if (goal.kind === 'defeat') p.defeated.push(...goal.ids!);
      if (goal.kind === 'regions') p.discovered.push(...REGIONS.map(r => r.id));
      if (goal.kind === 'relic') p.relic = true;
    }
    assert.ok(questReady(p, q)); assert.equal(nextQuestStep(p, q).id, q.giver);
    assert.ok(questSteps(p, q).every(s => s.done), q.id);
  }
});
