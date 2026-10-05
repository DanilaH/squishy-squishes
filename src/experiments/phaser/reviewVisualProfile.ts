import { preloadToyArt } from '../../sandbox/toyArt';
import { registerPagesDecorArt, unregisterPagesDecorArt } from '../../sandbox/decor';
import {
  disablePagesLibraryMaterialLighting,
  enablePagesLibraryMaterialLighting,
  registerPagesLibraryMaterialRenderer,
  unregisterPagesLibraryMaterialRenderer,
} from '../../sandbox/libraryThumbnail';
import {
  drawPagesAccessoryGraphic,
  renderPagesSurfaceDecor,
  renderPagesSurfaceFace,
  renderPagesSurfaceStickers,
} from '../../sandbox/pagesDecorArt';
import { renderPagesVolumeThumbnail, releasePagesVolumeThumbnail } from './libraryVolumeProduction';
import { mountLibraryHallFeel } from './libraryHallFeel';
import { mountLibraryHallPreview, preloadLibraryHallAssets } from './libraryHallPreview';
import { mountStudioEnvironmentPreview } from './studioEnvironmentPreview';
import './libraryHallPolish.css';
import './libraryHallGrounding.css';
import './libraryHallAccess.css';
import './libraryHallOwnerReview.css';
import './libraryHallPerspectiveFloor.css';
import '../../app/styles/room-atmosphere.css';
import '../../app/styles/controls.css';
import '../../app/styles/editor-layout.css';

/** Decode the Hall's small first-screen art before the playable Library mounts. */
export const preloadReviewVisualProfile = async (): Promise<void> => {
  await Promise.all([preloadLibraryHallAssets(), preloadToyArt()]);
};

/**
 * Registers the owner-reviewed Hall/Studio appearance before the first Library
 * paint and mounts its passive room layers. Production web/Yandex, Pages
 * review and the isolated Yandex DRAFT now exercise this same accepted profile.
 */
export const installReviewVisualProfile = (root: HTMLElement): (() => void) => {
  enablePagesLibraryMaterialLighting();
  registerPagesLibraryMaterialRenderer(renderPagesVolumeThumbnail, releasePagesVolumeThumbnail);
  registerPagesDecorArt({
    render: renderPagesSurfaceDecor,
    renderFace: renderPagesSurfaceFace,
    renderStickers: renderPagesSurfaceStickers,
    accessory: drawPagesAccessoryGraphic,
  });

  const disposeStudio = mountStudioEnvironmentPreview(root);
  const disposeHall = mountLibraryHallPreview(root);
  const disposeFeel = mountLibraryHallFeel(root);

  return () => {
    disposeFeel();
    disposeHall();
    disposeStudio();
    unregisterPagesDecorArt();
    unregisterPagesLibraryMaterialRenderer();
    disablePagesLibraryMaterialLighting();
  };
};
