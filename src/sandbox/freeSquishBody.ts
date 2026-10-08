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
  public angle = 0; public omega = 0;
  public contact = { nx: 0, ny: 0, pressure: 0 };
  public tension = 0;
  public pull = { x: 0, y: 1 };
  public anchor = { x: 0, y: 0 };
  private origin = { x: 0, y: 0 };
  private originSet = false;
  private pointerQuietSeconds = 0;
  private gripAcceleration = { x: 0, y: 0 };
  private pointer = { x: 0, y: 0, time: 0, vx: 0, vy: 0 };
  private returnFrom = { x: 0, y: 0, angle: 0 };
  private returnMs = 0;
  private stickMs = 0;
  private stickCooldown = 0;
  private stickNormal = { x: 0, y: 0 };
  private radius = 1;
  private material: MaterialId = 'soft';
  private impactSpeed = 0;
  private skin: readonly RoomPoint[] = [];
  public setOrigin(origin: RoomPoint): void { this.origin = { ...origin }; this.originSet = true; }
  public begin(id: number, x: number, y: number, time: number, origin?: RoomPoint): void {
    this.pointerQuietSeconds = 0; this.gripAcceleration = { x: 0, y: 0 }; this.pull = { x: 0, y: 1 };
    this.held = id; this.vx *= .35; this.vy *= .35; this.omega *= .6;
    if (origin) this.setOrigin(origin);
    const dx = x - this.origin.x - this.x, dy = y - this.origin.y - this.y;
    const c = Math.cos(this.angle), s = Math.sin(this.angle);
    this.anchor = { x: dx * c + dy * s, y: -dx * s + dy * c };
    this.pointer = { x, y, time, vx: 0, vy: 0 }; this.stickMs = 0;
  }
  public move(id: number, x: number, y: number, time: number): void {
    if (this.held !== id || this.returning) return;
    this.pointerQuietSeconds = 0;
    const dt = Math.max(.008, (time - this.pointer.time) / 1000);
    const blend = 1 - Math.exp(-dt * 24);
    const cap = (n: number): number => Math.max(-2200, Math.min(2200, n));
    const previousVx = this.pointer.vx, previousVy = this.pointer.vy;
    this.pointer.vx += (cap((x - this.pointer.x) / dt) - this.pointer.vx) * blend;
    this.pointer.vy += (cap((y - this.pointer.y) / dt) - this.pointer.vy) * blend;
    this.gripAcceleration = {
      x: Math.max(-2.5, Math.min(2.5, (this.pointer.vx - previousVx) / dt / 980)),
      y: Math.max(-2.5, Math.min(2.5, (this.pointer.vy - previousVy) / dt / 980)),
    };
    this.pointer.x = x; this.pointer.y = y; this.pointer.time = time;
  }
  public end(id: number, time: number): void {
    if (this.held !== id) return;
    const fade = Math.exp(-Math.max(0, time - this.pointer.time - 45) / 65);
    // A flick between frames still transfers energy. A held, stopped hand does not.
    this.vx = this.vx * .65 + this.pointer.vx * .35 * fade;
    this.vy = this.vy * .65 + this.pointer.vy * .35 * fade;
    this.held = null;
  }
  public cancel(): void {
    this.held = null; this.vx = this.vy = this.omega = 0; this.stickMs = 0;
  }
  public reset(): void {
    this.cancel(); this.x = this.y = this.angle = this.tension = 0;
    this.contact = { nx: 0, ny: 0, pressure: 0 };
  }
  public returnHome(): void {
    this.cancel(); this.returning = true; this.returnMs = 0;
    // Equivalent orientation, shortest return: several completed spins must
    // not unwind backwards when the player asks for the pedestal.
    this.angle = ((this.angle + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    this.returnFrom = { x: this.x, y: this.y, angle: this.angle };
  }
  public advance(ms: number, points: readonly RoomPoint[], room: FreeSquishRoom, material: MaterialId, radius: number,
    impact: (nx: number, ny: number, speed: number) => void, skinAngle = 0): boolean {
    if (this.returning) {
      this.returnMs += Math.max(0, Math.min(ms, 40));
      const t = Math.min(1, this.returnMs / 620);
      const minY = points.length ? Math.min(...points.map(p => p.y)) : room.top;
      const lift = Math.max(room.top - minY, Math.min(this.returnFrom.y, -radius * 1.6));
      this.x = this.returnFrom.x * (1 - smooth(Math.min(1, Math.max(0, (t - .35) / .4))));
      this.y = t < .35 ? this.returnFrom.y + (lift - this.returnFrom.y) * smooth(t / .35)
        : t < .75 ? lift : lift * (1 - smooth((t - .75) / .25));
      this.angle = this.returnFrom.angle * (1 - smooth(t));
      this.tension *= .9; this.contact.pressure *= .85;
      if (t === 1) { this.reset(); this.returning = false; return true; }
      return false;
    }
    if (!points.length) return false;
    if (!this.originSet) this.setOrigin({ x: (Math.min(...points.map(p => p.x)) + Math.max(...points.map(p => p.x))) / 2, y: (Math.min(...points.map(p => p.y)) + Math.max(...points.map(p => p.y))) / 2 });
    this.radius = Math.max(1, radius); this.material = material; this.impactSpeed = 0;
    const dt = Math.max(0, Math.min(ms, 40)) / 1000;
    const steps = Math.max(1, Math.ceil(dt * 240), Math.ceil(Math.hypot(this.vx, this.vy) * dt / Math.max(2, radius * .10)));
    const step = dt / steps;
    this.contact.pressure *= Math.exp(-dt * 7);
    let load = 0;
    for (let n = 0; n < steps; n++) {
      this.stickCooldown = Math.max(0, this.stickCooldown - step);
      if (this.held !== null) {
        const c = Math.cos(this.angle), s = Math.sin(this.angle);
        const ax = this.anchor.x * c - this.anchor.y * s, ay = this.anchor.x * s + this.anchor.y * c;
        const ex = this.pointer.x - this.origin.x - this.x - ax, ey = this.pointer.y - this.origin.y - this.y - ay;
        this.pointerQuietSeconds += step;
        const handFade = Math.exp(-Math.max(0, this.pointerQuietSeconds - .045) / .065);
        const stiffness = 280, damping = 29;
        const fx = ex * stiffness - (this.vx - ay * this.omega - this.pointer.vx * handFade) * damping;
        const fy = ey * stiffness - (this.vy + ax * this.omega - this.pointer.vy * handFade) * damping;
        this.vx += fx * step; this.vy += (fy + 980) * step;
        // Hand acceleration loads the mesh. Do not feed its own changing
        // grip deformation back as acceleration: that creates a spring loop.
        const blend = 1 - Math.exp(-step * 6);
        this.pull.x += (-this.gripAcceleration.x - this.pull.x) * blend;
        this.pull.y += (1 - this.gripAcceleration.y - this.pull.y) * blend;
        this.gripAcceleration.x *= Math.exp(-step * 8);
        this.gripAcceleration.y *= Math.exp(-step * 8);
        this.omega += (ax * fy - ay * fx) / (radius * radius * .75) * step;
        load = Math.max(load, Math.min(1, Math.hypot(ex, ey) / radius * .65 + this.omega ** 2 * Math.hypot(ax, ay) / 6000));
      } else {
        this.vy += 980 * step;
        if (this.stickMs > 0) {
          this.stickMs -= step;
          const normal = this.vx * this.stickNormal.x + this.vy * this.stickNormal.y;
          this.vx -= normal * this.stickNormal.x; this.vy -= normal * this.stickNormal.y;
          this.vy *= Math.exp(-step * 14); this.omega *= Math.exp(-step * 10);
          this.contact = { nx: this.stickNormal.x, ny: this.stickNormal.y, pressure: .38 };
          if (this.stickMs <= 0) { this.vx += this.stickNormal.x * 45; this.stickCooldown = .65; }
        }
      }
      this.vx = Math.max(-2200, Math.min(2200, this.vx)); this.vy = Math.max(-2200, Math.min(2200, this.vy));
      this.omega = Math.max(-18, Math.min(18, this.omega)) * Math.exp(-step * .65);
      this.vx *= Math.exp(-.14 * step);
      this.x += this.vx * step; this.y += this.vy * step; this.angle += this.omega * step;
      const c = Math.cos(this.angle - skinAngle), s = Math.sin(this.angle - skinAngle);
      const skin = points.map(p => {
        const dx = p.x - this.origin.x, dy = p.y - this.origin.y;
        return { x: this.origin.x + dx * c - dy * s, y: this.origin.y + dx * s + dy * c };
      });
      this.resolve(skin, room, restitution[material], impact);
    }
    this.tension += (load - this.tension) * (1 - Math.exp(-dt * (load > this.tension ? 12 : 5)));
    return false;
  }
  private bounce(nx: number, ny: number, amount: number, bounce: number,
    impact: (nx: number, ny: number, speed: number) => void): void {
    this.x += nx * amount; this.y += ny * amount;
    let support: RoomPoint = this.origin, minimum = Infinity, supportCount = 0;
    for (const p of this.skin) {
      const dot = (p.x - this.origin.x) * nx + (p.y - this.origin.y) * ny;
      if (dot < minimum - .05) { minimum = dot; support = p; supportCount = 1; }
      else if (Math.abs(dot - minimum) <= .05) { support = { x: (support.x * supportCount + p.x) / (supportCount + 1), y: (support.y * supportCount + p.y) / (supportCount + 1) }; supportCount++; }
    }
    const lever = (support.x - this.origin.x) * ny - (support.y - this.origin.y) * nx;
    const normal = this.vx * nx + this.vy * ny;
    const speed = Math.max(0, -normal);
    this.contact = { nx, ny, pressure: Math.min(1, Math.max(this.contact.pressure, amount / this.radius * 2, speed / 1100, ny < -.5 ? .48 : 0)) };
    if (normal >= 0) return;
    const factor = this.held !== null || speed < 55 ? 1 : 1 + bounce;
    this.vx -= factor * normal * nx; this.vy -= factor * normal * ny;
    this.omega += factor * speed * lever / (this.radius * this.radius * .75);
    const tangent = this.vx * -ny + this.vy * nx;
    const friction = this.material === 'jelly' || this.material === 'marshmallow' ? .12 : .05;
    this.vx -= -ny * tangent * friction; this.vy -= nx * tangent * friction;
    // Tangential contact transfers spin, then dissipates it at resting contact.
    this.omega += tangent / this.radius * friction * .8;
    this.omega *= speed < 55 ? .86 : .96;
    if (this.held === null && Math.abs(nx) > .6 && speed > 160 && this.stickCooldown === 0) {
      const duration = this.material === 'jelly' ? .34 : this.material === 'soft' ? .12 : this.material === 'marshmallow' ? .18 : 0;
      if (duration) { this.stickMs = duration; this.stickNormal = { x: nx, y: ny }; this.stickCooldown = duration + .65; }
    }
    if (speed > 90 && speed > this.impactSpeed) { this.impactSpeed = speed; impact(nx, ny, speed); }
  }
  private resolve(points: readonly RoomPoint[], room: FreeSquishRoom, bounce: number,
    impact: (nx: number, ny: number, speed: number) => void): void {
    this.skin = points;
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
