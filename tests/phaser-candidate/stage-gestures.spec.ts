import { expect, test } from '@playwright/test';
import { StageGestureRouter, type StageGestureHost, type StagePointer } from '../../src/sandbox/StageGestureRouter';
import type { AppearancePoint } from '../../src/sandbox/appearance';

const pointer = (id: number, x: number, y = 0): StagePointer => ({ id, x, y, clientX: x, clientY: y });

const setup = () => {
  const events: string[] = [];
  let squeezeCount = 0;
  let paintEnds = 0;
  let paintStamps = 0;
  let mixins = 0;
  let stickers = 0;
  let distance = 0;
  let active = false;
  const pointToUv = (x: number, y: number): AppearancePoint | null =>
    Math.hypot(x, y) <= 0.9 ? { u: x * 0.5 + 0.5, v: y * 0.5 + 0.5 } : null;
  const paintPointToUv = (x: number, y: number): AppearancePoint | null =>
    Math.abs(x) <= 1 && Math.abs(y) <= 1 ? { u: x * 0.5 + 0.5, v: y * 0.5 + 0.5 } : null;
  const host: StageGestureHost = {
    pointToUv,
    paintPointToUv,
    beginSquish: ({ x, y }) => {
      if (!pointToUv(x, y)) return false;
      active = true;
      events.push('squeeze-down');
      return true;
    },
    moveSquish: () => { if (active) events.push('squeeze-move'); },
    endSquish: () => { if (active) squeezeCount++; active = false; events.push('squeeze-up'); },
    cancelSquish: () => { active = false; events.push('squeeze-cancel'); },
    paintStamp: () => { paintStamps++; events.push('paint-stamp'); },
    paintSegment: () => events.push('paint-segment'),
    paintEnd: () => { paintEnds++; events.push('paint-end'); },
    addMixin: () => { mixins++; events.push('mixin'); },
    addSticker: () => { stickers++; events.push('sticker'); },
    mixProgress: (next) => { distance = next; events.push('mix-progress'); },
  };
  const router = new StageGestureRouter(host);
  return {
    router, events,
    get squeezeCount() { return squeezeCount; },
    get paintEnds() { return paintEnds; },
    get paintStamps() { return paintStamps; },
    get mixins() { return mixins; },
    get stickers() { return stickers; },
    get distance() { return distance; },
    get active() { return active; },
  };
};

test('M4 input: paint captures outside down and authors at texture edge before canonical silhouette', () => {
  const s = setup();
  s.router.setStage('paint');
  expect(s.router.down(pointer(1, 1.2))).toBe(true);
  expect(s.router.snapshot().owner).toBe(1);
  expect(s.paintStamps).toBe(0);
  s.router.move(pointer(2, 0)); // competing touch cannot paint
  expect(s.paintStamps).toBe(0);
  s.router.move(pointer(1, 1.0)); // canonical hit is still null, appearance UV is valid
  expect(s.paintStamps).toBe(1);
  s.router.move(pointer(1, 0.8));
  expect(s.events).toContain('paint-segment');
  s.router.move(pointer(1, 1.2));
  expect(s.paintEnds).toBe(1);
  s.router.move(pointer(1, 1.0)); // re-entering appearance space starts a new stroke
  expect(s.paintStamps).toBe(2);
  s.router.up(1);
  expect(s.paintEnds).toBe(2);
  expect(s.router.snapshot().owner).toBeNull();
  expect(s.squeezeCount).toBe(0);
});

test('M4 input: mix-in spacing and stickers use canonical hit UV, not squish gestures', () => {
  const s = setup();
  s.router.setStage('mixins');
  expect(s.router.down(pointer(1, 2))).toBe(false);
  expect(s.router.down(pointer(1, 0))).toBe(true);
  expect(s.mixins).toBe(1);
  s.router.move(pointer(1, 0.1));
  expect(s.mixins).toBe(1);
  // Client pixel distance matters, whereas x/y are normalized for this fake host.
  s.router.move({ ...pointer(1, 0.2), clientX: 25 });
  expect(s.mixins).toBe(2);
  s.router.up(1);
  s.router.setStage('decor', 'face');
  expect(s.router.down(pointer(1, 0))).toBe(false);
  s.router.setStage('decor', 'stickers');
  expect(s.router.down(pointer(1, 2))).toBe(false);
  expect(s.router.down(pointer(1, 0))).toBe(true);
  s.router.move(pointer(1, 0.3));
  expect(s.stickers).toBe(1);
  expect(s.squeezeCount).toBe(0);
  s.router.up(1);
});

test('M4 input: Mix retains progress on stage revisit, resets for a new toy and shares valid squish', () => {
  const s = setup();
  s.router.setStage('mix');
  // Local x is outside shape, and the unrelated client coordinate starts at 0.
  expect(s.router.down({ ...pointer(1, 2), clientX: 0 })).toBe(true);
  expect(s.active).toBe(false);
  for (let i = 1; i <= 20; i++) {
    s.router.move({ ...pointer(1, 2), clientX: i * 90 });
  }
  expect(s.distance).toBe(1_800);
  expect(s.router.snapshot().mixDistance).toBe(1_800);
  s.router.up(1);
  expect(s.squeezeCount).toBe(0);
  // Revisiting Mix from Decor restores progress rather than demanding a second grind.
  s.router.setStage('decor');
  s.router.setStage('mix');
  expect(s.distance).toBe(1_800);
  expect(s.router.down(pointer(2, 0))).toBe(true);
  expect(s.active).toBe(true);
  s.router.move({ ...pointer(2, 0.5), clientX: 40 });
  s.router.up(2);
  expect(s.squeezeCount).toBe(1);
  expect(s.distance).toBe(1_840);
  // Creating another toy after saving must start the Mix counter from zero.
  s.router.setStage('squeeze');
  s.router.setStage('shape');
  expect(s.router.snapshot().mixDistance).toBe(0);
  s.router.setStage('mix');
  expect(s.distance).toBe(0);
});

test('M4 input: squeeze requires hit; cancellation, blocking and stage change never credit', () => {
  const s = setup();
  s.router.setStage('squeeze');
  expect(s.router.down(pointer(1, 2))).toBe(false);
  expect(s.router.down(pointer(1, 0))).toBe(true);
  expect(s.router.down(pointer(2, 0))).toBe(false);
  s.router.up(2);
  expect(s.active).toBe(true);
  s.router.up(1, true);
  expect(s.squeezeCount).toBe(0);
  expect(s.active).toBe(false);
  expect(s.router.down(pointer(1, 0))).toBe(true);
  s.router.setBlocked(true);
  expect(s.squeezeCount).toBe(0);
  expect(s.router.down(pointer(2, 0))).toBe(false);
  s.router.setBlocked(false);
  expect(s.router.down(pointer(2, 0))).toBe(true);
  s.router.setStage('finish');
  expect(s.squeezeCount).toBe(0);
  expect(s.router.snapshot().owner).toBeNull();
  expect(s.router.down(pointer(2, 0))).toBe(false);
  s.router.setStage('squeeze');
  expect(s.router.down(pointer(2, 0))).toBe(true);
  s.router.up(2);
  expect(s.squeezeCount).toBe(1);
});
