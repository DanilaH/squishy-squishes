import { ContinuousNoiseTexture, type ContinuousNoiseTextureProfile } from '@danilah/mini-games-kit/audio';

const profile: ContinuousNoiseTextureProfile = {
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

export class TactileAudio {
  private context: AudioContext | null = null;
  private output: GainNode | null = null;
  private texture: ContinuousNoiseTexture | null = null;
  private muted = false;

  async prime(): Promise<void> {
    if (!this.context) {
      this.context = new AudioContext();
      this.output = this.context.createGain();
      this.output.gain.value = this.muted ? 0 : 0.72;
      this.output.connect(this.context.destination);
      this.texture = new ContinuousNoiseTexture(this.context, this.output, profile);
      this.texture.prime();
    }
    if (this.context.state !== 'running') await this.context.resume();
  }

  update(progress: number, velocity: number): void {
    this.texture?.update(progress, velocity);
  }

  release(intensity = 0): void {
    this.texture?.update(0, 0);
    if (intensity > 0.08) this.playReleasePlop(intensity);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (!this.output || !this.context) return;
    this.output.gain.setTargetAtTime(muted ? 0 : 0.72, this.context.currentTime, 0.02);
  }

  dispose(): void {
    this.texture?.dispose();
    this.texture = null;
    this.output?.disconnect();
    this.output = null;
    if (this.context) void this.context.close();
    this.context = null;
  }

  private playReleasePlop(intensity: number): void {
    if (!this.context || !this.output || this.context.state !== 'running' || this.muted) return;

    const strength = Math.min(1, Math.max(0, intensity));
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
    gain.connect(this.output);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
    oscillator.onended = () => {
      oscillator.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }
}
