import * as THREE from 'three';
import { ArchitectureBuilder } from './architecture.ts';
import { BUILDINGS, nearBuilding, nearTunnel } from './architecture-data.ts';
import { HARBORS, ROADS, roadDistance, roadWidthAt } from './settlements.ts';
import { groundHeight } from './world.ts';

export function buildSettlements(scene: THREE.Scene, solids: THREE.Box3[], label: (s: string, c?: string) => THREE.Object3D) {
  const b = new ArchitectureBuilder(scene, solids), vertices: number[] = [], colors: number[] = [];
  const lamps: {x:number;z:number}[]=[];
  const joins=(points:[number,number][])=>points.map((p,i)=>{
    const before=points[Math.max(0,i-1)],after=points[Math.min(points.length-1,i+1)];
    const n=(a:number[],b:number[])=>{const d=Math.hypot(b[0]-a[0],b[1]-a[1])||1;return [(b[1]-a[1])/d,-(b[0]-a[0])/d];};
    const a=n(before,p),c=n(p,after);
    if(i===0)return c;if(i===points.length-1)return a;
    const denominator=Math.max(.5,1+a[0]*c[0]+a[1]*c[1]);
    return [(a[0]+c[0])/denominator,(a[1]+c[1])/denominator];
  });
  // Graded carriageways with contrasting pavements at the scale of the buildings.
  const addStrip = (road: typeof ROADS[number], ax:number,az:number,bx:number,bz:number,left:number,right:number,color:string,normalA:number[],normalB:number[]) => {
    const carriage=left===-.67;
    const corners=[[ax,az,left,0],[bx,bz,left,1],[bx,bz,right,1],[ax,az,right,0]].map(([x,z,side,end])=>{
      const normal=end?normalB:normalA,width=roadWidthAt(road,x,z),xx=x+normal[0]*side*width/2,zz=z+normal[1]*side*width/2;
      // A tiny surface offset lets crossing carriageways cover the other road's kerb.
      return [xx,Math.max(3.5,groundHeight(xx,zz,false))+(carriage?1.05:.65),zz];
    });
    const c=new THREE.Color(color);
    for(const i of [0,2,1,0,3,2]) {vertices.push(...corners[i]);colors.push(c.r,c.g,c.b);}
  };
  for (const road of ROADS) {
    const miters=joins(road.points);
    for (let i=1;i<road.points.length;i++) {
      const [ax,az]=road.points[i-1],[bx,bz]=road.points[i],length=Math.hypot(bx-ax,bz-az),steps=Math.max(1,Math.ceil(length/8));
      const nx=(bz-az)/(length||1),nz=-(bx-ax)/(length||1),yaw=Math.atan2(bx-ax,bz-az);
      for(let j=0;j<steps;j++) {
        const x0=ax+(bx-ax)*j/steps,z0=az+(bz-az)*j/steps,x1=ax+(bx-ax)*(j+1)/steps,z1=az+(bz-az)*(j+1)/steps;
        const x=(x0+x1)/2,z=(z0+z1)/2,width=roadWidthAt(road,x,z),y=Math.max(3.5,groundHeight(x,z,false))+.8;
        if(nearBuilding(x,z,5))continue;
        const normalA=j===0?miters[i-1]:[nx,nz],normalB=j===steps-1?miters[i]:[nx,nz];
        if(road.kind==='rail') {
          addStrip(road,x0,z0,x1,z1,-1,1,'#998f79',normalA,normalB);
          b.box(x,y+.3,z,26,.7,2.5,'#705d46',false,yaw);
          for(const side of [-1,1])b.box(x+nx*side*9,y+1,z+nz*side*9,1,1.2,9,'#60746c',false,yaw);
        } else {
          addStrip(road,x0,z0,x1,z1,-1,-.72,'#c9c3ad',normalA,normalB);
          addStrip(road,x0,z0,x1,z1,-.72,-.67,'#e4d9bd',normalA,normalB);
          addStrip(road,x0,z0,x1,z1,-.67,.67,road.kind==='street'?'#929c8f':'#b2a58a',normalA,normalB);
          addStrip(road,x0,z0,x1,z1,.67,.72,'#e4d9bd',normalA,normalB);
          addStrip(road,x0,z0,x1,z1,.72,1,'#c9c3ad',normalA,normalB);
        }
        if(j%10===0&&groundHeight(x,z,false)<2)for(const side of [-1,1])b.box(x+nx*side*(width/2-2),1.7,z+nz*side*(width/2-2),4,5,4,'#8a8874');
        if(j%16===0&&road.kind!=='rail') {
          const xx=x+nx*width*.43,zz=z+nz*width*.43,floor=groundHeight(xx,zz,false);
          if(floor>4&&!nearBuilding(xx,zz,20)&&!HARBORS.some(h=>Math.hypot(xx-h.x,zz-h.z)<115||(Math.abs(xx-h.x)<26&&zz>h.z&&zz<h.z+240))&&!lamps.some(l=>Math.hypot(xx-l.x,zz-l.z)<45)) {
            lamps.push({x:xx,z:zz});
            b.box(xx,floor+1.5,zz,7,3,7,'#a9aa95');
            b.box(xx,floor+24,zz,1.8,48,1.8,'#5c7065');
            b.box(xx,floor+49,zz,6,7,6,'#f4d694',false);
            b.box(xx,floor+53,zz,8,1.5,8,'#54736c',false);
          }
        }
      }
    }
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); geometry.computeVertexNormals();
  const roads = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide })); roads.receiveShadow = true; scene.add(roads);
  const groundProps: {x:number;y:number;z:number;width:number;depth:number;kind:string}[]=[];
  const levelFootprint=(x:number,z:number,width:number,depth:number) => {
    const heights=[[-1,-1],[-1,1],[1,-1],[1,1]].map(([sx,sz])=>groundHeight(x+sx*width/2,z+sz*depth/2,false));
    return Math.max(...heights)-Math.min(...heights)<1.2 ? Math.max(...heights) : null;
  };
  for (const site of BUILDINGS) {
    const front=site.z+site.depth/2,industrial=['mill','store'].includes(site.style),temple=site.style==='temple';
    const floor=site.ground-4;
    // A level paved forecourt joins the existing front steps to its approach road.
    b.box(site.x,floor+.25,front+33,site.width+16,.5,62,temple?'#c7c3aa':'#bdbba4',false);
    for(let row=1;row<4;row++)b.box(site.x,floor+.53,front+row*16,site.width+12,.08,.5,'#a4a58f',false);
    for (const side of [-1,1]) {
      const x=site.x+side*(site.width/2+26);
      for(let j=0;j<5;j++) {
        const z=front-20-j*site.depth/5,y=levelFootprint(x,z,18,30);
        // No free-standing furniture on embankments, across roads or in colonnades.
        if(y===null||roadDistance(x,z)<20||nearBuilding(x,z,12)||temple)continue;
        groundProps.push({x,y,z,width:18,depth:30,kind:'planter'});
        b.box(x,y+3,z,18,6,30,'#a39a7d');b.box(x,y+9,z,15,10,26,'#648369',false);
      }
      const x2=site.x+side*site.width*.34,z2=front+36;
      const y2=levelFootprint(x2,z2,industrial?48:32,22);
      if(y2===null)continue;
      groundProps.push({x:x2,y:y2,z:z2,width:industrial?48:32,depth:22,kind:industrial?'freight stand':'bench'});
      if(industrial) {
        for(let j=0;j<3;j++)b.box(x2+side*j*9,y2+6,z2,8,12,10,['#ab895a','#9c7550','#bd9e70'][j]);
        b.box(x2,y2+18,z2,25,2,22,'#607c70',false);
      } else {
        b.box(x2,y2+8,z2,28,2,10,'#876a4e');
        for(const dx of [-10,10])b.box(x2+dx,y2+4,z2,2,8,7,'#655844');
        b.box(x2,y2+14,z2-5,28,9,2,'#947858');
      }
    }
  }
  const pads: THREE.Object3D[] = [];
  for (const h of HARBORS) {
    const floor = h.y - 5;
    b.box(h.x, floor + 3.8, h.z, 36, .6, 40, '#446e68', false);
    for (const side of [-1, 1]) {
      b.box(h.x + side * 17, floor + 4.15, h.z, .9, .2, 38, '#ead39b', false);
      b.box(h.x, floor + 4.15, h.z + side * 19, 35, .2, .9, '#ead39b', false);
      // Low guidance lamps leave the entire approach open.
      b.box(h.x + side * 21, floor + 3, h.z + 20, 2, 5, 2, '#91c6a8', false);
    }
    b.box(h.x, floor + 4.2, h.z, 16, .2, 2, '#ead39b', false);
    for (const side of [-1, 1]) b.box(h.x + side * 7, floor + 4.2, h.z, 2, .2, 14, '#ead39b', false);
    const tag = label('L · LAND AT ' + h.name.toUpperCase(), '#a9ead0'); tag.position.set(h.x, floor + 28, h.z); tag.scale.multiplyScalar(.78); scene.add(tag); pads.push(tag);
    const sign = label(h.workshop ? 'WORKSHOP · REST · TRADE' : h.market ? 'LANDING · REST · MARKET' : 'PILGRIM REST', '#ffe3ac');
    const building = BUILDINGS.find(s => s.id === h.building)!; sign.position.set(h.x, floor + 43, building.z + building.depth / 2 + 5); sign.scale.multiplyScalar(.75); scene.add(sign);
  }
  // Mature trees scale with the tall interiors. Spacing keeps roads and approaches flyable.
  const forest: { x: number; y: number; z: number; h: number; broad: boolean }[] = [];
  for (let i = 0; i < 1800; i++) {
    const x = Math.sin(i * 73.317) * 1470, z = 620 - ((i * 197.371) % 4350), y = groundHeight(x, z, false);
    if (y < 5 || nearBuilding(x, z, 95) || nearTunnel(x, z, 40) || roadDistance(x, z) < 48 || HARBORS.some(h => Math.hypot(x - h.x, z - h.z) < 150)) continue;
    if (forest.some(t => Math.hypot(t.x - x, t.z - z) < 42)) continue;
    forest.push({ x, y, z, h: (z < -2550 ? 65 : 85) + i % 65, broad: z > -1800 && i % 3 !== 0 });
  }
  const pine = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 8), new THREE.MeshStandardMaterial({ roughness: 1 }), forest.length * 3);
  const crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true }), forest.length * 3);
  const tree = new THREE.Object3D();
  forest.forEach((t, i) => {
    b.box(t.x, t.y + t.h * .28, t.z, 3.5, t.h * .56, 3.5, '#7e6b50');
    for (let layer = 0; layer < 3; layer++) {
      tree.position.set(t.x + (t.broad ? Math.sin(layer * 3) * 12 : 0), t.y + t.h * (.52 + layer * .14), t.z + (t.broad ? Math.cos(layer * 3) * 10 : 0));
      const width = t.h * (t.broad ? .22 : .21 - layer * .035);
      tree.scale.set(width, t.h * (t.broad ? .24 : .5), width); tree.updateMatrix();
      const active = t.broad ? crowns : pine, inactive = t.broad ? pine : crowns;
      active.setMatrixAt(i * 3 + layer, tree.matrix); active.setColorAt(i * 3 + layer, new THREE.Color(['#476e59', '#6f8858', '#82956b', '#527a69'][i % 4]));
      tree.scale.setScalar(0); tree.updateMatrix(); inactive.setMatrixAt(i * 3 + layer, tree.matrix);
    }
  });
  pine.castShadow = crowns.castShadow = true; scene.add(pine, crowns); b.flush();
  return { pads, forest, groundProps };
}
