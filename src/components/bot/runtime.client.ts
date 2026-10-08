export type BotRuntime = {
  reduceMotion: boolean;
  setState: (state: string) => void;
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
    await Promise.all([
      import("./vendor/geometry-data.js"),
      import("./vendor/src/math.js"),
      import("./vendor/src/tables.js"),
    ]);
    await Promise.all([
      import("./vendor/src/pose.js"),
      import("./vendor/src/tricks.js"),
      import("./vendor/src/fx.js"),
      import("./vendor/src/eyes.js"),
    ]);
    await import("./vendor/src/character.js");
  })();
  return runtime;
}
