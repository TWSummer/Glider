import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newProgress, buyUpgrade, flightTuning, serializeSave, parseSave } from './progression.ts';
import { HARBORS, ROADS, findHarbor, roadDistance, roadWidthAt } from './settlements.ts';
import { dock, depart, canLand, takeoffFlight } from './landing.ts';
import { cargoUsed, cargoCapacity, trade, quote, service, takeContract, deliverContract, marketStock } from './commerce.ts';
import { revealNearby, isCharted, knownRegions } from './exploration.ts';
import { BOSSES, bandDamage, receivedDamage, bossVulnerable, lootUnlocked } from './combat.ts';
import { World, groundHeight } from './world.ts';
import { Adventure } from './adventure.ts';
import { initialFlight, stepFlight } from './flight.ts';
import { BUILDINGS, nearBuilding, nearTunnel } from './architecture-data.ts';
import { interactSite, acceptQuest } from './quests.ts';
import * as THREE from 'three';
import { meters,worldUnits,metricDistance } from './units.ts';

const world = new World(), adventure = new Adventure(world.scene, world.plane);
test('every landing bay has a clear approach, safe floor and unobstructed takeoff', () => {
  for (const h of HARBORS) {
    const state = {...initialFlight(), ...h.launch, z:h.z+60, speed:27};
    assert.equal(adventure.hitsSolid(h,1.2),false,h.id+' bay');
    assert.ok(h.y>groundHeight(h.x,h.z)+2,h.id+' ground');
    assert.ok(canLand(state,h,(a,b)=>!adventure.pathBlocked(a,b,1.2)),h.id+' approach');
    assert.equal(adventure.hitsSolid(h.launch,1.2),false,h.id+' launch');
    assert.equal(world.hitsObstacle(h.launch.x,h.launch.y,h.launch.z),false,h.id+' tree');
    const p=newProgress();dock(p,state,h);assert.equal(p.flight.speed,0);assert.equal(p.dockedHub,h.id);
    const takeoff=depart(p,state);assert.ok(takeoff);assert.equal(p.dockedHub,null);
    assert.equal(state.speed,0,'departure starts on the table');
    const end=takeoffFlight(takeoff,takeoff.duration);assert.ok(end.speed>20);assert.equal(end.heading,Math.PI,'handoff keeps the launch direction');
    assert.ok(takeoff.duration<6,h.id+' short launch');
  }
});
test('animated takeoffs clear walls, trees and terrain with wing clearance at every harbor',()=>{
  for (const h of HARBORS) {
    const p=newProgress();dock(p,p.flight,h);const t=depart(p,p.flight)!;
    let previous=takeoffFlight(t,0);
    assert.deepEqual(previous,{...t.parked},h.id+' starts parked');
    for(let seconds=.05;seconds<=t.duration+.05;seconds+=.05) {
      const at=takeoffFlight(t,seconds);
      assert.ok(Math.abs(at.x-h.x)<1e-8,h.id+' no automatic turn after climbing');
      assert.equal(at.roll,0,h.id+' no automatic banking');
      assert.ok(Math.hypot(at.x-previous.x,at.y-previous.y,at.z-previous.z)<1.7,h.id+' continuous speed');
      for(const wing of [-6,0,6]) {
        const point={x:at.x+Math.cos(at.heading)*wing,y:at.y,z:at.z+Math.sin(at.heading)*wing};
        assert.ok(point.y>groundHeight(point.x,point.z)+1.2,`${h.id} terrain at ${seconds.toFixed(2)}`);
        assert.equal(adventure.hitsSolid(point,1.2),false,`${h.id} geometry at ${seconds.toFixed(2)} (${point.x.toFixed(1)},${point.y.toFixed(1)},${point.z.toFixed(1)})`);
        assert.equal(world.hitsObstacle(point.x,point.y,point.z),false,h.id+' trees');
      }
      previous=at;
    }
    // The handoff also leaves enough room for a few seconds of unsteered flight.
    const end=takeoffFlight(t,t.duration);
    for(let i=0;i<180;i++) {stepFlight(end,{left:false,right:false,up:false,down:false,boost:false},1/60);assert.equal(adventure.hitsSolid(end,6),false,h.id+' handoff');assert.ok(end.y>groundHeight(end.x,end.z)+3,h.id+' handoff ground');}
  }
});
test('landing refuses excessive speed and walls; airbraking slows an approach',()=>{
  const h=HARBORS[0],s={...initialFlight(),x:h.x,y:h.y+20,z:h.z+55,speed:50};
  assert.equal(canLand(s,h,()=>true),false);s.speed=28;assert.equal(canLand(s,h,()=>false),false);
  const before=s.speed;for(let i=0;i<60;i++)stepFlight(s,{left:false,right:false,up:false,down:false,boost:false,brake:true},1/60);
  assert.ok(before-s.speed>5);
});
test('upgrades and services require the correct physical landing location',()=>{
  const p=newProgress();p.parts=500;p.cores=10;p.fan=true;p.health=25;
  assert.equal(buyUpgrade(p,'bands'),false);assert.equal(service(p,'repair'),false);
  dock(p,p.flight,findHarbor('post')!);assert.equal(buyUpgrade(p,'bands'),false);assert.ok(service(p,'repair'));
  dock(p,p.flight,HARBORS[0]);assert.ok(buyUpgrade(p,'bands'));assert.equal(bandDamage(p),2);
  assert.ok(buyUpgrade(p,'hull'));assert.ok(receivedDamage(p,30)<25);
  dock(p,p.flight,findHarbor('temple')!);p.charge=0;assert.equal(service(p,'charge'),false);
  dock(p,p.flight,findHarbor('mill')!);assert.ok(service(p,'charge'));assert.equal(p.charge,100);
});
test('trade consumes currency and space, has no same-market profit and rewards transport',()=>{
  const p=newProgress();p.parts=100;assert.equal(trade(p,'tea','buy'),false);dock(p,p.flight,HARBORS[0]);
  const start=p.parts;assert.ok(trade(p,'tea','buy'));assert.ok(trade(p,'tea','sell'));assert.ok(p.parts<start);
  for(let i=0;i<4;i++)assert.ok(trade(p,'tea','buy'));assert.equal(cargoUsed(p),4);assert.equal(trade(p,'tea','buy'),false);
  assert.equal(trade(p,'copper','sell'),false);
  const bought=quote('house','tea').buy,prior=p.parts;dock(p,p.flight,findHarbor('market')!);assert.ok(trade(p,'tea','sell'));assert.ok(p.parts-prior>bought);
  p.marketStock['market:paper']=0;assert.equal(trade(p,'paper','buy'),false);assert.equal(marketStock(p,'market','paper'),0);
});
test('freight shares capacity, survives saves and only pays once at the destination',()=>{
  const p=newProgress();dock(p,p.flight,HARBORS[0]);assert.ok(takeContract(p,'tea-for-rowan'));assert.equal(cargoUsed(p),2);
  assert.equal(takeContract(p,'tea-for-rowan'),false);assert.equal(deliverContract(p),null);
  const loaded=parseSave(serializeSave(p))!.progress;dock(loaded,loaded.flight,findHarbor('mill')!);assert.ok(deliverContract(loaded));assert.equal(loaded.parts,18);assert.equal(deliverContract(loaded),null);
  dock(loaded,loaded.flight,HARBORS[0]);assert.equal(takeContract(loaded,'tea-for-rowan'),false);
  p.parts=500;p.cores=10;assert.ok(buyUpgrade(p,'cargo'));assert.equal(cargoCapacity(p),7);
  const bare=newProgress();assert.ok(flightTuning(p).sink>flightTuning(bare).sink);
});
test('charting persists locally while rumors reveal markers without revealing terrain',()=>{
  const p=newProgress();assert.equal(knownRegions(p).has('observatory'),false);revealNearby(p,p.flight);
  assert.ok(isCharted(p,p.flight.x,p.flight.z));assert.equal(isCharted(p,-250,-3250),false);
  const count=p.charted.length;revealNearby(p,p.flight);assert.equal(p.charted.length,count);
  interactSite(p,'keeper');acceptQuest(p,'valley-survey');assert.ok(knownRegions(p).has('observatory'));assert.equal(isCharted(p,-250,-3250),false);
  revealNearby(p,{x:-250,y:330,z:-3250});assert.ok(isCharted(p,-250,-3250));assert.deepEqual(parseSave(serializeSave(p))!.progress.charted,p.charted);
});
test('invalid cargo, market and exploration data is rejected',()=>{
  for(const patch of [{cargo:{tea:-1}}, {marketStock:{'house:tea':-3}}, {freight:'not-a-job'}, {charted:['bad']}, {dockedHub:'no-such-place'}]) {
    const raw=JSON.parse(serializeSave(newProgress()));Object.assign(raw.progress,patch);assert.equal(parseSave(JSON.stringify(raw)),null);
  }
});
test('bosses have clear arenas, meaningful upgrade scaling and cooling windows',()=>{
  for(const boss of BOSSES) {assert.equal(adventure.hitsSolid(boss,7),false,boss.id);assert.ok(boss.hp>=26);}
  assert.equal(bossVulnerable(1),false);assert.equal(bossVulnerable(2.5),false);assert.equal(bossVulnerable(5),true);
  const p=newProgress();assert.equal(lootUnlocked(p,'sigil-copper'),false);p.defeated.push('boss-copper');assert.ok(lootUnlocked(p,'sigil-copper'));
  const base=bandDamage(p);p.upgrades.bands=3;assert.equal(bandDamage(p),base*4);
});
test('boss shields reject shots, cooling cores take upgraded damage, and defeat persists',()=>{
  const p=newProgress();adventure.sync(p);const e=adventure.enemies.find(e=>e.id==='boss-heart')!;
  const state={...initialFlight(),x:e.home.x,y:e.home.y,z:e.home.z+45};
  const shoot=(clock:number, damage:number)=>{
    e.clock=clock;
    const origin=e.mesh.position.clone().add(new THREE.Vector3(0,0,14));
    adventure.spawnShot(origin,new THREE.Vector3(0,0,-120),false,damage);
    adventure.update(1/60,0,state,p,true,()=>{},()=>{});
  };
  adventure.update(1/60,0,state,p,true,()=>{},()=>{});
  shoot(.5,4);assert.equal(e.hp,e.maxHp,'shield should block damage');
  shoot(4,4);assert.equal(e.hp,e.maxHp-4,'cooling core should take damage');
  for(let i=0;i<20&&e.mesh.visible;i++)shoot(4,4);
  assert.equal(e.mesh.visible,false);assert.ok(p.defeated.includes(e.id));assert.ok(p.drops.some(d=>d.id==='loot-'+e.id));
  const loaded=parseSave(serializeSave(p))!.progress;adventure.sync(loaded);assert.equal(e.mesh.visible,false);
});
test('all buildings have approach roads and mature trees avoid inhabited clearances',()=>{
  for(const b of BUILDINGS) assert.ok(ROADS.some(r=>r.id==='approach-'+b.id));
  const trees=adventure.valley.settlements.forest;assert.ok(trees.length>100);
  for(const t of trees) {assert.ok(t.h>=65);assert.equal(nearBuilding(t.x,t.z,95),false);assert.equal(nearTunnel(t.x,t.z,40),false);assert.ok(roadDistance(t.x,t.z)>=48);}
});
test('road centerlines and shoulders never cut through building footprints',()=>{
  for(const r of ROADS) for(let i=1;i<r.points.length;i++) {
    const a=r.points[i-1],b=r.points[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/10);
    for(let k=0;k<=n;k++) {const x=a[0]+(b[0]-a[0])*k/n,z=a[1]+(b[1]-a[1])*k/n;
      const width=roadWidthAt(r,x,z);
      for(const building of BUILDINGS) assert.ok(Math.abs(x-building.x)>=building.width/2+width/2+4 || Math.abs(z-building.z)>=building.depth/2+width/2+4,`${r.id} crosses ${building.id}`);
    }
  }
});
test('forecourts are level and outdoor furniture has support at every corner',()=>{
  for(const b of BUILDINGS) for(const dx of [-.4,0,.4]) for(const dz of [12,36,58]) {
    assert.ok(Math.abs(groundHeight(b.x+b.width*dx,b.z+b.depth/2+dz,false)-(b.ground-4))<.1,b.id+' level court');
  }
  const props=adventure.valley.settlements.groundProps;
  assert.ok(props.filter(p=>p.kind==='bench').length>=25,'seating retained around the valley');
  for(const p of props) for(const sx of [-1,1]) for(const sz of [-1,1]) {
    const ground=groundHeight(p.x+sx*p.width/2,p.z+sz*p.depth/2,false);
    assert.ok(Math.abs(ground-p.y)<1.2,p.kind+' has level support');
  }
});
test('streets and instruments share a scale appropriate to a paper glider',()=>{
  assert.equal(meters(70),3.5);assert.equal(meters(32),1.6);
  assert.equal(worldUnits(5),100);assert.equal(metricDistance(1000),'50 m');
  assert.equal(metricDistance(20000),'1.00 km');
  const road=ROADS.find(r=>r.id==='city-post')!;
  assert.ok(meters(road.width)>=4,'avenue includes road and pavements');
  assert.ok(meters(roadWidthAt(road,1240,-1120))>=3.5,'open streets retain their width');
});
