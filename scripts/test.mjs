import { readdirSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function discover(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory())
      return entry.name === "vendor" ? [] : discover(filename);
    return filename.endsWith(".test.ts") ? [filename] : [];
  });
}

const files = ["src", "tests"].flatMap(discover).sort();
if (!files.length) throw new Error("No module tests found");
const result = spawnSync(
  process.execPath,
  ["--conditions=react-server", "--import", "tsx", "--test", ...files],
  { stdio: "inherit" },
);
process.exit(result.status ?? 1);
