import { expect, test, openEngine } from "./bot-runtime";

test("bouncing restores the face even when it interrupts arrival", async ({
  page,
}) => {
  await openEngine(page);
  const results = await page.evaluate(() =>
    [0, 0.99].flatMap((random) =>
      [0, 120, 1000].map((delay) =>
        window.__withBot({ state: "spawning", random }, ({ bot, advance }) => {
          advance(2000);
          bot.setState("idle");
          advance(delay);
          let faceless = 0;
          let faded = false;
          // A bad first exit used to leave a half turn behind for later clicks too.
          for (let click = 0; click < 3; click++) {
            bot.setState("bouncing");
            advance(1000);
            bot.setState("idle");
            for (let t = 0; t < 1000; t += 10) {
              advance(10);
              if (
                bot.fx.amount < 0.04 &&
                bot.eyeEls.some((eye) => eye.style.display === "none")
              )
                faceless++;
              if (
                bot.eyeEls.some(
                  (eye) =>
                    Number(eye.style.opacity) > 0.1 &&
                    Number(eye.style.opacity) < 0.9,
                )
              )
                faded = true;
            }
          }
          return { random, delay, faceless, faded };
        }),
      ),
    ),
  );
  for (const result of results) {
    expect(result.faceless, JSON.stringify(result)).toBe(0);
    expect(result.faded, JSON.stringify(result)).toBe(true);
  }
});

test("eye transitions preserve the rendered contour, including interruptions", async ({
  page,
}) => {
  await openEngine(page);
  const results = await page.evaluate(() =>
    window.__withBot({ state: "celebrate" }, ({ bot, contour }) => {
      const sample = () => contour(bot.eyeEls, 32);
      return (
        [
          ["idle", undefined],
          ["listening", 0.4],
          ["happy", undefined],
          ["happy", 1],
        ] as const
      ).map(([state, morph]) => {
        if (typeof morph === "number") bot.eyeMorph.x = morph;
        bot._paint(performance.now());
        const before = sample();
        bot.setState(state);
        bot._paint(performance.now());
        const after = sample();
        return {
          state,
          jump: Math.max(
            ...after.map((value, i) => Math.abs(value - before[i])),
          ),
          finite: [...before, ...after].every(Number.isFinite),
        };
      });
    }),
  );
  for (const result of results) {
    expect(result.finite).toBe(true);
    expect(result.jump, result.state).toBeLessThan(0.05);
  }
});
