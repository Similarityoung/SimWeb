import { expect, type Page } from "@playwright/test";

export const botOf = (page: Page) =>
  page.getByRole("button", { name: "Play with Bot" });
export const svgOf = (page: Page) => botOf(page).locator("svg");

export async function openIdle(page: Page) {
  await page.goto("/");
  // Wait for arrival, not the idle frame before engine initialization.
  await expect(svgOf(page)).toHaveAttribute("data-state", "spawning");
  await expect(svgOf(page)).toHaveAttribute("data-state", "idle");
}

export const setHidden = (page: Page, hidden: boolean) =>
  page.evaluate((value) => {
    Object.defineProperty(document, "hidden", { configurable: true, value });
    document.dispatchEvent(new Event("visibilitychange"));
  }, hidden);

export const setRandom = (page: Page, random: number) =>
  page.addInitScript((value) => {
    Math.random = () => value;
  }, random);

export async function changeMotion(
  page: Page,
  reducedMotion: "reduce" | "no-preference",
) {
  await page.evaluate((reduced) => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    Object.assign(window, {
      __motionChanged:
        query.matches === reduced
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              query.addEventListener("change", () => resolve(), { once: true });
            }),
    });
  }, reducedMotion === "reduce");
  await page.emulateMedia({ reducedMotion });
  // Query changes arrive on a rendering update, after CDP returns.
  await page.evaluate(
    () =>
      (window as unknown as { __motionChanged: Promise<void> }).__motionChanged,
  );
}
