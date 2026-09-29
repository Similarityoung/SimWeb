import { mkdir, mkdtemp, rename, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as pagefind from "pagefind";
import { readPublishedArticles } from "../src/lib/writing/catalog";

function checkErrors(errors: readonly string[]) {
  if (errors.length) throw new Error(`Pagefind: ${errors.join("; ")}`);
}

export async function indexWriting(
  source: string,
  output: string,
): Promise<number> {
  const published = readPublishedArticles(source);
  await mkdir(path.dirname(output), { recursive: true });
  const staged = await mkdtemp(path.join(path.dirname(output), ".pagefind-"));
  try {
    const created = await pagefind.createIndex({ forceLanguage: "zh" });
    checkErrors(created.errors);
    if (!created.index) throw new Error("Pagefind did not create an index");
    const index = created.index;

    for (const { article } of published) {
      const result = await index.addCustomRecord({
        url: article.href,
        language: "zh",
        content: [
          article.title,
          article.summary,
          article.categories.join(" "),
          article.tags.join(" "),
          article.body,
        ].join("\n\n"),
        meta: { articleId: article.id, title: article.title },
        filters: {
          kind: [article.kind],
          category: [...new Set(article.categories)],
          tag: [...new Set(article.tags)],
        },
      });
      checkErrors(result.errors);
    }

    const written = await index.writeFiles({ outputPath: staged });
    checkErrors(written.errors);
    await rm(output, { recursive: true, force: true });
    await rename(staged, output);
  } finally {
    await pagefind.close();
    await rm(staged, { recursive: true, force: true });
  }
  return published.length;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const count = await indexWriting(
    path.join(process.cwd(), "content"),
    path.join(process.cwd(), "public", "pagefind"),
  );
  console.log(`Indexed ${count} published articles`);
}
