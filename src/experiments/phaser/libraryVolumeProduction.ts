import { REST_FACE, type FaceReaction } from '../../sandbox/toyReactions';
import type { SavedSquishy } from '../../sandbox/types';
import { releaseStudioLibraryThumbnail, renderStudioLibraryThumbnail } from '../../sandbox/libraryStudioThumbnail';

/** Hall snapshots the exact production front shader and backing, not the old comparison mesh. */
export const renderPagesVolumeThumbnail = (
  destination: CanvasRenderingContext2D, toy: SavedSquishy, snapshotSize: 256 | 512, reaction: FaceReaction = REST_FACE,
): boolean => {
  const rendered = renderStudioLibraryThumbnail(destination, toy, snapshotSize, reaction);
  if (rendered) { destination.canvas.dataset.libraryRenderer = 'volume-mesh'; destination.canvas.dataset.libraryProjection = 'front'; }
  return rendered;
};
export const releasePagesVolumeThumbnail = releaseStudioLibraryThumbnail;
