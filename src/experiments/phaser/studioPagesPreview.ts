// Both visual environments are removable Phaser Pages-only layers.
// Main/Yandex entrypoints, player saves, input, and physics remain unchanged.
import './pagesPreview';
import { normalizeLanguage } from '../../i18n';
import { mountStudioEnvironmentPreview } from './studioEnvironmentPreview';
import { mountLibraryHallPreview } from './libraryHallPreview';
import { mountLibraryHallFeel } from './libraryHallFeel';
import { mountLibraryVolumeReview } from './libraryVolumeReview';
import { enablePagesLibraryMaterialLighting, registerPagesLibraryMaterialRenderer } from '../../sandbox/libraryThumbnail';
import { renderStudioLibraryThumbnail, releaseStudioLibraryThumbnail } from '../../sandbox/libraryStudioThumbnail';
import { registerPagesDecorArt } from '../../sandbox/decor';
import { drawPagesAccessoryGraphic, renderPagesSurfaceDecor } from '../../sandbox/pagesDecorArt';
import './libraryHallPolish.css';
import './libraryHallGrounding.css';
import './libraryHallAccess.css';
import './libraryHallOwnerReview.css';
import './libraryHallPerspectiveFloor.css';

// The Pages HTML defaults to en, but the actual app follows navigator.language.
// Set the document language before the asynchronous first Library paint so
// screen readers and the Hall's accessible navigation use the real UI locale.
document.documentElement.lang = normalizeLanguage(navigator.language);
// pagesPreview boots asynchronously after image preload; configure the isolated
// thumbnail appearance before it can synchronously paint its first Library cards.
enablePagesLibraryMaterialLighting();
registerPagesLibraryMaterialRenderer(renderStudioLibraryThumbnail, releaseStudioLibraryThumbnail);
registerPagesDecorArt({ render: renderPagesSurfaceDecor, accessory: drawPagesAccessoryGraphic });
const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing #app root.');
mountStudioEnvironmentPreview(root);
mountLibraryHallPreview(root);
mountLibraryHallFeel(root);
// Query-gated, disposable visual benchmark; normal Hall remains unchanged.
mountLibraryVolumeReview();
