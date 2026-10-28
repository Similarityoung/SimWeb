import type { Locator } from "@playwright/test";
import { expect, test } from "../e2e/answer-fixture";

async function textMetrics(locator: Locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return { fontSize: style.fontSize, lineHeight: style.lineHeight };
  });
}

test("session copy follows the body scale", async ({ page }) => {
  await page.goto("/");

  const input = page.getByRole("textbox", { name: "Ask a question" });
  expect(await textMetrics(input)).toEqual(
    test.info().project.name === "mobile"
      ? { fontSize: "16px", lineHeight: "24px" }
      : { fontSize: "14px", lineHeight: "24px" },
  );

  await page.getByRole("button", { name: /^Notes/ }).click();
  await expect(page.getByTestId("exchange")).toBeVisible();

  expect(await textMetrics(page.getByTestId("exchange").locator("h2"))).toEqual(
    { fontSize: "14px", lineHeight: "24px" },
  );
  expect(
    await textMetrics(page.getByTestId("answer").locator("p").first()),
  ).toEqual({ fontSize: "14px", lineHeight: "24px" });
});

test("cards follow the card-title and title scale", async ({ page }) => {
  await page.goto("/notes");
  const noteCard = page.locator("a[aria-label] h2").first();
  expect(await textMetrics(noteCard)).toEqual({
    fontSize: "16px",
    lineHeight: "24px",
  });
  expect(await textMetrics(noteCard.locator("xpath=..").locator("p"))).toEqual({
    fontSize: "14px",
    lineHeight: "24px",
  });

  await page.goto("/projects");
  const projectCard = page.locator("a[aria-label] h2").first();
  expect(await textMetrics(projectCard)).toEqual({
    fontSize: "20px",
    lineHeight: "24px",
  });
});
