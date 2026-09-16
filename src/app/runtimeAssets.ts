import {
  detectPreferredRuntimeImageFormat,
  resolveRuntimeImageRequestPath,
  type RuntimeImageFormat,
} from '@danilah/mini-games-kit/runtime-assets';

let pendingFormat: Promise<RuntimeImageFormat> | null = null;

/**
 * Call before queueing an authored image, not for procedural squishy textures.
 * The promise is shared so simultaneous assets run exactly one capability probe.
 */
export const detectAuthoredImageFormat = (): Promise<RuntimeImageFormat> => {
  pendingFormat ??= detectPreferredRuntimeImageFormat({
    overrideEnabled: import.meta.env.DEV,
  }).catch((error: unknown) => {
    console.warn('[squishy:art-format] AVIF probe failed; using WebP', error);
    return 'webp' as const;
  });
  return pendingFormat;
};

/**
 * A WebP fallback must always exist. Only request AVIF when the matching file
 * was actually emitted by asset:prepare and recorded in the art manifest.
 */
export const resolveAuthoredImagePath = async (
  fallbackWebpPath: string,
  hasAvifCompanion: boolean,
): Promise<string> => {
  if (!/\.webp(?:[?#]|$)/i.test(fallbackWebpPath)) {
    throw new Error(`Expected a canonical WebP asset path: ${fallbackWebpPath}`);
  }
  if (!hasAvifCompanion) return fallbackWebpPath;
  return resolveRuntimeImageRequestPath(fallbackWebpPath, await detectAuthoredImageFormat());
};
