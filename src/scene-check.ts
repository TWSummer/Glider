// Development-only visual inspection page; not an entry in the production build.
import * as THREE from 'three';
import { World } from './world';
import { Adventure } from './adventure';
import { initialFlight } from './flight';
import { newProgress } from './progression';
const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping; document.body.appendChild(renderer.domElement);
const world = new World(), adventure = new Adventure(world.scene, world.plane), camera = new THREE.PerspectiveCamera(63, innerWidth / innerHeight, .3, 9000);
world.rings.forEach(r => r.visible = false); world.plane.scale.setScalar(.72);
world.thermalPoints.visible = false;
let state = initialFlight(); const p = newProgress();
function view(place: string) {
  const positions = { house: [[160, 365, 730], [0, 123, 112], [0, 91, 345]], inside: [[95, 104, 293], [80, 99, 110], [95, 92, 266]], cellar: [[90, 37, 262], [10, 35, 105], [90, 25, 232]], attic: [[95, 242, 271], [0, 236, 100], [95, 227, 240]], valley: [[240, 245, 500], [-60, 15, 200], [120, 150, 320]], mill: [[-30, 330, 690], [-390, 125, 355], [-390, 60, 530]], mine: [[-920, 112, -1130], [-940, 105, -1470], [-920, 104, -1160]], city: [[1610, 630, -1080], [970, 140, -1740], [1350, 280, -1310]], aqueduct: [[800, 580, -1800], [70, 180, -2340], [550, 300, -2130]], observatory: [[240, 745, -2730], [-260, 420, -3260], [-120, 414, -2920]], cavern: [[-451, 79, -372], [-498, 83, -531], [-460, 70, -405]], temple: [[810, 480, -660], [310, 210, -1130], [310, 170, -870]] }[place] ?? [[0, 61, 190], [0, 51, 85], [0, 50, 161]];
  camera.position.fromArray(positions[0]); camera.lookAt(new THREE.Vector3().fromArray(positions[1])); world.plane.position.fromArray(positions[2]); state = { ...initialFlight(), x: positions[2][0], y: positions[2][1], z: positions[2][2] };
}
document.querySelectorAll<HTMLButtonElement>('[data-place]').forEach(button => button.onclick = () => view(button.dataset.place!));
window.addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
view(new URLSearchParams(location.search).get('view') ?? 'house');
function animate(time: number) { requestAnimationFrame(animate); world.update(time / 1000, world.plane.position, 0, 6); adventure.update(1 / 60, time / 1000, state, p, false, () => {}, () => {}); renderer.render(world.scene, camera); }
requestAnimationFrame(animate);
