import { meters } from './units';
import { groundHeight } from './world';
import { BUILDINGS } from './architecture-data';
import { ROADS, HARBORS } from './settlements';
import { CHART_CELL, isCharted } from './exploration';
import type { Progress } from './progression';
import type { FlightState, Point3 } from './flight';

const LEFT = -1700, TOP = -3950, WIDTH = 3400, HEIGHT = 4750, SCALE = .14;
let terrain: HTMLCanvasElement | undefined;
function chartTexture() {
  if (terrain) return terrain;
  terrain = document.createElement('canvas'); terrain.width = WIDTH * SCALE; terrain.height = HEIGHT * SCALE;
  const ctx = terrain.getContext('2d')!, pixels = ctx.createImageData(terrain.width, terrain.height);
  const heights = new Float32Array(terrain.width * terrain.height);
  for (let y = 0; y < terrain.height; y++) for (let x = 0; x < terrain.width; x++) heights[y * terrain.width + x] = groundHeight(LEFT + x / SCALE, TOP + y / SCALE, false);
  for (let y = 0; y < terrain.height; y++) for (let x = 0; x < terrain.width; x++) {
    const i = y * terrain.width + x, h = heights[i], edge = x > 0 ? heights[i - 1] : h;
    const shade = Math.max(-18, Math.min(16, (h - edge) * .85)), contour = Math.floor(h / 22) !== Math.floor(edge / 22) ? -13 : 0;
    const rgb = h < 2 ? [94, 140, 139] : h > 245 ? [184, 187, 157] : [164 - h * .045, 179 - h * .025, 132 + h * .025];
    for (let c = 0; c < 3; c++) pixels.data[i * 4 + c] = rgb[c] + shade + contour;
    pixels.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  ctx.save(); ctx.scale(SCALE, SCALE); ctx.translate(-LEFT, -TOP);
  for (const r of ROADS) {
    ctx.beginPath(); r.points.forEach(([x,z], i) => i ? ctx.lineTo(x,z) : ctx.moveTo(x,z));
    ctx.strokeStyle = '#7c7c62'; ctx.lineWidth = r.width + 7; ctx.stroke();
    ctx.strokeStyle = r.kind === 'rail' ? '#717362' : '#dfd5af'; ctx.lineWidth = r.kind === 'rail' ? 8 : r.width; ctx.setLineDash(r.kind === 'rail' ? [9, 8] : []); ctx.stroke(); ctx.setLineDash([]);
  }
  for (const b of BUILDINGS) {
    ctx.fillStyle = '#c4b58e'; ctx.strokeStyle = '#526b5d'; ctx.lineWidth = 5;
    ctx.fillRect(b.x - b.width / 2, b.z - b.depth / 2, b.width, b.depth); ctx.strokeRect(b.x - b.width / 2, b.z - b.depth / 2, b.width, b.depth);
    ctx.fillStyle = '#97a788'; ctx.fillRect(b.x - 35, b.z - 35, 70, 70);
  }
  ctx.restore(); return terrain;
}
export function drawLocalMap(ctx: CanvasRenderingContext2D, p: Progress, at: FlightState, goal: Point3 | null, enemies: { position: Point3; boss: boolean }[], lifts: Point3[]) {
  const w = 260, h = 190, zoom = .255, sx = (x: number) => w / 2 + (x - at.x) * zoom, sz = (z: number) => h / 2 + (z - at.z) * zoom;
  ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#243f3d'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#d6dab40c'; ctx.lineWidth = 1;
  for (let x = -h; x < w; x += 18) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x+h,h); ctx.stroke(); }
  ctx.save(); ctx.beginPath();
  for (const key of p.charted) { const [x,z] = key.split(',').map(Number); const cx=sx((x+.5)*CHART_CELL),cy=sz((z+.5)*CHART_CELL),r=CHART_CELL*zoom*.85; ctx.moveTo(cx+r,cy);ctx.arc(cx,cy,r,0,Math.PI*2); }
  ctx.clip(); const texture = chartTexture();
  ctx.drawImage(texture, sx(LEFT), sz(TOP), WIDTH * zoom, HEIGHT * zoom);
  ctx.restore();
  const inside = (x: number, y: number) => x > 10 && x < w - 10 && y > 10 && y < h - 10;
  for (const lift of lifts) if (isCharted(p, lift.x, lift.z) && inside(sx(lift.x), sz(lift.z))) {
    ctx.strokeStyle = '#efd898'; ctx.lineWidth = 1; const x = sx(lift.x), y = sz(lift.z);
    ctx.beginPath(); ctx.moveTo(x - 3,y + 3); ctx.lineTo(x,y - 3); ctx.lineTo(x + 3,y + 3); ctx.stroke();
  }
  for (const hub of HARBORS) if (isCharted(p, hub.x, hub.z) && inside(sx(hub.x), sz(hub.z))) {
    const x = sx(hub.x), y = sz(hub.z); ctx.fillStyle = '#365e54'; ctx.strokeStyle = '#f2e4b9'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(x-6,y-6,12,12,2); ctx.fill(); ctx.stroke(); ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff0c4'; ctx.fillText('H',x,y+3);
  }
  for (const enemy of enemies) if (isCharted(p, enemy.position.x, enemy.position.z) && inside(sx(enemy.position.x),sz(enemy.position.z))) {
    ctx.fillStyle = enemy.boss ? '#ffbd75' : '#af5948'; const x = sx(enemy.position.x), y = sz(enemy.position.z), r = enemy.boss ? 5 : 2.7;
    ctx.beginPath(); ctx.moveTo(x,y-r); ctx.lineTo(x+r,y); ctx.lineTo(x,y+r); ctx.lineTo(x-r,y); ctx.closePath(); ctx.fill();
  }
  if (goal) {
    const x = Math.max(10,Math.min(w-10,sx(goal.x))), y = Math.max(10,Math.min(h-10,sz(goal.z)));
    ctx.strokeStyle = '#f0c38c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x,y,6,0,Math.PI*2); ctx.stroke();
  }
  ctx.strokeStyle = '#fff7d848'; ctx.lineWidth = .6; ctx.setLineDash([2,4]); ctx.beginPath(); ctx.arc(w/2,h/2,58,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
  ctx.save(); ctx.translate(w/2,h/2); ctx.rotate(at.heading + (Math.cos(at.pitch) < 0 ? Math.PI : 0));
  ctx.shadowColor = '#173a32'; ctx.shadowBlur = 4; ctx.fillStyle = '#fff8d8'; ctx.strokeStyle = '#304c43'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(0,-8); ctx.lineTo(5.5,6); ctx.lineTo(0,3); ctx.lineTo(-5.5,6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.fillStyle = '#243f3dcc'; ctx.fillRect(8,h-23,66,15); ctx.strokeStyle = '#eee1b9'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(14,h-14); ctx.lineTo(14+100*zoom,h-14); ctx.stroke(); ctx.font = '8px sans-serif'; ctx.textAlign='left'; ctx.fillStyle='#eee1b9'; ctx.fillText(`${meters(100)} m`,45,h-11);
}
