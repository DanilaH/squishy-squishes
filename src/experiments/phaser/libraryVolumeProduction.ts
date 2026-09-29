import type { SavedSquishy } from '../../sandbox/types';
import { releaseStudioLibraryThumbnail, renderStudioLibraryThumbnail } from '../../sandbox/libraryStudioThumbnail';
import { renderNeutralVolumeAlbedo } from './libraryVolumeAlbedo';
import { releaseVolumeMesh, renderVolumeMesh } from './libraryVolumeMesh';

/** Owner-reviewed Hall: static 512px mesh snapshots, one reusable offscreen WebGL2
 * context, no per-card context or animation. Production, review Pages and the
 * isolated Yandex DRAFT share this renderer. The preexisting thumbnail draws the accessory
 * BEHIND the body; omit it here to prevent a duplicate bow/ears. */
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
    // The source art is not a successful volume render. The mesh renderer has
    // already released its failed context and memoized the fallback for this
    // Hall session; keep that state so every hidden/next-room toy does not
    // allocate another doomed WebGL context.
    return renderStudioLibraryThumbnail(destination, toy, snapshotSize);
  }
  destination.drawImage(volume, 0, 0, 256, 256);
  destination.canvas.dataset.libraryRenderer = 'volume-mesh';
  destination.canvas.dataset.libraryProjection = 'front';
  return true;
};

/** Called on leaving the Hall, including after a context-loss fallback. */
export const releasePagesVolumeThumbnail = (): void => {
  releaseVolumeMesh();
  releaseStudioLibraryThumbnail();
};
