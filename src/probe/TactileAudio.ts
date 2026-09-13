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

  release(): void {
    this.texture?.update(0, 0);
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
}
