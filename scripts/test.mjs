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
for (const client of [false, true]) {
  const selected = files.filter(
    (file) => file.endsWith(".client.test.ts") === client,
  );
  if (!selected.length) continue;
  const result = spawnSync(
    process.execPath,
    [
      ...(client ? [] : ["--conditions=react-server"]),
      "--import",
      "tsx",
      "--test",
      ...selected,
    ],
    { stdio: "inherit" },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}
