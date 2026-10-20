import './styles.css';
import './interaction-pass.css';
import './interaction-pass-03.css';
import './release.css';
import './ui-ux-pass-01.css';
import './feel-art-audio-pass-01.css';
import './ui-ux-overhaul-02.css';
import './sandbox-core.css';
import './sandbox-library.css';
import './sandbox-ideas.css';
import './sandbox-polish-01.css';
import './experiments/phaser/candyStudioPreview.css';
import './experiments/phaser/jellyUiPreview.css';
import './experiments/phaser/jellyTypographyPreview.css';
import { bootstrapSquishyApp } from './app/bootstrap';
import { getGameCopy, normalizeLanguage } from './i18n';
import { createReviewMakerRendererLoader } from './experiments/phaser/reviewMakerLoader';
import { prepareReviewFirstPaint } from './experiments/phaser/reviewStartupAssets';
import { installReviewVisualProfile } from './experiments/phaser/reviewVisualProfile';

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing #app root.');

const renderFatal = (error: unknown): void => {
  console.error('[squishy:bootstrap]', error);
  const copy = getGameCopy(normalizeLanguage(window.navigator.language));
  root.innerHTML = `<main class="lab-shell"><section class="recipe-panel"><strong>${copy.fatal.title}</strong><span>${copy.fatal.retry}</span></section></main>`;
};

const appearanceProbe = import.meta.env.VITE_PLATFORM !== 'yandex'
  && new URLSearchParams(window.location.search).get('appearanceProbe') === '1';

if (appearanceProbe) {
  // Keep the existing diagnostic route isolated from the production visual
  // profile so it continues to exercise its purpose-built probe surface.
  void bootstrapSquishyApp(root)
    .then((app) => {
      window.addEventListener('pagehide', () => { void app.dispose(); }, { once: true });
    })
    .catch(renderFatal);
} else {
  const language = normalizeLanguage(window.navigator.language);
  document.documentElement.lang = language;
  const makerRenderer = createReviewMakerRendererLoader('production');
  const disposeVisualProfile = installReviewVisualProfile(root);
  let visualProfileDisposed = false;
  const disposeProfile = (): void => {
    if (visualProfileDisposed) return;
    visualProfileDisposed = true;
    disposeVisualProfile();
  };

  root.innerHTML = `<main class="lab-shell"><section class="recipe-panel" role="status">${language === 'ru' ? 'ЗАГРУЖАЕМ МАСТЕРСКУЮ…' : 'PREPARING THE STUDIO…'}</section></main>`;

  void prepareReviewFirstPaint(root, 'production')
    .then(() => bootstrapSquishyApp(root, {
      loadMakerRendererOptions: makerRenderer.load,
    }))
    .then((app) => {
      const cancelMakerWarm = makerRenderer.scheduleWarm();
      const lifecycle = new AbortController();
      let disposed = false;
      const dispose = (): void => {
        if (disposed) return;
        disposed = true;
        lifecycle.abort();
        cancelMakerWarm();
        disposeProfile();
        void app.dispose();
      };
      window.addEventListener('pagehide', (event) => {
        if (!event.persisted) dispose();
      }, { signal: lifecycle.signal });
    })
    .catch((error: unknown) => {
      disposeProfile();
      renderFatal(error);
    });
}
