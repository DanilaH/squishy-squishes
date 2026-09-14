import './styles.css';
import './interaction-pass.css';
import './interaction-pass-03.css';
import { bootstrapSquishyApp } from './app/bootstrap';
import { getGameCopy, normalizeLanguage } from './i18n';

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing #app root.');

const renderFatal = (error: unknown): void => {
  console.error('[squishy:bootstrap]', error);
  const copy = getGameCopy(normalizeLanguage(window.navigator.language));
  root.innerHTML = `<main class="lab-shell"><section class="recipe-panel"><strong>${copy.fatal.title}</strong><span>${copy.fatal.retry}</span></section></main>`;
};

void bootstrapSquishyApp(root)
  .then((app) => {
    window.addEventListener('pagehide', () => { void app.dispose(); }, { once: true });
  })
  .catch(renderFatal);
