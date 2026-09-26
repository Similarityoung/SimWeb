import { expect, test, type Page } from "@playwright/test";
import {
  openIdle,
  botOf,
  setHidden,
  setRandom,
  changeMotion,
} from "./bot-page";

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
    await page.clock.install();
    await setRandom(page, random);
    await openIdle(page);
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

test("changing reduced motion stops an active idle expression and restarts after a quiet pause", async ({
  page,
}) => {
  await page.clock.install();
  await setRandom(page, 0);
  await openIdle(page);
  const bot = botOf(page);
  await page.clock.fastForward(20_100);
  await expect(bot).toHaveAttribute("data-scene", "idle-expression");

  await page.keyboard.press("Shift");
  await changeMotion(page, "reduce");
  await expect(bot).toHaveAttribute("data-scene", "idle");
  await page.clock.fastForward(10_100);
  await expect(bot).toHaveAttribute("data-scene", "idle");
  await page.keyboard.press("Shift");
  await changeMotion(page, "no-preference");
  await page.clock.fastForward(1_000);
  await expect(bot).toHaveAttribute("data-scene", "idle");
  await page.clock.fastForward(19_100);
  await expect(bot).toHaveAttribute("data-scene", "idle-expression");
});

test("hiding cancels idle expression timers and returning does not replay them", async ({
  page,
}) => {
  await page.clock.install();
  await setRandom(page, 0);
  await openIdle(page);
  const bot = botOf(page);
  await page.clock.fastForward(20_100);
  await expect(bot).toHaveAttribute("data-scene", "idle-expression");
  await setHidden(page, true);
  await expect(bot).toHaveAttribute("data-scene", "idle");
  await page.clock.fastForward(20_000);
  await expect(bot).toHaveAttribute("data-scene", "idle");
  await setHidden(page, false);
  await page.clock.fastForward(1_000);
  await expect(bot).toHaveAttribute("data-scene", "idle");
  await page.clock.fastForward(19_100);
  await expect(bot).toHaveAttribute("data-scene", "idle-expression");
});
