import { expect, test, type Page } from "@playwright/test";
import { readPublishedArticles } from "../../src/lib/writing/catalog";

const articles = readPublishedArticles("content").map(({ article }) => article);
const notes = articles.filter((article) => article.kind === "notes");
const thoughts = articles.filter((article) => article.kind === "thoughts");

function results(page: Page) {
  return page.getByRole("region", { name: "All articles", exact: true });
}

async function chooseFilter(
  page: Page,
  isMobile: boolean,
  label: "Categories" | "Tags",
  value: string,
) {
  if (isMobile) {
    await page.getByRole("combobox", { name: label, exact: true }).click();
    await page
      .getByRole("option", { name: new RegExp(`^${value || "All"}\\b`) })
      .click();
  } else {
    await page
      .getByRole("navigation", { name: label, exact: true })
      .getByRole("link", { name: new RegExp(`^${value}\\b`) })
      .click();
  }
}

test("ordinary browsing stays local and reading returns to the same page and article", async ({
  page,
}) => {
  const searchRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/pagefind/"))
      searchRequests.push(request.url());
  });
  await page.goto("/notes");
  await expect(page.getByRole("status")).toHaveText(
    `${notes.length} notes · Latest first`,
  );
  await expect(results(page).getByRole("link")).toHaveCount(10);
  const firstPageTitles = await results(page)
    .getByRole("heading", { level: 3 })
    .allTextContents();

  await page
    .getByRole("navigation", { name: "Notes pages" })
    .getByRole("link", { name: "Next", exact: true })
    .click();
  await expect(page).toHaveURL(/\/notes\?page=2$/);
  await expect(results(page).getByRole("link")).toHaveCount(10);
  const articleLink = results(page).getByRole("link").first();
  const title = await articleLink.getAttribute("aria-label");
  const href = await articleLink.getAttribute("href");
  expect(title).toBeTruthy();
  expect(href).toBeTruthy();
  expect(firstPageTitles).not.toContain(title);
  const articleId = new URL(href!, page.url()).pathname.split("/").at(-1);

  await articleLink.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title!);
  const returnLink = page.getByRole("link", {
    name: "Back to Notes",
    exact: true,
  });
  await expect(returnLink).toHaveAttribute(
    "href",
    `/notes?page=2#article-${articleId}`,
  );
  await returnLink.click();
  await expect(page).toHaveURL(
    new RegExp(`/notes\\?page=2#article-${articleId}$`),
  );
  const restored = results(page).getByRole("link", {
    name: title!,
    exact: true,
  });
  await expect(restored).toBeInViewport();
  await expect(restored).toBeFocused();
  await expect(results(page).getByRole("link")).toHaveCount(10);
  expect(searchRequests).toEqual([]);
});

test("real full-text search finds a body-only term and survives a shared URL reload", async ({
  page,
}) => {
  const target = notes.find(
    (article) => article.id === "pixiu-cluster-hot-path-optimization",
  )!;
  expect(
    [target.title, target.summary, ...target.categories, ...target.tags].join(
      " ",
    ),
  ).not.toMatch(/singleflight/i);
  expect(target.body).toMatch(/singleflight/i);

  await page.goto("/notes");
  const search = page.getByLabel("Search Notes", { exact: true });
  await expect(search).toBeEnabled();
  await search.fill("singleflight");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/notes\?q=singleflight$/);
  await expect(
    results(page).getByRole("link", { name: target.title, exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText("By relevance");
  const titles = await results(page)
    .getByRole("heading", { level: 3 })
    .allTextContents();

  await page.reload();
  await expect(page.getByLabel("Search Notes", { exact: true })).toHaveValue(
    "singleflight",
  );
  await expect(page.getByRole("status")).toContainText("By relevance");
  await expect(results(page).getByRole("heading", { level: 3 })).toHaveText(
    titles,
  );
});

test("Category and Tag controls combine with real search on desktop and mobile", async ({
  page,
  isMobile,
}) => {
  await page.goto("/notes");
  await expect(page.getByLabel("Search Notes", { exact: true })).toBeEnabled();
  await chooseFilter(page, isMobile, "Categories", "Agent");
  await chooseFilter(page, isMobile, "Tags", "interview");
  const matching = notes.filter(
    (article) =>
      article.categories.includes("Agent") &&
      article.tags.includes("interview"),
  );
  await expect(page.getByRole("status")).toHaveText(
    `${matching.length} notes · Latest first`,
  );
  await expect(results(page).getByRole("link")).toHaveCount(matching.length);

  const search = page.getByLabel("Search Notes", { exact: true });
  await search.fill("LLM");
  await search.press("Enter");
  await expect(page.getByRole("status")).toContainText("By relevance");
  await expect(
    results(page).getByRole("link", { name: "LLM 与 Prompt", exact: true }),
  ).toBeVisible();
  const params = new URL(page.url()).searchParams;
  expect(params.get("q")).toBe("LLM");
  expect(params.get("category")).toBe("Agent");
  expect(params.get("tag")).toBe("interview");
  for (const href of await results(page)
    .getByRole("link")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")))) {
    expect(
      matching.some(
        (article) =>
          new URL(href!, "https://simi.host").pathname === article.href,
      ),
    ).toBe(true);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("unknown metadata remains clearable and out-of-range pages normalize", async ({
  page,
}) => {
  await page.goto("/notes?category=not-a-published-category");
  await expect(page.getByRole("status")).toHaveText("0 notes · Latest first");
  await expect(
    results(page).getByRole("heading", { name: "No articles found" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/category=not-a-published-category$/);
  await page
    .getByRole("button", {
      name: "Remove category not-a-published-category",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/\/notes$/);
  await expect(results(page).getByRole("link")).toHaveCount(10);

  await page.goto("/notes?page=999");
  const lastPage = Math.ceil(notes.length / 10);
  await expect(page).toHaveURL(new RegExp(`/notes\\?page=${lastPage}$`));
  await expect(results(page).getByRole("link")).toHaveCount(
    notes.length - (lastPage - 1) * 10,
  );
  await expect(
    page
      .getByRole("navigation", { name: "Notes pages" })
      .getByRole("link", { name: `Page ${lastPage}`, exact: true }),
  ).toHaveAttribute("aria-current", "page");
});

test("Thoughts is a minimal timeline and ignores search and metadata parameters", async ({
  page,
}) => {
  const searchRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/pagefind/"))
      searchRequests.push(request.url());
  });
  await page.goto("/thoughts?q=Harness&category=Agent&tag=mcp&page=999");
  await expect(page).toHaveURL(/\/thoughts$/);
  await expect(page.getByRole("status")).toHaveText(
    `${thoughts.length} thoughts · Latest first`,
  );
  await expect(results(page).getByRole("link")).toHaveCount(thoughts.length);
  await expect(
    results(page).getByRole("heading", { level: 2 }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Thoughts pages" }),
  ).toHaveCount(0);
  await expect(page.getByRole("search")).toHaveCount(0);
  await expect(page.getByRole("combobox")).toHaveCount(0);
  for (const name of ["Categories", "Tags"])
    await expect(
      page.getByRole("navigation", { name, exact: true }),
    ).toHaveCount(0);
  await expect(results(page).getByRole("heading", { level: 3 })).toHaveText(
    thoughts.map((article) => article.title),
  );
  expect(searchRequests).toEqual([]);

  const link = results(page).getByRole("link").last();
  const title = await link.getAttribute("aria-label");
  await link.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title!);
  await page
    .getByRole("link", { name: "Back to Thoughts", exact: true })
    .click();
  await expect(
    results(page).getByRole("link", { name: title!, exact: true }),
  ).toBeFocused();
});

test("a late real search fragment cannot replace the directory after clearing", async ({
  page,
}) => {
  let releaseFragments!: () => void;
  const fragmentGate = new Promise<void>((resolve) => {
    releaseFragments = resolve;
  });
  let noticeFragment!: () => void;
  const fragmentStarted = new Promise<void>((resolve) => {
    noticeFragment = resolve;
  });
  await page.route("**/pagefind/fragment/*.pf_fragment", async (route) => {
    noticeFragment();
    await fragmentGate;
    await route.continue();
  });

  try {
    await page.goto("/notes");
    const search = page.getByLabel("Search Notes", { exact: true });
    await expect(search).toBeEnabled();
    await search.fill("singleflight");
    await search.press("Enter");
    await fragmentStarted;
    await expect(page.getByRole("status")).toHaveText("Searching…");
    await page.getByRole("button", { name: "Clear all", exact: true }).click();
    await expect(page).toHaveURL(/\/notes$/);
    await expect(page.getByRole("status")).toHaveText(
      `${notes.length} notes · Latest first`,
    );
    await expect(results(page).getByRole("link")).toHaveCount(10);
    const titles = await results(page)
      .getByRole("heading", { level: 3 })
      .allTextContents();

    releaseFragments();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/notes$/);
    await expect(search).toHaveValue("");
    await expect(page.getByRole("status")).toHaveText(
      `${notes.length} notes · Latest first`,
    );
    await expect(results(page).getByRole("heading", { level: 3 })).toHaveText(
      titles,
    );
  } finally {
    releaseFragments();
    await page.unrouteAll({ behavior: "wait" });
  }
});

test("normalizing a late search page preserves an unfinished IME draft", async ({
  page,
}) => {
  let releaseFragments!: () => void;
  const fragmentGate = new Promise<void>((resolve) => {
    releaseFragments = resolve;
  });
  let noticeFragment!: () => void;
  const fragmentStarted = new Promise<void>((resolve) => {
    noticeFragment = resolve;
  });
  await page.route("**/pagefind/fragment/*.pf_fragment", async (route) => {
    noticeFragment();
    await fragmentGate;
    await route.continue();
  });

  try {
    await page.goto("/notes?q=singleflight&page=999");
    const search = page.getByLabel("Search Notes", { exact: true });
    await expect(search).toBeEnabled();
    await fragmentStarted;
    await search.dispatchEvent("compositionstart");
    await search.fill("记忆");
    await expect(search).toHaveValue("记忆");
    await expect(page).toHaveURL(/\/notes\?q=singleflight&page=999$/);

    releaseFragments();
    await expect(page).toHaveURL(/\/notes\?q=singleflight$/);
    await expect(page.getByRole("status")).toContainText("By relevance");
    await expect(search).toHaveValue("记忆");
    await expect(
      results(page).getByRole("link", {
        name: "Cluster 热路径优化方案",
        exact: true,
      }),
    ).toBeVisible();

    await search.dispatchEvent("compositionend", { data: "记忆" });
    await expect
      .poll(() => new URL(page.url()).searchParams.get("q"))
      .toBe("记忆");
    await expect(search).toHaveValue("记忆");
    await expect(page.getByRole("status")).toContainText("By relevance");
    await expect(
      results(page).getByRole("link", { name: "上下文与记忆", exact: true }),
    ).toBeVisible();
  } finally {
    releaseFragments();
    await page.unrouteAll({ behavior: "wait" });
  }
});

test("leaving the directory cancels a pending input debounce", async ({
  page,
}) => {
  await page.goto("/notes");
  await expect(page.getByRole("status")).toHaveText(
    `${notes.length} notes · Latest first`,
  );
  await page.clock.install();
  await page
    .getByLabel("Search Notes", { exact: true })
    .fill("unfinished draft");
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Projects", exact: true })
    .click();
  await expect(page).toHaveURL(/\/projects$/);
  await page.clock.fastForward(500);
  await expect(page).toHaveURL(/\/projects$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Projects.", exact: true }),
  ).toBeVisible();
});

test("reopening Notes cancels the old query draft even on the same pathname", async ({
  page,
}) => {
  await page.goto("/notes?q=Go");
  await expect(page.getByRole("status")).toContainText("By relevance");
  const search = page.getByLabel("Search Notes", { exact: true });
  await expect(search).toHaveValue("Go");
  await page.clock.install();
  await search.fill("memory");
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Notes", exact: true })
    .click();
  await expect(page).toHaveURL(/\/notes$/);
  await page.clock.fastForward(500);
  await expect(page).toHaveURL(/\/notes$/);
  await expect(search).toHaveValue("");
  await expect(page.getByRole("status")).toHaveText(
    `${notes.length} notes · Latest first`,
  );
});

test("full-text pages load only their results and restore a cold search after reading", async ({
  page,
}) => {
  const fragments = new Set<string>();
  page.on("request", (request) => {
    if (request.url().includes("/pagefind/fragment/"))
      fragments.add(request.url());
  });
  await page.goto("/notes?q=Agent");
  await expect(page.getByRole("status")).toContainText("By relevance");
  const total = Number(
    (await page.getByRole("status").textContent())!.split(" ")[0],
  );
  expect(total).toBeGreaterThan(10);
  await expect(results(page).getByRole("link")).toHaveCount(10);
  expect(fragments.size).toBe(10);
  const firstTitles = await results(page)
    .getByRole("heading", { level: 3 })
    .allTextContents();
  await page
    .getByRole("navigation", { name: "Notes pages" })
    .getByRole("link", { name: "Next", exact: true })
    .click();
  await expect(page).toHaveURL(/q=Agent&page=2$/);
  await expect(page.getByRole("status")).toContainText("By relevance");
  await expect(results(page).getByRole("link")).toHaveCount(
    Math.min(total - 10, 10),
  );
  const article = results(page).getByRole("link").first();
  const title = await article.getAttribute("aria-label");
  expect(firstTitles).not.toContain(title);
  await article.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title!);
  // A reload drops the in-memory search module before returning to the directory.
  await page.reload();
  await page.getByRole("link", { name: "Back to Notes", exact: true }).click();
  await expect(page).toHaveURL(/q=Agent&page=2#article-/);
  const restored = results(page).getByRole("link", {
    name: title!,
    exact: true,
  });
  await expect(restored).toBeFocused();
  await expect(restored).toBeInViewport();
});

test("a failed search index is explicit and a refresh recovers the real results", async ({
  page,
}) => {
  await page.route("**/pagefind/pagefind.js", (route) => route.abort("failed"));
  await page.goto("/notes?q=singleflight");
  await expect(
    page.getByRole("alert").filter({ hasText: "Search couldn’t load" }),
  ).toBeVisible();
  await expect(results(page)).toHaveCount(0);
  await page.unroute("**/pagefind/pagefind.js");
  await page.getByRole("button", { name: "Refresh page", exact: true }).click();
  await expect(
    results(page).getByRole("link", {
      name: "Cluster 热路径优化方案",
      exact: true,
    }),
  ).toBeVisible();
});

test("history navigation discards an unfinished draft and restores both filters", async ({
  page,
  isMobile,
}) => {
  await page.goto("/notes");
  await expect(page.getByLabel("Search Notes", { exact: true })).toBeEnabled();
  await chooseFilter(page, isMobile, "Categories", "Agent");
  await chooseFilter(page, isMobile, "Tags", "interview");
  await page.clock.install();
  await page.getByLabel("Search Notes", { exact: true }).fill("pending memory");
  await page.goBack();
  await page.clock.fastForward(500);
  await expect(page).toHaveURL(/\/notes\?category=Agent$/);
  await expect(page.getByLabel("Search Notes", { exact: true })).toHaveValue(
    "",
  );
  await page.goForward();
  await expect(page).toHaveURL(/category=Agent&tag=interview$/);
  await expect(page.getByRole("status")).toContainText("Latest first");
});
