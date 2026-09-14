import { ALL_VARIANT_IDS, ALL_VARIANTS } from '../game/content';
import { RANK_DEFINITIONS, getLabRank } from '../game/progression';
import type { SaveStateV2 } from '../platform/save';

interface ProgressOverride {
  readonly labXp: number;
  readonly completedVariantIds: readonly string[];
}

interface Options {
  readonly language: string;
  readonly getSaveState: () => SaveStateV2;
  readonly setProgress: (next: ProgressOverride) => Promise<void>;
  readonly resetProgress: () => Promise<void>;
}

const OPEN_KEY = 'squishy.phone-qa.open.v1';
const knownIds = new Set<string>(ALL_VARIANT_IDS);

const normalizeIds = (ids: readonly string[]): readonly string[] => {
  const set = new Set(ids.filter((id) => knownIds.has(id)));
  return ALL_VARIANT_IDS.filter((id) => set.has(id));
};

export const installPhoneQaPanel = (options: Options): (() => void) => {
  const ru = options.language.toLowerCase().startsWith('ru');
  const labels = ru
    ? { title: 'Phone QA', rank: 'Ранг', xp: 'XP', all: 'Все готово', none: 'Снять все', reset: 'Сбросить прогресс', failed: 'Не удалось применить QA-состояние.' }
    : { title: 'Phone QA', rank: 'Rank', xp: 'XP', all: 'Complete all', none: 'Clear all', reset: 'Reset progress', failed: 'Could not apply QA state.' };

  const strip = document.querySelector<HTMLElement>('.debug-controls');
  if (!strip) return () => undefined;

  const launcher = document.createElement('button');
  launcher.type = 'button';
  launcher.className = 'debug-button';
  launcher.textContent = 'QA';
  launcher.setAttribute('aria-pressed', 'false');
  strip.append(launcher);

  const panel = document.createElement('aside');
  panel.hidden = true;
  panel.style.cssText = 'position:fixed;z-index:80;top:54px;right:10px;width:min(360px,calc(100vw - 20px));max-height:calc(100dvh - 66px);overflow:auto;padding:12px;border:1px solid rgba(255,255,255,.12);border-radius:14px;background:rgba(9,8,14,.95);color:#fff;box-shadow:0 18px 60px rgba(0,0,0,.5);backdrop-filter:blur(16px);font:11px/1.35 system-ui,sans-serif';
  document.body.append(panel);

  const buttonStyle = 'min-height:32px;border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:6px 8px;background:rgba(255,255,255,.06);color:rgba(255,255,255,.86);font:inherit';
  const sectionStyle = 'padding-top:10px;margin-top:10px;border-top:1px solid rgba(255,255,255,.08)';
  const rowStyle = 'display:flex;flex-wrap:wrap;gap:6px';

  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><strong>${labels.title}</strong><button style="${buttonStyle}" data-action="close">×</button></div>
    <div data-summary style="margin-top:6px;color:rgba(255,255,255,.55)"></div>
    <section style="${sectionStyle}"><div style="margin-bottom:6px;color:rgba(255,255,255,.55)">${labels.rank}</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">${RANK_DEFINITIONS.map((item) => `<button style="${buttonStyle}" data-rank="${item.rank}">${item.rank}</button>`).join('')}</div></section>
    <section style="${sectionStyle}"><div style="margin-bottom:6px;color:rgba(255,255,255,.55)">${labels.xp}</div><div style="${rowStyle}"><button style="${buttonStyle}" data-xp="-100">−100</button><button style="${buttonStyle}" data-xp="-25">−25</button><button style="${buttonStyle}" data-xp="25">+25</button><button style="${buttonStyle}" data-xp="100">+100</button></div></section>
    <section style="${sectionStyle}"><div style="${rowStyle};margin-bottom:8px"><button style="${buttonStyle}" data-action="all">${labels.all}</button><button style="${buttonStyle}" data-action="none">${labels.none}</button></div><div data-recipes style="display:grid;gap:5px;max-height:240px;overflow:auto"></div></section>
    <section style="${sectionStyle}"><button style="${buttonStyle};border-color:rgba(255,100,120,.35);color:#ffb0ba" data-action="reset">${labels.reset}</button></section>
  `;

  const recipes = panel.querySelector<HTMLElement>('[data-recipes]');
  const summary = panel.querySelector<HTMLElement>('[data-summary]');
  if (!recipes || !summary) throw new Error('Phone QA panel failed to initialize');

  for (const variant of ALL_VARIANTS) {
    const label = document.createElement('label');
    label.style.cssText = 'display:grid;grid-template-columns:auto 1fr;gap:7px;align-items:center;padding:6px 7px;border-radius:8px;background:rgba(255,255,255,.04)';
    label.innerHTML = `<input type="checkbox" data-recipe="${variant.id}"><span>${variant.label}</span>`;
    recipes.append(label);
  }

  let busy = false;
  const setOpen = (open: boolean): void => {
    panel.hidden = !open;
    launcher.setAttribute('aria-pressed', String(open));
    try { sessionStorage.setItem(OPEN_KEY, open ? '1' : '0'); } catch { /* QA convenience only. */ }
  };

  const refresh = (): void => {
    const state = options.getSaveState();
    const completed = new Set(normalizeIds(state.completedVariantIds));
    summary.textContent = `R${getLabRank(state.labXp)} · ${state.labXp} XP · ${completed.size}/${ALL_VARIANT_IDS.length}`;
    for (const input of panel.querySelectorAll<HTMLInputElement>('[data-recipe]')) {
      input.checked = completed.has(input.dataset.recipe ?? '');
    }
    for (const button of panel.querySelectorAll<HTMLButtonElement>('[data-rank]')) {
      button.style.borderColor = Number(button.dataset.rank) === getLabRank(state.labXp) ? 'rgba(210,180,255,.72)' : 'rgba(255,255,255,.12)';
    }
  };

  const lock = (value: boolean): void => {
    busy = value;
    for (const control of panel.querySelectorAll<HTMLButtonElement | HTMLInputElement>('button,input')) control.disabled = value;
  };

  const apply = async (next: ProgressOverride): Promise<void> => {
    if (busy) return;
    lock(true);
    try {
      await options.setProgress({ labXp: Math.max(0, Math.floor(next.labXp)), completedVariantIds: normalizeIds(next.completedVariantIds) });
      try { sessionStorage.setItem(OPEN_KEY, '1'); } catch { /* QA convenience only. */ }
      location.reload();
    } catch (error: unknown) {
      console.error('[squishy:phone-qa]', error);
      alert(labels.failed);
      lock(false);
      refresh();
    }
  };

  launcher.addEventListener('click', () => { setOpen(panel.hidden); refresh(); });

  panel.addEventListener('click', (event) => {
    const target = event.target instanceof HTMLElement ? event.target.closest<HTMLButtonElement>('button') : null;
    if (!target || busy) return;
    const action = target.dataset.action;
    if (action === 'close') return setOpen(false);
    const state = options.getSaveState();
    if (action === 'all') return void apply({ labXp: state.labXp, completedVariantIds: ALL_VARIANT_IDS });
    if (action === 'none') return void apply({ labXp: state.labXp, completedVariantIds: [] });
    if (action === 'reset') {
      if (!confirm(ru ? 'Сбросить весь XP и коллекцию?' : 'Reset all XP and collection progress?')) return;
      lock(true);
      void options.resetProgress().then(() => { try { sessionStorage.setItem(OPEN_KEY, '1'); } catch { /* QA convenience only. */ } location.reload(); }).catch((error: unknown) => { console.error('[squishy:phone-qa-reset]', error); alert(labels.failed); lock(false); refresh(); });
      return;
    }
    const rank = Number(target.dataset.rank);
    if (Number.isInteger(rank)) {
      const definition = RANK_DEFINITIONS.find((item) => item.rank === rank);
      if (definition) void apply({ labXp: definition.minXp, completedVariantIds: state.completedVariantIds });
      return;
    }
    const delta = Number(target.dataset.xp);
    if (Number.isFinite(delta) && delta !== 0) void apply({ labXp: Math.max(0, state.labXp + delta), completedVariantIds: state.completedVariantIds });
  });

  panel.addEventListener('change', (event) => {
    if (busy || !(event.target instanceof HTMLInputElement)) return;
    const id = event.target.dataset.recipe;
    if (!id || !knownIds.has(id)) return;
    const state = options.getSaveState();
    const completed = new Set(normalizeIds(state.completedVariantIds));
    if (event.target.checked) completed.add(id); else completed.delete(id);
    void apply({ labXp: state.labXp, completedVariantIds: [...completed] });
  });

  refresh();
  try { setOpen(sessionStorage.getItem(OPEN_KEY) === '1'); } catch { setOpen(false); }

  return () => {
    launcher.remove();
    panel.remove();
  };
};
