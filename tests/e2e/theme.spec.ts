import { expect, test } from "@playwright/test";

test("theme follows the system until chosen, then persists through reading and reload", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(
    page.getByRole("button", { name: "Switch to light theme" }),
  ).toBeVisible();

  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveClass(/light/);
  const toggle = page.getByRole("button", { name: "Switch to dark theme" });
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveClass(/dark/);
  expect(await page.evaluate(() => localStorage.getItem("simweb-theme"))).toBe(
    "dark",
  );
  await page.emulateMedia({ colorScheme: "dark" });
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Notes", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Dubbo-go-Pixiu 实现 grpc 双向流", exact: true })
    .click();
  await expect(page).toHaveURL(/\/notes\/pixiu-grpc-streaming$/);
  await expect(page.locator(".prose pre code").first()).toBeAttached();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  const colors = await page.evaluate(() => {
    const body = getComputedStyle(document.body);
    const title = document.querySelector("article h1")!;
    const prose = document.querySelector(".prose")!;
    return {
      colorScheme: body.colorScheme,
      foreground: body.color,
      background: body.backgroundColor,
      title: getComputedStyle(title).color,
      code: getComputedStyle(prose.querySelector("pre code")!).color,
    };
  });
  expect(colors.colorScheme).toBe("dark");
  expect(colors.title).toBe(colors.foreground);
  expect(colors.code).toBe(colors.foreground);
  expect(colors.foreground).not.toBe(colors.background);
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator("html")).toHaveClass(/light/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/light/);
  expect(errors).toEqual([]);
});

test("theme changes preserve the Bot instance and the active answer", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const body = page
    .getByRole("img")
    .locator('svg path[fill="var(--fg, #000)"]');
  await expect(body).toBeAttached();
  const originalBody = await body.elementHandle();
  const lightFill = await body.evaluate(
    (element) => getComputedStyle(element).fill,
  );
  await page.getByRole("button", { name: /^Notes/ }).click();
  await expect(page.getByTestId("answer")).toHaveAttribute(
    "data-state",
    "streaming",
  );
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.getByTestId("exchange")).toHaveCount(1);
  await expect(page.getByTestId("answer")).toHaveAttribute(
    "data-state",
    "complete",
  );
  await expect(page.getByTestId("answer").getByRole("link")).toHaveCount(3);
  expect(await originalBody!.evaluate((element) => element.isConnected)).toBe(
    true,
  );
  expect(
    await body.evaluate((element) => getComputedStyle(element).fill),
  ).not.toBe(lightFill);
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(body).toHaveCSS("fill", lightFill);
  await expect(page.getByTestId("exchange")).toHaveCount(1);
  await expect(page.getByTestId("streaming-text")).toHaveCount(0);
});

test("all navigation and theme controls fit at 320px on home and inner pages", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ colorScheme: "dark" });
  for (const route of ["/", "/notes"]) {
    await page.goto(route);
    await expect(
      page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("link"),
    ).toHaveCount(4);
    for (const target of ["light", "dark"]) {
      await page
        .getByRole("button", { name: `Switch to ${target} theme` })
        .click();
      expect(
        await page.evaluate(() => {
          const header = document.querySelector("body header")!;
          return (
            document.documentElement.scrollWidth <= innerWidth &&
            [...header.querySelectorAll("a, button")].every((element) => {
              const rect = element.getBoundingClientRect();
              return rect.x >= 0 && rect.right <= innerWidth;
            })
          );
        }),
      ).toBe(true);
    }
  }
});
