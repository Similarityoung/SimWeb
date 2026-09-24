import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  renameSync,
  rmSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readPublishedArticles } from "../src/lib/writing/catalog";

export function syncWriting(source: string, target: string): number {
  const published = readPublishedArticles(source);
  mkdirSync(path.dirname(target), { recursive: true });
  const staged = mkdtempSync(path.join(path.dirname(target), ".writing-sync-"));
  try {
    for (const { file } of published) {
      const destination = path.join(staged, file);
      mkdirSync(path.dirname(destination), { recursive: true });
      copyFileSync(path.join(source, file), destination);
    }
    rmSync(target, { recursive: true, force: true });
    renameSync(staged, target);
  } finally {
    rmSync(staged, { recursive: true, force: true });
  }
  return published.length;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const source = process.argv[2];
  if (!source)
    throw new Error("Usage: npm run sync:writing -- <source-directory>");
  const target = path.join(process.cwd(), "content/writing");
  console.log(
    `Synced ${syncWriting(path.resolve(source), target)} published articles`,
  );
}
