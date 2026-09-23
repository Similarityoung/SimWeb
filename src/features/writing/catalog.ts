import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Article, WritingKind } from "./types";

export type PublishedArticle = { file: string; article: Article };

function markdownFiles(directory: string, relative = ""): string[] {
  return readdirSync(path.join(directory, relative), { withFileTypes: true })
    .flatMap((entry) => {
      if (entry.name.startsWith(".") || entry.name.startsWith("_")) return [];
      const file = path.join(relative, entry.name);
      if (entry.isDirectory()) return markdownFiles(directory, file);
      if (!entry.isFile() || !entry.name.endsWith(".md")) return [];
      return relative === "" && entry.name === "README.md" ? [] : [file];
    })
    .sort();
}

function nonemptyString(value: unknown, field: string, file: string): string {
  if (typeof value !== "string" || !value.trim())
    throw new Error(`${file}: ${field} must be a nonempty string`);
  return value.trim();
}

function stringList(value: unknown, field: string, file: string): string[] {
  if (value === undefined) return [];
  if (
    !Array.isArray(value) ||
    !value.every((item) => typeof item === "string" && item.trim())
  )
    throw new Error(`${file}: ${field} must be a list of strings`);
  return value;
}

export function readPublishedArticles(directory: string): PublishedArticle[] {
  const slugs = new Set<string>();
  const published = markdownFiles(directory).flatMap((file) => {
    const { data, content } = matter(
      readFileSync(path.join(directory, file), "utf8"),
    );
    if (typeof data.draft !== "boolean")
      throw new Error(`${file}: draft must be true or false`);
    if (data.draft) return [];

    const title = nonemptyString(data.title, "title", file);
    const summary = nonemptyString(data.summary, "summary", file);
    const slug = nonemptyString(data.slug, "slug", file);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
      throw new Error(
        `${file}: slug must use lowercase letters, digits and hyphens`,
      );
    if (slugs.has(slug)) throw new Error(`${file}: duplicate slug ${slug}`);
    slugs.add(slug);
    if (data.type !== "notes" && data.type !== "thoughts")
      throw new Error(`${file}: type must be notes or thoughts`);
    const kind: WritingKind = data.type;
    if (!(data.date instanceof Date) && typeof data.date !== "string")
      throw new Error(`${file}: date must be a valid date`);
    const date =
      data.date instanceof Date ? data.date : new Date(String(data.date));
    if (!data.date || Number.isNaN(date.getTime()))
      throw new Error(`${file}: date must be a valid date`);
    const tags = stringList(data.tags, "tags", file);
    stringList(data.categories, "categories", file);

    return [
      {
        file,
        article: {
          id: slug,
          slug,
          kind,
          title,
          summary,
          date: date.toISOString(),
          tags,
          href: `/${kind}/${slug}`,
          body: content,
        },
      },
    ];
  });
  if (!published.length) throw new Error("No published articles found");
  return published.sort((a, b) => b.article.date.localeCompare(a.article.date));
}
