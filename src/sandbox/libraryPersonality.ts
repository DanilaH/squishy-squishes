import { renderLibraryThumbnail } from './libraryThumbnail';
import { REST_FACE } from './toyReactions';
import type { SavedSquishy } from './types';

/** One sparse Hall clock. Blink one visible card, then restore its exact pixels. */
export const mountLibraryPersonality = (root: HTMLElement, findToy: (id: string) => SavedSquishy | undefined, blocked: () => boolean) => {
  const abort = new AbortController(), reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let timer = 0, cursor = 0, disposed = false, restore: (() => void) | null = null;
  const stop = (): void => { clearTimeout(timer); timer = 0; restore?.(); restore = null; };
  const allowed = (): boolean => !disposed && !blocked() && !document.hidden && !reduced.matches;
  const schedule = (): void => {
    stop();
    if (!allowed() || !root.querySelector('[data-sandbox-library]')) return;
    timer = window.setTimeout(() => {
      timer = 0;
      const shell = root.querySelector<HTMLElement>('[data-sandbox-library]');
      if (!allowed() || !shell || shell.classList.contains('is-blocked') || shell.classList.contains('library-hall-interacting') || root.querySelector('[role="dialog"]')) { schedule(); return; }
      const cards = [...shell.querySelectorAll<HTMLElement>('[data-library-toy]')].filter(card => !card.hidden && card.getBoundingClientRect().width > 0);
      const card = cards[cursor++ % Math.max(1, cards.length)], canvas = card?.querySelector<HTMLCanvasElement>('[data-library-thumbnail]');
      const toy = canvas ? findToy(canvas.dataset.libraryThumbnail ?? '') : undefined;
      if (!canvas || !toy || !card) { schedule(); return; }
      const original = document.createElement('canvas'); original.width = canvas.width; original.height = canvas.height;
      original.getContext('2d')?.drawImage(canvas, 0, 0);
      restore = () => {
        if (canvas.isConnected) { const ctx = canvas.getContext('2d'); ctx?.setTransform(1, 0, 0, 1, 0, 0); ctx?.clearRect(0, 0, canvas.width, canvas.height); ctx?.drawImage(original, 0, 0); }
        card.classList.remove('is-library-curious'); canvas.dataset.libraryReaction = 'rest';
      };
      if (toy.decor.eyes) renderLibraryThumbnail(canvas, toy, canvas.width === 512 ? 512 : 256, { ...REST_FACE, blink: 1 });
      canvas.dataset.libraryReaction = toy.decor.eyes ? 'blink' : 'tilt';
      card.classList.add('is-library-curious');
      timer = window.setTimeout(() => { restore?.(); restore = null; schedule(); }, 220);
    }, 7800 + (cursor % 3) * 1500);
  };
  document.addEventListener('visibilitychange', schedule, { signal: abort.signal });
  reduced.addEventListener('change', schedule, { signal: abort.signal });
  return { schedule, stop, dispose: (): void => { disposed = true; stop(); abort.abort(); } };
};
