export interface SquishyDebugTools {
  resetSave(): Promise<void>;
  resetSettings(): Promise<void>;
  logState(): void;
}

interface InstallDebugToolsOptions {
  readonly resetSave: () => Promise<void>;
  readonly resetSettings: () => Promise<void>;
  readonly getState: () => unknown;
}

type DebugWindow = Window & {
  __squishyDebug?: SquishyDebugTools;
};

export const installDebugTools = (options: InstallDebugToolsOptions): (() => void) => {
  if (!import.meta.env.DEV) return () => undefined;

  const target = window as DebugWindow;
  target.__squishyDebug = {
    resetSave: options.resetSave,
    resetSettings: options.resetSettings,
    logState: () => console.info('[squishy-debug]', options.getState()),
  };

  return () => {
    delete target.__squishyDebug;
  };
};
