import { expect, test, type Page } from "@playwright/test";

async function readNavigation(page: Page, html?: string) {
  return page.evaluate((serverHtml) => {
    const root = serverHtml
      ? new DOMParser().parseFromString(serverHtml, "text/html")
      : document;
    return [
      ...root.querySelectorAll('nav[aria-label="Main navigation"] a'),
    ].map((link) => ({
      href: link.getAttribute("href"),
      current: link.getAttribute("aria-current"),
      className: link.className,
    }));
  }, html);
}

test("navigation matches server HTML through hydration, reloads, and page changes", async ({
  page,
}) => {
  const hydrationErrors: string[] = [];
  const capture = (message: string) => {
    if (/hydrat|didn't match|Minified React error #418/i.test(message))
      hydrationErrors.push(message);
  };
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning")
      capture(message.text());
  });
  page.on("pageerror", (error) => capture(error.message));

  const routes = [
    { path: "/", active: "/" },
    { path: "/projects", active: "/projects" },
    { path: "/notes", active: "/notes" },
    { path: "/thoughts", active: "/thoughts" },
    { path: "/about", active: "/about" },
    { path: "/notes/interview-llm-prompt", active: "/notes" },
    { path: "/thoughts/dubbo-go-community-and-me", active: "/thoughts" },
  ];

  for (const route of routes) {
    await page.goto(route.path);
    const response = await page.reload();
    expect(response?.status()).toBe(200);

    // Exercise a real handler so the comparison runs after hydration.
    const toggle = page.getByRole("button", {
      name: /^Switch to (light|dark) theme$/,
    });
    const isDark = await page
      .locator("html")
      .evaluate((element) => element.classList.contains("dark"));
    await toggle.click();
    await expect(page.locator("html")).toHaveClass(
      new RegExp(isDark ? "light" : "dark"),
    );

    const navigation = await readNavigation(page);
    expect(navigation).toHaveLength(5);
    expect(navigation.filter((link) => link.current === "page")).toEqual([
      expect.objectContaining({ href: route.active }),
    ]);
    expect(navigation).toEqual(
      await readNavigation(page, await response!.text()),
    );
    expect(hydrationErrors).toEqual([]);
  }

  for (const { path } of routes.slice(0, 5)) {
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .locator(`a[href="${path}"]`)
      .click();
    await expect(page).toHaveURL(path);
    await expect(
      page.locator('nav[aria-label="Main navigation"] [aria-current="page"]'),
    ).toHaveAttribute("href", path);
  }
  expect(hydrationErrors).toEqual([]);
});
