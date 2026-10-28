import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const pages = [
  { path: "/", name: "home" },
  { path: "/notes", name: "notes" },
  { path: "/projects", name: "projects" },
  { path: "/about", name: "about" },
] as const;

for (const target of pages) {
  test(`${target.name} exposes accessible names for interactive elements`, async ({
    page,
  }) => {
    await page.goto(target.path);
    const results = await new AxeBuilder({ page })
      .withRules([
        "aria-command-name",
        "aria-input-field-name",
        "aria-toggle-field-name",
        "button-name",
        "input-button-name",
        "link-name",
        "select-name",
      ])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
