import { BUILDINGS } from './architecture-data';
import { REGIONS, regionAt } from './atlas';
import { groundHeight } from './world';
import { STATIONS } from './adventure';
import { QUESTS } from './quests';
import type { Progress } from './progression';
import type { Point3 } from './flight';

const W = 1000, H = 820, SCALE = .159;
export const project = (p: { x: number; z: number }) => ({ x: 500 + p.x * SCALE, y: 58 + (p.z + 3900) * SCALE });
const unproject = (x: number, y: number) => ({ x: (x - 500) / SCALE, z: (y - 58) / SCALE - 3900 });
const round = (n: number) => Math.round(n * 10) / 10;
const layout: Record<string, { dx: number; dy: number; side: 'left' | 'right' }> = {
  observatory: { dx: 57, dy: -14, side: 'right' }, aqueduct: { dx: 72, dy: -10, side: 'right' },
  mine: { dx: -65, dy: -9, side: 'left' }, city: { dx: 62, dy: -5, side: 'right' },
  temple: { dx: 63, dy: 14, side: 'right' }, cavern: { dx: -67, dy: -8, side: 'left' },
  hearthside: { dx: 69, dy: -3, side: 'right' }, mill: { dx: -78, dy: 30, side: 'left' },
};

const drawings: Record<string, string> = {
  hearthside: '<path d="M-12 0 0-11 12 0M-9-2V11H9V-2M-3 11V3H3V11M-13 11H13M5-7V-12H9V-3"/>',
  mill: '<path d="M-12 11H11M-5 10-3-6H5L8 10M1-6V-12M-9-7 11 3M-4 8 6-12"/><circle cx="1" cy="-2" r="3"/>',
  cavern: '<path d="M-14 10-10-2-4-10 5-12 12-4 15 10ZM-6 10V3Q0-8 6 3V10M-9-1-3-6M4-7 9-2"/>',
  mine: '<path d="M-10 12 8-9M-11-8Q1-13 13-1M-7-8 12 11M-12 2Q-5-10 5-12"/>',
  city: '<path d="M-14 12H14M-11 12V-2H-4V12M-4 12V-12H4V12M4 12V-5H12V12M-6-12H6M-8 2H-7M-8 6H-7M-1-7H1M-1-2H1M7 0H9M7 5H9"/>',
  temple: '<path d="M-15-4 0-12 15-4ZM-13 11H13M-15 14H15M-10-1V9M-3-1V9M4-1V9M11-1V9"/>',
  aqueduct: '<path d="M-15-8H15V11H10V4Q6-3 2 4V11H-2V4Q-6-3-10 4V11H-15ZM-15-3H15M-12-12V-8M-4-12V-8M4-12V-8M12-12V-8"/>',
  observatory: '<path d="M-13 0A13 13 0 0 1 13 0ZM-11 0V12H11V0M-15 12H15M-4 12V5H4V12M0-13V-17M-4-16H4M-7-2Q-8-9 0-13M3-2Q9-8 0-13"/>',
};
export function mapIcon(id: string, className = '') { return `<svg class="${className}" viewBox="-18 -19 36 38" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${drawings[id]}</svg>`; }

let scenery = '';
// Marching squares traces the same height field used by flight collision. No placeholder islands.
function terrainPaths(): string {
  const step = 4, cols = W / step + 1, rows = H / step + 1;
  const heights = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { const p = unproject(x * step, y * step); heights[y * cols + x] = groundHeight(p.x, p.z, false); }
  const coast: [number, number][][] = [];
  const levels = [1.5, 13, 30, 50, 75, 105, 140, 190, 235, 280, 325];
  let paths = '';
  for (let levelIndex = 0; levelIndex < levels.length; levelIndex++) {
    const level = levels[levelIndex], lines: [number, number][][] = [];
    for (let y = 0; y < rows - 1; y++) for (let x = 0; x < cols - 1; x++) {
      const values = [heights[y * cols + x], heights[y * cols + x + 1], heights[(y + 1) * cols + x + 1], heights[(y + 1) * cols + x]];
      const points = [[x * step, y * step], [(x + 1) * step, y * step], [(x + 1) * step, (y + 1) * step], [x * step, (y + 1) * step]];
      const edges: [number, number][] = [];
      for (let e = 0; e < 4; e++) { const next = (e + 1) % 4; if ((values[e] > level) === (values[next] > level)) continue; const t = (level - values[e]) / (values[next] - values[e]); edges.push([round(points[e][0] + (points[next][0] - points[e][0]) * t), round(points[e][1] + (points[next][1] - points[e][1]) * t)]); }
      for (let e = 0; e < edges.length - 1; e += 2) lines.push([edges[e], edges[e + 1]]);
    }
    // Join shared edge vertices to get continuous coastlines and filled elevation bands.
    const byPoint = new Map<string, number[]>();
    lines.forEach((line, i) => line.forEach(p => { const key = p.join(','); if (!byPoint.has(key)) byPoint.set(key, []); byPoint.get(key)!.push(i); }));
    const used = new Set<number>(), chains: [number, number][][] = [];
    lines.forEach((line, i) => {
      if (used.has(i)) return;
      const chain = [...line]; used.add(i);
      while (true) { const at = chain.at(-1)!, next = byPoint.get(at.join(','))?.find(n => !used.has(n)); if (next === undefined) break; used.add(next); const segment = lines[next]; chain.push(segment[0][0] === at[0] && segment[0][1] === at[1] ? segment[1] : segment[0]); }
      if (chain.length > 3) chains.push(chain);
    });
    const d = chains.map(c => `M${c.map(v => v.join(',')).join('L')}Z`).join('');
    if (levelIndex === 0) { coast.push(...chains); paths += `<path d="${d}" fill="#92b5ad" stroke="#c8d4bb" stroke-width="12" stroke-linejoin="round"/><path d="${d}" fill="#d6d1a7" stroke="#526f62" stroke-width="1.8" fill-rule="evenodd"/>`; }
    else paths += `<path d="${d}" fill="${['', '#c8caa0', '#b5bf94', '#a7b48a', '#a3ac88', '#b1b395', '#bdbaa1', '#cbc5ae', '#d6ceb9', '#e0d8c3', '#e9e0ca'][levelIndex]}" fill-rule="evenodd" stroke="#5f745b" stroke-opacity=".3" stroke-width=".7"/>`;
  }
  // Shore stippling and hachures make the paper map read at a glance.
  let shore = '';
  coast.forEach(c => { for (let i = 3; i < c.length; i += 6) { const [x, y] = c[i]; shore += `<circle cx="${x}" cy="${y}" r=".8" fill="#526e5c" opacity=".45"/>`; } });
  return paths + shore;
}
function mapDecor(): string {
  let trees = '', ridges = '';
  for (let i = 0; i < 430; i++) {
    const x = -1320 + ((i * 743.317) % 2640), z = -3570 + ((i * 313.781) % 4000), height = groundHeight(x, z, false), point = project({ x, z });
    if (height < 9 || height > 88 || Math.sin(x * .008) + Math.cos(z * .009) < -.15 || REGIONS.some(r => Math.hypot((x - r.x), (z - r.z)) < 170)) continue;
    const s = .65 + (i % 3) * .13;
    trees += `<use href="#atlas-tree" transform="translate(${round(point.x)} ${round(point.y)}) scale(${s})"/>`;
  }
  for (const [x, z, size] of [[-250, -3370, 24], [-440, -3510, 19], [-540, -3000, 16], [100, -3320, 18], [-120, -2800, 22], [-160, -745, 14], [-240, -395, 12], [235, -675, 13], [-1080, -1510, 17], [-530, -520, 13]]) {
    const at = project({ x, z }); ridges += `<use href="#atlas-mountain" transform="translate(${round(at.x)} ${round(at.y)}) scale(${size / 20})"/>`;
  }
  const paths = [
    { points: [[0, 356], [130, 445], [350, 535], [600, 505]], kind: 'road' },
    { points: [[-175, 360], [-230, 515], [-390, 535]], kind: 'road' },
    { points: [[-405, -270], [-624, -870], [-690, -990], [-920, -1060]], kind: 'rail' },
    { points: [[646, -1100], [970, -1150], [1015, -2150]], kind: 'road' },
    { points: [[-300, -2260], [90, -2260], [450, -2250], [580, -1990], [695, -1790]], kind: 'canal' },
    { points: [[-80, -2655], [-80, -2945], [-250, -3020]], kind: 'road' },
  ].map(route => { const d = route.points.map(([x, z], i) => { const p = project({ x, z }); return `${i ? 'L' : 'M'}${round(p.x)},${round(p.y)}`; }).join(''); return `<path d="${d}" fill="none" stroke="${route.kind === 'canal' ? '#638b86' : '#6d7055'}" stroke-width="${route.kind === 'canal' ? 3 : 2}" ${route.kind === 'rail' ? 'stroke-dasharray="2 3"' : ''} opacity=".7"/><path d="${d}" fill="none" stroke="#eee1b9" stroke-width=".8" opacity=".7"/>`; }).join('');
  let town = '';
  for (const { x, z } of BUILDINGS.filter(b => b.region === 'city')) { const p = project({ x, z }); town += `<g transform="translate(${p.x} ${p.y})"><path d="M-5-6H5V7H-5Z" fill="#eee0b9" stroke="#737a5d" stroke-width=".9"/><path d="M-6-6 0-10 6-6M0-10V3M-5 7 0 3 5 7" fill="none" stroke="#737a5d" stroke-width=".8"/></g>`; }
  return `<g opacity=".5">${trees}</g>${paths}<g opacity=".66">${ridges}${town}</g>`;
}
function staticMap() {
  if (scenery) return scenery;
  scenery = `<defs>
    <pattern id="atlas-water" width="29" height="22" patternUnits="userSpaceOnUse"><path d="M3 12q4-2 8 0t8 0" fill="none" stroke="#3b6c69" stroke-width=".6" opacity=".18"/></pattern>
    <pattern id="atlas-grain" width="67" height="71" patternUnits="userSpaceOnUse"><circle cx="9" cy="19" r=".6" fill="#344c3c" opacity=".15"/><circle cx="42" cy="47" r=".7" fill="#fff0cc" opacity=".35"/><path d="m15 58 8-1M52 12h4" stroke="#354839" stroke-width=".4" opacity=".13"/></pattern>
    <linearGradient id="atlas-sea" x2=".8" y2="1"><stop stop-color="#acc3b6"/><stop offset="1" stop-color="#769e96"/></linearGradient>
    <radialGradient id="atlas-edge"><stop offset=".68" stop-color="#344e41" stop-opacity="0"/><stop offset="1" stop-color="#203f37" stop-opacity=".2"/></radialGradient>
    <g id="atlas-tree" stroke="#52735b" stroke-width=".8" stroke-linejoin="round"><path d="M0-6-4 1h2l-3 4H5L2 1h2Z" fill="#799575"/><path d="M0 5v3"/></g>
    <g id="atlas-mountain" fill="none" stroke="#5d715c" stroke-width="1"><path d="m-21 10 16-25L13 10M-5-15l-2 13 6-3-4 15M-14 10 8-7l16 17" fill="#cec7aa"/><path d="m-9-9 4 3 3-3M4 0l4 3 3-1M-17 9l8-12M9 8 7 5M-4 9l1-8" opacity=".6"/></g>
  </defs><rect width="1000" height="820" fill="url(#atlas-sea)"/><rect width="1000" height="820" fill="url(#atlas-water)"/>
  ${terrainPaths()}${mapDecor()}<rect width="1000" height="820" fill="url(#atlas-grain)" pointer-events="none"/><rect width="1000" height="820" fill="url(#atlas-edge)" pointer-events="none"/>
  <g class="map-cartouche" fill="#3c5c4d"><path d="M52 58h180M52 65h60" stroke="#57715b" stroke-width="1"/><text x="52" y="91" font-size="10" letter-spacing="3.4">THE WINDWARD COUNTRY</text><text x="49" y="133" font-family="Georgia,serif" font-size="40">Willowmere</text><text x="52" y="158" font-size="11" letter-spacing="5">A VALLEY OF STORIES</text><path d="M52 177h180M126 173l4 4-4 4-4-4Z" fill="none" stroke="#57715b"/><text x="52" y="198" font-family="Georgia,serif" font-style="italic" font-size="13">An explorer’s field atlas</text></g>
  <g transform="translate(143 357)" stroke="#506d5c" fill="none"><circle r="38" stroke-opacity=".45"/><circle r="30" stroke-opacity=".4"/><path d="M0-57 8-8 0 5-8-8ZM0 57 8 8 0-5-8 8ZM-57 0-8-8 5 0-8 8ZM57 0 8-8-5 0 8 8Z" fill="#c3cfb4" stroke-width=".8"/><path d="M0-57 0 5-8-8ZM57 0-5 0 8-8Z" fill="#567460"/><circle r="4" fill="#dcd9b8"/><g stroke="none" fill="#405e4e" text-anchor="middle" font-size="11"><text y="-69">N</text><text y="81">S</text><text x="-73" y="4">W</text><text x="73" y="4">E</text></g></g>
  <g class="map-water-labels" fill="#416c66" font-family="Georgia,serif" font-style="italic" text-anchor="middle" opacity=".7"><text x="745" y="755" font-size="19" letter-spacing="3" transform="rotate(-12 745 755)">Hearthside Lake</text><text x="195" y="603" font-size="13" letter-spacing="2" transform="rotate(-72 195 603)">The western shore</text></g>
  <g transform="translate(58 739)" fill="#456153"><text y="-12" font-size="9" letter-spacing="2">DISTANCE · METRES</text><path d="M0 0H159M0-4V4M79.5-4V4M159-4V4" stroke="#456153" stroke-width="1.3"/><text y="20" font-size="10">0</text><text x="79.5" y="20" font-size="10" text-anchor="middle">500</text><text x="159" y="20" font-size="10" text-anchor="middle">1,000</text></g>`;
  return scenery;
}

function marker(r: typeof REGIONS[number], p: Progress) {
  const found = p.discovered.includes(r.id), pos = project(r), label = layout[r.id];
  const x = pos.x + label.dx, y = pos.y + label.dy, anchor = label.side === 'right' ? 'start' : 'end', end = x + (label.side === 'right' ? -7 : 7);
  const compactLeft = ['mill', 'cavern', 'city'].includes(r.id);
  const shortName: Record<string, string> = { hearthside: 'Hearthside', mill: 'Mill', cavern: 'Caverns', mine: 'Mine', city: 'City', temple: 'Temple', aqueduct: 'Aqueduct', observatory: 'Starfall' };
  return `<g class="atlas-location ${found ? 'is-discovered' : 'is-rumor'}" data-atlas-region="${r.id}" role="button" tabindex="0" aria-label="Select ${r.name}${found ? ', discovered' : ', unexplored'}" aria-pressed="false">
    <path class="map-leader" d="M${pos.x} ${pos.y}L${end} ${y + 5}"/><g transform="translate(${pos.x} ${pos.y})"><circle class="map-icon-halo" r="24"/><circle class="map-icon-disc" r="19"/><g class="map-symbol" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${drawings[r.id]}</g></g>
    <text class="map-location-name" x="${x}" y="${y}" text-anchor="${anchor}">${r.name === 'The Sunken Aqueduct' ? 'Sunken Aqueduct' : r.name}</text><text class="map-location-state" x="${x}" y="${y + 15}" text-anchor="${anchor}">${found ? 'CHARTED' : 'UNCHARTED'}</text>
    <text class="map-location-compact" x="${pos.x + (compactLeft ? -30 : 30)}" y="${pos.y + 5}" text-anchor="${compactLeft ? 'end' : 'start'}" aria-hidden="true">${shortName[r.id]}</text>
  </g>`;
}

export function renderAtlas(p: Progress, position: Point3, pinned: string): string {
  const at = project(position), heading = 'heading' in position && typeof position.heading === 'number' ? position.heading * 180 / Math.PI : p.flight.heading * 180 / Math.PI;
  const selected = pinned.startsWith('place:') ? pinned.slice(6) : regionAt(position).id;
  const discovered = REGIONS.filter(r => p.discovered.includes(r.id)).length;
  const camps = STATIONS.filter(s => p.discovered.includes('station-' + s.id)).map(s => { const q = project(s); return `<g class="map-camp" transform="translate(${q.x} ${q.y})"><title>${s.name} recharge camp</title><path d="m0-6 6 6-6 6-6-6Z" fill="#4e7661" stroke="#eff0ca" stroke-width="1.5"/><path d="m1-4-3 4h3l-2 4 4-5H0Z" fill="#f0e7b7"/></g>`; }).join('');
  return `<section class="atlas-workspace" aria-label="Interactive world atlas" data-selected="${selected}">
    <div class="atlas-map-column"><div class="atlas-map-viewport"><svg class="game-atlas" viewBox="0 0 ${W} ${H}" aria-label="Map of Willowmere. Select a landmark to inspect it. Drag to pan and use the zoom controls to explore." role="group">
      ${staticMap()}<g class="map-camps">${camps}</g><g class="map-locations">${REGIONS.map(r => marker(r, p)).join('')}</g>
      <g class="map-player" transform="translate(${at.x} ${at.y})"><title>Your glider</title><circle class="map-player-pulse" r="16"/><circle r="11" fill="#294e48" stroke="#fff4c7" stroke-width="2"/><path d="M0-8 6 7 0 3-6 7Z" transform="rotate(${heading})" fill="#fff1c0"/></g>
      <rect x="12" y="12" width="976" height="796" rx="3" fill="none" stroke="#e9dfbe" stroke-width="1.2" opacity=".5" pointer-events="none"/>
    </svg><span class="atlas-mobile-charted">${discovered} / 8 regions charted</span><span class="atlas-mobile-north">N ↑</span><div class="atlas-map-tools" role="group" aria-label="Map view controls"><button data-map-action="in" aria-label="Zoom map in" title="Zoom in">+</button><button data-map-action="out" aria-label="Zoom map out" title="Zoom out">−</button><span></span><button data-map-action="player" aria-label="Center map on your glider" title="Find my glider">⌖</button><button data-map-action="reset" aria-label="Fit whole map" title="Whole valley">⛶</button></div><span class="atlas-pan-hint">DRAG TO EXPLORE · SCROLL TO ZOOM</span></div>
    <div class="atlas-legend"><span><i class="legend-player"></i>Your glider</span><span><i class="legend-charted"></i>Charted</span><span><i class="legend-uncharted"></i>Uncharted</span><span><i class="legend-camp"></i>Recharge camp</span><b id="atlas-zoom">100%</b></div></div>
    <aside class="atlas-sidebar"><div class="atlas-progress"><span>YOUR FIELD ATLAS</span><strong>${discovered}<small> / 8</small></strong><p>regions charted</p><div><i style="width:${discovered / 8 * 100}%"></i></div></div>
    <div class="atlas-selection" aria-live="polite">${REGIONS.map(r => { const found = p.discovered.includes(r.id), jobs = QUESTS.filter(q => q.region === r.id && p.accepted.includes(q.id)), done = jobs.filter(q => p.completed.includes(q.id)).length; return `<section data-region-panel="${r.id}" ${selected === r.id ? '' : 'hidden'}><span class="atlas-region-status">${found ? 'DISCOVERED' : 'A RUMOR ON THE WIND'}</span><div class="atlas-detail-icon">${mapIcon(r.id)}</div><h3>${r.name}</h3><span class="atlas-difficulty">${['Gentle air', 'Crosswinds', 'High winds', 'Storm ridge'][r.tier - 1]}<i>${'◆'.repeat(r.tier)}${'◇'.repeat(4 - r.tier)}</i></span><p>${r.subtitle}.</p><p class="atlas-advice">${r.advice}</p>${jobs.length ? `<span class="atlas-quest-count">${done} of ${jobs.length} known stories completed</span>` : ''}<button class="atlas-pin-button" data-track="place:${r.id}">${pinned === 'place:' + r.id ? 'Pinned on your compass' : 'Pin this region'} <span>↗</span></button></section>`; }).join('')}</div>
    <button class="atlas-clear-pin" data-track="none">Clear compass pin</button><p class="atlas-free-explore">A pin marks a place.<br>The way there is yours.</p></aside>
  </section>`;
}

export function bindAtlas(root: HTMLElement, position: Point3) {
  const workspace = root.querySelector<HTMLElement>('.atlas-workspace'); if (!workspace) return;
  const svg = workspace.querySelector<SVGSVGElement>('.game-atlas')!, viewport = workspace.querySelector<HTMLElement>('.atlas-map-viewport')!;
  let zoom = 1, cx = W / 2, cy = H / 2;
  const mobile = () => viewport.clientWidth < 450;
  const bounds = () => { const ratio = viewport.clientWidth / Math.max(1, viewport.clientHeight), fitWidth = Math.max(W, H * ratio); return { w: fitWidth / zoom, h: fitWidth / ratio / zoom }; };
  const update = () => {
    const { w, h } = bounds(); cx = Math.max(Math.min(W / 2, w / 2 - 30), Math.min(Math.max(W / 2, W - w / 2 + 30), cx)); cy = Math.max(Math.min(H / 2, h / 2 - 30), Math.min(Math.max(H / 2, H - h / 2 + 30), cy));
    svg.setAttribute('viewBox', `${cx - w / 2} ${cy - h / 2} ${w} ${h}`); svg.style.setProperty('--atlas-label-size', `${Math.max(21, 11.5 * w / viewport.clientWidth)}px`);
    workspace.querySelector('#atlas-zoom')!.textContent = `${Math.round(zoom * 100)}%`;
    workspace.querySelector<HTMLButtonElement>('[data-map-action="in"]')!.disabled = zoom >= 3;
    workspace.querySelector<HTMLButtonElement>('[data-map-action="out"]')!.disabled = zoom <= 1;
  };
  const select = (id: string) => {
    workspace.dataset.selected = id;
    workspace.querySelectorAll<SVGGElement>('[data-atlas-region]').forEach(g => { const on = g.dataset.atlasRegion === id; g.classList.toggle('is-selected', on); g.setAttribute('aria-pressed', String(on)); });
    workspace.querySelectorAll<HTMLElement>('[data-region-panel]').forEach(panel => panel.hidden = panel.dataset.regionPanel !== id);
  };
  workspace.querySelectorAll<SVGGElement>('[data-atlas-region]').forEach(g => { g.addEventListener('click', () => { if (!dragged) select(g.dataset.atlasRegion!); }); g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); select(g.dataset.atlasRegion!); } }); });
  workspace.querySelectorAll<HTMLButtonElement>('[data-map-action]').forEach(button => button.onclick = () => {
    switch (button.dataset.mapAction) { case 'in': zoom = Math.min(3, zoom + .4); break; case 'out': zoom = Math.max(1, zoom - .4); break; case 'player': { const p = project(position); cx = p.x; cy = p.y; zoom = Math.max(mobile() ? 2 : 1.8, zoom); break; } case 'reset': zoom = 1; cx = W / 2; cy = H / 2; break; } update();
  });
  let pointer: { id: number; x: number; y: number; cx: number; cy: number } | null = null, dragged = false;
  svg.addEventListener('pointerdown', e => { if (e.button !== 0) return; dragged = false; pointer = { id: e.pointerId, x: e.clientX, y: e.clientY, cx, cy }; });
  svg.addEventListener('pointermove', e => { if (!pointer || e.pointerId !== pointer.id) return; const dx = e.clientX - pointer.x, dy = e.clientY - pointer.y; if (Math.hypot(dx, dy) > 5) { dragged = true; svg.setPointerCapture(e.pointerId); } if (dragged) { const b = bounds(); cx = pointer.cx - dx * b.w / viewport.clientWidth; cy = pointer.cy - dy * b.h / viewport.clientHeight; update(); } });
  const release = () => { pointer = null; }; svg.addEventListener('pointerup', release); svg.addEventListener('pointercancel', release); svg.addEventListener('lostpointercapture', release);
  svg.addEventListener('wheel', e => { e.preventDefault(); const previous = bounds(), box = svg.getBoundingClientRect(), fx = (e.clientX - box.left) / box.width - .5, fy = (e.clientY - box.top) / box.height - .5; const x = cx + fx * previous.w, y = cy + fy * previous.h; zoom = Math.max(1, Math.min(3, zoom * Math.exp(-e.deltaY * .0015))); const next = bounds(); cx = x - fx * next.w; cy = y - fy * next.h; update(); }, { passive: false });
  svg.addEventListener('keydown', e => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) { e.preventDefault(); e.stopPropagation(); const { w, h } = bounds(); cx += (e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0) * w * .12; cy += (e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0) * h * .12; update(); } });
  select(workspace.dataset.selected!);
  if (mobile()) zoom = 1.65;
  update();
  const resize = new ResizeObserver(update); resize.observe(viewport);
  return () => resize.disconnect();
}
