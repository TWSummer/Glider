const icons: Record<string, string> = {
  plane: '<path d="m3 11 18-8-6 18-4-7-8-3Z"/><path d="m11 14 10-11"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  sound: '<path d="m11 5-6 4H2v6h3l6 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  mute: '<path d="m11 5-6 4H2v6h3l6 4V5Z"/><path d="m16 9 6 6m0-6-6 6"/>',
  expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6 6-2Z"/>',
  wind: '<path d="M3 8h12a3 3 0 1 0-3-3M2 12h17a3 3 0 1 1-3 3M5 17h5a2 2 0 1 1-2 2"/>',
  reset: '<path d="M3 11a9 9 0 1 1 2 7M3 4v7h7"/>',
  mountain: '<path d="m2 19 7-13 5 8 3-5 5 10H2Zm4-8 3 3 3-3"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4m0 3v.1"/>',
  leaf: '<path d="M20 3C8 2 2 7 5 15c8 4 15-1 15-12ZM4 21 16 8"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
};
export const icon = (name: string, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] ?? ''}</svg>`;

