export type BotRuntime = {
  reduceMotion: boolean;
  setState: (state: string) => void;
  setFollowPointer: (follow: boolean) => void;
  setPaused: (paused: boolean) => void;
  destroy: () => void;
};

declare global {
  interface Window {
    GrokCharacter: new (
      svg: SVGSVGElement,
      options: Record<string, unknown>,
    ) => BotRuntime;
  }
}

let runtime: Promise<void> | undefined;

export function loadRuntime(): Promise<void> {
  runtime ??= (async () => {
    await import("./vendor/geometry-data.js");
    await import("./vendor/src/math.js");
    await import("./vendor/src/tables.js");
    await import("./vendor/src/pose.js");
    await import("./vendor/src/tricks.js");
    await import("./vendor/src/fx.js");
    await import("./vendor/src/eyes.js");
    await import("./vendor/src/character.js");
  })();
  return runtime;
}
