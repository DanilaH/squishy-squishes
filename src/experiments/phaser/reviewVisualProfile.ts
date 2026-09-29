import { registerPagesDecorArt } from '../../sandbox/decor';
import { enablePagesLibraryMaterialLighting, registerPagesLibraryMaterialRenderer } from '../../sandbox/libraryThumbnail';
import { drawPagesAccessoryGraphic, renderPagesSurfaceDecor } from '../../sandbox/pagesDecorArt';
import { renderPagesVolumeThumbnail, releasePagesVolumeThumbnail } from './libraryVolumeProduction';
import { mountLibraryHallFeel } from './libraryHallFeel';
import { mountLibraryHallPreview } from './libraryHallPreview';
import { mountLibraryVolumeReview } from './libraryVolumeReview';
import { mountStudioEnvironmentPreview } from './studioEnvironmentPreview';
import './libraryHallPolish.css';
import './libraryHallGrounding.css';
import './libraryHallAccess.css';
import './libraryHallOwnerReview.css';
import './libraryHallPerspectiveFloor.css';

export interface ReviewVisualProfileOptions {
  readonly volumeProbe?: boolean;
}

/**
 * Registers the owner-reviewed Hall/Studio appearance before the first Library
 * paint and mounts its passive room layers. It is shared by Pages and the
 * isolated Yandex DRAFT so both exercise the same reviewed renderer profile.
 */
export const installReviewVisualProfile = (
  root: HTMLElement,
  options: ReviewVisualProfileOptions = {},
): (() => void) => {
  enablePagesLibraryMaterialLighting();
  registerPagesLibraryMaterialRenderer(renderPagesVolumeThumbnail, releasePagesVolumeThumbnail);
  registerPagesDecorArt({ render: renderPagesSurfaceDecor, accessory: drawPagesAccessoryGraphic });

  const disposeStudio = mountStudioEnvironmentPreview(root);
  mountLibraryHallPreview(root);
  mountLibraryHallFeel(root);
  if (options.volumeProbe) mountLibraryVolumeReview();

  return () => {
    disposeStudio();
    releasePagesVolumeThumbnail();
  };
};
