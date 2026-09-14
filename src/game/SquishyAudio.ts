import { ContinuousNoiseTexture, type ContinuousNoiseTextureProfile } from '@danilah/mini-games-kit/audio';
import type { PresentationTier } from './presentation';

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
const STAGE_COMPLETE_PITCH = [0.975, 1.025, 1] as const;

interface ActivePour {
  source: AudioBufferSourceNode;
  filter: BiquadFilterNode;
  gain: GainNode;
}

interface RevealProfile {
  readonly lowStartHz: number;
  readonly lowGain: number;
  readonly highStartHz: number;
  readonly highEndHz: number;
  readonly highGain: number;
  readonly duration: number;
  readonly shimmerGain: number;
}

const revealProfiles: Readonly<Record<PresentationTier, RevealProfile>> = {
  standard: {
    lowStartHz: 110,
    lowGain: 0.044,
    highStartHz: 520,
    highEndHz: 730,
    highGain: 0.014,
    duration: 0.28,
    shimmerGain: 0,
  },
  special: {
    lowStartHz: 98,
    lowGain: 0.05,
    highStartHz: 590,
    highEndHz: 860,
    highGain: 0.018,
    duration: 0.31,
    shimmerGain: 0.004,
  },
  showcase: {
    lowStartHz: 88,
    lowGain: 0.054,
    highStartHz: 660,
    highEndHz: 1040,
    highGain: 0.021,
    duration: 0.34,
    shimmerGain: 0.009,
  },
};

interface CollectProfile {
  readonly startHz: number;
  readonly endHz: number;
  readonly gain: number;
  readonly duration: number;
}

const collectProfiles: Readonly<Record<PresentationTier, CollectProfile>> = {
  standard: { startHz: 330, endHz: 510, gain: 0.02, duration: 0.13 },
  special: { startHz: 355, endHz: 585, gain: 0.021, duration: 0.145 },
  showcase: { startHz: 385, endHz: 680, gain: 0.022, duration: 0.16 },
};

export class SquishyAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private tactile: ContinuousNoiseTexture | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private activePour: ActivePour | null = null;
  private pourRequestId = 0;
  private stageCompleteToneIndex = 0;
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
    const pitch = STAGE_COMPLETE_PITCH[this.stageCompleteToneIndex % STAGE_COMPLETE_PITCH.length]!;
    this.stageCompleteToneIndex = (this.stageCompleteToneIndex + 1) % STAGE_COMPLETE_PITCH.length;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime((405 + strength * 85) * pitch, now);
    oscillator.frequency.exponentialRampToValueAtTime((548 + strength * 110) * pitch, now + 0.072);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.011 + strength * 0.009, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.112);

    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + 0.12);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }

  public playReveal(tier: PresentationTier): void {
    if (!this.context || !this.master || this.context.state !== 'running' || this.muted) return;
    const profile = revealProfiles[tier];
    const now = this.context.currentTime;

    const low = this.context.createOscillator();
    const lowGain = this.context.createGain();
    low.type = 'sine';
    low.frequency.setValueAtTime(profile.lowStartHz, now);
    low.frequency.exponentialRampToValueAtTime(58, now + profile.duration * 0.82);
    lowGain.gain.setValueAtTime(0.0001, now);
    lowGain.gain.exponentialRampToValueAtTime(profile.lowGain, now + 0.018);
    lowGain.gain.exponentialRampToValueAtTime(0.0001, now + profile.duration);
    low.connect(lowGain);
    lowGain.connect(this.master);
    low.start(now);
    low.stop(now + profile.duration + 0.02);

    const high = this.context.createOscillator();
    const highGain = this.context.createGain();
    high.type = tier === 'showcase' ? 'sine' : 'triangle';
    high.frequency.setValueAtTime(profile.highStartHz, now + 0.055);
    high.frequency.exponentialRampToValueAtTime(profile.highEndHz, now + profile.duration * 0.8);
    highGain.gain.setValueAtTime(0.0001, now);
    highGain.gain.exponentialRampToValueAtTime(profile.highGain, now + 0.075);
    highGain.gain.exponentialRampToValueAtTime(0.0001, now + profile.duration + 0.045);
    high.connect(highGain);
    highGain.connect(this.master);
    high.start(now + 0.05);
    high.stop(now + profile.duration + 0.06);

    low.onended = () => {
      low.disconnect();
      lowGain.disconnect();
    };
    high.onended = () => {
      high.disconnect();
      highGain.disconnect();
    };

    if (profile.shimmerGain > 0 && this.noiseBuffer) {
      const shimmer = this.context.createBufferSource();
      const filter = this.context.createBiquadFilter();
      const shimmerGain = this.context.createGain();
      shimmer.buffer = this.noiseBuffer;
      filter.type = 'bandpass';
      filter.frequency.value = tier === 'showcase' ? 2850 : 2250;
      filter.Q.value = tier === 'showcase' ? 1.5 : 1.05;
      shimmerGain.gain.setValueAtTime(0.0001, now + 0.055);
      shimmerGain.gain.exponentialRampToValueAtTime(profile.shimmerGain, now + 0.105);
      shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + profile.duration + 0.07);
      shimmer.connect(filter);
      filter.connect(shimmerGain);
      shimmerGain.connect(this.master);
      shimmer.start(now + 0.05);
      shimmer.stop(now + profile.duration + 0.09);
      shimmer.onended = () => {
        shimmer.disconnect();
        filter.disconnect();
        shimmerGain.disconnect();
      };
    }
  }

  public playCollect(tier: PresentationTier): void {
    if (!this.context || !this.master || this.context.state !== 'running' || this.muted) return;
    const profile = collectProfiles[tier];
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(profile.startHz, now);
    oscillator.frequency.exponentialRampToValueAtTime(profile.endHz, now + profile.duration * 0.72);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(profile.gain, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + profile.duration);

    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + profile.duration + 0.015);
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
