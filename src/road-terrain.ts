import { ROADS, roadWidthAt } from './settlements.ts';
import { inBuildingCourt, nearTunnel } from './architecture-data.ts';

type Sample = {x:number;z:number;y:number;width:number;anchor:boolean};
type Segment = {a:Sample;b:Sample;length2:number};
type Surface = (x:number,z:number,excavated?:boolean)=>number;
let grid: Map<string,Segment[]> | undefined;
const CELL=128, SHOULDER=34;

function roadProfiles(surface: Surface) {
  grid=new Map();
  const junctions=new Map<string,number>();
  for(const r of ROADS) for(const p of r.points) junctions.set(p.join(','),(junctions.get(p.join(','))??0)+1);
  for(const road of ROADS) {
    const samples:Sample[]=[];
    for(let i=1;i<road.points.length;i++) {
      const [ax,az]=road.points[i-1],[bx,bz]=road.points[i], n=Math.max(1,Math.ceil(Math.hypot(bx-ax,bz-az)/16));
      for(let k=i===1?0:1;k<=n;k++) {
        const x=ax+(bx-ax)*k/n,z=az+(bz-az)*k/n;
        samples.push({x,z,y:surface(x,z,false),width:roadWidthAt(road,x,z),anchor:inBuildingCourt(x,z)||(junctions.get(`${x},${z}`)??0)>1});
      }
    }
    // Cut and fill smooth small humps while preserving shared junction levels.
    for(let pass=0;pass<4;pass++) {
      const previous=samples.map(p=>p.y);
      for(let i=1;i<samples.length-1;i++) if(!samples[i].anchor) samples[i].y=(previous[i-1]+2*previous[i]+previous[i+1])/4;
    }
    for(let i=1;i<samples.length;i++) {
      const a=samples[i-1],b=samples[i],length2=(a.x-b.x)**2+(a.z-b.z)**2;
      if(length2<.001)continue;
      const segment={a,b,length2},margin=Math.max(a.width,b.width)/2+SHOULDER;
      for(let x=Math.floor((Math.min(a.x,b.x)-margin)/CELL);x<=Math.floor((Math.max(a.x,b.x)+margin)/CELL);x++)
        for(let z=Math.floor((Math.min(a.z,b.z)-margin)/CELL);z<=Math.floor((Math.max(a.z,b.z)+margin)/CELL);z++) {
          const key=x+','+z;if(!grid.has(key))grid.set(key,[]);grid.get(key)!.push(segment);
        }
    }
  }
}

export function gradeRoadGround(x:number,z:number,excavated:boolean,surface:Surface) {
  const original=surface(x,z,excavated);
  // Keep basements, level forecourts and existing cave interiors intact.
  if(inBuildingCourt(x,z)||nearTunnel(x,z,8))return original;
  if(!grid)roadProfiles(surface);
  let level=0,weight=0,influence=0;
  for(const {a,b,length2} of grid!.get(Math.floor(x/CELL)+','+Math.floor(z/CELL))??[]) {
    const t=Math.max(0,Math.min(1,((x-a.x)*(b.x-a.x)+(z-a.z)*(b.z-a.z))/length2));
    const distance=Math.hypot(x-a.x-(b.x-a.x)*t,z-a.z-(b.z-a.z)*t),width=a.width+(b.width-a.width)*t;
    const edge=Math.max(0,distance-width/2),u=Math.min(1,edge/SHOULDER),fade=1-u*u*(3-2*u);
    if(fade<=0)continue;
    const w=fade/(1+distance*distance);
    level+=(a.y+(b.y-a.y)*t)*w;weight+=w;influence=Math.max(influence,fade);
  }
  return weight?original+(level/weight-original)*influence:original;
}
