import { meters, metricDistance } from './units';
import { HARBORS, findHarbor, type Harbor } from './settlements';
import { dockedHarbor, trade, takeContract, deliverContract, service, type Good } from './commerce';
import { equipmentPage, harborPage, cargoPage } from './harbor-ui';
import { landingCandidate, canLand, dock, depart, takeoffFlight, type Takeoff } from './landing';
import { revealNearby } from './exploration';
import { drawLocalMap } from './minimap';
import { receivedDamage, bossPhase, BOSSES } from './combat';
import * as THREE from 'three';
import './style.css';
import './adventure.css';
import './valley.css';
import './game-map.css';
import './harbor.css';
import { bindAtlas } from './game-map';
import { atlasPage, questPage, questCard } from './journal';
import { REGIONS, SITES, LAND, regionAt, applyAir, airAt, valleyFloor } from './atlas';
import { QUESTS, questKnown, acceptQuest, finishQuest, interactSite, rumor, nextQuestStep } from './quests';
import { icon } from './icons';
import { buildingAt } from './architecture-data';
import { World, groundHeight, islands } from './world';
import { initialFlight, stepFlight, forwardVector, angleDifference, type Point3, type FlightInput } from './flight';
import { Adventure, PLACES, STATIONS, LIFTS, liftAt, placeAt, difficultyAt } from './adventure';
import { newProgress, capacity, flightTuning, spendCharge, UPGRADE_INFO, upgradeCost, upgradeProblem, buyUpgrade, readSave, writeSave, serializeSave, parseSave, type Progress, type SaveFile, type Upgrade } from './progression';

const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
// Separate development entry exercises the real UI without ever touching player saves.
const playtest = import.meta.env.DEV && location.pathname === `${import.meta.env.BASE_URL}playtest.html`;
const testStorage = new Map<string, string>();
const storage = playtest ? { getItem: (key: string) => testStorage.get(key) ?? null, setItem: (key: string, value: string) => { testStorage.set(key, value); } } : { getItem: (key: string) => localStorage.getItem(key), setItem: (key: string, value: string) => localStorage.setItem(key, value) };
document.getElementById('app')!.innerHTML = `
<main class="experience" id="experience">
  <div id="scene" aria-label="3D paper-plane adventure world"></div><div class="vignette"></div><div class="grain"></div>
  <header class="topbar"><a class="brand" href="#" aria-label="Glider home">${icon('plane')}<span>glider<span class="brand-dot">.</span></span></a><div class="world-label"><span class="live-dot"></span> LITTLE WINGS. UNTOLD STORIES.</div>
    <nav class="toolbar" aria-label="Game controls"><button class="icon-button" id="sound" aria-label="Turn sound on" title="Sound (M)">${icon('mute')}</button><button class="icon-button" id="fullscreen" aria-label="Enter fullscreen" title="Fullscreen (F)">${icon('expand')}</button><span class="toolbar-divider"></span><button class="icon-button" id="journal" aria-label="Atlas map and field journal" title="Atlas & journal (J) · Equipment (U)">${icon('compass')}</button><button class="icon-button" id="settings" aria-label="Flight settings">${icon('settings')}</button><button class="icon-button flight-only" id="pause" aria-label="Pause flight" title="Pause (Space)">${icon('pause')}</button></nav>
  </header>
  <div class="location-tag menu-only">${icon('mountain')}<div><span>THE WILLOWMERE VALLEY</span><strong>One valley. A thousand little stories.</strong></div></div>
  <section class="welcome menu-only"><div class="intro"><div class="eyebrow"><span></span> A PAPER-PLANE ADVENTURE</div><h1>Small wings.<br>Untold stories.</h1><p>Across rooftops. Beneath mountains.<br>A whole valley, waiting in the wind.</p><div class="inspired">Explore · discover · make a little progress.</div></div>
    <div class="launch-card"><div class="card-top"><span>THE WORLD BEYOND</span><span>8 REGIONS</span></div><h2>Your story takes flight.</h2><p>Take the quiet road. Follow a rumor.<br>Find your own way through Willowmere.</p><button class="launch-button" id="launch"><span>Begin your adventure</span>${icon('arrow')}</button><div class="launch-hint" id="save-summary">Autosaves as you explore · stored in this browser</div><button class="text-button" id="new-game" hidden>Start a new adventure</button></div>
  </section>
  <div class="flight-hud flight-only">
    <div class="flight-location"><span class="eyebrow" id="region-tier">REGION I · GENTLE AIR</span><h2 id="region-name">Hearthside Lake</h2><span id="flight-mode-label">ADVENTURE</span></div>
    <div class="compass-strip"><span>W</span><i></i><span class="compass-heading" id="heading">N 000°</span><i></i><span>E</span><b>▾</b></div>
    <div class="objective"><span class="objective-icon">${icon('compass')}</span><div><span id="objective-label">FOLLOW YOUR CURIOSITY</span><strong id="objective-title">A valley of possibilities</strong><small id="objective-detail">Explore at your own pace · J opens your journal</small></div></div>
    <button class="interact-prompt" id="interact" hidden><kbd>E</kbd><span id="interact-name">Read field notes</span></button><div class="flight-condition" id="flight-condition"></div><div class="aim" aria-hidden="true"><i></i><i></i></div>
    <button id="land" class="landing-prompt" hidden><kbd>L</kbd><span id="land-name">Land</span></button><div id="boss-hud" class="boss-hud" hidden><strong id="boss-name"></strong><small id="boss-phase"></small><i><em id="boss-health"></em></i></div>
    <div class="telemetry"><div class="telemetry-item"><span>AIRSPEED</span><strong id="speed">1.4<small>m/s</small></strong><div class="energy-meter"><i id="energy-fill"></i></div><span id="speed-status">GLIDING</span></div><div class="telemetry-item"><span>ALTITUDE</span><strong id="altitude">4.3<small>m</small></strong><span class="above-water" id="lift-status">LOSING HEIGHT · FIND RISING AIR</span></div></div>
    <div class="flight-inventory"><div><span>HULL</span><b id="health">100%</b><i><em id="health-fill"></em></i></div><div><span id="battery-label">FAN · UNDISCOVERED</span><b id="battery">—</b><i><em id="battery-fill"></em></i></div><div class="pocket-items"><span>◎ <b id="ammo">16</b> bands</span><span>◇ <b id="parts">0</b> scrap</span><span>✧ <b id="cores">0</b> cores</span></div></div>
    <div class="navigation"><div class="map-title"><span>${icon('compass')} LOCAL FIELD CHART</span><span>N ↑</span></div><canvas id="minimap" width="520" height="380" aria-label="Local map of nearby terrain and discovered landmarks"></canvas><div class="map-footer"><span class="live-dot"></span><span id="distance">0 m explored</span><span id="save-indicator">AUTOSAVE ON</span></div></div><div class="target-hint" id="target-hint"></div>
  </div>
  <div class="toast" id="toast" role="status" aria-live="polite"></div><div class="damage-flash" id="damage-flash"></div>
  <footer class="bottom-bar"><div class="control-hints"><span class="control-group"><span class="key">←</span><span class="key">→</span><span>Steer</span></span><span class="control-group"><span class="key">↑</span><span class="key">↓</span><span>Pitch / loop</span></span><span class="control-group optional-control"><span class="key wide">shift</span><span>Fan</span></span><span class="control-group"><span class="key">X</span><span>Shoot</span></span><span class="control-group optional-control"><span class="key">L</span><span>Land</span></span><span class="control-group optional-control"><span class="key">B</span><span>Brake</span></span></div><button class="how-to" id="atlas-button">Atlas map <kbd>J</kbd></button><button class="how-to" id="help">How to fly ${icon('help')}</button><button class="how-to flight-only" id="save-button">Save ${icon('check')}</button></footer>
  <div class="touch-controls flight-only" aria-label="Touch flight controls"><button data-key="ArrowLeft" aria-label="Steer left">←</button><div><button data-key="ArrowUp" aria-label="Pitch up">↑</button><button data-key="ArrowDown" aria-label="Pitch down">↓</button></div><button data-key="ArrowRight" aria-label="Steer right">→</button><div><button data-key="x" aria-label="Shoot rubber band">X</button><button data-key="Shift" aria-label="Run electric fan">ϟ</button></div></div>
  <div class="dialog-backdrop" id="dialog-backdrop" hidden><section class="dialog" id="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><button class="dialog-close icon-button" id="dialog-close" aria-label="Close dialog">${icon('close')}</button><div id="dialog-content"></div></section></div>
  <input id="import-file" type="file" accept="application/json,.json" hidden>
  <div id="loading"><div class="loading-plane">${icon('plane')}</div><span>Opening a world of possibilities…</span></div>
</main>`;

type Mode = 'menu' | 'flying' | 'landing' | 'taking-off' | 'landed' | 'paused';
let mode: Mode = 'menu', previousMode: Mode = 'menu';
let takeoff: Takeoff | null = null;
let landing: { hub: Harbor; from: typeof state; elapsed: number } | null = null;
let progress = newProgress(), saved: SaveFile | null = null, started = false, storageErrorShown = false;
let soundEnabled = false, invertPitch = false, toastTime = 0, invulnerable = 0, rescueCooldown = 0, saveTimer = 0, lastFocus: HTMLElement | null = null;
let atlasCleanup: (() => void) | undefined;
let waypoint = 'none', lastStalled = false, fanEmptyWarned = false, journalTab = 'journey';
try { const loaded = readSave(storage); saved = loaded.save; invertPitch = storage.getItem('glider-invert') === 'true'; if (saved) { progress = saved.progress; } if (loaded.recovered) queueMicrotask(() => toast('Your previous save was recovered from its backup.', 6)); } catch { /* The game remains playable without browser storage. */ }
if (playtest) {
  const params = new URLSearchParams(location.search), site = SITES.find(s => s.id === params.get('site'));
  if (site) Object.assign(progress.flight, { x: site.x, y: site.y, z: site.z + 8, speed: 4 });
  const testHub = findHarbor(params.get('hub'));
  const testBoss = params.get('boss');
  if(testBoss) { const b=BOSSES.find(b=>b.id===testBoss); if(b) Object.assign(progress.flight,{x:b.x,y:b.y,z:b.z+95,speed:26}); }
  if (testHub) { Object.assign(progress.flight, testHub, {z:testHub.z+55,y:testHub.y+22,speed:24}); if (params.get('parked') === 'yes') dock(progress,progress.flight,testHub); }
  if (params.get('equipped') === 'yes') { progress.fan = true; progress.charge = 100; progress.parts = 250; progress.cores = 12; progress.ammo = 80; }
  if (params.get('ready') === 'fan') progress.collected.push('fan-housing', 'fan-coil', 'fan-blades');
  saved = parseSave(serializeSave(progress));
  document.querySelector('.world-label')!.textContent = 'PLAYTEST · PLAYER SAVES ARE UNTOUCHED';
}
revealNearby(progress, progress.flight);
const state = initialFlight(), keys = new Set<string>();
const input: FlightInput = { left: false, right: false, up: false, down: false, boost: false };
let renderer: THREE.WebGLRenderer, world: World, adventure: Adventure;
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, .35, 9000);
const position = new THREE.Vector3(), previousPosition = new THREE.Vector3(), cameraGoal = new THREE.Vector3(), lookGoal = new THREE.Vector3(), smoothLook = new THREE.Vector3();
let audioContext: AudioContext | null = null, windGain: GainNode | null = null;
const dist = (a: Point3, b: Point3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

function toast(message: string, seconds = 4) { el('toast').textContent = message; el('toast').classList.add('show'); toastTime = seconds; }
function setupAudio() {
  if (!audioContext) {
    audioContext = new AudioContext(); const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 3, audioContext.sampleRate), data = buffer.getChannelData(0); let brown = 0;
    for (let i = 0; i < data.length; i++) { brown = (brown + (Math.random() * 2 - 1) * .02) / 1.02; data[i] = brown * 3.5; }
    const source = audioContext.createBufferSource(); source.buffer = buffer; source.loop = true;
    const filter = audioContext.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 650; windGain = audioContext.createGain(); windGain.gain.value = 0;
    source.connect(filter); filter.connect(windGain); windGain.connect(audioContext.destination); source.start();
  } void audioContext.resume();
}
function chime(frequency = 660) {
  if (!soundEnabled || !audioContext) return; const now = audioContext.currentTime;
  [frequency, frequency * 1.25, frequency * 1.5].forEach((f, i) => { const osc = audioContext!.createOscillator(), gain = audioContext!.createGain(); osc.frequency.value = f; gain.gain.setValueAtTime(0, now + i * .08); gain.gain.linearRampToValueAtTime(.045, now + i * .08 + .02); gain.gain.exponentialRampToValueAtTime(.001, now + i * .08 + .5); osc.connect(gain); gain.connect(audioContext!.destination); osc.start(now + i * .08); osc.stop(now + i * .08 + .6); });
}
function toggleSound() { soundEnabled = !soundEnabled; if (soundEnabled) setupAudio(); el('sound').innerHTML = icon(soundEnabled ? 'sound' : 'mute'); el('sound').setAttribute('aria-label', soundEnabled ? 'Turn sound off' : 'Turn sound on'); }
function refreshMenu() {
  el('launch').innerHTML = `<span>${saved ? 'Continue your adventure' : 'Begin your adventure'}</span>${icon('arrow')}`;
  el('new-game').hidden = !saved;
  el('save-summary').textContent = saved ? `Saved ${new Date(saved.savedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · ${saved.progress.parts} scrap · ${saved.progress.fan ? 'fan equipped' : 'paper glider'}` : 'Autosaves as you explore · stored in this browser';
}
function refreshMode() { el('experience').classList.toggle('in-flight', mode !== 'menu'); el('experience').classList.toggle('is-paused', mode === 'paused'); el('experience').classList.toggle('is-landed', !!progress.dockedHub); }
function saveSnapshot(): Progress {
  // Interrupting a departure resumes safely on its landing table.
  if (takeoff) return {...progress, flight:{...takeoff.parked}, dockedHub:takeoff.hub.id};
  if (started) progress.flight = {...state};
  return progress;
}
function saveGame(notify = false): boolean {
  const snapshot = saveSnapshot();
  let success = false; try { success = writeSave(storage, snapshot); } catch { /* Storage unavailable. */ }
  if (success) { saved = parseSave(serializeSave(snapshot)); saveTimer = 0; el('save-indicator').textContent = 'SAVED JUST NOW'; if (notify) toast('Adventure saved in this browser. You can also export a backup.'); }
  else if (notify || !storageErrorShown) { storageErrorShown = true; toast('Browser storage is unavailable. Use Journal → Save → Export to keep your progress.', 9); }
  return success;
}
function snapCamera() {
  const f = forwardVector(state); position.set(state.x, state.y, state.z); camera.position.copy(position).add(new THREE.Vector3(-f.x * 25, 9 - f.y * 25, -f.z * 25)); smoothLook.copy(position).add(new THREE.Vector3(f.x * 30, f.y * 30, f.z * 30)); camera.up.set(0, 1, 0); camera.lookAt(smoothLook);
}
function launch(fresh = false) {
  closeDialog(false); takeoff = null; landing = null;
  if (fresh) { progress = newProgress(); waypoint = 'none'; } else if (saved) progress = parseSave(JSON.stringify(saved))!.progress;
  Object.assign(state, progress.flight); started = true; mode = dockedHarbor(progress) ? 'landed' : 'flying'; if (mode === 'flying') progress.dockedHub = null; revealNearby(progress,state); keys.clear(); invulnerable = 2; saveTimer = 0; lastStalled = false;
  adventure.sync(progress); refreshMode(); snapCamera();
  if (mode === 'landed') { showHarbor(); saveGame(); return; }
  if (state.y < groundHeight(state.x, state.z) + 3 || adventure.hitsSolid(state) || world.hitsObstacle(state.x, state.y, state.z)) rescue('Welcome back. Relaunching safely from your last camp.');
  else toast(progress.fan ? 'Welcome back. Land at a flight house with L to rest, repair or charge.' : 'Welcome to Willowmere. L lands at the marked flight house ahead. E reads local stories; J opens your chart.', 7);
  if (soundEnabled) setupAudio(); saveGame();
}
function rescue(message: string) {
  progress.dockedHub = null; landing = null; takeoff = null; mode = 'flying'; adventure.resetCombat(); refreshMode();
  const station = STATIONS.find(s => s.id === progress.checkpoint) ?? STATIONS[0];
  Object.assign(state, initialFlight(), { x: station.x, y: station.y, z: station.z + 14 });
  progress.health = 100; invulnerable = 3; rescueCooldown = .5; keys.clear(); previousPosition.set(state.x, state.y, state.z); snapCamera();
  toast(message + ' Your discoveries and parts are safe.', 6); saveGame();
}
function damage(amount: number) {
  if (invulnerable > 0 || mode !== 'flying') return;
  progress.health = Math.max(0, progress.health - receivedDamage(progress,amount)); invulnerable = 1.1; el('damage-flash').classList.add('show');
  if (progress.health <= 0) rescue('Your glider needs a new fold. Back at camp.');
}
function openDialog(content: string, wide = false) {
  atlasCleanup?.(); atlasCleanup = undefined;
  if (el('dialog-backdrop').hidden) { lastFocus = document.activeElement as HTMLElement; previousMode = mode; }
  if (mode === 'flying' || mode === 'taking-off') { mode = 'paused'; keys.clear(); }
  el('dialog').classList.remove('atlas-dialog');
  el('dialog').classList.toggle('wide-dialog', wide); el('dialog-content').innerHTML = content; el('dialog-backdrop').hidden = false; refreshMode(); el('dialog-close').focus();
}
function closeDialog(resume = true) { atlasCleanup?.(); atlasCleanup = undefined; el('dialog-backdrop').hidden = true; if (resume && mode === 'paused') mode = previousMode; keys.clear(); refreshMode(); lastFocus?.focus(); }
function goHome() { if (started) saveGame(); closeDialog(false); takeoff = null; mode = 'menu'; started = false; Object.assign(state, initialFlight()); snapCamera(); refreshMode(); refreshMenu(); el('toast').classList.remove('show'); el('toast').textContent = ''; }
function pauseFlight() {
  if (mode === 'paused') { closeDialog(); return; } if (mode === 'landed') { showHarbor(); return; } if (mode !== 'flying' && mode !== 'taking-off') return;
  openDialog(`<div class="dialog-emblem">${icon('wind')}</div><div class="eyebrow">A MOMENT BETWEEN ADVENTURES</div><h2 id="dialog-title">The sky can wait.</h2><p>Your progress autosaves every 15 seconds and whenever you make a discovery.</p><button class="launch-button" id="resume-flight"><span>Keep flying</span>${icon('arrow')}</button><button class="secondary-button" id="pause-journal">Field journal & upgrades</button><button class="secondary-button" id="pause-save">Save adventure now</button><button class="text-button" id="return-home">Save & return to the lake</button>`);
  el('resume-flight').onclick = () => closeDialog(); el('pause-journal').onclick = () => showJournal(); el('pause-save').onclick = () => saveGame(true); el('return-home').onclick = goHome;
}
function confirmNewGame() { openDialog(`<div class="eyebrow">A FRESH SHEET OF PAPER</div><h2 id="dialog-title">Begin again?</h2><p>This replaces your current local adventure. Export a backup from the journal first if you want to keep it.</p><button class="launch-button" id="confirm-new"><span>Start a new adventure</span>${icon('plane')}</button><button class="secondary-button" id="cancel-new">Keep my adventure</button>`); el('confirm-new').onclick = () => { saved = null; launch(true); }; el('cancel-new').onclick = () => closeDialog(); }
function showHelp() {
  openDialog(`<div class="dialog-emblem">${icon('plane')}</div><div class="eyebrow">A LITTLE FLIGHT SCHOOL</div><h2 id="dialog-title">Trade height for speed.</h2><p>Dive to gather energy. Pull up to spend it. Hold up through a full circle for a loop; enter fast, with room beneath you. A slow, steep climb stalls the glider—the nose will drop to recover.</p><div class="help-list"><div><span><kbd>←</kbd> <kbd>→</kbd></span><span>Steer and bank</span></div><div><span><kbd>↑</kbd> <kbd>↓</kbd></span><span>Pitch continuously · hold for loops</span></div><div><kbd>Shift</kbd><span>Run your discovered fan · uses charge</span></div><div><kbd>X</kbd><span>Fire rubber bands · hold to repeat</span></div><div><kbd>U / J</kbd><span>Field journal, quests and atlas</span></div><div><kbd>E</kbd><span>Read signs, speak to locals, use mechanisms</span></div><div><kbd>L / B</kbd><span>Land at a flight house / hold airbrake</span></div><div><kbd>K</kbd><span>Save your adventure</span></div><div><kbd>Space</kbd><span>Pause / resume</span></div><div><kbd>Backspace</kbd><span>Rescue to last camp · keeps your loot</span></div></div><div class="help-note">${icon('wind')} You always lose a little height. Gold air columns and floor grates provide lift. Land at H-marked flight houses with L. B slows the plane on approach. Repair, charge, fit equipment and trade while safely parked. Green beacons mark emergency relaunch camps. Fly through physical loot to collect it. Signs marked E are interactions: ! means a new request, ? means ready to turn in, and ✓ means already read. Enemies have red eyes.</div><button class="launch-button" id="help-done"><span>Got it. Let’s explore.</span>${icon('check')}</button>`);
  el('help-done').onclick = () => closeDialog();
}
function showSettings() {
  openDialog(`<div class="dialog-emblem">${icon('settings')}</div><div class="eyebrow">YOUR KIND OF FLIGHT</div><h2 id="dialog-title">Make yourself at home.</h2><div class="settings-list"><label><span>Ambient sound<small>Wind and discovery chimes</small></span><input id="setting-sound" type="checkbox" ${soundEnabled ? 'checked' : ''}><span class="switch"></span></label><label><span>Invert pitch<small>Up arrow points the nose down</small></span><input id="setting-invert" type="checkbox" ${invertPitch ? 'checked' : ''}><span class="switch"></span></label><label><span>Graphics<small>Performance disables shadows</small></span><select id="setting-quality" aria-label="Graphics quality"><option value="high">High</option><option value="low">Performance</option></select></label></div><button class="launch-button" id="settings-done"><span>All set</span>${icon('check')}</button>`);
  el<HTMLInputElement>('setting-sound').onchange = toggleSound;
  el<HTMLInputElement>('setting-invert').onchange = e => { invertPitch = (e.target as HTMLInputElement).checked; try { storage.setItem('glider-invert', String(invertPitch)); } catch { /* Optional preference. */ } };
  el<HTMLSelectElement>('setting-quality').value = renderer.shadowMap.enabled ? 'high' : 'low';
  el<HTMLSelectElement>('setting-quality').onchange = e => { const high = (e.target as HTMLSelectElement).value === 'high'; renderer.setPixelRatio(Math.min(devicePixelRatio, high ? 1.5 : 1)); renderer.shadowMap.enabled = high; world.scene.traverse(object => { if (object instanceof THREE.Mesh) (Array.isArray(object.material) ? object.material : [object.material]).forEach(mat => mat.needsUpdate = true); }); };
  el('settings-done').onclick = () => closeDialog();
}

function showJournal(tabName = journalTab) {
  currentSite = null; journalTab = tabName;
  let body = '';
  if (tabName === 'quests') body = questPage(progress);
  else if (tabName === 'upgrades') body = equipmentPage(progress);
  else if (tabName === 'cargo') body = cargoPage(progress);
  else if (tabName === 'save') body = `<div class="save-panel"><div class="save-stamp">${saved ? `Last saved ${new Date(saved.savedAt).toLocaleString()}` : 'No adventure saved yet'}</div><p>Your glider, position, inventory, discoveries, defeated enemies, uncollected loot, and upgrades stay with you. Saves are local to this browser and this site address.</p><button class="launch-button" id="journal-save"><span>Save now</span>${icon('check')}</button><div class="save-actions"><button class="secondary-button" id="export-save">Export backup (.json)</button><button class="secondary-button" id="import-save">Import backup</button></div><p class="journal-note">A previous-save backup is kept automatically. Export a file to move your adventure to another browser or device. Importing replaces the current local adventure.</p><div id="save-result" role="status"></div></div>`;
  else body = atlasPage(progress, started ? state : progress.flight, waypoint);
  openDialog(`<div class="eyebrow">NOT ALL WHO WANDER ARE LOST</div><h2 id="dialog-title">Your field journal.</h2><div class="journal-tabs" role="group" aria-label="Journal section"><button data-tab="journey" class="${tabName === 'journey' ? 'active' : ''}">Atlas</button><button data-tab="quests" class="${tabName === 'quests' ? 'active' : ''}">Quests</button><button data-tab="upgrades" class="${tabName === 'upgrades' ? 'active' : ''}">Equipment</button><button data-tab="cargo" class="${tabName === 'cargo' ? 'active' : ''}">Cargo</button><button data-tab="save" class="${tabName === 'save' ? 'active' : ''}">Save & backup</button></div>${body}${mode === 'landed' ? '<button class="secondary-button" id="journal-back-harbor">← Back to landing services</button>' : ''}`, true);
  if (mode === 'landed') el('journal-back-harbor').onclick = () => showHarbor();
  document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(button => button.onclick = () => showJournal(button.dataset.tab));
  document.querySelectorAll<HTMLButtonElement>('[data-upgrade]').forEach(button => button.onclick = () => { if (buyUpgrade(progress, button.dataset.upgrade as Upgrade)) { saveGame(); chime(); showJournal('upgrades'); toast('Upgrade installed. Your next flight will feel the difference.'); } });
  document.querySelectorAll<HTMLButtonElement>('[data-track]').forEach(button => button.onclick = () => { waypoint = button.dataset.track!; closeDialog(); toast(waypoint === 'none' ? 'Compass pin cleared. Explore freely.' : 'Region pinned. Choose your own route.'); });
  if (tabName === 'journey') { el('dialog').classList.add('atlas-dialog'); atlasCleanup = bindAtlas(el('dialog-content'), started ? state : progress.flight); }
  bindQuestButtons(); bindHarborPins();
  if (tabName === 'save') {
    el('journal-save').onclick = () => { const ok = saveGame(); el('save-result').textContent = ok ? 'Saved successfully in this browser.' : 'Storage unavailable. Export a backup instead.'; };
    el('export-save').onclick = exportSave; el('import-save').onclick = () => el<HTMLInputElement>('import-file').click();
  }
}
function bindHarborPins() {
  document.querySelectorAll<HTMLButtonElement>('[data-harbor-pin]').forEach(b=>b.onclick=()=>{waypoint='harbor:'+b.dataset.harborPin;closeDialog();});
}
function landAtHarbor() {
  if (mode==='landed') {showHarbor();return;}
  if(mode!=='flying') return;
  const hub=landingCandidate(state);
  if(!hub) {toast('Look for an H-marked landing bay inside a flight house. Approach the front entrance, then press L.',6);return;}
  if(!canLand(state,hub,(a,b)=>!adventure.pathBlocked(a,b,1.2))) {toast(state.speed>38 ? 'Too fast to land. Hold B to slow below 1.9 m/s.' : 'Approach the bay through its open entrance, below the ceiling.',5);return;}
  landing={hub,from:{...state},elapsed:0};mode='landing';keys.clear();adventure.resetCombat();refreshMode();toast('Settling onto the landing table…',2);
}
function showHarbor(tab='rest') {
  const hub=dockedHarbor(progress); if(!hub) return;
  openDialog(harborPage(progress,hub,tab),true);
  document.querySelectorAll<HTMLButtonElement>('[data-harbor-tab]').forEach(b=>b.onclick=()=>showHarbor(b.dataset.harborTab));
  document.querySelectorAll<HTMLButtonElement>('[data-service]').forEach(b=>b.onclick=()=>{if(service(progress,b.dataset.service as 'repair'|'charge'|'ammo')){saveGame();showHarbor(tab);toast('Service complete. Ready when you are.');}});
  document.querySelectorAll<HTMLButtonElement>('[data-buy],[data-sell]').forEach(b=>b.onclick=()=>{if(trade(progress,(b.dataset.buy??b.dataset.sell) as Good,b.dataset.buy?'buy':'sell')){saveGame();showHarbor(tab);}});
  document.querySelectorAll<HTMLButtonElement>('[data-contract]').forEach(b=>b.onclick=()=>{if(takeContract(progress,b.dataset.contract!)){saveGame();showHarbor(tab);toast('Loaded aboard. Your journal has the destination and delivery details.',6);}});
  document.querySelectorAll<HTMLButtonElement>('[data-upgrade]').forEach(b=>b.onclick=()=>{if(buyUpgrade(progress,b.dataset.upgrade as Upgrade)){saveGame();showHarbor(tab);chime();}});
  bindHarborPins();
  el('harbor-atlas').onclick = () => showJournal('journey');
  el('depart-harbor').onclick=()=>{takeoff=depart(progress,state);if(!takeoff)return;closeDialog(false);mode='taking-off';invulnerable=0;keys.clear();adventure.resetCombat();refreshMode();saveGame();toast('Taking off · controls return at the top of the climb',3);};
}
el('land').onclick=landAtHarbor;
function exportSave() {
  const blob = new Blob([serializeSave(saveSnapshot())], { type: 'application/json' }), url = URL.createObjectURL(blob), anchor = document.createElement('a'); anchor.href = url; anchor.download = `glider-adventure-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast('Backup exported. Keep it somewhere safe.');
}
el<HTMLInputElement>('import-file').onchange = async event => {
  const file = (event.target as HTMLInputElement).files?.[0]; (event.target as HTMLInputElement).value = ''; if (!file) return;
  const imported = file.size <= 1_000_000 ? parseSave(await file.text()) : null;
  if (!imported) { toast('That file is not a valid Glider adventure save. Your current progress is unchanged.', 8); const result = el('save-result'); if (result) result.textContent = 'Invalid or unsupported save file. Nothing was changed.'; return; }
  openDialog(`<div class="eyebrow">A JOURNEY FROM ANOTHER DAY</div><h2 id="dialog-title">Load this adventure?</h2><p>${imported.progress.parts} scrap · ${imported.progress.defeated.length} guardians defeated · ${imported.progress.fan ? 'fan equipped' : 'paper glider'}. This replaces your current local adventure.</p><button class="launch-button" id="confirm-import"><span>Load imported adventure</span>${icon('arrow')}</button><button class="secondary-button" id="cancel-import">Keep current adventure</button>`);
  el('confirm-import').onclick = () => { takeoff = null; landing = null; saved = imported; progress = imported.progress; started = false; saveGame(); launch(); toast('Backup loaded. Welcome back to your adventure.'); };
  el('cancel-import').onclick = () => showJournal('save');
};

function target(): { name: string; detail: string; point: Point3 | null } {
  if (waypoint.startsWith('harbor:')) { const h=findHarbor(waypoint.slice(7)); if(h) return { name:h.name,detail:'Optional landing pin · L to land · B to slow down',point:h }; }
  if (waypoint === 'charge') { const station = [...STATIONS].filter(s => progress.discovered.includes('station-' + s.id) || dist(s, state) < 260).sort((a, b) => dist(a, state) - dist(b, state))[0]; if (station) return { name: station.name, detail: 'An optional pin to a known emergency relaunch camp', point: station }; }
  if (waypoint.startsWith('place:')) { const place = PLACES.find(p => p.id === waypoint.slice(6)); if (place) return { name: place.name, detail: progress.trackedQuest ? rumor(progress).detail : 'Pinned region · choose your own route', point: place }; }
  return { ...rumor(progress), point: null };
}
let currentSite: string | null = null;
function bindQuestButtons() {
  document.querySelectorAll<HTMLButtonElement>('[data-quest-pin]').forEach(b => b.onclick = () => { waypoint = 'place:' + b.dataset.questPin; closeDialog(); });
  document.querySelectorAll<HTMLButtonElement>('[data-accept]').forEach(b => b.onclick = () => { if (acceptQuest(progress, b.dataset.accept!)) { waypoint = 'none'; const q = QUESTS.find(q => q.id === b.dataset.accept)!; toast(`Following: ${q.title} · ${nextQuestStep(progress, q).title}`, 8); saveGame(); if (currentSite) showSite(currentSite); else showJournal('quests'); } });
  document.querySelectorAll<HTMLButtonElement>('[data-finish]').forEach(b => b.onclick = () => { const message = finishQuest(progress, b.dataset.finish!, state); if (message) { adventure.sync(progress); saveGame(); chime(); toast(message, 8); if (currentSite) showSite(currentSite); else showJournal('quests'); } });
  document.querySelectorAll<HTMLButtonElement>('[data-quest-track]').forEach(b => b.onclick = () => { progress.trackedQuest = progress.trackedQuest === b.dataset.questTrack ? null : b.dataset.questTrack!; waypoint = 'none'; saveGame(); closeDialog(); });
}
function showSite(id: string) {
  currentSite = id; const site = SITES.find(s => s.id === id)!;
  const quests = QUESTS.filter(q => q.giver === id && questKnown(progress, q));
  openDialog(`<div class="eyebrow">${REGIONS.find(r => r.id === site.region)!.name} · FIELD ENCOUNTER</div><h2 id="dialog-title">${site.name}</h2><p class="site-story">${site.text}</p>${quests.map(q => questCard(progress, q, state)).join('')}${!quests.length ? '<p class="journal-note">This place has been recorded in your field journal.</p>' : ''}<button class="secondary-button" id="leave-site">Back to the wind</button>`, true);
  bindQuestButtons(); el('leave-site').onclick = () => closeDialog();
}
function nearestSite() { return SITES.filter(s => dist(state, s) < 24 && !adventure.pathBlocked(state, s, .1)).sort((a, b) => dist(a, state) - dist(b, state))[0]; }
function interact() {
  if (mode !== 'flying') return; const site = nearestSite(); if (!site) return;
  const message = interactSite(progress, site.id); saveGame(); chime();
  if (site.kind === 'mechanism') toast(message, 8); else showSite(site.id);
}
el('interact').onclick = interact;

el('launch').onclick = () => launch(); el('new-game').onclick = confirmNewGame; el('sound').onclick = toggleSound; el('pause').onclick = pauseFlight; el('help').onclick = showHelp; el('settings').onclick = showSettings; el('journal').onclick = () => showJournal('journey'); el('atlas-button').onclick = () => showJournal('journey'); el('save-button').onclick = () => saveGame(true); el('dialog-close').onclick = () => closeDialog();
document.querySelector<HTMLAnchorElement>('.brand')!.onclick = event => { event.preventDefault(); if (mode === 'flying') pauseFlight(); else if (mode === 'paused') goHome(); };
async function fullscreen() { try { if (document.fullscreenElement) await document.exitFullscreen(); else await el('experience').requestFullscreen(); } catch { toast('Fullscreen is unavailable in this browser view.'); } }
el('fullscreen').onclick = fullscreen; document.addEventListener('fullscreenchange', () => el('fullscreen').setAttribute('aria-label', document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen'));
el('dialog-backdrop').onclick = event => { if (event.target === el('dialog-backdrop')) closeDialog(); };
window.addEventListener('keydown', event => {
  const tag = (event.target as HTMLElement).tagName;
  if (event.key === 'Tab' && !el('dialog-backdrop').hidden) { const all = Array.from(el('dialog').querySelectorAll<HTMLElement>('button:not(:disabled), input, select, [tabindex="0"]')); if (event.shiftKey && document.activeElement === all[0]) { event.preventDefault(); all.at(-1)?.focus(); } else if (!event.shiftKey && document.activeElement === all.at(-1)) { event.preventDefault(); all[0]?.focus(); } return; }
  if (['INPUT', 'SELECT'].includes(tag)) return;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Shift'].includes(event.key) || (event.key === ' ' && mode !== 'menu') || (event.key === 'Backspace' && mode === 'flying')) event.preventDefault();
  if (event.repeat || mode === 'landing') return;
  if (event.key === 'Escape' || (event.key === ' ' && mode !== 'menu')) { if (!el('dialog-backdrop').hidden) closeDialog(); else pauseFlight(); return; }
  if (!el('dialog-backdrop').hidden) return;
  const key = event.key.toLowerCase();
  if (event.key === 'Enter' && mode === 'menu' && tag !== 'BUTTON') launch();
  if (key === 'l' || (key === 'e' && mode === 'landed')) { landAtHarbor(); return; }
  if (key === 'e' && mode === 'flying') interact();
  if (event.key === 'Backspace' && mode === 'flying') { rescue('Back to your last camp.'); return; }
  if (key === 'm') toggleSound(); if (key === 'f') void fullscreen(); if (key === 'h') showHelp(); if (key === 'u') showJournal('upgrades'); if (key === 'j') showJournal('journey'); if (key === 'k') saveGame(true);
  if (mode === 'flying') { keys.add(event.key.length === 1 ? key : event.key); if (key === 'x') { if (!adventure.fire(state, progress) && progress.ammo <= 0) toast('Out of rubber bands. Land at a flight house to buy more ammunition.'); } if (event.key === 'Shift' && !progress.fan) toast('Find Rowan’s repair bench in Willow Mill to learn about the electric fan.'); }
});
window.addEventListener('keyup', e => keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key));
window.addEventListener('blur', () => { keys.clear(); if (mode === 'flying' || mode === 'taking-off') { saveGame(); pauseFlight(); } });
document.addEventListener('visibilitychange', () => { if (document.hidden && (mode === 'flying' || mode === 'taking-off')) { saveGame(); pauseFlight(); } });
window.addEventListener('pagehide', () => { if (started) saveGame(); });
document.querySelectorAll<HTMLButtonElement>('[data-key]').forEach(button => { button.addEventListener('pointerdown', event => { event.preventDefault(); button.setPointerCapture(event.pointerId); keys.add(button.dataset.key!); button.classList.add('pressed'); }); const release = () => { keys.delete(button.dataset.key!); button.classList.remove('pressed'); }; button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release); button.addEventListener('lostpointercapture', release); });

const map = el<HTMLCanvasElement>('minimap').getContext('2d')!;
function drawMap() {
  if (!started) return;
  drawLocalMap(map,progress,state,target().point,adventure.enemies.filter(e=>e.mesh.visible && dist(e.mesh.position,state)<(e.boss ? 230 : 130)).map(e=>({position:e.mesh.position,boss:!!e.boss})),LIFTS.filter(v=>!('requires' in v) || !v.requires || progress.completed.includes(v.requires)).map(v=>({x:v.x,y:v.base,z:v.z})));
}
function updateHUD(lift: number) {
  const zone = placeAt(state), tier = difficultyAt(state), goal = target(), station = STATIONS.find(s => dist(state, s) < 22);
  const interior = buildingAt(state), floor = interior ? Math.max(0, interior.floors.filter(y => state.y >= y).length - 1) : 0;
  el('region-name').textContent = interior?.id === 'house' ? `Hearthside · ${['Cellar', 'Main floor', 'Upstairs', 'Attic'][floor]}` : zone?.name ?? regionAt(state).name;
  el('region-tier').textContent = `REGION ${['I', 'II', 'III', 'IV'][tier - 1]} · ${['GENTLE AIR', 'CROSSWINDS', 'HIGH WINDS', 'STORM RIDGE'][tier - 1]}`;
  el('objective-label').textContent = goal.point ? 'OPTIONAL COMPASS PIN' : progress.trackedQuest ? 'A STORY YOU CHOSE' : 'FOLLOW YOUR CURIOSITY';
  const nearbyLanding = mode === 'landed' ? findHarbor(progress.dockedHub) : landingCandidate(state);
  const approach = nearbyLanding && (mode === 'landed' || !adventure.pathBlocked(state,nearbyLanding,1.2));
  el('land').hidden = !approach || mode === 'landing' || mode === 'taking-off';
  if (nearbyLanding) el('land-name').innerHTML = mode === 'landed' ? `Rest at ${nearbyLanding.name}<small>Safely parked · open services</small>` : `Land at ${nearbyLanding.name}<small>${state.speed > 38 ? 'Hold B to slow below 1.9 m/s' : 'Workshop, rest and local departures'}</small>`;
  const boss = adventure.enemies.find(e=>e.boss && e.mesh.visible && dist(e.mesh.position,state)<240 && mode==='flying');
  el('boss-hud').hidden=!boss; el('flight-condition').style.top=boss?'170px':'';
  if(boss) {el('boss-name').textContent=boss.name;el('boss-phase').textContent=bossPhase(boss.clock)==='cooling' ? 'CORE EXPOSED · FIRE NOW' : bossPhase(boss.clock)==='warning' ? 'VOLLEY INCOMING · KEEP MOVING' : 'SHIELDED · EVADE THE VOLLEY';el('boss-health').style.width=`${Math.max(0,boss.hp)/boss.maxHp*100}%`;}
  const encounter = nearestSite(); el('interact').hidden = !encounter || mode === 'taking-off'; if (encounter) el('interact-name').textContent = `${encounter.kind === 'mechanism' ? 'Use' : 'Read'} ${encounter.name}`;
  el('objective-title').textContent = goal.name; el('objective-detail').textContent = goal.detail;
  el('speed').innerHTML = `${meters(state.speed).toFixed(1)}<small>m/s</small>`; el('altitude').innerHTML = `${meters(state.y).toFixed(1)}<small>m</small>`;
  el('energy-fill').style.width = `${Math.min(100, state.speed / 60 * 100)}%`;
  el('speed-status').textContent = takeoff ? 'TAKING OFF · LAUNCH ASSIST' : progress.dockedHub ? 'PARKED' : keys.has('b') ? 'AIRBRAKE · APPROACH SPEED' : state.stalled ? 'STALL · NOSE DOWN TO RECOVER' : state.speed < 15 ? 'LOW ENERGY · DIVE GENTLY' : state.speed > 40 ? 'LOOP ENERGY READY' : 'GLIDING';
  el('lift-status').textContent = takeoff ? 'LEAVING THE LANDING BAY' : progress.dockedHub ? 'RESTING AT A FLIGHT HOUSE' : lift > 2 ? `RISING AIR · +${meters(lift).toFixed(1)} m/s` : Math.sin(state.pitch) < -.1 ? 'DIVING · GAINING SPEED' : Math.sin(state.pitch) > .1 ? 'CLIMBING · SPENDING SPEED' : 'SINKING · WATCH YOUR ALTITUDE';
  const condition = el('flight-condition'); condition.textContent = takeoff ? 'TAKING OFF · CLIMBING' : progress.dockedHub ? 'SAFELY LANDED · L OPENS SERVICES' : state.stalled ? 'STALL — LOWER THE NOSE' : station ? 'EMERGENCY RELAUNCH CAMP'  : lift > 3 ? 'RIDING AN UPDRAFT' : progress.fan && keys.has('Shift') && progress.charge > 0 ? 'FAN ASSIST' : airAt(state).name; condition.classList.toggle('stall', state.stalled);
  el('health').textContent = `${Math.ceil(progress.health)}%`; el('health-fill').style.width = `${progress.health}%`;
  el('battery-label').textContent = progress.fan ? 'ϟ FAN CHARGE' : 'FAN · UNDISCOVERED'; el('battery').textContent = progress.fan ? `${Math.ceil(progress.charge)} / ${capacity(progress)}` : '—'; el('battery-fill').style.width = `${progress.charge / capacity(progress) * 100}%`;
  el('ammo').textContent = String(progress.ammo); el('parts').textContent = String(progress.parts); el('cores').textContent = String(progress.cores);
  el('distance').textContent = metricDistance(progress.distance); if (saveTimer > 4) el('save-indicator').textContent = storageErrorShown ? 'EXPORT TO SAVE' : 'AUTOSAVE ON';
  const degrees = ((state.heading * 180 / Math.PI) % 360 + 360) % 360; el('heading').textContent = `${['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(degrees / 45) % 8]} ${Math.round(degrees)}°`;
  if (goal.point) {
    const bearing = Math.atan2(goal.point.x - state.x, -(goal.point.z - state.z)), relative = angleDifference(bearing, state.heading + (Math.cos(state.pitch) < 0 ? Math.PI : 0));
    el('target-hint').textContent = `${relative < -.35 ? '↶' : relative > .35 ? '↷' : '◇'} ${metricDistance(dist(state, goal.point))} · optional pin`;
  } else el('target-hint').textContent = '';
  drawMap();
}

try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  el('scene').appendChild(renderer.domElement); world = new World(); world.thermalPoints.visible = false; world.plane.scale.setScalar(.72); adventure = new Adventure(world.scene, world.plane); adventure.sync(progress); snapCamera(); refreshMenu();
  renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); if (started) saveGame(); if (mode === 'flying') pauseFlight(); toast('The view needs a refresh. Your adventure was saved where browser storage is available.', 120); });
  window.addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
  let last = performance.now(), time = 0, accumulator = 0, hudAccumulator = 0;
  function simulate(dt: number) {
    previousPosition.set(state.x, state.y, state.z); progress.seconds += dt; saveTimer += dt; invulnerable = Math.max(0, invulnerable - dt); rescueCooldown = Math.max(0, rescueCooldown - dt);
    revealNearby(progress,state);
    input.brake = keys.has('b');
    input.left = keys.has('ArrowLeft') || keys.has('a'); input.right = keys.has('ArrowRight') || keys.has('d'); input.up = keys.has('ArrowUp') || keys.has('w'); input.down = keys.has('ArrowDown') || keys.has('s'); input.boost = keys.has('Shift');
    const tuning = flightTuning(progress), poweredSeconds = input.boost ? spendCharge(progress, dt) : 0; tuning.thrust *= poweredSeconds / dt;
    stepFlight(state, input, dt, liftAt(state, progress), invertPitch, tuning);
    applyAir(state, progress, state.heading, dt, time);
    progress.distance += dist(state, previousPosition);
    if (keys.has('x')) adventure.fire(state, progress);
    adventure.update(dt, time, state, progress, true, (message, save) => { toast(message, message.includes('fan discovered') ? 8 : 4); chime(); if (save) saveGame(); }, damage, poweredSeconds > 0);
    if (state.stalled && !lastStalled) toast('Stall! The nose is dropping to rebuild speed. Give yourself room below.', 5); lastStalled = state.stalled;
    if (progress.fan && progress.charge <= 0 && input.boost && !fanEmptyWarned) { toast('Fan empty. Land at a flight house with a generator or collect a charge pickup.', 6); fanEmptyWarned = true; } if (progress.charge > 5) fanEmptyWarned = false;
    if (dist(state, { x: -335, y: 112, z: -235 }) < 40 && !progress.discovered.includes('west-lift')) { progress.discovered.push('west-lift'); saveGame(); }
    const ground = groundHeight(state.x, state.z);
    if (rescueCooldown <= 0 && (state.y < ground + 2 || world.hitsObstacle(state.x, state.y, state.z) || adventure.pathBlocked(previousPosition, state, 1.2))) rescue('A rough landing. Relaunching from camp.');
    if (state.x < -1550 || state.x > 1600 || state.z < -3900 || state.z > 720 || state.y > 750 || state.y < -20) rescue('The wind brought you back from the edge of the map.');
    if (saveTimer >= 15) saveGame();
  }
  function animate(now: number) {
    requestAnimationFrame(animate); const dt = Math.min((now - last) / 1000, .1); last = now;
    if (mode !== 'paused') time += dt;
    if (mode === 'landing' && landing) {
      landing.elapsed += dt; const t=Math.min(1,landing.elapsed/1.8), ease=t*t*(3-2*t), h=landing.hub;
      for(const k of ['x','y','z'] as const) state[k]=landing.from[k]+(h[k]-landing.from[k])*ease;
      state.speed=landing.from.speed*(1-ease); state.pitch=landing.from.pitch*(1-ease); state.roll=landing.from.roll*(1-ease); state.heading=landing.from.heading+angleDifference(0,landing.from.heading)*ease;
      if(t===1) { dock(progress,state,h); mode='landed'; landing=null; revealNearby(progress,state); const delivery=deliverContract(progress); saveGame(); refreshMode(); showHarbor(); if(delivery) toast(delivery,8); }
    }
    if (mode === 'taking-off' && takeoff) {
      takeoff.elapsed += dt; Object.assign(state,takeoffFlight(takeoff,takeoff.elapsed)); revealNearby(progress,state);
      if (takeoff.elapsed >= takeoff.duration) { takeoff=null;mode='flying';invulnerable=2;rescueCooldown=.4;keys.clear();previousPosition.set(state.x,state.y,state.z);refreshMode();saveGame();toast('Your wings. Your route. Arrow keys to steer.',4); }
    }
    if (mode === 'flying') { accumulator += dt; while (accumulator >= 1 / 60) { simulate(1 / 60); accumulator -= 1 / 60; } } else { accumulator = 0; adventure.update(mode === 'paused' || mode === 'landed' || mode === 'landing' || mode === 'taking-off' ? 0 : dt, time, state, progress, false, () => {}, () => {}); }
    position.set(state.x, state.y + (mode === 'menu' ? (innerWidth <= 480 ? 30 : 18) + Math.sin(time * .8) * .45 : 0), state.z);
    world.plane.position.copy(position); world.plane.rotation.set(state.pitch + (mode === 'menu' ? Math.sin(time * .65) * .025 : 0), -state.heading, state.roll, 'YXZ');
    world.plane.visible = invulnerable <= 0 || Math.floor(invulnerable * 7) % 2 === 0 || mode === 'menu';
    if (mode === 'menu') { cameraGoal.set(state.x - 12, state.y + 32, state.z + 73); lookGoal.set(state.x, state.y + 11, state.z - 210); camera.up.lerp(new THREE.Vector3(0, 1, 0), .1); }
    else {
      const f = forwardVector(state), forward = new THREE.Vector3(f.x, f.y, f.z), up = new THREE.Vector3(-Math.sin(state.heading) * Math.sin(state.pitch), Math.cos(state.pitch), Math.cos(state.heading) * Math.sin(state.pitch));
      const indoors = !!placeAt(state); cameraGoal.copy(position).addScaledVector(forward, indoors ? -17 : -28).addScaledVector(up, indoors ? 5 : 9); lookGoal.copy(position).addScaledVector(forward, 30).addScaledVector(up, 1.5);
      camera.up.lerp(up, 1 - Math.exp(-7 * dt)).normalize(); adventure.clipCamera(position, cameraGoal); cameraGoal.y = Math.max(cameraGoal.y, groundHeight(cameraGoal.x, cameraGoal.z) + 2);
    }
    camera.position.lerp(cameraGoal, 1 - Math.exp(-5 * dt)); if (mode !== 'menu') adventure.clipCamera(position, camera.position); smoothLook.lerp(lookGoal, 1 - Math.exp(-7 * dt)); camera.lookAt(smoothLook); camera.rotation.z += state.roll * .1;
    camera.fov += ((mode === 'flying' ? 60 + Math.min(12, Math.max(0, state.speed - 28) * .3) : 60) - camera.fov) * dt * 2; camera.updateProjectionMatrix();
    world.update(time, position, state.heading, mode === 'flying' ? state.speed : mode === 'menu' ? 6 : 0); renderer.render(world.scene, camera);
    if (windGain && audioContext) windGain.gain.setTargetAtTime(soundEnabled && mode === 'flying' ? .06 + state.speed * .002 : 0, audioContext.currentTime, .3);
    hudAccumulator += dt; if (hudAccumulator > .12) { updateHUD(liftAt(state, progress)); hudAccumulator = 0; }
    if (toastTime > 0 && mode !== 'paused') { toastTime -= dt; if (toastTime <= 0) el('toast').classList.remove('show'); }
    if (invulnerable < .7) el('damage-flash').classList.remove('show');
  }
  renderer.render(world.scene, camera); el('loading').classList.add('loaded'); requestAnimationFrame(animate);
} catch (error) { console.error(error); el('loading').innerHTML = `<h2>The sky couldn’t open.</h2><p>Glider needs WebGL2 and hardware acceleration. Try reloading in a recent browser.</p><button class="launch-button" id="retry">Try again</button>`; el('retry').onclick = () => location.reload(); }
