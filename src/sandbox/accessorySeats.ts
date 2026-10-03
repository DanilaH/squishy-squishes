import { getShapeTopAtX, type ShapeDefinition, type ShapeId } from '../game/shapes';
import type { AccessoryId } from './decor';

export const getAccessoryDepth = (id: AccessoryId): 'front' | 'rear' =>
  id === 'bow' || id === 'crown' ? 'front' : 'rear';

export interface AccessorySeat { readonly u: number; readonly v: number; readonly angle: number; readonly side: 'whole' | 'left' | 'right' }
// Coordinates are fractions of each mold's bounding frame; roots follow its
// actual contour. A paired accessory reuses one authored ear, mirrored on the right.
const seats: Record<ShapeId, { bow: readonly [number, number]; pair: readonly [number, number]; earAngle: number; crown: number }> = {
  'soft-square': { bow: [-.27, -.30], pair: [-.31, .31], earAngle: .16, crown: 0 },
  heart: { bow: [-.23, -.42], pair: [-.25, .25], earAngle: .22, crown: .025 },
  mochi: { bow: [-.24, -.35], pair: [-.29, .29], earAngle: .25, crown: 0 },
  peach: { bow: [-.25, -.38], pair: [-.27, .27], earAngle: .22, crown: 0 },
  mushroom: { bow: [-.29, -.40], pair: [-.32, .32], earAngle: .18, crown: 0 },
  paw: { bow: [-.28, -.58], pair: [-.36, .36], earAngle: .30, crown: 0 },
  dumpling: { bow: [-.27, -.42], pair: [-.31, .31], earAngle: .20, crown: -.045 },
  strawberry: { bow: [-.28, -.48], pair: [-.31, .31], earAngle: .24, crown: .035 },
};
export const getAccessorySeats = (shape: ShapeDefinition, id: AccessoryId): readonly AccessorySeat[] => {
  const xs = shape.boundary.map(p => p.x), ys = shape.boundary.map(p => p.y);
  const minX = Math.min(...xs), width = Math.max(...xs) - minX;
  const height = Math.max(...ys) - Math.min(...ys), center = minX + width / 2;
  const profile = seats[shape.id];
  const seat = (offset: number, angle: number, side: AccessorySeat['side'], lift = 0): AccessorySeat => {
    const x = center + width * offset;
    return { u: (x + 1) / 2, v: (getShapeTopAtX(shape, x) - height * (getAccessoryDepth(id) === 'rear' ? (shape.id === 'heart' ? .11 : .075) : .045) + height * lift + 1) / 2, angle, side };
  };
  if (id === 'bow') return [seat(profile.bow[0], profile.bow[1], 'whole')];
  if (id === 'crown') return [seat(0, 0, 'whole', profile.crown)];
  // Tall bunny ears are more upright; horns spread out along the shoulder.
  const spread = id === 'bunny-ears' ? .90 : id === 'horns' ? 1.06 : 1;
  const angle = profile.earAngle * (id === 'bunny-ears' ? .55 : id === 'horns' ? 1.15 : 1);
  return [seat(profile.pair[0] * spread, -angle, 'left'), seat(profile.pair[1] * spread, angle, 'right')];
};
