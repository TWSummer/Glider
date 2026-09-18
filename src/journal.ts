import { REGIONS, SITES } from './atlas';
import { renderAtlas } from './game-map';
import { QUESTS, questKnown, questReady, goalProgress, nearSite, questSteps, nextQuestStep } from './quests';
import { UPGRADE_INFO, type Progress } from './progression';
import type { Point3 } from './flight';

export function questCard(p: Progress, q: typeof QUESTS[number], position?: Point3): string {
  const done = p.completed.includes(q.id), accepted = p.accepted.includes(q.id), ready = questReady(p, q);
  const next = nextQuestStep(p, q);
  const reward = [q.reward.fan ? 'Pocket electric fan' : '', q.reward.parts ? `${q.reward.parts} scrap` : '', q.reward.cores ? `${q.reward.cores} cores` : '', q.blueprint ? `${UPGRADE_INFO[q.blueprint].name} schematic` : ''].filter(Boolean).join(' · ');
  return `<article class="quest-card ${done ? 'quest-done' : p.trackedQuest === q.id ? 'quest-following' : ''}"><div class="quest-meta">${REGIONS.find(r => r.id === q.region)!.name} · ${done ? 'COMPLETED' : accepted ? ready ? 'READY TO RETURN' : p.trackedQuest === q.id ? 'FOLLOWING' : 'IN YOUR JOURNAL' : 'A LOCAL REQUEST'}</div><h3>${q.title}</h3><p>${q.story}</p>${done ? '' : `<div class="quest-next"><span>${ready ? 'READY TO RETURN' : accepted ? 'A PLACE TO START · ANY ORDER' : 'YOUR FIRST LEAD'}</span><strong>${next.title}</strong><p>${next.hint}</p>${accepted ? `<button class="quest-region-pin" data-quest-pin="${next.region}">Pin this region on the compass</button>` : ''}</div><details class="quest-leads"><summary>All leads &amp; field notes</summary><p class="quest-clue">${q.clue}</p>${questSteps(p, q).map(s => `<div class="quest-lead ${s.done ? 'goal-done' : ''}"><b>${s.done ? '✓' : '○'} ${s.title}</b><span>${s.hint}</span></div>`).join('')}</details><ul>${q.goals.map(g => { const [n, total] = goalProgress(p, g); return `<li class="${n >= total ? 'goal-done' : ''}"><span>${n >= total ? '✓' : '○'} ${g.label}</span><b>${Math.min(n, total)} / ${total}</b></li>`; }).join('')}</ul>`}<div class="quest-reward">${reward}</div><div class="quest-actions">${done ? '' : !accepted ? `<button data-accept="${q.id}">Take this request</button>` : ready ? `<button data-finish="${q.id}" ${position && nearSite(position, q.giver) ? '' : 'disabled'}>Return to ${SITES.find(s => s.id === q.giver)!.name}</button>` : ''}${accepted && !done ? `<button class="quiet" data-quest-track="${q.id}">${p.trackedQuest === q.id ? 'Hide flight hint' : 'Follow this story'}</button>` : ''}</div></article>`;
}
export function questPage(p: Progress): string {
  const known = QUESTS.filter(q => questKnown(p, q)), active = known.filter(q => !p.completed.includes(q.id)), done = known.filter(q => p.completed.includes(q.id));
  return `<div class="journal-overview"><b>${p.completed.length} / ${QUESTS.length}</b><span>stories completed<br>Requests are optional. Discover them by talking to locals and reading signs with E.</span></div><div class="marker-legend"><span><b>!</b> New request</span><span><b>?</b> Turn in</span><span><b>E</b> Read / use</span><span><b>✓</b> Already read</span></div>${active.length ? active.map(q => questCard(p, q)).join('') : '<div class="empty-journal"><h3>Stories start with a hello.</h3><p>Visit Ada’s desk in the conservatory, or follow the path west to Willow Mill. Press E when a name appears nearby.</p></div>'}${done.length ? `<details class="completed-quests"><summary>Completed stories (${done.length})</summary>${done.map(q => questCard(p, q)).join('')}</details>` : ''}`;
}
export function atlasPage(p: Progress, position: Point3, pinned = 'none'): string {
  return renderAtlas(p, position, pinned);
}
