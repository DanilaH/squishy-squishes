import { readFileSync, writeFileSync } from 'node:fs';

const replaceOnce = (source, before, after, label) => {
  if (!source.includes(before)) throw new Error(`Missing patch anchor: ${label}`);
  if (source.indexOf(before) !== source.lastIndexOf(before)) throw new Error(`Ambiguous patch anchor: ${label}`);
  return source.replace(before, after);
};

const decorPath = 'src/sandbox/decor.ts';
let decor = readFileSync(decorPath, 'utf8');
decor = replaceOnce(
  decor,
  '  readonly headAnchor: AppearancePoint;\n  readonly headBasisU: number;\n  readonly headBasisV: number;\n',
  '  readonly headAnchor: AppearancePoint;\n  readonly headBasisU: number;\n  readonly headBasisV: number;\n  readonly headSeatOffsetV: number;\n',
  'DecorFrame seat offset field',
);
decor = replaceOnce(
  decor,
  '  const headSurfaceY = Number.isFinite(topBoundaryY) ? topBoundaryY : maxY;\n  const headY = headSurfaceY - height * 0.025;\n  return {',
  `  const headSurfaceY = Number.isFinite(topBoundaryY) ? topBoundaryY : maxY;\n  const headY = headSurfaceY - height * 0.025;\n  // Keep the accessory's familiar visual seat near the top of the shape, but derive\n  // deformation from a real surface point. The offset is replayed along the live\n  // projected vertical basis, so concave shapes do not float or swallow accessories.\n  const headSeatY = maxY - height * 0.055;\n  const headSeatOffsetV = (headSeatY - headY) * 0.5;\n  return {`,
  'head seat offset calculation',
);
decor = replaceOnce(
  decor,
  '    headBasisU: clamp(width * 0.11 * 0.5, 0.055, 0.12),\n    headBasisV: clamp(height * 0.09 * 0.5, 0.045, 0.10),\n',
  '    headBasisU: clamp(width * 0.11 * 0.5, 0.055, 0.12),\n    headBasisV: clamp(height * 0.09 * 0.5, 0.045, 0.10),\n    headSeatOffsetV,\n',
  'head seat offset return',
);
writeFileSync(decorPath, decor);

const appPath = 'src/sandbox/SandboxApp.ts';
let app = readFileSync(appPath, 'utf8');
app = replaceOnce(
  app,
  '    const normVx = basisV.x / lengthV;\n    const normVy = basisV.y / lengthV;\n    const a = normUx * ratioU;',
  '    const normVx = basisV.x / lengthV;\n    const normVy = basisV.y / lengthV;\n    const seatOffsetPx = (frame.headSeatOffsetV / frame.headBasisV) * lengthV;\n    const a = normUx * ratioU;',
  'live seat offset pixels',
);
app = replaceOnce(
  app,
  '      const anchorX = canvasRect.left - stageRect.left + anchor.x;\n      const anchorY = canvasRect.top - stageRect.top + anchor.y;',
  '      const anchorX = canvasRect.left - stageRect.left + anchor.x - normVx * seatOffsetPx;\n      const anchorY = canvasRect.top - stageRect.top + anchor.y - normVy * seatOffsetPx;',
  'live accessory seat position',
);
writeFileSync(appPath, app);

const thumbnailPath = 'src/sandbox/libraryThumbnail.ts';
let thumbnail = readFileSync(thumbnailPath, 'utf8');
thumbnail = replaceOnce(
  thumbnail,
  '    const localX = frame.headAnchor.u * 2 - 1;\n    const localY = frame.headAnchor.v * 2 - 1;',
  '    const localX = frame.headAnchor.u * 2 - 1;\n    const localY = (frame.headAnchor.v + frame.headSeatOffsetV) * 2 - 1;',
  'thumbnail accessory seat',
);
writeFileSync(thumbnailPath, thumbnail);

console.log('Applied generic S3 accessory seat correction.');
