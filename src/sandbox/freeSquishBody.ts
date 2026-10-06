import type { MaterialId } from '../game/content';

export interface RoomPoint { readonly x: number; readonly y: number }
export interface FreeSquishRoom {
  readonly left: number; readonly right: number; readonly top: number; readonly bottom: number;
  readonly pedestal: readonly RoomPoint[];
}
const restitution: Record<MaterialId, number> = { soft: .24, jelly: .46, marshmallow: .08, pearl: .56, holo: .32, chrome: .10 };
const smooth = (t: number): number => t * t * (3 - 2 * t);

/** Whole-toy motion in viewport CSS pixels. Deformation stays in SquishSimulation.
 * The caller advances this on Phaser's existing clock and supplies its live skin. */
export class FreeSquishBody {
  public x = 0; public y = 0;
  public vx = 0; public vy = 0;
  public returning = false;
  public held: number | null = null;
  private grab = { x: 0, y: 0, time: 0 };
  private returnFrom = { x: 0, y: 0 };
  private returnMs = 0;
  private resolved = { x: 0, y: 0 };
  public begin(id: number, x: number, y: number, time: number): void {
    this.held = id; this.vx = this.vy = 0;
    this.resolved = { x: this.x, y: this.y };
    this.grab = { x: x - this.x, y: y - this.y, time };
  }
  public move(id: number, x: number, y: number, time: number): void {
    if (this.held !== id || this.returning) return;
    const nx = x - this.grab.x, ny = y - this.grab.y;
    const dt = Math.max(.008, (time - this.grab.time) / 1000);
    // Fresh samples follow a flick, while a stopped hand loses old throw energy.
    const blend = 1 - Math.exp(-dt * 24);
    this.vx += (Math.max(-1800, Math.min(1800, (nx - this.x) / dt)) - this.vx) * blend;
    this.vy += (Math.max(-1800, Math.min(1800, (ny - this.y) / dt)) - this.vy) * blend;
    this.x = nx; this.y = ny; this.grab.time = time;
  }
  public end(id: number, time: number): void {
    if (this.held !== id) return;
    const fade = Math.exp(-Math.max(0, time - this.grab.time - 45) / 65);
    this.vx *= fade; this.vy *= fade; this.held = null;
  }
  public cancel(): void { this.held = null; this.vx = this.vy = 0; }
  public returnHome(): void {
    this.cancel(); this.returning = true; this.returnMs = 0;
    this.returnFrom = { x: this.x, y: this.y };
  }
  public advance(ms: number, points: readonly RoomPoint[], room: FreeSquishRoom, material: MaterialId, radius: number,
    impact: (nx: number, ny: number, speed: number) => void): boolean {
    if (this.returning) {
      this.returnMs += Math.max(0, Math.min(ms, 40));
      const t = Math.min(1, this.returnMs / 620);
      const minY = points.length ? Math.min(...points.map(p => p.y)) : room.top;
      const lift = Math.max(room.top - minY, Math.min(this.returnFrom.y, -radius * 1.6));
      this.x = this.returnFrom.x * (1 - smooth(Math.min(1, Math.max(0, (t - .35) / .4))));
      this.y = t < .35 ? this.returnFrom.y + (lift - this.returnFrom.y) * smooth(t / .35)
        : t < .75 ? lift : lift * (1 - smooth((t - .75) / .25));
      if (t === 1) { this.x = this.y = 0; this.returning = false; return true; }
      return false;
    }
    if (!points.length) return false;
    const dt = Math.max(0, Math.min(ms, 40)) / 1000;
    const target = { x: this.x, y: this.y };
    const held = this.held !== null;
    const travel = held ? Math.hypot(target.x - this.resolved.x, target.y - this.resolved.y) : 0;
    const steps = Math.max(1, Math.ceil(dt * 240), Math.ceil(travel / Math.max(2, radius * .12))), step = dt / steps;
    if (held) { this.x = this.resolved.x; this.y = this.resolved.y; }
    for (let n = 0; n < steps; n++) {
      if (held) {
        this.x += (target.x - this.resolved.x) / steps;
        this.y += (target.y - this.resolved.y) / steps;
      } else {
        this.vy += 980 * step;
        this.vx *= Math.exp(-.14 * step);
        this.x += this.vx * step; this.y += this.vy * step;
      }
      this.resolve(points, room, restitution[material], impact);
    }
    this.resolved = { x: this.x, y: this.y };
    return false;
  }
  private bounce(nx: number, ny: number, amount: number, bounce: number,
    impact: (nx: number, ny: number, speed: number) => void): void {
    this.x += nx * amount; this.y += ny * amount;
    const normal = this.vx * nx + this.vy * ny;
    if (normal >= 0 || this.held !== null) return;
    const speed = -normal;
    const factor = speed < 55 ? 1 : 1 + bounce;
    this.vx -= factor * normal * nx; this.vy -= factor * normal * ny;
    // Contact friction prevents endless horizontal sliding after a small bounce.
    const tangent = this.vx * -ny + this.vy * nx;
    this.vx -= -ny * tangent * .035; this.vy -= nx * tangent * .035;
    if (speed > 90) impact(nx, ny, speed);
  }
  private resolve(points: readonly RoomPoint[], room: FreeSquishRoom, bounce: number,
    impact: (nx: number, ny: number, speed: number) => void): void {
    let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
    for (const p of points) { left = Math.min(left, p.x); right = Math.max(right, p.x); top = Math.min(top, p.y); bottom = Math.max(bottom, p.y); }
    if (left + this.x < room.left) this.bounce(1, 0, room.left - left - this.x, bounce, impact);
    if (right + this.x > room.right) this.bounce(-1, 0, right + this.x - room.right, bounce, impact);
    if (top + this.y < room.top) this.bounce(0, 1, room.top - top - this.y, bounce, impact);
    if (bottom + this.y > room.bottom) this.bounce(0, -1, bottom + this.y - room.bottom, bounce, impact);
    const obstacle = room.pedestal;
    if (obstacle.length < 3) return;
    // SAT uses the live body contour (its convex support) and the illustrated
    // pedestal's convex outline. Holes remain holes in hit testing/rendering.
    const axes: RoomPoint[] = [{ x: 1, y: 0 }, { x: 0, y: 1 }];
    for (let i = 0; i < obstacle.length; i++) {
      const a = obstacle[i]!, b = obstacle[(i + 1) % obstacle.length]!, len = Math.hypot(b.x - a.x, b.y - a.y);
      if (len) axes.push({ x: -(b.y - a.y) / len, y: (b.x - a.x) / len });
    }
    let amount = Infinity, normal = { x: 0, y: 0 };
    for (const axis of axes) {
      let lo = Infinity, hi = -Infinity, olo = Infinity, ohi = -Infinity;
      for (const p of points) { const d = (p.x + this.x) * axis.x + (p.y + this.y) * axis.y; lo = Math.min(lo, d); hi = Math.max(hi, d); }
      for (const p of obstacle) { const d = p.x * axis.x + p.y * axis.y; olo = Math.min(olo, d); ohi = Math.max(ohi, d); }
      if (hi <= olo || lo >= ohi) return;
      const negative = hi - olo, positive = ohi - lo;
      const depth = Math.min(negative, positive), sign = negative < positive ? -1 : 1;
      if (depth < amount) { amount = depth; normal = { x: axis.x * sign, y: axis.y * sign }; }
    }
    this.bounce(normal.x, normal.y, amount + .05, bounce, impact);
  }
}
