import { expect, test } from "../e2e/answer-fixture";

test("conversation exposes empty, loading, streaming, complete, and error states", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("exchange")).toHaveCount(0);

  await page.evaluate(() => {
    window.__answers.manual = true;
  });
  await page.getByRole("button", { name: /^Notes/ }).click();
  const waiting = page.getByTestId("waiting-indicator");
  await expect(waiting).toBeVisible();
  await expect(waiting.locator(".waiting-dot")).toHaveCount(3);
  await expect
    .poll(() =>
      waiting
        .locator(".waiting-dot")
        .first()
        .evaluate((element) => getComputedStyle(element).animationName),
    )
    .toBe("waiting-dot");

  await expect
    .poll(() => page.evaluate(() => window.__answers.pending.length))
    .toBe(1);
  await page.evaluate(() => window.__answers.advance());
  await expect(page.getByTestId("answer")).toHaveAttribute(
    "data-state",
    "streaming",
  );
  await expect(page.getByTestId("streaming-text")).toBeVisible();

  await page.evaluate(() => window.__answers.flush());
  await expect(page.getByTestId("answer")).toHaveAttribute(
    "data-state",
    "complete",
  );

  await page.evaluate(() => {
    window.__answers.failNext = 502;
  });
  await page.getByRole("textbox", { name: "Ask a question" }).fill("Again");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toBeVisible();
});

test("reduced motion keeps waiting and streaming states visible", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => {
    window.__answers.manual = true;
  });
  await page.getByRole("button", { name: /^Notes/ }).click();
  const waiting = page.getByTestId("waiting-indicator");
  await expect(waiting).toBeVisible();
  await expect(waiting.locator(".waiting-dot")).toHaveCount(3);
  await expect
    .poll(() =>
      waiting
        .locator(".waiting-dot")
        .first()
        .evaluate((element) => getComputedStyle(element).animationName),
    )
    .toBe("none");

  await expect
    .poll(() => page.evaluate(() => window.__answers.pending.length))
    .toBe(1);
  await page.evaluate(() => window.__answers.advance());
  await expect(page.getByTestId("streaming-text")).toBeVisible();
});
