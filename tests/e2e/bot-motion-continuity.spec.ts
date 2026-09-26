import { expect, test, openEngine } from "./bot-runtime";

test("motion hands over from the rendered pose without jumping, including rapid interruptions", async ({
  page,
}) => {
  await openEngine(page);
  const results = await page.evaluate(() => {
    const results: { name: string; jump: number; finite: boolean }[] = [];
    for (const size of [43, 54, 192]) {
      for (const [from, to, elapsed] of [
        ["writing", "idle", 650],
        ["writing", "celebrate", 1650],
        ["writing", "alerting", 1100],
        ["celebrate", "writing", 450],
        ["celebrate", "bouncing", 1050],
        ["bouncing", "idle", 1000],
      ] as const) {
        window.__withBot(
          { state: from, size },
          ({ bot, tick, advance, contour }) => {
            const renderedPose = () => {
              // Basis points detect transforms even when contours are symmetric.
              const matrix = bot.group.getCTM()!;
              const basis = [
                new DOMPoint(114.2705, 114.2705),
                new DOMPoint(0, 114.2705),
                new DOMPoint(114.2705, 0),
              ].flatMap((point) => {
                const p = point.matrixTransform(matrix);
                return [p.x, p.y];
              });
              return basis.concat(contour([bot.body, ...bot.eyeEls]));
            };
            advance(elapsed);
            for (const target of [to, "listening", "writing", "idle"]) {
              const before = renderedPose();
              bot.setState(target);
              tick();
              const after = renderedPose();
              results.push({
                name: `${size}px ${from} → ${to} → ${target}`,
                jump: Math.max(
                  ...after.map((value, i) => Math.abs(value - before[i])),
                ),
                finite: after.every(Number.isFinite),
              });
              advance(80);
            }
          },
        );
      }
    }
    return results;
  });
  for (const result of results) {
    expect(result.finite, result.name).toBe(true);
    expect(result.jump, result.name).toBeLessThan(0.1);
  }
});

test("completion unfolds before turning and lands within its scene at different refresh rates", async ({
  page,
}) => {
  await openEngine(page);
  const results = await page.evaluate(() =>
    [30, 60, 120].map((fps) =>
      // Include the longest-lived particles, not just the average landing.
      window.__withBot(
        { state: "writing", frameMs: 1000 / fps, random: 0.99 },
        ({ bot, advance }) => {
          advance(3000);
          bot.setState("celebrate");
          let firstTurn: { folded: number; remainingTurn: number } | undefined;
          let landings = 0;
          let peak = 0;
          for (let i = 0; i < 2.4 * fps; i++) {
            advance(1000 / fps);
            if (bot.extras.turn !== null && !firstTurn)
              firstTurn = {
                folded: bot.fx.amount,
                remainingTurn: bot.fx.remainingTurn,
              };
            if (bot.extras.wantBurst) landings++;
            peak = Math.min(peak, bot.extras.hop);
          }
          return {
            fps,
            firstTurn,
            landings,
            peak,
            lastHop: bot.extras.hop,
            effectsRemain: bot.particles.hasLife(),
          };
        },
      ),
    ),
  );
  for (const result of results) {
    expect(result.firstTurn, `${result.fps}fps starts turning`).toBeDefined();
    expect(result.firstTurn!.folded).toBeLessThan(0.04);
    expect(result.firstTurn!.remainingTurn).toBeLessThan(0.04);
    expect(result.landings).toBe(1);
    expect(result.peak).toBeLessThan(-35);
    expect(result.lastHop).toBe(0);
    expect(result.effectsRemain).toBe(false);
  }
});
