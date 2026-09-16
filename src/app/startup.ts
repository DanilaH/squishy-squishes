import { StartupTimeline } from '@danilah/mini-games-kit/startup';

type SquishyStartupPhase = 'platformReady' | 'saveReady' | 'shellRendered' | 'gameReady';

// Initialized at module evaluation, before the async platform/bootstrap path.
const timeline = new StartupTimeline<SquishyStartupPhase>();

export const markStartup = (phase: SquishyStartupPhase): void => {
  timeline.mark(phase);
};

export const getStartupSnapshot = () => timeline.snapshot({
  moduleToPlatformMs: ['start', 'platformReady'],
  platformToSaveMs: ['platformReady', 'saveReady'],
  saveToShellMs: ['saveReady', 'shellRendered'],
  shellToReadyMs: ['shellRendered', 'gameReady'],
  moduleToReadyMs: ['start', 'gameReady'],
});
