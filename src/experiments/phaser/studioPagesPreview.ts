// Both visual environments are removable Phaser Pages-only layers.
// Main/Yandex entrypoints, player saves, input, and physics remain unchanged.
import './pagesPreview';
import { mountStudioEnvironmentPreview } from './studioEnvironmentPreview';
import { mountLibraryHallPreview } from './libraryHallPreview';
import './libraryHallPolish.css';
import './libraryHallGrounding.css';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing #app root.');
mountStudioEnvironmentPreview(root);
mountLibraryHallPreview(root);
