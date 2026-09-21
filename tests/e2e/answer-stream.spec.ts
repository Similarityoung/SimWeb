import { expect, test } from "@playwright/test";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`answers append text chunks before showing cards (${reducedMotion})`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto("/");
    await expect(
      page.getByRole("img").locator("svg > *").first(),
    ).toBeAttached();
    const result = await page.evaluate(
      () =>
        new Promise<{
          samples: string[];
          complete: string;
          earlyCards: boolean;
        }>((resolve, reject) => {
          const samples: string[] = [];
          let earlyCards = false;
          const observer = new MutationObserver(() => {
            const answer = document.querySelector('[data-testid="answer"]');
            const visible = answer?.querySelector(
              '[data-testid="streaming-text"]',
            )?.textContent;
            if (visible && visible !== samples.at(-1)) samples.push(visible);
            if (answer?.getAttribute("data-state") === "streaming")
              earlyCards ||= !!answer.querySelector("a");
            if (answer?.getAttribute("data-state") === "complete") {
              observer.disconnect();
              clearTimeout(deadline);
              resolve({
                samples,
                complete: answer.querySelector("p")?.textContent ?? "",
                earlyCards,
              });
            }
          });
          const deadline = setTimeout(() => {
            observer.disconnect();
            reject(new Error("Answer did not finish"));
          }, 5000);
          observer.observe(document.querySelector("main")!, {
            childList: true,
            characterData: true,
            attributes: true,
            subtree: true,
          });
          document
            .querySelector<HTMLButtonElement>(
              '[aria-label="Conversation topics"] > button:nth-child(2)',
            )!
            .click();
        }),
    );
    expect(result.samples.length).toBeGreaterThan(2);
    expect(result.earlyCards).toBe(false);
    expect(result.complete).toContain("I write things down as I learn.");
    const increments = result.samples.map(
      (text, index) => text.length - (result.samples[index - 1]?.length ?? 0),
    );
    expect(increments.every((size) => size > 1)).toBe(true);
    expect(new Set(increments).size).toBeGreaterThan(1);
    expect(
      result.samples.every((text) => result.complete.startsWith(text)),
    ).toBe(true);
    await expect(page.getByTestId("answer").getByRole("link")).toHaveCount(3);
  });
}

test("a new question completes the old answer, and clearing cancels output", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Notes/ }).click();
  await expect(page.getByTestId("answer")).toHaveAttribute(
    "data-state",
    "streaming",
  );
  await page.getByRole("button", { name: "Projects", exact: true }).click();
  await expect(page.getByTestId("answer").first()).toHaveAttribute(
    "data-state",
    "complete",
  );
  await expect(page.getByTestId("answer").last()).toHaveAttribute(
    "data-state",
    "streaming",
  );
  await page.getByRole("button", { name: "Clear conversation" }).click();
  await expect(page.getByTestId("answer")).toHaveCount(0);
  await page.getByRole("button", { name: /^Thoughts/ }).click();
  await expect(page.getByTestId("answer")).toHaveAttribute(
    "data-state",
    "complete",
  );
  await expect(page.getByTestId("exchange")).toHaveCount(1);
  await expect(page.getByTestId("answer").getByRole("link")).toHaveCount(1);
});

test("returning home shows history without replaying unfinished output", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Notes/ }).click();
  await expect(page.getByTestId("answer")).toHaveAttribute(
    "data-state",
    "streaming",
  );
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Notes", exact: true })
    .click();
  await expect(page).toHaveURL(/\/notes$/);
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await expect(page.getByTestId("answer")).toHaveAttribute(
    "data-state",
    "complete",
  );
  await expect(page.getByTestId("streaming-text")).toHaveCount(0);
  await expect(page.getByTestId("answer").getByRole("link")).toHaveCount(3);
});
