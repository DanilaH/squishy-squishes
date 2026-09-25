import type { SavedSquishy } from '../../sandbox/types';
import { releaseStudioLibraryThumbnail, renderStudioLibraryThumbnail } from '../../sandbox/libraryStudioThumbnail';
import { renderNeutralVolumeAlbedo } from './libraryVolumeAlbedo';
import { releaseVolumeMesh, renderVolumeMesh } from './libraryVolumeMesh';

/** Actual Pages Hall: static 512px mesh snapshots, one reusable offscreen WebGL2
 * context, no per-card context or animation. The preexisting thumbnail draws
 * the accessory BEHIND the body; omit it here to prevent a duplicate bow/ears. */
export const renderPagesVolumeThumbnail = (
  destination: CanvasRenderingContext2D, toy: SavedSquishy, snapshotSize: 256 | 512,
): boolean => {
  if (snapshotSize !== 512) return renderStudioLibraryThumbnail(destination, toy, snapshotSize);
  const source = renderNeutralVolumeAlbedo(toy);
  const withoutAccessory: SavedSquishy = {
    ...toy,
    decor: { ...toy.decor, accessory: null },
  };
  const volume = renderVolumeMesh(withoutAccessory, source);
  if (volume.dataset.volumeRenderer === 'mesh-unavailable') {
    // The source art is not a successful volume render. Preserve the original
    // Studio shader on devices that can use it, then Canvas2D as last resort.
    releaseVolumeMesh();
    return renderStudioLibraryThumbnail(destination, toy, snapshotSize);
  }
  destination.drawImage(volume, 0, 0, 256, 256);
  destination.canvas.dataset.libraryRenderer = 'volume-mesh';
  return true;
};

/** Called on leaving the Hall, including after a context-loss fallback. */
export const releasePagesVolumeThumbnail = (): void => {
  releaseVolumeMesh();
  releaseStudioLibraryThumbnail();
};
