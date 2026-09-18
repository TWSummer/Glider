// Development-only model inspection; no game state or save storage is touched.
import * as THREE from 'three';
import { makeEnemy, makePickup, animateEnemy, interactionBadge, ENEMY_NAMES, type EnemyKind } from './game-visuals';
const scene = new THREE.Scene(); scene.background = new THREE.Color('#e8eddf');
scene.add(new THREE.HemisphereLight('#fff6da','#5e877a',3)); const sun=new THREE.DirectionalLight('#fff2d9',2); sun.position.set(-30,40,30); scene.add(sun);
const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,1000); camera.position.set(0,37,147); camera.lookAt(0,-8,0);
const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setSize(innerWidth,innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.toneMapping=THREE.ACESFilmicToneMapping; document.body.appendChild(renderer.domElement);
function label(text:string,x:number,y:number){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=64;const c=canvas.getContext('2d')!;c.fillStyle='#31534b';c.font='500 28px sans-serif';c.textAlign='center';c.fillText(text,256,44);const texture=new THREE.CanvasTexture(canvas);const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthWrite:false}));sprite.scale.set(23,2.88,1);sprite.position.set(x,y,4);scene.add(sprite);}
const kinds=Object.keys(ENEMY_NAMES) as EnemyKind[];
const enemies=kinds.map((kind,i)=>{const e=makeEnemy(kind);e.mesh.position.set((i-2.5)*23,18,0);scene.add(e.mesh);label(e.name,(i-2.5)*23,10);return e;});
const items=[['parts','Salvage crate',{parts:10}],['ammo','Rubber bands',{ammo:10}],['battery','Charge cell',{charge:80}],['estate-note-a','Notebook',{parts:5}],['fan-coil','Copper winding',{parts:5}],['fan-blades','Propeller',{parts:5}],['fan-housing','Fan housing',{parts:5}],['sigil-echo','Valley sigil',{cores:1}],['echo-one','Tuning stone',{parts:5}],['survey-east','Survey plate',{parts:5}],['lens-west','Lens fragment',{cores:1}],['skyheart','Skyheart',{relic:true}]] as const;
items.forEach(([id,name,reward],i)=>{const g=makePickup({id,reward,x:0,y:0,z:0}),x=(i%6-2.5)*23,y=-Math.floor(i/6)*19-2;g.position.set(x,y,0);g.rotation.y=-.15;scene.add(g);label(name,x,y-6);});
[['! REQUEST','gold'],['? TURN IN','gold'],['USE','blue'],['✓ READ','green']].forEach(([text,tone],i)=>{const badge=interactionBadge(text,tone as 'gold'|'blue'|'green');if(badge instanceof THREE.Sprite) badge.material.sizeAttenuation=true; badge.scale.set(28,7,1);badge.position.set((i-1.5)*31,-38,0);scene.add(badge);});
function animate(t:number){requestAnimationFrame(animate);enemies.forEach(e=>animateEnemy(e.kind,e.moving,t/1000));renderer.render(scene,camera);}requestAnimationFrame(animate);
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
