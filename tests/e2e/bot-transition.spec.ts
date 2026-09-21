import { expect, test, type Page } from "@playwright/test";

async function observeMovement(
  page: Page,
  action: "ask" | "clear" | "interrupt",
) {
  return page.evaluate(async (action) => {
    const avatar = document.querySelector<HTMLElement>(
      '[role="img"][aria-label="Interactive character"]',
    );
    if (!avatar) throw new Error("Missing Bot");
    const svg = avatar.querySelector("svg");
    const measure = () => {
      const { x, y, width, height } = avatar.getBoundingClientRect();
      return { x, y, width, height };
    };
    const before = measure();
    const frames: ReturnType<typeof measure>[] = [];
    const selector =
      action === "clear"
        ? 'button[aria-label="Clear conversation"]'
        : '[aria-label="Conversation topics"] > button:nth-child(2)';
    const button = document.querySelector<HTMLButtonElement>(selector);
    if (!button) throw new Error("Missing transition trigger");
    button.click();
    if (action === "interrupt") {
      setTimeout(() => {
        document
          .querySelector<HTMLButtonElement>(
            'button[aria-label="Clear conversation"]',
          )
          ?.click();
      }, 120);
    }
    await new Promise<void>((resolve) => {
      const started = performance.now();
      const sample = (now: number) => {
        frames.push(measure());
        if (now - started < 850) requestAnimationFrame(sample);
        else resolve();
      };
      requestAnimationFrame(sample);
    });
    return {
      before,
      after: measure(),
      frames,
      sameSvg:
        svg ===
        document.querySelector('[aria-label="Interactive character"] svg'),
      avatarCount: document.querySelectorAll(
        '[aria-label="Interactive character"]',
      ).length,
    };
  }, action);
}

async function openHome(page: Page) {
  await page.goto("/");
  await expect(
    page
      .getByRole("img", { name: "Interactive character" })
      .locator("svg > *")
      .first(),
  ).toBeAttached();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

test("the same Bot travels to the assistant position and returns, including interrupted travel", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openHome(page);
  const forward = await observeMovement(page, "ask");
  expect(forward.sameSvg).toBe(true);
  expect(forward.avatarCount).toBe(1);
  // Short mobile viewports place the initial Bot closer to the header.
  expect(forward.after.y).toBeLessThan(forward.before.y - 4);
  expect(forward.after.width).toBeLessThan(forward.before.width - 2);
  expect(
    forward.frames.some(
      (frame) =>
        frame.y > forward.after.y + 2 &&
        frame.y < forward.before.y - 2 &&
        frame.width > forward.after.width + 0.4 &&
        frame.width < forward.before.width - 0.4,
    ),
  ).toBe(true);
  expect(
    forward.frames.every((frame) => Math.abs(frame.width - frame.height) < 1),
  ).toBe(true);

  const followUp = await observeMovement(page, "ask");
  expect(followUp.sameSvg).toBe(true);
  expect(
    followUp.frames.every((frame) => Math.abs(frame.y - forward.after.y) < 1),
  ).toBe(true);

  const returning = await observeMovement(page, "clear");
  expect(returning.sameSvg).toBe(true);
  expect(
    returning.frames.some(
      (frame) =>
        frame.y > returning.before.y + 2 && frame.y < returning.after.y - 2,
    ),
  ).toBe(true);
  expect(Math.abs(returning.after.y - forward.before.y)).toBeLessThan(2);
  expect(Math.abs(returning.after.width - forward.before.width)).toBeLessThan(
    2,
  );

  const interrupted = await observeMovement(page, "interrupt");
  expect(interrupted.sameSvg).toBe(true);
  expect(interrupted.avatarCount).toBe(1);
  expect(Math.abs(interrupted.after.y - interrupted.before.y)).toBeLessThan(2);
  await expect(page.getByTestId("exchange")).toHaveCount(0);
});

test("reduced motion switches the Bot position without travel", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openHome(page);
  const movement = await observeMovement(page, "ask");
  expect(movement.sameSvg).toBe(true);
  expect(movement.after.y).toBeLessThan(movement.before.y - 4);
  expect(
    movement.frames.every(
      (frame) =>
        Math.abs(frame.y - movement.before.y) < 1 ||
        Math.abs(frame.y - movement.after.y) < 1,
    ),
  ).toBe(true);
});
