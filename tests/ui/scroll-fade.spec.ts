import { expect, test } from "../e2e/answer-fixture";

test("conversation fades only the scrollable edges", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    window.__answers.manual = true;
  });
  await page.getByRole("button", { name: /^Notes/ }).click();
  await expect(page.getByTestId("exchange")).toHaveCount(1);

  const area = page.getByRole("region", { name: "Conversation" });
  const top = page.getByTestId("scroll-fade-top");
  const bottom = page.getByTestId("scroll-fade-bottom");

  await expect(top).toHaveAttribute("data-visible", "false");
  await expect(bottom).toHaveAttribute("data-visible", "false");

  await area.evaluate((element) => {
    const spacer = document.createElement("div");
    spacer.style.height = "2000px";
    element.firstElementChild?.append(spacer);
  });
  await expect(bottom).toHaveAttribute("data-visible", "true");
  await expect(top).toHaveAttribute("data-visible", "false");

  await area.evaluate((element) => {
    element.scrollTop = 100;
  });
  await expect(top).toHaveAttribute("data-visible", "true");
  await expect(bottom).toHaveAttribute("data-visible", "true");

  await area.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect(top).toHaveAttribute("data-visible", "true");
  await expect(bottom).toHaveAttribute("data-visible", "false");

  await area.evaluate((element) => {
    element.scrollTop = 0;
  });
  await expect(top).toHaveAttribute("data-visible", "false");
  await expect(bottom).toHaveAttribute("data-visible", "true");
});
