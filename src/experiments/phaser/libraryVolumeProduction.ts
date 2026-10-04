import { REST_FACE, type FaceReaction } from '../../sandbox/toyReactions';
import type { SavedSquishy } from '../../sandbox/types';
import { releaseStudioLibraryThumbnail, renderStudioLibraryThumbnail } from '../../sandbox/libraryStudioThumbnail';
import { renderNeutralVolumeAlbedo } from './libraryVolumeAlbedo';
import { releaseVolumeMesh, renderVolumeMesh } from './libraryVolumeMesh';

/** Owner-reviewed Hall: static 512px mesh snapshots, one reusable offscreen WebGL2
 * context, no per-card context or animation. Production, review Pages and the
 * isolated Yandex DRAFT share this renderer. Accessories are composited once,
 * behind or in front of the body by accessory type, using Studio seats. */
export const renderPagesVolumeThumbnail = (
  destination: CanvasRenderingContext2D, toy: SavedSquishy, snapshotSize: 256 | 512, reaction: FaceReaction = REST_FACE,
): boolean => {
  if (snapshotSize !== 512) return renderStudioLibraryThumbnail(destination, toy, snapshotSize, reaction);
  const source = renderNeutralVolumeAlbedo(toy, reaction);
  const volume = renderVolumeMesh(toy, source);
  if (volume.dataset.volumeRenderer === 'mesh-unavailable') {
    // The source art is not a successful volume render. The mesh renderer has
    // already released its failed context and memoized the fallback for this
    // Hall session; keep that state so every hidden/next-room toy does not
    // allocate another doomed WebGL context.
    return renderStudioLibraryThumbnail(destination, toy, snapshotSize, reaction);
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
