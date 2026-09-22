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

async function waitForExpression(page: Page) {
  await page.clock.fastForward(19_000);
  await expect(botOf(page)).toHaveAttribute("data-scene", "idle");
  // Keep the independent 60s sleep deadline out of this expression check.
  await page.keyboard.press("Shift");
  await page.clock.fastForward(11_100);
  await expect(botOf(page)).toHaveAttribute("data-scene", "idle-expression");
}

for (const [random, expression] of [
  [0, "happy"],
  [0.25, "curious"],
  [0.45, "shy"],
  [0.65, "proud"],
  [0.99, "playful"],
] as const) {
  test(`idle cycles through full ${expression} and yields to exploration, input and writing`, async ({
    page,
    isMobile,
  }) => {
    await openIdle(page, random);
    const bot = botOf(page);
    const svg = bot.locator("svg");
    await waitForExpression(page);
    await expect(svg).toHaveAttribute("data-state", expression);
    await page.clock.fastForward(1_000);
    await expect(svg).toHaveAttribute("data-state", expression);
    await page.clock.fastForward(1_600);
    await expect(svg).toHaveAttribute("data-state", "idle");
    await page.keyboard.press("Shift");
    await waitForExpression(page);
    const topic = page.getByRole("button", { name: /^Notes/ });
    if (isMobile) await topic.focus();
    else await topic.hover();
    await expect(bot).toHaveAttribute("data-scene", "listening");
    await expect(svg).toHaveAttribute("data-state", "listening");
    await page.getByRole("textbox").focus();
    await expect(svg).toHaveAttribute("data-state", "listening");
    await page.clock.fastForward(11_000);
    await expect(svg).toHaveAttribute("data-state", "listening");
    await topic.click();
    await expect(svg).toHaveAttribute("data-state", "writing");
  });
}

test("a brief idle expression is not followed immediately by inactivity humming", async ({
  page,
}) => {
  await openIdle(page, 0);
  await page.clock.fastForward(20_100);
  await expect(botOf(page)).toHaveAttribute("data-scene", "idle-expression");
  await page.clock.fastForward(2_600);
  await expect(botOf(page)).toHaveAttribute("data-scene", "idle");
  await page.clock.fastForward(8_000);
  await expect(botOf(page)).toHaveAttribute("data-scene", "idle");
});

test("changing reduced motion stops an active idle expression and restarts after a quiet pause", async ({
  page,
}) => {
  await openIdle(page, 0);
  const bot = botOf(page);
  await page.clock.fastForward(20_100);
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
  await page.keyboard.press("Shift");
  await changeMotion("reduce");
  await expect(bot).toHaveAttribute("data-scene", "idle");
  await page.clock.fastForward(10_100);
  await expect(bot).toHaveAttribute("data-scene", "idle");
  await page.keyboard.press("Shift");
  await changeMotion("no-preference");
  await page.clock.fastForward(1_000);
  await expect(bot).toHaveAttribute("data-scene", "idle");
  await page.clock.fastForward(19_100);
  await expect(bot).toHaveAttribute("data-scene", "idle-expression");
});

test("hiding cancels idle expression timers and returning does not replay them", async ({
  page,
}) => {
  await openIdle(page, 0);
  const bot = botOf(page);
  await page.clock.fastForward(20_100);
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
  await page.clock.fastForward(19_100);
  await expect(bot).toHaveAttribute("data-scene", "idle-expression");
});
