import type { StorageAdapter } from '@danilah/mini-games-kit/platform';
import '../../styles.css';
import '../../interaction-pass.css';
import '../../interaction-pass-03.css';
import '../../release.css';
import '../../ui-ux-pass-01.css';
import '../../feel-art-audio-pass-01.css';
import '../../ui-ux-overhaul-02.css';
import '../../sandbox-core.css';
import '../../sandbox-library.css';
import '../../sandbox-ideas.css';
import '../../sandbox-polish-01.css';
import './candyStudioPreview.css';
import './jellyUiPreview.css';
import './jellyTypographyPreview.css';
import { prepareReviewFirstPaint } from './reviewStartupAssets';
import { createReviewMakerRendererLoader } from './reviewMakerLoader';
import { bootstrapSquishyApp } from '../../app/bootstrap';
import { getGameCopy, normalizeLanguage } from '../../i18n';
import { createSquishyPlatformRuntime, type SquishyPlatformRuntime } from '../../platform/runtime';
import { captureModalReturnFocus, focusModal, restoreModalFocus, trapModalTab } from '../../sandbox/modalFocus';

// Pages is a public device-preview, not a migration of real player saves or a Yandex SDK test.
const PAGES_PREFIX = 'squishy.phaser-pages-preview.';
const prefixStorage = (storage: StorageAdapter): StorageAdapter => ({
  getItem: (key) => storage.getItem(PAGES_PREFIX + key),
  setItem: (key, value) => storage.setItem(PAGES_PREFIX + key, value),
  removeItem: (key) => storage.removeItem(PAGES_PREFIX + key),
});

let pagesRuntime: SquishyPlatformRuntime | null = null;
const createPagesRuntime = async (): Promise<SquishyPlatformRuntime> => {
  const runtime = await createSquishyPlatformRuntime();
  if (runtime.kind === 'yandex') {
    runtime.destroy();
    throw new Error('The Phaser Pages preview must not initialize the Yandex SDK.');
  }
  pagesRuntime = { ...runtime, storage: prefixStorage(runtime.storage) };
  return pagesRuntime;
};

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing #app root.');
document.documentElement.lang = normalizeLanguage(navigator.language);

const makerRenderer = createReviewMakerRendererLoader('pages');

/** Phaser's renderer needs WebGL2; probe once per page instead of allocating a throwaway context on every maker entry. */
let phaserSupport: boolean | null = null;
const canStartPhaser = (): boolean => {
  if (phaserSupport !== null) return phaserSupport;
  const probe = document.createElement('canvas');
  try {
    const gl = probe.getContext('webgl2');
    if (!gl) {
      phaserSupport = false;
      return false;
    }
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    phaserSupport = true;
    return true;
  } catch {
    phaserSupport = false;
    return false;
  }
};

// Session-reachable UI images decode before the first playable Library frame.
root.innerHTML = `<main class="lab-shell"><section class="recipe-panel" role="status">${normalizeLanguage(navigator.language) === 'ru' ? 'ЗАГРУЖАЕМ МАСТЕРСКУЮ…' : 'PREPARING THE STUDIO…'}</section></main>`;
void prepareReviewFirstPaint(root, 'pages').then(() => bootstrapSquishyApp(root, {
    createRuntime: createPagesRuntime,
    loadMakerRendererOptions: makerRenderer.load,
  })).then((handle) => {
  const cancelMakerWarm = makerRenderer.scheduleWarm(canStartPhaser);
  const listeners = new AbortController();
  // Capture before the Library's delegated bubble click, but only on maker entry.
  // A diagnostic overlay keeps the Library and all existing saves intact.
  root.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!target.closest('button[data-library-new], button[data-library-play-id], button[data-idea-id]')) return;
    if (!root.querySelector('[data-sandbox-library], [data-sandbox-ideas]') || canStartPhaser()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    console.warn('[squishy:phaser-pages-preview] WebGL2 is unavailable; studio was not opened.');
    root.querySelector('[data-phaser-unsupported]')?.remove();
    const ru = normalizeLanguage(navigator.language) === 'ru';
    const overlay = document.createElement('section');
    overlay.className = 'sandbox-library-modal';
    overlay.dataset.phaserUnsupported = '';
    overlay.setAttribute('role', 'alertdialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'phaser-unsupported-title');
    overlay.innerHTML = `<div class="sandbox-library-modal__sheet sandbox-library-modal__sheet--compact">
      <h2 id="phaser-unsupported-title">${ru ? 'НУЖЕН WEBGL2' : 'WEBGL2 REQUIRED'}</h2>
      <p>${ru
        ? 'Этот браузер или устройство не поддерживает WebGL2 либо он отключён. Включи аппаратное ускорение или попробуй другой браузер.'
        : 'WebGL2 is unavailable or disabled in this browser or device. Enable hardware acceleration or try another browser.'}</p>
      <button class="sandbox-library-modal__cancel" type="button" data-phaser-unsupported-close>${ru ? 'НАЗАД К ПОЛКЕ' : 'BACK TO LIBRARY'}</button>
    </div>`;
    const returnFocus = captureModalReturnFocus();
    const dialog = overlay.querySelector<HTMLElement>('.sandbox-library-modal__sheet');
    const close = (): void => {
      overlay.remove();
      restoreModalFocus(returnFocus);
    };
    overlay.addEventListener('click', (closeEvent) => {
      if (closeEvent.target instanceof Element && closeEvent.target.closest('[data-phaser-unsupported-close]')) close();
    });
    overlay.addEventListener('keydown', (keyEvent) => {
      if (keyEvent.key === 'Escape') {
        keyEvent.preventDefault();
        close();
        return;
      }
      if (dialog) trapModalTab(keyEvent, dialog);
    });
    root.append(overlay);
    if (dialog) focusModal(dialog);
  }, { capture: true, signal: listeners.signal });
  let disposed = false;
  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    listeners.abort();
    cancelMakerWarm();
    pagesRuntime = null;
    void handle.dispose();
  };
  window.addEventListener('pagehide', (event) => {
    pagesRuntime?.activity.setBlocked('pagehide', true);
    if (!event.persisted) dispose();
  }, { signal: listeners.signal });
  window.addEventListener('pageshow', () => {
    pagesRuntime?.activity.setBlocked('pagehide', false);
  }, { signal: listeners.signal });
}).catch((error: unknown) => {
  console.error('[squishy:phaser-pages-preview]', error);
  const copy = getGameCopy(normalizeLanguage(navigator.language));
  root.innerHTML = `<main class="lab-shell"><section class="recipe-panel"><strong>${copy.fatal.title}</strong><span>${copy.fatal.retry}</span></section></main>`;
});
