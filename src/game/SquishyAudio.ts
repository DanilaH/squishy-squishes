import { ContinuousNoiseTexture, type ContinuousNoiseTextureProfile } from '@danilah/mini-games-kit/audio';

type PourKind = 'base' | 'beads';

const tactileProfile: ContinuousNoiseTextureProfile = {
  minGain: 0.004,
  maxGain: 0.038,
  minBandHz: 170,
  maxBandHz: 620,
  minQ: 0.9,
  maxQ: 2.2,
  progressWeight: 0.42,
  velocityWeight: 0.58,
  updateMs: 34,
  startAttackMs: 110,
  startVelocityCap: 0.18,
  startGainMultiplier: 0.24,
  idleReleaseMs: 80,
  releaseMs: 110,
};

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

interface ActivePour {
  source: AudioBufferSourceNode;
  filter: BiquadFilterNode;
  gain: GainNode;
}

export class SquishyAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private tactile: ContinuousNoiseTexture | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private activePour: ActivePour | null = null;
  private pourRequestId = 0;
  private muted = false;
  private disposed = false;

  public async prime(): Promise<void> {
    if (this.disposed) return;
    if (!this.context) {
      const context = new AudioContext();
      const master = context.createGain();
      master.gain.value = this.muted ? 0 : 0.68;
      master.connect(context.destination);

      this.context = context;
      this.master = master;
      this.noiseBuffer = this.createNoiseBuffer(context);
      this.tactile = new ContinuousNoiseTexture(context, master, tactileProfile);
      this.tactile.prime();
    }

    if (this.context.state !== 'running') await this.context.resume();
  }

  public updateTactile(progress: number, velocity: number): void {
    this.tactile?.update(progress, velocity);
  }

  public releaseTactile(intensity = 0): void {
    this.tactile?.update(0, 0);
    if (intensity > 0.08) this.playReleasePlop(intensity);
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (!this.context || !this.master) return;
    this.master.gain.setTargetAtTime(muted ? 0 : 0.68, this.context.currentTime, 0.025);
  }

  public startPour(kind: PourKind): void {
    const requestId = ++this.pourRequestId;
    void this.startPourAsync(kind, requestId);
  }

  public stopPour(): void {
    this.pourRequestId += 1;
    this.stopActivePour();
  }

  public playStageComplete(weight = 0.5): void {
    if (!this.context || !this.master || this.context.state !== 'running' || this.muted) return;
    const strength = clamp01(weight);
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(410 + strength * 90, now);
    oscillator.frequency.exponentialRampToValueAtTime(560 + strength * 120, now + 0.075);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.014 + strength * 0.012, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + 0.13);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }

  public playReveal(premium = false): void {
    if (!this.context || !this.master || this.context.state !== 'running' || this.muted) return;
    const now = this.context.currentTime;

    const low = this.context.createOscillator();
    const lowGain = this.context.createGain();
    low.type = 'sine';
    low.frequency.setValueAtTime(premium ? 92 : 108, now);
    low.frequency.exponentialRampToValueAtTime(58, now + 0.24);
    lowGain.gain.setValueAtTime(0.0001, now);
    lowGain.gain.exponentialRampToValueAtTime(premium ? 0.062 : 0.048, now + 0.018);
    lowGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.27);
    low.connect(lowGain);
    lowGain.connect(this.master);
    low.start(now);
    low.stop(now + 0.29);

    const high = this.context.createOscillator();
    const highGain = this.context.createGain();
    high.type = 'triangle';
    high.frequency.setValueAtTime(premium ? 610 : 540, now + 0.055);
    high.frequency.exponentialRampToValueAtTime(premium ? 940 : 760, now + 0.22);
    highGain.gain.setValueAtTime(0.0001, now);
    highGain.gain.exponentialRampToValueAtTime(premium ? 0.024 : 0.016, now + 0.075);
    highGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    high.connect(highGain);
    highGain.connect(this.master);
    high.start(now + 0.05);
    high.stop(now + 0.34);

    low.onended = () => {
      low.disconnect();
      lowGain.disconnect();
    };
    high.onended = () => {
      high.disconnect();
      highGain.disconnect();
    };
  }

  public playCollect(): void {
    if (!this.context || !this.master || this.context.state !== 'running' || this.muted) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(330, now);
    oscillator.frequency.exponentialRampToValueAtTime(515, now + 0.09);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.024, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);

    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + 0.14);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stopPour();
    this.tactile?.dispose();
    this.tactile = null;
    this.master?.disconnect();
    this.master = null;
    this.noiseBuffer = null;
    if (this.context) void this.context.close();
    this.context = null;
  }

  private async startPourAsync(kind: PourKind, requestId: number): Promise<void> {
    await this.prime();
    if (requestId !== this.pourRequestId) return;
    if (!this.context || !this.master || !this.noiseBuffer || this.muted || this.disposed) return;

    this.stopActivePour();

    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    const now = this.context.currentTime;

    source.buffer = this.noiseBuffer;
    source.loop = true;
    filter.type = kind === 'base' ? 'bandpass' : 'highpass';
    filter.frequency.value = kind === 'base' ? 360 : 1450;
    filter.Q.value = kind === 'base' ? 0.85 : 0.65;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(kind === 'base' ? 0.038 : 0.024, now + 0.06);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(now);
    this.activePour = { source, filter, gain };
  }

  private stopActivePour(): void {
    const active = this.activePour;
    if (!active || !this.context) return;
    this.activePour = null;

    const now = this.context.currentTime;
    active.gain.gain.cancelScheduledValues(now);
    active.gain.gain.setValueAtTime(Math.max(0.0001, active.gain.gain.value), now);
    active.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
    active.source.stop(now + 0.09);
    active.source.onended = () => {
      active.source.disconnect();
      active.filter.disconnect();
      active.gain.disconnect();
    };
  }

  private playReleasePlop(intensity: number): void {
    if (!this.context || !this.master || this.context.state !== 'running' || this.muted) return;

    const strength = clamp01(intensity);
    const now = this.context.currentTime;
    const duration = 0.11 + strength * 0.055;
    const oscillator = this.context.createOscillator();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(104 - strength * 16, now);
    oscillator.frequency.exponentialRampToValueAtTime(58, now + duration);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(260, now);
    filter.Q.setValueAtTime(0.7, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.016 + strength * 0.036, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
    oscillator.onended = () => {
      oscillator.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }

  private createNoiseBuffer(context: AudioContext): AudioBuffer {
    const length = Math.max(1, Math.round(context.sampleRate * 0.65));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const channel = buffer.getChannelData(0);
    let previous = 0;

    for (let index = 0; index < channel.length; index += 1) {
      const white = Math.random() * 2 - 1;
      previous = previous * 0.72 + white * 0.28;
      channel[index] = previous * 0.8;
    }

    return buffer;
  }
}
