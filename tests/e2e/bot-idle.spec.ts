import { expect, test, type Page } from "@playwright/test";

const botOf = (page: Page) =>
  page.getByRole("button", { name: "Play with Bot" });

async function openIdle(page: Page, random: number) {
  await page.clock.install();
  await page.addInitScript((value) => {
    Math.random = () => value;
  }, random);
  await page.goto("/");
  // Ignore the initial idle frame before the arrival effect has started.
  await expect(botOf(page).locator("svg")).toHaveAttribute(
    "data-state",
    "spawning",
  );
  await expect(botOf(page).locator("svg")).toHaveAttribute(
    "data-state",
    "idle",
  );
}

for (const [random, expression, exploring] of [
  [0, "happy", "curious"],
  [0.25, "curious", "curious"],
  [0.45, "shy", "curious"],
  [0.65, "proud", "radar"],
  [0.99, "playful", "radar"],
] as const) {
  test(`idle cycles through full ${expression} and yields to exploration, input and writing`, async ({
    page,
    isMobile,
  }) => {
    await openIdle(page, random);
    const bot = botOf(page);
    const svg = bot.locator("svg");
    await page.clock.fastForward(10_050);
    await expect(bot).toHaveAttribute("data-scene", "idle-expression");
    await expect(svg).toHaveAttribute("data-state", expression);
    await page.clock.fastForward(3_000);
    await expect(svg).toHaveAttribute("data-state", expression);
    await page.clock.fastForward(2_100);
    await expect(svg).toHaveAttribute("data-state", "idle");
    await page.clock.fastForward(10_050);
    await expect(bot).toHaveAttribute("data-scene", "idle-expression");
    const topic = page.getByRole("button", { name: /^Notes/ });
    if (isMobile) await topic.focus();
    else await topic.hover();
    // Cancel the idle expression before the hover dwell has elapsed.
    await expect(bot).toHaveAttribute("data-scene", "idle");
    await page.clock.fastForward(600);
    await expect(bot).toHaveAttribute("data-scene", "explore");
    await expect(svg).toHaveAttribute("data-state", exploring);
    await page.getByRole("textbox").focus();
    await expect(svg).toHaveAttribute("data-state", "listening");
    await page.clock.fastForward(11_000);
    await expect(svg).toHaveAttribute("data-state", "listening");
    await topic.click();
    await expect(svg).toHaveAttribute("data-state", "writing");
  });
}

test("changing reduced motion stops an active idle expression and restarts after a quiet pause", async ({
  page,
}) => {
  await openIdle(page, 0);
  const bot = botOf(page);
  await page.clock.fastForward(6_100);
  await expect(bot).toHaveAttribute("data-scene", "idle-expression");
  async function changeMotion(reducedMotion: "reduce" | "no-preference") {
    const changed = page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          window
            .matchMedia("(prefers-reduced-motion: reduce)")
            .addEventListener("change", () => resolve(), { once: true });
        }),
    );
    await page.emulateMedia({ reducedMotion });
    // Media query changes are delivered on a rendering update, not when CDP returns.
    await changed;
  }
  await changeMotion("reduce");
  await expect(bot).toHaveAttribute("data-scene", "idle");
  await page.clock.fastForward(10_100);
  await expect(bot).toHaveAttribute("data-scene", "idle");
  await changeMotion("no-preference");
  await page.clock.fastForward(1_000);
  await expect(bot).toHaveAttribute("data-scene", "idle");
  await page.clock.fastForward(5_100);
  await expect(bot).toHaveAttribute("data-scene", "idle-expression");
});

test("hiding cancels idle expression timers and returning does not replay them", async ({
  page,
}) => {
  await openIdle(page, 0);
  const bot = botOf(page);
  await page.clock.fastForward(6_100);
  await expect(bot).toHaveAttribute("data-scene", "idle-expression");
  const setHidden = (hidden: boolean) =>
    page.evaluate((value) => {
      Object.defineProperty(document, "hidden", { configurable: true, value });
      document.dispatchEvent(new Event("visibilitychange"));
    }, hidden);
  await setHidden(true);
  await expect(bot).toHaveAttribute("data-scene", "idle");
  await page.clock.fastForward(20_000);
  await expect(bot).toHaveAttribute("data-scene", "idle");
  await setHidden(false);
  await page.clock.fastForward(1_000);
  await expect(bot).toHaveAttribute("data-scene", "idle");
  await page.clock.fastForward(5_100);
  await expect(bot).toHaveAttribute("data-scene", "idle-expression");
});
