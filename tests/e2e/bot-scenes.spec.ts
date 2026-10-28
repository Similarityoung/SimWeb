import { expect, test } from "./bot-runtime";
import { changeMotion, openIdle, setRandom } from "./bot-page";

test("restoring motion allows writing to finish with a turn, hop and landing particles", async ({
  page,
}) => {
  await setRandom(page, 0.99);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openIdle(page);
  await changeMotion(page, "no-preference");
  const result = await page.evaluate(async () => {
    const svg = document.querySelector(
      '[aria-label="Interactive character"] svg',
    );
    const samples: {
      phase: string;
      state: string;
      ribbons: boolean;
      particles: number;
      turn: number;
      hop: number;
      at: number;
    }[] = [];
    const start = performance.now();
    await new Promise<void>((resolve, reject) => {
      const deadline = setTimeout(
        () => reject(new Error("Presentation did not settle")),
        13_000,
      );
      const sample = () => {
        const answer = document.querySelector('[data-testid="answer"]');
        const phase = answer?.getAttribute("data-state") ?? "";
        const extras = window.__bot.extras;
        samples.push({
          particles: svg?.querySelectorAll("[data-particle]").length ?? 0,
          turn: Math.abs(extras.turn ?? 0),
          hop: extras.hop,
          phase,
          state: svg?.getAttribute("data-state") ?? "",
          ribbons: [...(svg?.querySelectorAll("path[data-trail]") ?? [])].some(
            (path) =>
              !!path.getAttribute("d") &&
              Number(path.getAttribute("opacity")) > 0,
          ),
          at: performance.now() - start,
        });
        if (
          phase === "complete" &&
          samples.some((frame) => frame.state === "celebrate") &&
          svg?.getAttribute("data-state") === "idle"
        ) {
          clearTimeout(deadline);
          resolve();
        } else requestAnimationFrame(sample);
      };
      document
        .querySelector<HTMLButtonElement>(
          '[aria-label="Conversation topics"] > button:nth-child(2)',
        )!
        .click();
      requestAnimationFrame(sample);
    });
    return {
      samples,
      sameSvg:
        svg ===
        document.querySelector('[aria-label="Interactive character"] svg'),
    };
  });
  const { samples } = result;
  expect(result.sameSvg).toBe(true);
  expect(
    samples.some(
      (frame) => frame.phase === "streaming" && frame.state === "writing",
    ),
  ).toBe(true);
  expect([
    ...new Set(
      samples.map((frame) => frame.state).filter((state) => state !== "idle"),
    ),
  ]).toEqual(["writing", "celebrate"]);
  const completion = samples.filter((frame) => frame.state === "celebrate");
  const rotating = completion.filter(
    (frame) => frame.turn > 0 && frame.turn < Math.PI * 2,
  );
  const hopping = completion.filter((frame) => frame.hop < 0);
  const particles = completion.filter((frame) => frame.particles > 0);
  expect(rotating.length).toBeGreaterThan(2);
  expect(rotating.some((frame) => frame.ribbons)).toBe(true);
  expect(
    rotating.every((frame) => frame.hop === 0 && frame.particles === 0),
  ).toBe(true);
  expect(hopping.length).toBeGreaterThan(2);
  expect(
    hopping.every(
      (frame) => frame.turn === Math.PI * 2 && frame.particles === 0,
    ),
  ).toBe(true);
  expect(particles.length).toBeGreaterThan(2);
  expect(particles[0].at).toBeGreaterThan(hopping.at(-1)!.at);
  expect(particles.every((frame) => frame.hop === 0 && !frame.ribbons)).toBe(
    true,
  );
  expect(completion.at(-1)!.particles).toBe(0);
  expect(completion.at(-1)!.ribbons).toBe(false);
  expect(
    samples
      .filter((frame) => frame.phase !== "complete")
      .every((frame) => frame.particles === 0 && !frame.ribbons),
  ).toBe(true);
  const completionStartedAt = completion[0].at;
  const settledAt = samples.find(
    (frame) => frame.at > completionStartedAt && frame.state === "idle",
  )!.at;
  expect(settledAt - completionStartedAt).toBeGreaterThan(2_150);
  expect(settledAt - completionStartedAt).toBeLessThan(2_900);
});

test("reduced motion freezes the decorative SVG while text still unfolds", async ({
  page,
}) => {
  await setRandom(page, 0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openIdle(page);
  await page.getByRole("button", { name: /^Notes/ }).click();
  await expect(page.getByTestId("streaming-text")).not.toBeEmpty();
  const samples = await page.evaluate(() => {
    const svg = document.querySelector(
      '[aria-label="Interactive character"] svg',
    )!;
    return window.__sampleFrames(500, () => ({
      svg: svg.innerHTML,
      length:
        document.querySelector('[data-testid="streaming-text"]')?.textContent
          ?.length ?? 0,
    }));
  });
  expect(new Set(samples.map((sample) => sample.svg)).size).toBe(1);
  expect(new Set(samples.map((sample) => sample.length)).size).toBeGreaterThan(
    1,
  );
  await expect(page.getByTestId("answer")).toHaveAttribute(
    "data-state",
    "complete",
  );
  await expect(page.getByRole("img").locator("svg")).toHaveAttribute(
    "data-state",
    "celebrate",
  );
  await expect(page.locator("path[data-trail], [data-particle]")).toHaveCount(
    0,
  );
});

for (const effect of ["ribbons", "particles"] as const) {
  test(`a new question and clear remove completion ${effect} immediately`, async ({
    page,
  }) => {
    await page.goto("/");
    const svg = page.getByRole("img").locator("svg");
    const selector =
      effect === "ribbons" ? "path[data-trail]" : "[data-particle]";
    const effects = svg.locator("path[data-trail], [data-particle]");
    const waitForEffect = () =>
      page.waitForFunction(
        (selector) =>
          [...document.querySelectorAll(selector)].some(
            (element) =>
              Number(element.getAttribute("opacity")) > 0 &&
              (!element.hasAttribute("data-trail") ||
                !!element.getAttribute("d")),
          ),
        selector,
      );
    await page.getByRole("button", { name: /^Projects/ }).click();
    await expect(svg).toHaveAttribute("data-state", "celebrate", {
      timeout: 8_000,
    });
    await waitForEffect();
    await page.getByRole("button", { name: /^Notes/ }).click();
    await expect(svg).toHaveAttribute("data-state", "writing");
    await expect(effects).toHaveCount(0);
    await page.mouse.move(0, 0);
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await expect(svg).toHaveAttribute("data-state", "celebrate", {
      timeout: 8_000,
    });
    await waitForEffect();
    await page.getByRole("button", { name: "Clear conversation" }).click();
    await expect(svg).toHaveAttribute("data-state", "idle");
    await expect(effects).toHaveCount(0);
    // Observe past the cancelled landing: it must not produce a delayed burst.
    const reappeared = await svg.evaluate(
      (element) =>
        new Promise<boolean>((resolve) => {
          let seen = false;
          const observer = new MutationObserver(() => {
            seen ||= !!element.querySelector(
              "path[data-trail], [data-particle]",
            );
          });
          observer.observe(element, { childList: true, subtree: true });
          setTimeout(() => {
            observer.disconnect();
            resolve(seen);
          }, 1_500);
        }),
    );
    expect(reappeared).toBe(false);
  });
}

test("the development action preview is unavailable in production", async ({
  page,
}) => {
  const response = await page.goto("/dev/bot");
  expect(response?.status()).toBe(404);
});
