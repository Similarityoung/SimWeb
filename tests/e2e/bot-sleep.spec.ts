import { expect, test, type Page } from "@playwright/test";

const botOf = (page: Page) =>
  page.getByRole("button", { name: "Play with Bot" });
const svgOf = (page: Page) => botOf(page).locator("svg");

async function openIdle(page: Page) {
  await page.clock.install();
  await page.goto("/");
  await expect(svgOf(page)).toHaveAttribute("data-state", "spawning");
  await expect(svgOf(page)).toHaveAttribute("data-state", "idle");
  // Start from an explicit user action, independent of hydration timing.
  await page.keyboard.press("Shift");
}

test("60 seconds without activity sleeps; movement resets the deadline and wakes only once", async ({
  page,
}) => {
  await openIdle(page);
  const svg = svgOf(page);
  await page.clock.fastForward(59_000);
  await expect(svg).not.toHaveAttribute("data-state", "sleeping");
  await page.mouse.move(4, 4);
  await page.clock.fastForward(59_000);
  await expect(svg).not.toHaveAttribute("data-state", "sleeping");
  await page.clock.fastForward(1_100);
  await expect(svg).toHaveAttribute("data-state", "sleeping");
  await page.clock.fastForward(30_000);
  await expect(svg).toHaveAttribute("data-state", "sleeping");
  await page.mouse.move(12, 4);
  await expect(svg).toHaveAttribute("data-state", "waking");
  await page.clock.fastForward(2_000);
  await page.mouse.move(20, 4);
  await expect(svg).toHaveAttribute("data-state", "waking");
  await page.clock.fastForward(1_100);
  await expect(svg).toHaveAttribute("data-state", "idle");
  await page.clock.fastForward(19_000);
  await page.keyboard.press("Shift");
  await page.clock.fastForward(11_100);
  await expect(botOf(page)).toHaveAttribute("data-scene", "idle-expression");
});

test("a quiet focused input can sleep; typing and submitting immediately take over", async ({
  page,
}) => {
  await openIdle(page);
  const input = page.getByRole("textbox");
  await input.fill("Projects");
  await expect(svgOf(page)).toHaveAttribute("data-state", "listening");
  await page.clock.fastForward(60_100);
  await expect(svgOf(page)).toHaveAttribute("data-state", "sleeping");
  await page.keyboard.press("Shift");
  await expect(svgOf(page)).toHaveAttribute("data-state", "waking");
  await input.press("Enter");
  await expect(svgOf(page)).toHaveAttribute("data-state", "writing");
  await page.clock.fastForward(1_100);
  await expect(svgOf(page)).toHaveAttribute("data-state", "writing");
  await page.clock.fastForward(3_000);
  await expect(page.getByTestId("answer").getByRole("link")).toHaveCount(2);
});

test("touch or click wakes without adding a special Bot gesture; a topic still answers", async ({
  page,
  isMobile,
}) => {
  await openIdle(page);
  await page.clock.fastForward(60_100);
  await expect(svgOf(page)).toHaveAttribute("data-state", "sleeping");
  if (isMobile) await page.touchscreen.tap(8, 80);
  else await page.mouse.click(8, 80);
  await expect(svgOf(page)).toHaveAttribute("data-state", "waking");
  await page.getByRole("button", { name: /^Notes/ }).click();
  await expect(svgOf(page)).toHaveAttribute("data-state", "writing");
});

test("hiding cancels sleep and its deadline; coming back starts a fresh minute", async ({
  page,
}) => {
  await openIdle(page);
  await page.clock.fastForward(60_100);
  await expect(svgOf(page)).toHaveAttribute("data-state", "sleeping");
  const setHidden = (hidden: boolean) =>
    page.evaluate((value) => {
      Object.defineProperty(document, "hidden", { configurable: true, value });
      document.dispatchEvent(new Event("visibilitychange"));
    }, hidden);
  await setHidden(true);
  await expect(svgOf(page)).toHaveAttribute("data-state", "idle");
  await page.clock.fastForward(120_000);
  await expect(svgOf(page)).toHaveAttribute("data-state", "idle");
  await setHidden(false);
  await page.clock.fastForward(59_000);
  await expect(svgOf(page)).not.toHaveAttribute("data-state", "sleeping");
  await page.clock.fastForward(1_100);
  await expect(svgOf(page)).toHaveAttribute("data-state", "sleeping");
});

test("reduced motion holds a static sleeping face and restores it immediately on activity", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openIdle(page);
  await page.clock.fastForward(60_100);
  await expect(svgOf(page)).toHaveAttribute("data-state", "sleeping");
  await page.clock.runFor(100);
  const sleeping = await svgOf(page).innerHTML();
  await page.clock.runFor(500);
  expect(await svgOf(page).innerHTML()).toBe(sleeping);
  await page.keyboard.press("Shift");
  await expect(svgOf(page)).toHaveAttribute("data-state", "idle");
});

test("leaving home discards the old sleep timer", async ({ page }) => {
  await openIdle(page);
  await page.clock.fastForward(50_000);
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Notes", exact: true })
    .click();
  await page.clock.fastForward(120_000);
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await expect(svgOf(page)).toHaveAttribute("data-state", "idle");
  await page.clock.fastForward(59_000);
  await expect(svgOf(page)).not.toHaveAttribute("data-state", "sleeping");
  await page.clock.fastForward(1_100);
  await expect(svgOf(page)).toHaveAttribute("data-state", "sleeping");
});
