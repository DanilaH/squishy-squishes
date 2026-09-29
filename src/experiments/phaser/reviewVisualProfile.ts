import { registerPagesDecorArt, unregisterPagesDecorArt } from '../../sandbox/decor';
import {
  disablePagesLibraryMaterialLighting,
  enablePagesLibraryMaterialLighting,
  registerPagesLibraryMaterialRenderer,
  unregisterPagesLibraryMaterialRenderer,
} from '../../sandbox/libraryThumbnail';
import { drawPagesAccessoryGraphic, renderPagesSurfaceDecor } from '../../sandbox/pagesDecorArt';
import { renderPagesVolumeThumbnail, releasePagesVolumeThumbnail } from './libraryVolumeProduction';
import { mountLibraryHallFeel } from './libraryHallFeel';
import { mountLibraryHallPreview, preloadLibraryHallAssets } from './libraryHallPreview';
import { mountStudioEnvironmentPreview } from './studioEnvironmentPreview';
import './libraryHallPolish.css';
import './libraryHallGrounding.css';
import './libraryHallAccess.css';
import './libraryHallOwnerReview.css';
import './libraryHallPerspectiveFloor.css';

/** Decode the Hall's small first-screen art before the playable Library mounts. */
export const preloadReviewVisualProfile = (): Promise<void> => preloadLibraryHallAssets();

/**
 * Registers the owner-reviewed Hall/Studio appearance before the first Library
 * paint and mounts its passive room layers. It is shared by Pages and the
 * isolated Yandex DRAFT so both exercise the same reviewed renderer profile.
 */
export const installReviewVisualProfile = (root: HTMLElement): (() => void) => {
  enablePagesLibraryMaterialLighting();
  registerPagesLibraryMaterialRenderer(renderPagesVolumeThumbnail, releasePagesVolumeThumbnail);
  registerPagesDecorArt({ render: renderPagesSurfaceDecor, accessory: drawPagesAccessoryGraphic });

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
    releasePagesVolumeThumbnail();
  };
};
