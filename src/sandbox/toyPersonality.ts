import type { AccessoryId } from './decor';
import { REST_TOY, type ToyPose } from './livingToy';

const unit = (n: number): number => Math.max(0, Math.min(1, n));
const quantize = (n: number): number => Math.round(unit(n) * 8) / 8;

/** Transient responses only; the host supplies input timestamps and its presentation clock. */
export class ToyPersonality {
  private beganInputAt = 0;
  private lastTapAt = -Infinity;
  private taps = 0;
  private surprisedAt = -Infinity;
  private strokingAt = -Infinity;
  private stretched = 0;
  private releasedAt = -Infinity;
  private releaseStrength = 0;

  public begin(now: number, inputTime = now): void { this.beganInputAt = inputTime; this.releasedAt = -Infinity; this.stretched = 0; }
  public release(now: number, energy: number, inputTime = now): void {
    if (inputTime - this.beganInputAt >= 0 && inputTime - this.beganInputAt < 220) {
      this.taps = inputTime >= this.lastTapAt && inputTime - this.lastTapAt < 750 ? this.taps + 1 : 1;
      this.lastTapAt = inputTime;
      if (this.taps >= 3) { this.surprisedAt = now; this.taps = 0; }
    } else this.taps = 0;
    this.releasedAt = now;
    this.releaseStrength = this.stretched > .25 || energy > .35 ? unit(Math.max(energy, this.stretched)) : 0;
    this.strokingAt = -Infinity;
  }
  public greet(now: number): void { this.releasedAt = now; this.releaseStrength = .35; }
  public cancel(): void {
    this.taps = 0; this.lastTapAt = -Infinity; this.surprisedAt = this.strokingAt = this.releasedAt = -Infinity;
    this.stretched = this.releaseStrength = 0;
  }
  public sample(now: number, active: boolean, stroke: number, stretch: number): { surprise: number; blink: number } {
    if (active) this.stretched = Math.max(this.stretched, stretch);
    if (active && stroke > .6) { if (!Number.isFinite(this.strokingAt)) this.strokingAt = now; }
    else this.strokingAt = -Infinity;
    const surprise = quantize(1 - (now - this.surprisedAt) / 650);
    const blink = active && now - this.strokingAt > 650 ? quantize(stroke * .65) : 0;
    return { surprise, blink };
  }
  public releasePose(now: number): ToyPose {
    const ms = now - this.releasedAt;
    if (ms < 0 || ms >= 700 || !this.releaseStrength) return REST_TOY;
    const t = ms / 700, fade = (1 - t) ** 2 * this.releaseStrength;
    return { ...REST_TOY, kind: 'jiggle', rotation: Math.sin(t * Math.PI * 6) * .045 * fade,
      scaleY: 1 + Math.sin(t * Math.PI * 4) * .025 * fade, delight: quantize(fade), sway: Math.sin(t * Math.PI * 6) * .04 * fade };
  }
}

/** Secondary motion around the existing seat. No change to authored coordinates. */
export const accessoryMotion = (id: AccessoryId, ms: number, strength: number, piece: number) => {
  if (ms < 0 || ms > 1100) return { angle: 0, lift: 0, scale: 1 };
  const t = ms / 1000, fade = Math.exp(-t * (id === 'bow' ? 4.5 : 6)) * unit(strength);
  const ears = id === 'cat-ears' || id === 'bunny-ears' || id === 'horns';
  return {
    angle: Math.sin(t * (id === 'bow' ? 16 : ears ? 20 : 13)) * fade * (ears ? .11 : id === 'bow' ? .09 : .04) * (piece === 1 ? -.85 : 1),
    lift: id === 'crown' ? Math.abs(Math.sin(t * 15)) * fade * .035 : 0,
    scale: 1 + (id === 'bow' ? Math.sin(t * 18) * fade * .035 : 0),
  };
};
