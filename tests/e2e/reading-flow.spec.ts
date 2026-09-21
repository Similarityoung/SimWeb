import { expect, test } from "@playwright/test";

test("conversation survives reading and navigation, then clears on reload", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => {
    document.documentElement.dataset.navigationProbe = "same-document";
  });
  await page.getByRole("button", { name: /^Notes/ }).click();
  await expect(page.getByTestId("exchange")).toHaveCount(1);
  await expect(page.getByTestId("exchange").getByRole("link")).toHaveCount(3);
  await expect
    .poll(async () => {
      const question = await page
        .getByText("What have you been learning?", { exact: true })
        .boundingBox();
      const region = await page
        .getByRole("region", { name: "Conversation" })
        .boundingBox();
      return question && region ? question.y >= region.y : false;
    })
    .toBe(true);
  await page
    .getByRole("textbox", { name: "Ask a question" })
    .fill("Show me your projects");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.getByTestId("exchange")).toHaveCount(2);
  await page
    .getByRole("link", { name: "Dubbo-go-Pixiu 实现 grpc 双向流", exact: true })
    .click();
  await expect(page).toHaveURL(/\/notes\/pixiu-grpc-streaming$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Dubbo-go-Pixiu 实现 grpc 双向流",
  );
  await page.getByRole("link", { name: "Back to conversation" }).click();
  await expect(page.getByTestId("exchange")).toHaveCount(2);
  await expect(page.locator("html")).toHaveAttribute(
    "data-navigation-probe",
    "same-document",
  );
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Notes", exact: true })
    .click();
  await expect(page).toHaveURL(/\/notes$/);
  await page.goBack();
  await expect(page.getByTestId("exchange")).toHaveCount(2);
  await page.reload();
  await expect(page.getByTestId("exchange")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Similarityoung", exact: true }),
  ).toBeVisible();
});

test("menus open full catalogs, cards have the expected destinations, and direct links work", async ({
  page,
}) => {
  await page.goto("/projects");
  await expect(
    page.getByRole("link", { name: "Dubbo-go-Pixiu, view on GitHub" }),
  ).toHaveAttribute("href", "https://github.com/apache/dubbo-go-pixiu");
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Thoughts" })
    .click();
  await page.getByRole("link", { name: "解决问题的思路", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "解决问题的思路",
  );
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "解决问题的思路",
  );
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("heading", { name: "Similarityoung", exact: true }),
  ).toBeVisible();
  const response = await page.goto("/notes/not-selected");
  expect(response?.status()).toBe(404);
});

test("Bot loads, clearing works, and the interface fits the viewport", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(
    page
      .getByRole("img", { name: "Interactive character" })
      .locator("svg > *")
      .first(),
  ).toBeAttached();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("textbox").fill("你好");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(
    page.getByRole("region", { name: "Conversation" }),
  ).toContainText("Hello!");
  await page.getByRole("button", { name: "Clear conversation" }).click();
  await expect(page.getByTestId("exchange")).toHaveCount(0);
});

test("topic submission and clearing also clear the unfinished input", async ({
  page,
}) => {
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "Ask a question" });
  await input.fill("An unfinished question");
  await page.getByRole("button", { name: /^Notes/ }).click();
  await expect(page.getByTestId("exchange")).toHaveCount(1);
  await expect(input).toHaveValue("");
  await input.fill("Another unfinished question");
  await page.getByRole("button", { name: "Clear conversation" }).click();
  await expect(input).toHaveValue("");
  await expect(page.getByTestId("exchange")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Send question" }),
  ).toBeDisabled();
});

test("long continuous questions wrap without horizontal scrolling", async ({
  page,
}) => {
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "Ask a question" });
  await input.fill("a".repeat(300));
  await page.getByRole("button", { name: "Send question" }).click();
  const conversation = page.getByRole("region", { name: "Conversation" });
  await expect(conversation).toContainText("a".repeat(300));
  await expect(input).toHaveValue("");
  await expect
    .poll(() =>
      conversation.evaluate(
        (element) => element.scrollWidth <= element.clientWidth + 1,
      ),
    )
    .toBe(true);
});
