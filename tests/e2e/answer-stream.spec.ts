import { expect, test } from "./answer-fixture";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`real stream progress gates cards and submission (${reducedMotion})`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto("/");
    await page.evaluate(() => {
      window.__answers.manual = true;
    });
    await page.getByRole("button", { name: /^Notes/ }).click();
    await expect
      .poll(() => page.evaluate(() => window.__answers.pending.length))
      .toBe(1);
    await page.evaluate(() => window.__answers.advance());
    await expect(page.getByTestId("streaming-text")).toHaveText("Hello! H");
    await expect(page.getByTestId("answer").getByRole("link")).toHaveCount(0);
    await page.getByRole("textbox").fill("Next question");
    await expect(
      page.getByRole("button", { name: "Send question" }),
    ).toBeDisabled();
    await page.evaluate(() => window.__answers.advance(2));
    await expect(page.getByTestId("streaming-text")).toHaveText(
      "Hello! Here is a selection of m",
    );
    await page.evaluate(() => window.__answers.advance(3));
    // The business object is complete, but transport finish has not arrived.
    await expect(page.getByTestId("answer")).toHaveAttribute(
      "data-state",
      "streaming",
    );
    await expect(page.getByTestId("answer").getByRole("link")).toHaveCount(0);
    await page.evaluate(() => window.__answers.flush());
    await expect(page.getByTestId("answer")).toHaveAttribute(
      "data-state",
      "complete",
    );
    await expect(page.getByTestId("answer").getByRole("link")).toHaveCount(5);
    await expect(
      page.getByRole("button", { name: "Send question" }),
    ).toBeEnabled();
  });
}

test("clear cancels a pending response and starts a clean session", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => {
    window.__answers.manual = true;
  });
  await page.getByRole("button", { name: /^Notes/ }).click();
  await expect
    .poll(() => page.evaluate(() => window.__answers.pending.length))
    .toBe(1);
  await page.evaluate(() => window.__answers.advance(2));
  await expect(page.getByTestId("streaming-text")).not.toBeEmpty();
  await page.getByRole("button", { name: "Clear conversation" }).click();
  await expect(page.getByTestId("exchange")).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => window.__answers.pending.length))
    .toBe(0);
  await page.getByRole("button", { name: /^Thoughts/ }).click();
  await expect
    .poll(() => page.evaluate(() => window.__answers.pending.length))
    .toBe(1);
  await page.evaluate(() => window.__answers.flush());
  await expect(page.getByTestId("answer")).toHaveAttribute(
    "data-state",
    "complete",
  );
  await expect(page.getByTestId("exchange")).toHaveCount(1);
  expect(
    await page.evaluate(() => window.__answers.requests.at(-1)?.previous),
  ).toBeUndefined();
});

test("navigation preserves a live request without replaying it", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => {
    window.__answers.manual = true;
  });
  await page.getByRole("button", { name: /^Notes/ }).click();
  await expect
    .poll(() => page.evaluate(() => window.__answers.pending.length))
    .toBe(1);
  await page.evaluate(() => window.__answers.advance(2));
  await expect(page.getByTestId("streaming-text")).not.toBeEmpty();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Notes", exact: true })
    .click();
  await expect(page).toHaveURL(/\/notes$/);
  await page.evaluate(() => window.__answers.flush());
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await expect(page.getByTestId("answer")).toHaveAttribute(
    "data-state",
    "complete",
  );
  await expect(page.getByTestId("streaming-text")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Play with Bot" }),
  ).not.toHaveAttribute("data-scene", "complete");
  expect(await page.evaluate(() => window.__answers.requests.length)).toBe(1);
});

test("disconnect after complete data never shows cards or becomes history", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => {
    window.__answers.manual = true;
    window.__answers.disconnectBeforeFinish = true;
  });
  await page.getByRole("button", { name: /^Projects/ }).click();
  await expect
    .poll(() => page.evaluate(() => window.__answers.pending.length))
    .toBe(1);
  await page.evaluate(() => window.__answers.flush());
  await expect(page.getByRole("main").getByRole("alert")).toBeVisible();
  await expect(page.getByTestId("answer").getByRole("link")).toHaveCount(0);
  await page.evaluate(() => {
    window.__answers.disconnectBeforeFinish = false;
  });
  await page.getByRole("button", { name: /^Notes/ }).click();
  await expect
    .poll(() => page.evaluate(() => window.__answers.pending.length))
    .toBe(1);
  expect(
    await page.evaluate(() => window.__answers.requests.at(-1)?.previous),
  ).toBeUndefined();
  await page.evaluate(() => window.__answers.flush());
  await expect(page.getByTestId("answer").last()).toHaveAttribute(
    "data-state",
    "complete",
  );
});

test("stream updates do not pull a reader away from earlier messages", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Notes/ }).click();
  await expect(page.getByTestId("answer")).toHaveAttribute(
    "data-state",
    "complete",
  );
  await page.evaluate(() => {
    window.__answers.manual = true;
  });
  await page.getByRole("button", { name: /^About Me/ }).click();
  await expect
    .poll(() => page.evaluate(() => window.__answers.pending.length))
    .toBe(1);
  const region = page.getByRole("region", { name: "Conversation" });
  await region.evaluate((element) => {
    element.scrollTop = 0;
    element.dispatchEvent(new Event("scroll"));
  });
  await page.evaluate(() => window.__answers.advance(3));
  await expect(page.getByTestId("answer").last()).toHaveAttribute(
    "data-state",
    "streaming",
  );
  expect(await region.evaluate((element) => element.scrollTop)).toBe(0);
  await page.evaluate(() => window.__answers.flush());
  await expect(page.getByTestId("answer").last()).toHaveAttribute(
    "data-state",
    "complete",
  );
  expect(await region.evaluate((element) => element.scrollTop)).toBe(0);
});

test("topic and free-text submissions use fresh Turnstile tokens", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Projects/ }).click();
  await expect(page.getByTestId("answer")).toHaveAttribute(
    "data-state",
    "complete",
  );
  await page.getByRole("textbox").fill("Tell me more");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.getByTestId("answer").last()).toHaveAttribute(
    "data-state",
    "complete",
  );
  const tokens = await page.evaluate(() => window.__answers.tokens);
  expect(tokens).toHaveLength(2);
  expect(new Set(tokens).size).toBe(2);
});
