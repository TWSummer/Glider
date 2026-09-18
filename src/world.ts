import * as THREE from 'three';
import { landHeight } from './atlas.ts';
import { gradeTerrain, nearBuilding, nearTunnel } from './architecture-data.ts';

export interface Island { x: number; z: number; rx: number; rz: number; h: number; seed: number }
export const islands: Island[] = [
  { x: -170, z: 195, rx: 107, rz: 142, h: 36, seed: 1 },
  { x: 192, z: 180, rx: 97, rz: 95, h: 24, seed: 2 },
  { x: -180, z: -100, rx: 112, rz: 148, h: 72, seed: 3 },
  { x: 153, z: -100, rx: 102, rz: 115, h: 47, seed: 4 },
  { x: -275, z: -395, rx: 139, rz: 150, h: 88, seed: 5 },
  { x: 55, z: -545, rx: 167, rz: 135, h: 79, seed: 6 },
  { x: 442, z: -330, rx: 89, rz: 135, h: 70, seed: 7 },
  { x: 432, z: 70, rx: 74, rz: 88, h: 47, seed: 8 },
  { x: -425, z: 100, rx: 84, rz: 170, h: 90, seed: 9 },
  { x: 235, z: -675, rx: 130, rz: 100, h: 80, seed: 10 },
  { x: -160, z: -745, rx: 180, rz: 100, h: 80, seed: 11 },
];
const TAU = Math.PI * 2;
function random(seed: number) { let a = seed; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function edgeNoise(angle: number, seed: number) { return 1 + Math.sin(angle * 5 + seed) * 0.07 + Math.cos(angle * 9 - seed) * 0.035; }
function islandHeight(island: Island, x: number, z: number) {
  const nx = (x - island.x) / island.rx, nz = (z - island.z) / island.rz;
  const r = Math.hypot(nx, nz) / edgeNoise(Math.atan2(nz, nx), island.seed);
  if (r >= 1) return -2;
  const top = (0.87 + 0.1 * Math.sin(nx * 4 + island.seed) * Math.cos(nz * 4));
  const slope = Math.max(0, 1 - Math.pow(r, 5));
  return -2 + island.h * top * Math.pow(slope, 0.65);
}
export function groundHeight(x: number, z: number, excavated = true) { return gradeTerrain(x, z, islands.reduce((height, island) => Math.max(height, islandHeight(island, x, z)), landHeight(x, z)), excavated); }
const mat = (color: string, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.95, flatShading: true, ...extra });
export const thermals = [{ x: -63, z: 68, radius: 24 }, { x: 45, z: -240, radius: 25 }, { x: 292, z: -270, radius: 23 }];

export class World {
  scene = new THREE.Scene();
  birds: THREE.Group[] = [];
  thermalPoints: THREE.Points;
  water: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  plane: THREE.Group;
  sun: THREE.DirectionalLight;
  wind: THREE.LineSegments;
  obstacles: { x: number; z: number; y: number; height: number; radius: number }[] = [];
  constructor() {
    this.scene.background = new THREE.Color('#e2e9d9');
    this.scene.fog = new THREE.FogExp2('#c2d7ce', 0.0007);
    this.scene.add(new THREE.HemisphereLight('#fff3d4', '#536e61', 2.8));
    const sun = new THREE.DirectionalLight('#fff1cc', 4.0);
    this.sun = sun;
    sun.position.set(-220, 330, -230); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -420, right: 420, top: 420, bottom: -420, near: 1, far: 900 });
    sun.shadow.normalBias = 0.9; sun.shadow.bias = -0.00015;
    this.scene.add(sun); this.scene.add(sun.target);
    this.makeSky();
    this.water = this.makeWater();
    islands.forEach(island => this.makeIsland(island));
    this.makeMountains();
    this.makeArch(715, -85);
    this.makeCabin(-670, 520);
    this.makeDock(-680, 549);
    this.makeSailboat(780, 380, 0.3);
    this.makeSailboat(-78, -265, -0.6);
    this.makeBirds();
    this.thermalPoints = this.makeThermals();
    this.plane = this.makePlane(); this.scene.add(this.plane);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(60 * 6), 3));
    this.wind = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: '#fffcdf', transparent: true, opacity: 0.25 }));
    this.wind.frustumCulled = false; this.scene.add(this.wind);
  }

  makeSky() {
    const sky = new THREE.Mesh(new THREE.SphereGeometry(6500, 32, 24), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: `varying vec3 vPosition; void main(){vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `varying vec3 vPosition; void main(){vec3 dir=normalize(vPosition);float h=max(dir.y,0.);vec3 col=mix(vec3(.89,.91,.79),vec3(.43,.69,.73),pow(h,.55));float glow=pow(max(dot(dir,normalize(vec3(-.55,.29,-.8))),0.),9.);col=mix(col,vec3(1.,.87,.61),glow*.65);float sun=smoothstep(.99925,.99965,dot(dir,normalize(vec3(-.55,.29,-.8))));col=mix(col,vec3(1.,.97,.80),sun);gl_FragColor=vec4(col,1.);}`,
    })); this.scene.add(sky);
    const rng = random(77);
    const cloudMat = new THREE.MeshBasicMaterial({ color: '#f7f0db', transparent: true, opacity: 0.68, depthWrite: false, fog: false });
    const cloudGeo = new THREE.IcosahedronGeometry(1, 2);
    for (let i = 0; i < 24; i++) {
      const cloud = new THREE.Group(); const angle = rng() * TAU, distance = 4200 + rng() * 850;
      cloud.position.set(Math.cos(angle) * distance, 650 + rng() * 190, Math.sin(angle) * distance);
      for (let k = 0; k < 5; k++) { const puff = new THREE.Mesh(cloudGeo, cloudMat); puff.position.set(k * 30, rng() * 10, rng() * 10); puff.scale.set(48 + rng() * 35, 8 + rng() * 13, 20 + rng() * 20); cloud.add(puff); }
      this.scene.add(cloud);
    }
  }

  makeWater() {
    const material = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, nearColor: { value: new THREE.Color('#529e91') }, farColor: { value: new THREE.Color('#a4c7b6') } },
      vertexShader: `varying vec3 vWorld; void main(){vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}`,
      fragmentShader: `uniform float time;uniform vec3 nearColor;uniform vec3 farColor;varying vec3 vWorld;
      void main(){vec2 p=vWorld.xz;float a=sin(p.x*.19+p.y*.14+time*.45);float b=sin(p.x*.36-p.y*.4+time*.75);float c=sin(p.x*.73+p.y*.11-time*.7);float ripple=a*b*.018+c*.009;float d=length(cameraPosition.xz-p);vec3 col=mix(nearColor,farColor,smoothstep(150.,1500.,d));col+=ripple;float reflection=pow(max(0.,1.-abs(p.x+145.+sin(p.y*.04)*25.)/130.),5.);float glint=pow(max(0.,sin(p.y*2.+a*4.+time)*b),14.);col+=vec3(.8,.67,.35)*glint*(.06+.36*reflection);float lines=smoothstep(.97,1.,sin(p.y*.65+sin(p.x*.06)*3.+time*.55));col+=lines*.018;gl_FragColor=vec4(col,1.);
      #include <colorspace_fragment>
      }`,
    });
    const water = new THREE.Mesh(new THREE.PlaneGeometry(16000, 16000), material);
    water.rotation.x = -Math.PI / 2; water.position.y = -0.2; this.scene.add(water); return water;
  }

  makeIsland(island: Island) {
    const rng = random(island.seed * 921);
    const positions: number[] = [], colors: number[] = [];
    const segments = 80, steps = 23;
    const rock = new THREE.Color('#aaa48a'), darkRock = new THREE.Color('#7d8771');
    const green = new THREE.Color('#73956a'), greenLight = new THREE.Color('#99ad78');
    const vertex = (r: number, a: number) => { const edge = edgeNoise(a, island.seed); const x = island.x + Math.cos(a) * island.rx * r * edge, z = island.z + Math.sin(a) * island.rz * r * edge; return new THREE.Vector3(x, groundHeight(x, z) - .2, z); };
    const addTriangle = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, r: number) => {
      const color = r < 0.76 ? green.clone().lerp(greenLight, rng() * 0.7) : rock.clone().lerp(darkRock, rng() * 0.7);
      if (r > .965) color.set('#d1cbb0');
      for (const v of [a, b, c]) { positions.push(v.x, v.y, v.z); colors.push(color.r, color.g, color.b); }
    };
    for (let j = 0; j < steps; j++) for (let i = 0; i < segments; i++) {
      const r0 = j / steps, r1 = (j + 1) / steps, a0 = i / segments * TAU, a1 = (i + 1) / segments * TAU;
      const a = vertex(r0, a0), b = vertex(r1, a0), c = vertex(r1, a1), d = vertex(r0, a1);
      addTriangle(a, c, b, r1); addTriangle(a, d, c, r1);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 })); mesh.receiveShadow = true; mesh.castShadow = true; this.scene.add(mesh);

    // A shallow, irregular turquoise shelf hugs each shoreline.
    const shelf = new THREE.Mesh(new THREE.CircleGeometry(1, 80), new THREE.MeshBasicMaterial({ color: '#81b7a0', transparent: true, opacity: .35, depthWrite: false }));
    shelf.rotation.x = -Math.PI / 2; shelf.position.set(island.x, .01, island.z); shelf.scale.set(island.rx * 1.06, island.rz * 1.06, 1); this.scene.add(shelf);
    const count = Math.floor(island.rx * island.rz / 95);
    const leaves = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 6), mat('#ffffff'), count * 3);
    const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.15, .24, 1, 5), mat('#66513b'), count);
    const dummy = new THREE.Object3D(); const greens = ['#315647', '#41654c', '#577853', '#658458', '#3e6553', '#83915b'];
    for (let i = 0; i < count; i++) {
      const angle = rng() * TAU, r = Math.sqrt(rng()) * .77;
      const x = island.x + Math.cos(angle) * r * island.rx, z = island.z + Math.sin(angle) * r * island.rz;
      const y = groundHeight(x, z); const h = 8 + rng() * 14, width = 2.1 + rng() * 2.6;
      if (nearBuilding(x, z, 50) || nearTunnel(x, z)) { dummy.scale.setScalar(0); dummy.updateMatrix(); trunks.setMatrixAt(i, dummy.matrix); for (let layer = 0; layer < 3; layer++) leaves.setMatrixAt(i * 3 + layer, dummy.matrix); continue; }
      this.obstacles.push({ x, z, y, height: h, radius: width * .65 });
      dummy.position.set(x, y + h * .2, z); dummy.scale.set(1, h * .4, 1); dummy.rotation.set(0, rng() * TAU, 0); dummy.updateMatrix(); trunks.setMatrixAt(i, dummy.matrix);
      for (let layer = 0; layer < 3; layer++) {
        dummy.position.set(x, y + h * (.35 + layer * .23), z); dummy.scale.set(width * (1 - layer * .2), h * .56, width * (1 - layer * .2)); dummy.updateMatrix(); leaves.setMatrixAt(i * 3 + layer, dummy.matrix); leaves.setColorAt(i * 3 + layer, new THREE.Color(greens[Math.floor(rng() * greens.length)]));
      }
    }
    leaves.castShadow = true; leaves.receiveShadow = true; this.scene.add(leaves, trunks);
    const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), mat('#9b9d88'), 30);
    for (let i = 0; i < 30; i++) { const a = rng() * TAU, r = .8 + rng() * .25; const x = island.x + Math.cos(a) * island.rx * r, z = island.z + Math.sin(a) * island.rz * r; dummy.position.set(x, nearBuilding(x, z, 30) ? -100 : Math.max(0, groundHeight(x, z)), z); dummy.scale.set(2 + rng() * 5, 2 + rng() * 5, 2 + rng() * 5); dummy.rotation.set(rng(), rng() * 6, rng()); dummy.updateMatrix(); rocks.setMatrixAt(i, dummy.matrix); } rocks.castShadow = true; this.scene.add(rocks);
  }

  makeMountains() {
    const rng = random(142);
    for (let i = 0; i < 38; i++) {
      const angle = i / 38 * TAU; const distance = 3700 + rng() * 400;
      const height = 170 + rng() * 290, radius = 140 + rng() * 200;
      const geo = new THREE.ConeGeometry(radius, height, 7, 3);
      const pos = geo.getAttribute('position');
      for (let j = 0; j < pos.count; j++) { const x = pos.getX(j), y = pos.getY(j), z = pos.getZ(j); pos.setXYZ(j, x + Math.sin(y * .015 + i) * 30, y, z); } geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, mat(i % 3 === 0 ? '#708c83' : '#91a399'));
      mesh.position.set(Math.cos(angle) * distance, height / 2 - 15, Math.sin(angle) * distance - 1200); mesh.rotation.y = rng() * TAU; this.scene.add(mesh);
      if (height > 350) { const cap = new THREE.Mesh(new THREE.ConeGeometry(radius * .18, height * .2, 7), mat('#e3e3ce')); cap.position.copy(mesh.position); cap.position.y = height * .9 - 15; cap.rotation.copy(mesh.rotation); this.scene.add(cap); }
    }
  }

  makeArch(x: number, z: number) {
    const base = groundHeight(x, z) - 3;
    const group = new THREE.Group(); group.position.set(x, base, z); group.rotation.y = -.3;
    const rock = mat('#c4b895');
    for (const side of [-1, 1]) { const pillar = new THREE.Mesh(new THREE.CylinderGeometry(7, 12, 52, 7), rock); pillar.position.set(side * 26, 25, 0); pillar.rotation.z = side * .08; pillar.castShadow = true; group.add(pillar); this.obstacles.push({ x: x + side * 26 * Math.cos(-.3), z: z - side * 26 * Math.sin(-.3), y: base, height: 53, radius: 9 }); }
    const arch = new THREE.Mesh(new THREE.TorusGeometry(26, 7.5, 5, 15, Math.PI), rock); arch.position.y = 49; arch.castShadow = true; group.add(arch);
    for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI; this.obstacles.push({ x: x + Math.cos(a) * 26 * Math.cos(-.3), z: z - Math.cos(a) * 26 * Math.sin(-.3), y: base + 49 + Math.sin(a) * 26 - 7, height: 14, radius: 7.5 }); }
    this.scene.add(group);
  }

  makeCabin(x: number, z: number) {
    const y = groundHeight(x, z); const group = new THREE.Group(); group.position.set(x, y + 4, z); group.rotation.y = .5;
    this.obstacles.push({ x, z, y, height: 17, radius: 9 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(13, 8, 11), mat('#a96c42')); body.castShadow = true; group.add(body);
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 16, 3), mat('#455e54')); roof.rotation.z = Math.PI / 2; roof.position.y = 7; roof.castShadow = true; group.add(roof);
    for (const wx of [-3.7, 3.7]) { const window = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.5), new THREE.MeshBasicMaterial({ color: '#ffdc91' })); window.position.set(wx, .6, 5.51); group.add(window); }
    const door = new THREE.Mesh(new THREE.BoxGeometry(2.6, 5.2, .2), mat('#4d5446')); door.position.set(0, -1.4, 5.51); group.add(door);
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(2, 7, 2), mat('#b3ae96')); chimney.position.set(4, 8, 1); group.add(chimney);
    this.scene.add(group);
  }

  makeDock(x: number, z: number) {
    const wood = mat('#a88b62');
    for (let i = 0; i < 15; i++) { const plank = new THREE.Mesh(new THREE.BoxGeometry(9, .45, 1.25), wood); plank.position.set(x, 1.2, z + i * 1.5); this.scene.add(plank); }
    for (let i = 0; i < 4; i++) for (const side of [-1, 1]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(.28, .32, 4, 6), wood); post.position.set(x + side * 3.8, 1, z + i * 7); this.scene.add(post); }
  }

  makeSailboat(x: number, z: number, heading: number) {
    const boat = new THREE.Group(); boat.position.set(x, .8, z); boat.rotation.y = heading;
    const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 7, 4), mat('#965e3e')); hull.scale.set(2, 1.2, 4.7); boat.add(hull);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(.1, .12, 13, 5), mat('#826e4b')); mast.position.y = 6.5; boat.add(mast);
    const sailGeo = new THREE.BufferGeometry(); sailGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 1, 0, 0, 12, 0, 0, 1, 5.5], 3)); sailGeo.computeVertexNormals(); const sail = new THREE.Mesh(sailGeo, mat('#f6ecd4', { side: THREE.DoubleSide })); boat.add(sail); this.scene.add(boat);
  }

  makePlane() {
    const group = new THREE.Group();
    const points = [
      [0, .5, -4.7, -5.6, 0, 3.1, -.55, -.3, 1.9],
      [0, .5, -4.7, -.55, -.3, 1.9, 0, -1, 2.9],
      [0, .5, -4.7, .55, -.3, 1.9, 5.6, 0, 3.1],
      [0, .5, -4.7, 0, -1, 2.9, .55, -.3, 1.9],
    ];
    points.forEach((p, i) => { const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); geometry.computeVertexNormals(); const wing = new THREE.Mesh(geometry, mat(i % 2 ? '#c9c8ae' : '#fff8de', { side: THREE.DoubleSide, flatShading: false })); wing.castShadow = true; group.add(wing); });
    const seam = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-5.6, .02, 3.1), new THREE.Vector3(0, .52, -4.7), new THREE.Vector3(5.6, .02, 3.1)]);
    group.add(new THREE.Line(seam, new THREE.LineBasicMaterial({ color: '#faf4df' })));
    return group;
  }

  makeBirds() {
    for (let i = 0; i < 13; i++) {
      const bird = new THREE.Group(); const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-1.4, .2, 0), new THREE.Vector3(0, 0, .3), new THREE.Vector3(1.4, .2, 0)]);
      bird.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: '#36514b' })));
      bird.userData = { phase: i * 1.76, radius: 45 + i * 8, height: 95 + i * 3 }; this.birds.push(bird); this.scene.add(bird);
    }
  }

  makeThermals() {
    const positions = new Float32Array(thermals.length * 100 * 3);
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const points = new THREE.Points(geometry, new THREE.PointsMaterial({ color: '#fff0b1', size: .55, transparent: true, opacity: .6, depthWrite: false })); points.frustumCulled = false; this.scene.add(points); return points;
  }

  hitsObstacle(x: number, y: number, z: number): boolean {
    return this.obstacles.some(obstacle => y > obstacle.y - 1 && y < obstacle.y + obstacle.height + 1 && Math.hypot(x - obstacle.x, z - obstacle.z) < obstacle.radius + 1.2);
  }

  update(time: number, position: THREE.Vector3, heading: number, speed: number) {
    this.sun.position.set(position.x - 220, position.y + 330, position.z - 230); this.sun.target.position.copy(position);
    this.water.material.uniforms.time.value = time;
    this.birds.forEach(bird => { const { phase, radius, height } = bird.userData; const a = time * .08 + phase; bird.position.set(-95 + Math.sin(a) * radius, height + Math.sin(time + phase) * 2, -140 + Math.cos(a) * radius); bird.rotation.y = -a; bird.scale.y = .8 + Math.sin(time * 4 + phase) * .5; });
    const attr = this.thermalPoints.geometry.getAttribute('position');
    thermals.forEach((thermal, k) => { for (let i = 0; i < 100; i++) { const a = i * 2.4 + time * .22, h = (i * .83 + time * 5) % 85, r = 5 + (i % 15) * .7; attr.setXYZ(k * 100 + i, thermal.x + Math.cos(a) * r, h, thermal.z + Math.sin(a) * r); } }); attr.needsUpdate = true;
    const windAttr = this.wind.geometry.getAttribute('position');
    for (let i = 0; i < 60; i++) { const a = i * 2.399, r = 12 + i % 15, t = ((i * 3.77 + time * speed) % 85) - 45; const x = position.x + Math.cos(a) * r + Math.sin(heading) * t, y = position.y + Math.sin(a) * r, z = position.z - Math.cos(heading) * t; windAttr.setXYZ(i * 2, x, y, z); windAttr.setXYZ(i * 2 + 1, x + Math.sin(heading) * 2.2, y + .03, z - Math.cos(heading) * 2.2); } windAttr.needsUpdate = true;
  }
}
