import * as THREE from 'three';
import type { ArchitectureBuilder } from './architecture.ts';
import { roofHeight, type Building } from './architecture-data.ts';

export function buildingTheme(b: Building) {
  if (['garden', 'rooftop'].includes(b.id)) return 'glasshouse';
  if (b.id === 'observatory') return 'observatory';
  if (b.id === 'market') return 'market';
  if (b.id === 'warehouse' || b.id === 'depot') return 'industrial';
  if (b.id === 'clock' || b.id === 'watch') return 'tower';
  if (b.style === 'temple') return b.region === 'observatory' ? 'ruin' : b.region === 'aqueduct' ? 'waterworks' : 'sanctuary';
  if (b.id === 'lock') return 'waterworks';
  if (b.style === 'mill') return 'timber';
  if (b.id === 'post') return 'post';
  if (b.id === 'ridge-inn') return 'lodge';
  return b.style === 'archive' ? 'library' : 'manor';
}
export function palette(b: Building) {
  const theme = buildingTheme(b);
  const colors: Record<string, [string, string, string, string]> = {
    manor: ['#d5c5a2', '#426e67', '#7c6045', '#c3a778'],
    timber: ['#b99462', '#785544', '#654d38', '#ac976c'],
    glasshouse: ['#a7c6b5', '#517b6c', '#4e7464', '#c1c6ad'],
    industrial: ['#a67c65', '#617174', '#4d6061', '#a4a28c'],
    post: ['#c7947e', '#587a80', '#f0d8aa', '#c3ad87'],
    market: ['#d3b18c', '#ac6954', '#836a46', '#bdad8c'],
    tower: ['#adb7a9', '#66788a', '#667365', '#b5b09a'],
    sanctuary: ['#c7c2a3', '#a2ac8b', '#aaa77e', '#c4c4a6'],
    waterworks: ['#9bab9d', '#6b9185', '#adb79e', '#94a99f'],
    ruin: ['#a6b3b0', '#75858d', '#82958e', '#a5b4aa'],
    observatory: ['#9caeba', '#638d91', '#b5a374', '#a2b4b8'],
    lodge: ['#a4927e', '#5c7181', '#695b4a', '#baa483'],
    library: ['#b5bba9', '#6c7f7a', '#796e53', '#c3b58f'],
  };
  const [wall, roof, trim, floor] = colors[theme]; return { wall, roof, trim, floor };
}
function cylinder(a: ArchitectureBuilder, x: number, y: number, z: number, r: number, h: number, color: string, top = r) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, r, h, 12), new THREE.MeshStandardMaterial({ color, roughness: .7 })); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; a.scene.add(mesh);
  a.solids.push(new THREE.Box3(new THREE.Vector3(x-r,y-h/2,z-r), new THREE.Vector3(x+r,y+h/2,z+r))); return mesh;
}
export function themedWall(a: ArchitectureBuilder, b: Building, x: number, z: number, y: number, h: number, length: number, opening: number, alongX: boolean) {
  const theme = buildingTheme(b), c = palette(b);
  const place = (offset: number, yy: number, w: number, hh: number, depth: number, color: string, solid = true) => a.box(x+(alongX?offset:0), yy, z+(alongX?0:offset), alongX?w:depth, hh, alongX?depth:w, color, solid);
  if (['sanctuary', 'market', 'glasshouse', 'ruin'].includes(theme) && !(theme === 'sanctuary' && !alongX)) {
    for (const side of [-1, 1]) {
      const span = (length-opening)/2, center = side*(opening/2+span/2);
      if (theme === 'glasshouse') {
        place(center,y+5,span,10,4,c.wall);
        const glass = new THREE.Mesh(new THREE.BoxGeometry(alongX?span:1,h-16,alongX?1:span), new THREE.MeshStandardMaterial({ color:'#aacdbb', transparent:true, opacity:.2, roughness:.25, side:THREE.DoubleSide, depthWrite:false })); glass.position.set(x+(alongX?center:0),y+h/2,z+(alongX?0:center)); a.scene.add(glass);
        a.solids.push(new THREE.Box3().setFromObject(glass));
        for (let t = 0; t <= span; t += 18) place(side*(opening/2+t),y+h/2,2,h,3,c.trim);
        for (const yy of [.3,.65,.98]) place(center,y+h*yy,span,2,3,c.trim);
      } else {
        for (const offset of [opening/2+4, length/2-5]) { const xx=x+(alongX?side*offset:0), zz=z+(alongX?0:side*offset); cylinder(a,xx,y+h/2,zz,theme==='sanctuary'?5:3.5,h,c.wall); place(side*offset,y+4,14,8,14,c.trim); place(side*offset,y+h-5,14,8,14,c.trim); }
        if (theme === 'ruin') place(center,y+9,span,18,7,c.wall);
      }
    }
    place(0,y+h-3,length+6,6,9,c.trim); return;
  }
  a.wall(x,z,y,h,length,opening,c.wall,alongX);
  // Material-specific courses, siding and tall framing replace identical plaster faces.
  for (const side of [-1,1]) {
    const span=(length-opening)/2, center=side*(opening/2+span/2);
    if (theme==='industrial') for(let yy=6;yy<h;yy+=9) { place(center,y+yy,span,.8,4.3,'#c3a98b',false); for(let t=7;t<span;t+=16) place(side*(opening/2+t+(Math.floor(yy/9)%2)*5),y+yy-4,.7,7,4.4,'#c3a98b',false); }
    if (['timber','lodge'].includes(theme)) { for(let yy=9;yy<h;yy+=10) place(center,y+yy,span,1.2,4.4,'#8a7350',false); for(let t=8;t<span;t+=29) place(side*(opening/2+t),y+h/2,3,h,6,c.trim); }
    if (theme==='tower') for(let yy=0;yy<h;yy+=18) place(center,y+yy,span,2,5,'#879786',false);
    if (theme==='post' || theme==='library') for(const offset of [opening/2+8,length/2-8]) place(side*offset,y+h/2,7,h,7,c.trim);
  }
}
export function themedFurniture(a: ArchitectureBuilder, b: Building, y: number, level: number) {
  const theme=buildingTheme(b), {x,z,width:w,depth:d}=b;
  for (const side of [-1,1]) {
    const px=x+side*(w/2-42), front=z+d/2-43, rear=z-d/2+13;
    if (['manor','library','lodge','post'].includes(theme)) {
      a.shelf(px,y,rear,56,theme==='post'?'store':b.style); a.desk(px,y,front);
      if (w>=330) a.desk(x+side*(w/2-44),y,z-d/6-31);
      if(theme==='post') for(let row=0;row<4;row++) for(let col=0;col<5;col++) { a.box(px-22+col*11,y+7+row*11,rear+11,8,8,6,'#eee0b5',false); a.box(px-22+col*11,y+7+row*11,rear+14.1,5,.5,.2,'#bf7d60',false); }
    } else if (theme==='glasshouse' || theme==='market') {
      for (const pz of [front,rear+12]) {
        a.box(px,y+8,pz,48,16,22,theme==='glasshouse'?'#b39870':'#92724e');
        for (let i=0;i<5;i++) cylinder(a,px-17+i*8,y+(theme==='glasshouse'?22:20),pz,3.3,theme==='glasshouse'?13:9,theme==='glasshouse'?'#6e9567':['#dfb26d','#ad8261','#bcb171'][i%3],1);
        if(theme==='market') { a.box(px,y+41,pz,53,2,30,side===1?'#c38565':'#668a7a'); for(let i=0;i<4;i++) a.box(px-22+i*14,y+42.2,pz,6,.5,30,'#ede0b6',false); for(const end of [-1,1]) a.box(px+end*24,y+21,pz+12,2,42,2,'#8e754b'); }
      }
    } else if (theme==='industrial' || theme==='timber') {
      a.desk(px,y,front,'#708079');
      for(const pz of [rear+7,rear+35]) { cylinder(a,px,y+14,pz,12,28,'#99734c'); for(const yy of [5,23]) cylinder(a,px,y+yy,pz,12.5,2,'#5a6960'); }
      if(level===0) { a.box(px,y+47,front-4,49,2,4,'#5e685a'); for(let i=0;i<4;i++) a.box(px-18+i*12,y+40,front-4,2,12,2,'#bbc3a5'); }
    } else if (theme==='waterworks') {
      cylinder(a,px,y+16,rear+14,18,32,'#6c9793'); cylinder(a,px,y+33,rear+14,19,2,'#b8b996');
      a.box(px,y+2,front,46,4,37,'#bcc4ac'); a.box(px,y+4.1,front,38,.2,28,'#6c9f9c',false);
      for(const dx of [-20,20]) a.box(px+dx,y+12,rear+26,3,24,3,'#b69463');
    } else if (theme==='sanctuary') {
      a.box(px,y+3,front,54,6,38,'#b0b69a'); a.box(px,y+6.1,front,43,.2,28,'#71a49a',false);
      cylinder(a,px,y+9,rear+14,12,18,'#b0b191',8); const gong=new THREE.Mesh(new THREE.TorusGeometry(16,1.1,6,32),new THREE.MeshStandardMaterial({color:'#c8ab6a',metalness:.6})); gong.position.set(px,y+31,rear+14); a.scene.add(gong);
    } else if (theme==='tower') {
      a.box(px,y+5,rear+16,42,10,25,'#8b9680');
      const cog=new THREE.Mesh(new THREE.TorusGeometry(16,3,5,16),new THREE.MeshStandardMaterial({color:'#b19960'})); cog.position.set(px,y+28,rear+13); a.scene.add(cog); a.solids.push(new THREE.Box3().setFromObject(cog));
      for(let i=0;i<8;i++) a.box(px+Math.cos(i*Math.PI/4)*17,y+28+Math.sin(i*Math.PI/4)*17,rear+13,5,5,6,'#b19960');
    } else if (theme==='observatory' || theme==='ruin') {
      cylinder(a,px,y+9,front,13,18,'#7d908c');
      const instrument=cylinder(a,px,y+25,front,6,25,'#b4a578'); instrument.rotation.z=.65; a.solids[a.solids.length-1].setFromObject(instrument);
      a.desk(px,y,rear+12,'#647a7b');
      for(let i=0;i<3;i++) a.box(px-12+i*12,y+34,rear+12,10,.5,16,'#d8d8b3',false);
    }
  }
}

/** Roofs share the clear thermal opening but have different structural silhouettes. */
export function specialRoof(a: ArchitectureBuilder,b: Building,hole:number): boolean {
  const theme=buildingTheme(b), c=palette(b), {x,z,width:w,depth:d}=b, roof=roofHeight(b);
  if (['manor','timber','lodge','post','library'].includes(theme)) return false;
  if(theme==='glasshouse') {
    // A light iron-and-glass grid, with an open atrium vent.
    for(const side of [-1,1]) for(let zz=-d/2;zz<=d/2;zz+=22) a.box(x+side*(w/2+hole/2)/2,roof+6,z+zz,w/2-hole/2+6,2,2,c.roof);
    for(const side of [-1,1]) for(let xx=-w/2;xx<=w/2;xx+=22) a.box(x+xx,roof+6,z+side*(d/2+hole/2)/2,2,2,d/2-hole/2+6,c.roof);
    for(const side of [-1,1]) { a.box(x+side*(hole/2+2),roof+7,z,3,8,d,c.roof); a.box(x,roof+7,z+side*(hole/2+2),w,8,3,c.roof); }
    const glass=new THREE.MeshStandardMaterial({color:'#b2d5bc',transparent:true,opacity:.2,roughness:.2,side:THREE.DoubleSide,depthWrite:false});
    for(const side of [-1,1]) for(const axis of ['x','z']) { const pane=new THREE.Mesh(new THREE.BoxGeometry(axis==='x'?w/2-hole/2:hole,1,axis==='x'?d:d/2-hole/2),glass); pane.position.set(x+(axis==='x'?side*(w/2+hole/2)/2:0),roof+5,z+(axis==='z'?side*(d/2+hole/2)/2:0)); a.scene.add(pane); a.solids.push(new THREE.Box3().setFromObject(pane)); }
    return true;
  }
  for (const side of [-1,1]) {
    a.box(x+side*(w/2+hole/2)/2,roof,z,w/2-hole/2,3,d,c.roof);
    a.box(x,roof,z+side*(d/2+hole/2)/2,hole,3,d/2-hole/2,c.roof);
  }
  if(theme==='sanctuary' || theme==='waterworks') {
    for(let tier=0;tier<3;tier++) for(const side of [-1,1]) {
      a.box(x+side*(w/2-tier*7),roof+5+tier*6,z,12,6,d+20-tier*12,c.roof);
      a.box(x,roof+5+tier*6,z+side*(d/2-tier*7),w+20-tier*12,6,12,c.roof);
    }
    // Monumental corner pylons break the long horizontal cornice.
    for(const sx of [-1,1]) for(const sz of [-1,1]) for(let tier=0;tier<3;tier++) a.box(x+sx*(w/2-15),roof+18+tier*9,z+sz*(d/2-15),26-tier*5,9,26-tier*5,'#bdc2a3');
  } else if(theme==='industrial') {
    for(const side of [-1,1]) for(let zz=-d/2+15;zz<d/2;zz+=42) { a.box(x+side*(w/2+hole/2)/2,roof+9,z+zz,w/2-hole/2,3,35,c.roof,true,.0,.0); a.box(x+side*(w/2+hole/2)/2,roof+4,z+zz-18,w/2-hole/2,9,2,'#91aca5'); }
    a.box(x-w/2+14,roof+30,z-d/2+20,15,60,15,'#775d4d');
    a.box(x+w/2-20,roof+22,z+d/2-20,5,44,5,'#576767'); a.box(x+w/2-38,roof+42,z+d/2-20,41,4,4,'#576767');
  } else if(theme==='market') {
    for(const side of [-1,1]) for(let xx=hole/2+7;xx<w/2;xx+=14) a.box(x+side*xx,roof+5,z,7,3,d+15,Math.floor(xx/14)%2?'#b76b57':'#ead6a6');
    for(const side of [-1,1]) a.box(x,roof+4,z+side*(d/2+hole/2)/2,hole,3,d/2-hole/2,'#d9bf8f');
  } else if(theme==='tower' || theme==='ruin') {
    for(const side of [-1,1]) { for(let offset=-w/2;offset<w/2;offset+=23) a.box(x+offset,roof+7,z+side*d/2,12,theme==='ruin'?9+Math.abs(offset%13):14,9,c.wall); for(let offset=-d/2;offset<d/2;offset+=23) a.box(x+side*w/2,roof+7,z+offset,9,14,12,c.wall); }
  }
  if(b.id==='clock') {
    // Two open bell turrets flank the warm shaft instead of capping its exit.
    for(const side of [-1,1]) {
      const px=x+side*(w/2-24),pz=z-d/2+26;
      for(const dx of [-13,13]) for(const dz of [-13,13]) a.box(px+dx,roof+22,pz+dz,4,44,4,'#aeb89d');
      cylinder(a,px,roof+24,pz,10,15,'#ad9259',6);
      const cap=new THREE.Mesh(new THREE.ConeGeometry(27,32,4),new THREE.MeshStandardMaterial({color:'#647686'})); cap.rotation.y=Math.PI/4; cap.position.set(px,roof+60,pz);a.scene.add(cap);a.solids.push(new THREE.Box3().setFromObject(cap));
    }
  }
  return true;
}
