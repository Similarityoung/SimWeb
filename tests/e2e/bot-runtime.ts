import { type Page } from "@playwright/test";
import { test as base, expect } from "./answer-fixture";

type BotEngine = {
  svg: SVGSVGElement;
  body: SVGPathElement;
  group: SVGGElement;
  eyeEls: SVGPathElement[];
  eyeMorph: { x: number };
  fx: {
    amount: number;
    remainingTurn: number;
    rings: SVGCircleElement[];
    parts: SVGCircleElement[];
  };
  extras: { turn: number | null; hop: number; wantBurst: boolean };
  particles: { hasLife: () => boolean };
  _raf: number;
  _tick: (now: number) => void;
  _paint: (now: number) => void;
  setState: (state: string) => void;
  destroy: () => void;
};

type EngineSession = {
  bot: BotEngine;
  tick: () => void;
  advance: (duration: number) => void;
  contour: (paths: SVGPathElement[], count?: number) => number[];
};
type EngineOptions = {
  state: string;
  size?: number;
  frameMs?: number;
  random?: number;
};

declare global {
  interface Window {
    __bot: BotEngine;
    __withBot: <T>(
      options: EngineOptions,
      run: (session: EngineSession) => T,
    ) => T;
    __sampleFrames: <T>(
      duration: number,
      read: (elapsed: number) => T,
    ) => Promise<T[]>;
  }
  interface WindowEventMap {
    "bot-test:created": CustomEvent<BotEngine>;
  }
}

export const test = base.extend({
  page: async ({ page }, runTest) => {
    await page.addInitScript(() => {
      window.__sampleFrames = (duration, read) =>
        new Promise((resolve) => {
          const samples: ReturnType<typeof read>[] = [];
          const start = performance.now();
          const sample = () => {
            const elapsed = performance.now() - start;
            samples.push(read(elapsed));
            if (elapsed < duration) requestAnimationFrame(sample);
            else resolve(samples);
          };
          requestAnimationFrame(sample);
        });
      Object.defineProperty(window, "GrokCharacter", {
        configurable: true,
        set(Character: new (svg: SVGSVGElement, options: object) => BotEngine) {
          Object.defineProperty(window, "GrokCharacter", {
            configurable: true,
            writable: true,
            value: class extends Character {
              constructor(svg: SVGSVGElement, options: object) {
                super(svg, options);
                window.__bot = this;
                window.dispatchEvent(
                  new CustomEvent("bot-test:created", { detail: this }),
                );
              }
            },
          });
          window.__withBot = (
            { state, size = 192, frameMs = 10, random },
            run,
          ) => {
            const nativeNow = performance.now;
            const nativeRandom = Math.random;
            let now = 10_000;
            performance.now = () => now;
            if (random !== undefined) Math.random = () => random;
            const svg = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "svg",
            );
            svg.style.width = svg.style.height = `${size}px`;
            document.body.append(svg);
            let bot: BotEngine | undefined;
            try {
              bot = new Character(svg, { state, reduceMotion: false });
              cancelAnimationFrame(bot._raf);
              const engine = bot;
              const tick = () => {
                engine._tick(now);
                cancelAnimationFrame(engine._raf);
              };
              return run({
                bot,
                tick,
                advance(duration) {
                  const end = now + duration;
                  while (now < end) {
                    now = Math.min(now + frameMs, end);
                    tick();
                  }
                },
                contour(paths, count = 24) {
                  return paths.flatMap((path) =>
                    Array.from({ length: count }, (_, i) => {
                      const point = path
                        .getPointAtLength((path.getTotalLength() * i) / count)
                        .matrixTransform(path.getCTM()!);
                      return [point.x, point.y];
                    }).flat(),
                  );
                },
              });
            } finally {
              bot?.destroy();
              svg.remove();
              performance.now = nativeNow;
              Math.random = nativeRandom;
            }
          };
        },
      });
    });
    await runTest(page);
  },
});

export { expect };

export async function openEngine(page: Page) {
  await page.goto("/");
  await page.waitForFunction(() => "__bot" in window);
}
