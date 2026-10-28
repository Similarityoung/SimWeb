import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export type Violation = {
  rule: "ENG-01";
  file: string;
  line: number;
  message: string;
};

type SourceFile = {
  file: string;
  content: string;
};

const SOURCE_EXTENSIONS = new Set([
  ".css",
  ".js",
  ".jsx",
  ".mjs",
  ".ts",
  ".tsx",
]);
const IGNORED_DIRECTORIES = new Set([
  ".next",
  "coverage",
  "node_modules",
  "vendor",
]);
const RUNTIME_VARIABLE_PREFIXES = [
  "--font-geist-",
  "--next-",
  "--radix-",
  "--tw-",
];

function walk(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name)) return [];
      return walk(path.join(directory, entry.name));
    }
    const file = path.join(directory, entry.name);
    return SOURCE_EXTENSIONS.has(path.extname(entry.name)) ? [file] : [];
  });
}

function stripComments(line: string, file: string): string {
  if (file.endsWith(".css")) {
    return line.replace(/\/\*.*?\*\//g, "").replace(/\/\*.*$/, "");
  }
  return line
    .replace(/\/\*.*?\*\//g, "")
    .replace(/\/\/.*$/, "")
    .replace(/\{\/\*.*$/, "");
}

function isTokenDefinition(line: string, index: number): boolean {
  const before = line.slice(0, index);
  const declaration = before.match(/(?:^|[^\w-])--[\w-]+\s*:/g)?.at(-1);
  if (!declaration) return false;
  const start = before.lastIndexOf(declaration);
  return !before.slice(start + declaration.length).includes(";");
}

export function findBareColors(file: string, content: string): Violation[] {
  return content.split("\n").flatMap((line, lineIndex) => {
    const source = stripComments(line, file);
    const violations: Violation[] = [];
    for (const match of source.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
      if (isTokenDefinition(source, match.index ?? 0)) continue;
      violations.push({
        rule: "ENG-01",
        file,
        line: lineIndex + 1,
        message: `裸色值 ${match[0]}；改用语义令牌或局部自定义属性`,
      });
    }
    return violations;
  });
}

export function collectDefinitions(files: readonly SourceFile[]): Set<string> {
  const defined = new Set<string>();
  for (const { content } of files) {
    for (const match of content.matchAll(/(?:^|[^\w-])--([\w-]+)\s*:/g))
      defined.add(match[1]);
    for (const match of content.matchAll(/\[--([\w-]+)\s*:/g))
      defined.add(match[1]);
    for (const match of content.matchAll(/setProperty\(\s*["']--([\w-]+)/g))
      defined.add(match[1]);
  }
  return defined;
}

function isRuntimeVariable(name: string): boolean {
  return RUNTIME_VARIABLE_PREFIXES.some((prefix) =>
    `--${name}`.startsWith(prefix),
  );
}

export function findUndefinedVars(files: readonly SourceFile[]): Violation[] {
  const defined = collectDefinitions(files);
  return files.flatMap(({ file, content }) =>
    content.split("\n").flatMap((line, lineIndex) => {
      const source = stripComments(line, file);
      return [...source.matchAll(/var\(\s*--([\w-]+)/g)]
        .filter(
          (match) => !defined.has(match[1]) && !isRuntimeVariable(match[1]),
        )
        .map((match) => ({
          rule: "ENG-01" as const,
          file,
          line: lineIndex + 1,
          message: `未定义的 CSS 变量 --${match[1]}`,
        }));
    }),
  );
}

export function scanProject(root: string): Violation[] {
  const files = walk(path.join(root, "src"))
    .filter((file) => !file.includes(".test.") && !file.includes(".spec."))
    .map((file) => ({ file, content: readFileSync(file, "utf8") }));
  return [
    ...files.flatMap(({ file, content }) => findBareColors(file, content)),
    ...findUndefinedVars(files),
  ].sort(
    (left, right) =>
      left.file.localeCompare(right.file) || left.line - right.line,
  );
}

function main() {
  const root = process.cwd();
  const violations = scanProject(root);
  if (!violations.length) {
    console.log("ENG-01: design tokens OK");
    return;
  }
  for (const violation of violations) {
    console.error(
      `${violation.rule} ${path.relative(root, violation.file)}:${violation.line} ${violation.message}`,
    );
  }
  process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main();
