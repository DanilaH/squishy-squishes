// Both visual environments are removable Phaser Pages-only layers.
// Main/Yandex entrypoints, player saves, input, and physics remain unchanged.
import './pagesPreview';
import { mountStudioEnvironmentPreview } from './studioEnvironmentPreview';
import { mountLibraryHallPreview } from './libraryHallPreview';
import { enablePagesLibraryMaterialLighting } from '../../sandbox/libraryThumbnail';
import './libraryHallPolish.css';
import './libraryHallGrounding.css';

// pagesPreview boots asynchronously after image preload; configure the isolated
// thumbnail appearance before it can synchronously paint its first Library cards.
enablePagesLibraryMaterialLighting();
const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing #app root.');
mountStudioEnvironmentPreview(root);
mountLibraryHallPreview(root);
