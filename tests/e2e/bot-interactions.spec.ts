import { expect, test, type Page } from "@playwright/test";
const svgOf = (page: Page) =>
  page.getByRole("img", { name: "Interactive character" }).locator("svg");
async function openIdle(page: Page) {
  await page.goto("/");
  await expect(svgOf(page)).toHaveAttribute("data-state", "idle");
}

test("arrival plays once, inactivity allows quiet expressions without humming, then sleeps", async ({
  page,
}) => {
  await page.clock.install();
  await page.addInitScript(() => {
    Math.random = () => 0.99;
  });
  await page.goto("/");
  await expect(svgOf(page)).toHaveAttribute("data-state", "spawning");
  await expect(svgOf(page)).toHaveAttribute("data-state", "idle");
  await page.clock.fastForward(30_100);
  await expect(svgOf(page)).toHaveAttribute("data-state", "playful");
  await page.clock.fastForward(2_600);
  await expect(svgOf(page)).toHaveAttribute("data-state", "idle");
  await page.clock.fastForward(60_000);
  await expect(svgOf(page)).toHaveAttribute("data-state", "sleeping");
});

for (const [random, returning] of [
  [0, "happy"],
  [0.99, "notifying"],
] as const) {
  test(`cards and input share listening, reading return uses ${returning}`, async ({
    page,
  }) => {
    await page.addInitScript((value) => {
      Math.random = () => value;
    }, random);
    await openIdle(page);
    const topic = page.getByRole("button", { name: /^Notes/ });
    await topic.focus();
    await expect(svgOf(page)).toHaveAttribute("data-state", "listening");
    await page.getByRole("textbox").focus();
    await expect(svgOf(page)).toHaveAttribute("data-state", "listening");
    await topic.click();
    await expect(svgOf(page)).toHaveAttribute("data-state", "writing");
    await expect(page.getByTestId("answer").getByRole("link")).toHaveCount(3);
    await page
      .getByRole("link", {
        name: "Dubbo-go-Pixiu 实现 grpc 双向流",
        exact: true,
      })
      .click();
    await page.getByRole("link", { name: "Back to conversation" }).click();
    await expect(svgOf(page)).toHaveAttribute("data-state", returning);
    await expect(page.getByTestId("answer")).toHaveAttribute(
      "data-state",
      "complete",
    );
    await expect(svgOf(page)).toHaveAttribute("data-state", "idle");
  });
}

test("theme and clicks never interrupt writing or queue a surprise after completion", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await openIdle(page);
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(svgOf(page)).toHaveAttribute("data-state", "surprised");
  await page.getByRole("button", { name: /^Projects/ }).click();
  await expect(svgOf(page)).toHaveAttribute("data-state", "writing");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await page
    .getByRole("button", { name: "Play with Bot" })
    .click({ force: true });
  await page.getByRole("button", { name: /^Notes/ }).focus();
  await expect(svgOf(page)).toHaveAttribute("data-state", "writing");
  await expect(page.getByTestId("answer")).toHaveAttribute(
    "data-state",
    "complete",
  );
  await expect(svgOf(page)).toHaveAttribute("data-state", "celebrate");
  await expect(svgOf(page)).toHaveAttribute("data-state", "idle", {
    timeout: 8_000,
  });
  await page.clock.install();
  await page.clock.fastForward(2_000);
  await expect(svgOf(page)).toHaveAttribute("data-state", "idle");
});

test("unknown questions are confused, rather than classified from visible wording", async ({
  page,
}) => {
  await openIdle(page);
  await page.getByRole("textbox").fill("今天的天气怎么样");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(svgOf(page)).toHaveAttribute("data-state", "confused");
  await expect(page.getByTestId("answer")).toHaveAttribute(
    "data-state",
    "complete",
  );
  await expect(page.getByTestId("answer").getByRole("link")).toHaveCount(0);
  await expect(svgOf(page)).toHaveAttribute("data-state", "idle");
});

test("click and keyboard bounce; rapid clicks and Escape have no hidden gesture", async ({
  page,
}) => {
  // Install before the first click so cooldowns use the same monotonic clock.
  await page.clock.install();
  await openIdle(page);
  const requests: string[] = [];
  page.on("request", (request) => {
    if (["fetch", "xhr"].includes(request.resourceType()))
      requests.push(request.url());
  });
  const bot = page.getByRole("button", { name: "Play with Bot" });
  await bot.click();
  await expect(svgOf(page)).toHaveAttribute("data-state", "bouncing");
  await expect(svgOf(page)).toHaveAttribute("data-state", "idle");
  await page.clock.fastForward(1_500);
  await bot.click({ clickCount: 3, delay: 70 });
  await expect(svgOf(page)).toHaveAttribute("data-state", "bouncing");
  await page.clock.fastForward(1_600);
  await bot.focus();
  await page.keyboard.press("Escape");
  await expect(svgOf(page)).toHaveAttribute("data-state", "idle");
  for (const key of ["Enter", "Space"]) {
    await page.keyboard.press(key);
    await expect(svgOf(page)).toHaveAttribute("data-state", "bouncing");
    await page.clock.fastForward(1_600);
    await expect(svgOf(page)).toHaveAttribute("data-state", "idle");
  }
  expect(requests).toEqual([]);
});

test("dragging does not move Bot and holding no longer puts it to sleep", async ({
  page,
}) => {
  await openIdle(page);
  const bot = page.getByRole("button", { name: "Play with Bot" });
  const before = (await bot.boundingBox())!;
  await page.mouse.move(
    before.x + before.width / 2,
    before.y + before.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(1, 1, { steps: 5 });
  await expect(svgOf(page)).toHaveAttribute("data-state", "idle");
  const dragged = (await bot.boundingBox())!;
  expect(dragged).toEqual(before);
  await page.mouse.up();
  await expect(svgOf(page)).toHaveAttribute("data-state", "idle");
  await page.clock.install();
  await page.clock.fastForward(1_100);
  await expect(svgOf(page)).toHaveAttribute("data-state", "idle");
  await page.mouse.move(
    before.x + before.width / 2,
    before.y + before.height / 2,
  );
  await page.mouse.down();
  await page.clock.runFor(1_050);
  await expect(svgOf(page)).toHaveAttribute("data-state", "idle");
  await page.mouse.up();
  await expect(svgOf(page)).toHaveAttribute("data-state", "bouncing");
});

test("touch drag cancellation does not fire a tap or long press", async ({
  page,
}) => {
  await openIdle(page);
  const bot = page.getByRole("button", { name: "Play with Bot" });
  await expect(bot).toHaveCSS("touch-action", "auto");
  const box = (await bot.boundingBox())!;
  const clientX = box.x + box.width / 2,
    clientY = box.y + box.height / 2;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: clientX, y: clientY }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: clientX + 20, y: clientY + 15 }],
  });
  await expect(svgOf(page)).toHaveAttribute("data-state", "idle");
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchCancel",
    touchPoints: [],
  });
  await expect(svgOf(page)).toHaveAttribute("data-state", "idle");
  await page.clock.install();
  await page.clock.fastForward(1_500);
  await expect(svgOf(page)).toHaveAttribute("data-state", "idle");
  await cdp.detach();
});

test("a failed answer alerts once, restores idle expressions and listening, and permits retry", async ({
  page,
}) => {
  await page.clock.install();
  await openIdle(page);
  // Fail one content lookup at the answer boundary, without adding a production debug route.
  await page.evaluate(() => {
    const find = Array.prototype.find;
    Array.prototype.find = function (
      predicate: Parameters<typeof find>[0],
      thisArg?: unknown,
    ) {
      if (this.length === 2 && this[0]?.id === "dubbo-go-pixiu") {
        Array.prototype.find = find;
        throw new Error("Injected content lookup failure");
      }
      return find.call(this, predicate, thisArg);
    };
  });
  await page.getByRole("button", { name: /^Projects/ }).click();
  await expect(svgOf(page)).toHaveAttribute("data-state", "alerting");
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Something went wrong",
  );
  await expect(svgOf(page)).toHaveAttribute("data-state", "idle");
  const bot = page.getByRole("button", { name: "Play with Bot" });
  await page.clock.fastForward(19_000);
  await page.keyboard.press("Shift");
  await page.clock.fastForward(11_100);
  await expect(bot).toHaveAttribute("data-scene", "idle-expression");
  const input = page.getByRole("textbox");
  await input.focus();
  await expect(svgOf(page)).toHaveAttribute("data-state", "listening");
  await page.clock.fastForward(2_000);
  await expect(svgOf(page)).toHaveAttribute("data-state", "listening");
  await input.blur();
  await expect(svgOf(page)).toHaveAttribute("data-state", "idle");
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Something went wrong",
  );
  await page.getByRole("button", { name: /^Notes/ }).click();
  await expect(svgOf(page)).toHaveAttribute("data-state", "writing");
});
