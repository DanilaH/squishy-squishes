// Keep the actual Phaser Pages bootstrap intact. The extra art is a removable
// Pages-only layer; no change to main, Yandex, physics, or player saves.
import './pagesPreview';
import { mountStudioEnvironmentPreview } from './studioEnvironmentPreview';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing #app root.');
mountStudioEnvironmentPreview(root);
