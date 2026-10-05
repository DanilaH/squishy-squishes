import { renderLibraryThumbnail } from './libraryThumbnail';
import { REST_FACE } from './toyReactions';
import { idleToyPose, posePoint, type ToyPose } from './livingToy';
import { moldFactors } from '../squish/projection';
import type { SavedSquishy } from './types';

/** Same bounded pose as Squeeze, composed onto one Hall snapshot at a time. */
const snapshotPose = (width: number, height: number, pose: ToyPose): string => {
  const radius = Math.min(width, height) * .4, mold = moldFactors(1);
  const project = (x: number, y: number) => {
    const p = posePoint((x - width * .5) / radius / mold.x, ((height * .5 - y) / radius + mold.offsetY) / mold.y, pose);
    return { x: width * .5 + p.x * radius * mold.x, y: height * .5 - (p.y * mold.y - mold.offsetY) * radius };
  };
  const a = project(0, 0), b = project(1, 0), c = project(0, 1);
  // CSS transforms act about the canvas centre, whose base Hall scale stays intact.
  const xx = b.x - a.x, xy = b.y - a.y, yx = c.x - a.x, yy = c.y - a.y;
  return `matrix(${xx},${xy},${yx},${yy},${a.x + xx * width * .5 + yx * height * .5 - width * .5},${a.y + xy * width * .5 + yy * height * .5 - height * .5})`;
};

/** One sparse Hall clock and a bounded burst; no per-card game or permanent RAF. */
export const mountLibraryPersonality = (root: HTMLElement, findToy: (id: string) => SavedSquishy | undefined, blocked: () => boolean) => {
  const abort = new AbortController(), reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let timer = 0, frame = 0, cursor = 0, disposed = false, restore: (() => void) | null = null;
  const stop = (): void => { clearTimeout(timer); cancelAnimationFrame(frame); timer = frame = 0; restore?.(); restore = null; };
  const allowed = (): boolean => !disposed && !blocked() && !document.hidden && !reduced.matches;
  const schedule = (): void => {
    stop();
    if (!allowed() || !root.querySelector('[data-sandbox-library]')) return;
    timer = window.setTimeout(() => {
      timer = 0;
      const shell = root.querySelector<HTMLElement>('[data-sandbox-library]');
      if (!allowed() || !shell || shell.classList.contains('is-blocked') || shell.classList.contains('library-hall-interacting') || root.querySelector('[role="dialog"]')) { schedule(); return; }
      const cards = [...shell.querySelectorAll<HTMLElement>('[data-library-toy]')].filter(card => !card.hidden && card.getBoundingClientRect().width > 0);
      const turn = cursor++, card = cards[turn % Math.max(1, cards.length)], canvas = card?.querySelector<HTMLCanvasElement>('[data-library-thumbnail]');
      const toy = canvas ? findToy(canvas.dataset.libraryThumbnail ?? '') : undefined;
      if (!canvas || !toy || !card) { schedule(); return; }
      const original = document.createElement('canvas'); original.width = canvas.width; original.height = canvas.height;
      original.getContext('2d')?.drawImage(canvas, 0, 0);
      const inline = canvas.style.transform, base = getComputedStyle(canvas).transform;
      restore = () => {
        if (canvas.isConnected) { const ctx = canvas.getContext('2d'); ctx?.setTransform(1, 0, 0, 1, 0, 0); ctx?.clearRect(0, 0, canvas.width, canvas.height); ctx?.drawImage(original, 0, 0); canvas.style.transform = inline; }
        canvas.dataset.libraryReaction = 'rest';
      };
      const starts = [5000, 12000, 20500, 28000], durations = [180, 1100, 850, 1250];
      const mode = turn % 4, started = performance.now(); let faceKey = '';
      const animate = (now: number): void => {
        frame = 0;
        if (!allowed() || !canvas.isConnected || card.hidden || shell.classList.contains('library-hall-interacting') || root.querySelector('[role="dialog"]')) { schedule(); return; }
        const elapsed = now - started;
        if (elapsed >= durations[mode]!) { restore?.(); restore = null; schedule(); return; }
        const pose = idleToyPose(starts[mode]! + elapsed), nextKey = `${pose.blink}:${pose.delight}:${pose.squeeze}`;
        if (nextKey !== faceKey) {
          renderLibraryThumbnail(canvas, toy, canvas.width === 512 ? 512 : 256, { ...REST_FACE, blink: pose.blink, delight: pose.delight, squeeze: pose.squeeze });
          faceKey = nextKey;
        }
        canvas.style.transform = `${base === 'none' ? '' : base} ${snapshotPose(canvas.clientWidth, canvas.clientHeight, pose)}`;
        canvas.dataset.libraryReaction = pose.kind;
        frame = requestAnimationFrame(animate);
      };
      frame = requestAnimationFrame(animate);
    }, 7800 + (cursor % 3) * 1500);
  };
  document.addEventListener('visibilitychange', schedule, { signal: abort.signal });
  reduced.addEventListener('change', schedule, { signal: abort.signal });
  return { schedule, stop, dispose: (): void => { disposed = true; stop(); abort.abort(); } };
};
