import { dock } from './landing.ts';
import { HARBORS } from './settlements.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newProgress, capacity, flightTuning, spendCharge, recharge, buyUpgrade, collect, enemyReward, serializeSave, parseSave, readSave, writeSave, SAVE_KEY } from './progression.ts';
test('the fan must be discovered, consumes a finite battery and can recharge', () => {
  const p = newProgress(); assert.equal(flightTuning(p).thrust, 0); assert.equal(spendCharge(p, 1), 0);
  collect(p, 'fan', { fan: true }); assert.equal(p.charge, 100); assert.ok(flightTuning(p).thrust > 0);
  assert.ok(spendCharge(p, 100) < 17); assert.equal(p.charge, 0); assert.equal(flightTuning(p).thrust, 0);
  recharge(p, 2); assert.equal(p.charge, 48); recharge(p, 100); assert.equal(p.charge, capacity(p));
});
test('upgrades charge real currency, change tuning and cap at three', () => {
  const p = newProgress(); assert.equal(buyUpgrade(p, 'speed'), false); dock(p,p.flight,HARBORS[0]); p.parts = 400; p.cores = 10; const base = flightTuning(p);
  assert.equal(buyUpgrade(p, 'speed'), true); assert.equal(p.parts, 380); assert.ok(flightTuning(p).drag < base.drag);
  assert.equal(buyUpgrade(p, 'turn'), true); assert.ok(flightTuning(p).turn > base.turn); assert.equal(buyUpgrade(p, 'glide'), true); assert.ok(flightTuning(p).sink < base.sink);
  assert.equal(buyUpgrade(p, 'motor'), false); collect(p, 'fan', { fan: true }); assert.equal(buyUpgrade(p, 'battery'), true); assert.equal(capacity(p), 160);
  assert.equal(buyUpgrade(p, 'speed'), false); p.blueprints.push('speed'); assert.equal(buyUpgrade(p, 'speed'), true); assert.equal(buyUpgrade(p, 'speed'), true); const parts = p.parts; assert.equal(buyUpgrade(p, 'speed'), false); assert.equal(p.parts, parts);
});
test('pickups cannot be collected twice; maxed duplicate upgrades become scrap', () => {
  const p = newProgress(); assert.ok(collect(p, 'chest', { parts: 12, ammo: 8 })); assert.equal(collect(p, 'chest', { parts: 12 }), null); assert.equal(p.parts, 12);
  p.upgrades.glide = 3; collect(p, 'plans', { upgrade: 'glide' }); assert.equal(p.upgrades.glide, 3); assert.equal(p.parts, 24);
  assert.equal(enemyReward(4, 2).upgrade, undefined); assert.ok(enemyReward(2, 3).cores); assert.ok(enemyReward(0, 1).ammo);
});
test('save round-trip preserves the full adventure and uncollected enemy loot', () => {
  const p = newProgress(); p.parts = 37; p.fan = true; p.charge = 56; p.upgrades.glide = 2; p.collected = ['fan']; p.defeated = ['guardian-0']; p.discovered.push('cavern'); p.checkpoint = 'cave'; p.flight.pitch = 7.3; p.flight.z = -550; p.drops = [{ id: 'loot-guardian-0', x: 1, y: 2, z: 3, reward: { parts: 7, ammo: 4 } }];
  assert.deepEqual(parseSave(serializeSave(p))?.progress, p);
});
test('malformed, future, negative, overcharged and truncated saves are rejected', () => {
  assert.equal(parseSave('{broken'), null); assert.equal(parseSave('{"version":2}'), null); const p = newProgress(); p.parts = -1; assert.equal(parseSave(serializeSave(p)), null); p.parts = 1; p.charge = 280; assert.equal(parseSave(serializeSave(p)), null);
  p.charge = 0; const save = JSON.parse(serializeSave(p)); delete save.progress.flight; assert.equal(parseSave(JSON.stringify(save)), null);
});
test('import sanitizes unknown flight properties', () => {
  const save = JSON.parse(serializeSave(newProgress())); save.progress.flight.extra = 'ignored'; Object.defineProperty(save.progress.flight, '__proto__', { value: { poisoned: true }, enumerable: true }); const loaded = parseSave(JSON.stringify(save));
  assert.ok(loaded); assert.equal(Object.hasOwn(loaded.progress.flight, '__proto__'), false); assert.equal(Object.hasOwn(loaded.progress.flight, 'extra'), false);
});
test('corrupted current saves recover from backup; unavailable storage fails safely', () => {
  const values = new Map<string, string>(); const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
  const p = newProgress(); assert.equal(writeSave(storage, p), true); p.parts = 17; assert.equal(writeSave(storage, p), true); assert.equal(readSave(storage).save?.progress.parts, 17);
  values.set(SAVE_KEY, '{oops'); const recovery = readSave(storage); assert.equal(recovery.recovered, true); assert.equal(recovery.save?.progress.parts, 0);
  const denied = { getItem: () => { throw Error('Denied'); }, setItem: () => { throw Error('Quota'); } }; assert.equal(writeSave(denied, p), false); assert.equal(readSave(denied).save, null);
});
