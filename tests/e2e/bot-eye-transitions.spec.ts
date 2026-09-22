import { expect, test } from "@playwright/test";

// Exercise the real SVG renderer at a fixed instant, so breathing and frame
// scheduling cannot hide a discontinuity introduced by changing state.
test("eye transitions preserve the rendered contour, including interruptions", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForFunction(() => "GrokCharacter" in window);
  const result = await page.evaluate(() => {
    type Bot = {
      eyeMorph: { x: number };
      eyeEls: SVGPathElement[];
      setState: (name: string) => void;
      _paint: (now: number) => void;
      destroy: () => void;
    };
    const { GrokCharacter } = window as unknown as {
      GrokCharacter: new (svg: SVGSVGElement, options: object) => Bot;
    };
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    document.body.append(svg);
    const bot = new GrokCharacter(svg, {
      mode: "manual",
      state: "celebrate",
      paused: true,
      autoTricks: false,
      followPointer: false,
    });
    const now = performance.now();
    function contour() {
      return bot.eyeEls.flatMap((eye) =>
        Array.from({ length: 32 }, (_, i) => {
          const p = eye.getPointAtLength((eye.getTotalLength() * i) / 32);
          const q = p.matrixTransform(eye.getCTM()!);
          return [q.x, q.y];
        }).flat(),
      );
    }
    function change(name: string) {
      bot._paint(now);
      const before = contour();
      bot.setState(name);
      bot._paint(now);
      return Math.max(
        ...contour().map((value, i) => Math.abs(value - before[i])),
      );
    }
    try {
      const leavingCompletion = change("idle");
      // Interrupt the transition midway, as hover/focus or a new answer can.
      bot.eyeMorph.x = 0.4;
      const interrupted = change("listening");
      const rapidRetarget = change("happy");
      bot.eyeMorph.x = 1;
      bot._paint(now);
      const beforeRestart = contour();
      const restart = change("happy");
      return {
        leavingCompletion,
        interrupted,
        rapidRetarget,
        restart,
        finite: beforeRestart.every(Number.isFinite),
      };
    } finally {
      bot.destroy();
      svg.remove();
    }
  });
  expect(result.finite).toBe(true);
  for (const key of [
    "leavingCompletion",
    "interrupted",
    "rapidRetarget",
    "restart",
  ] as const)
    expect(result[key], key).toBeLessThan(0.05);
});
