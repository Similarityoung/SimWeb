import assert from "node:assert/strict";
import { test } from "node:test";
import { cn } from "./utils";

test("keeps custom font-size and text-color utilities together", () => {
  assert.equal(
    cn("text-body", "text-muted-foreground"),
    "text-body text-muted-foreground",
  );
  assert.equal(
    cn("text-card-title", "text-foreground-soft"),
    "text-card-title text-foreground-soft",
  );
});

test("resolves conflicts between custom and default font sizes", () => {
  assert.equal(cn("text-sm", "text-body"), "text-body");
  assert.equal(cn("text-prose", "text-lg"), "text-lg");
  assert.equal(cn("text-card-title", "text-base"), "text-base");
});

test("treats custom radii as the same conflict group", () => {
  assert.equal(cn("rounded-md", "rounded-panel"), "rounded-panel");
  assert.equal(cn("rounded-bubble", "rounded-lg"), "rounded-lg");
  assert.equal(cn("rounded-composer", "rounded-pill"), "rounded-pill");
});

test("keeps unrelated utilities while merging", () => {
  assert.equal(
    cn("text-body", "leading-6", "rounded-panel", "p-4"),
    "text-body leading-6 rounded-panel p-4",
  );
});
