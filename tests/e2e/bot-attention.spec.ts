import { expect, test, type Page } from "@playwright/test";

const svgOf = (page: Page) =>
  page.getByRole("button", { name: "Play with Bot" }).locator("svg");

async function openIdle(page: Page) {
  await page.clock.install();
  await page.goto("/");
  await expect(svgOf(page)).toHaveAttribute("data-state", "spawning");
  await expect(svgOf(page)).toHaveAttribute("data-state", "idle");
}

async function watchStateChanges(page: Page) {
  // setState also resets the nod when given the same state. Observe every write.
  await svgOf(page).evaluate((svg) => {
    svg.setAttribute("data-state-writes", "0");
    new MutationObserver((records) => {
      const writes = Number(svg.getAttribute("data-state-writes"));
      svg.setAttribute("data-state-writes", String(writes + records.length));
    }).observe(svg, { attributes: true, attributeFilter: ["data-state"] });
  });
}

test("tabbing between cards and input keeps one listening gesture; leaving restores idle", async ({
  page,
}) => {
  await openIdle(page);
  const projects = page.getByRole("button", { name: /^Projects/ });
  await projects.focus();
  await expect(svgOf(page)).toHaveAttribute("data-state", "listening");
  await watchStateChanges(page);
  for (let i = 0; i < 4; i++) await page.keyboard.press("Tab");
  const input = page.getByRole("textbox");
  await expect(input).toBeFocused();
  await input.fill("Projects");
  await page.clock.fastForward(8_000);
  await expect(svgOf(page)).toHaveAttribute("data-state", "listening");
  await expect(svgOf(page)).toHaveAttribute("data-state-writes", "0");
  await input.blur();
  await expect(svgOf(page)).toHaveAttribute("data-state", "idle");
  await projects.click();
  await expect(svgOf(page)).toHaveAttribute("data-state", "writing");
});

test("hover and focus cooperate without restarting listening or clearing the other source", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Touch has no persistent pointer hover");
  await openIdle(page);
  const projects = page.getByRole("button", { name: /^Projects/ });
  const notes = page.getByRole("button", { name: /^Notes/ });
  const input = page.getByRole("textbox");
  await notes.hover();
  await expect(svgOf(page)).toHaveAttribute("data-state", "listening");
  await watchStateChanges(page);
  await projects.hover();
  await input.focus();
  await page.mouse.move(8, 80);
  await expect(svgOf(page)).toHaveAttribute("data-state", "listening");
  await expect(svgOf(page)).toHaveAttribute("data-state-writes", "0");
  await input.blur();
  await expect(svgOf(page)).toHaveAttribute("data-state", "idle");
  await notes.focus();
  await notes.hover();
  await expect(svgOf(page)).toHaveAttribute("data-state", "listening");
  await page.mouse.move(8, 80);
  await expect(svgOf(page)).toHaveAttribute("data-state", "listening");
  await notes.blur();
  await expect(svgOf(page)).toHaveAttribute("data-state", "idle");
});
