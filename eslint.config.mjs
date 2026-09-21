import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const forbid = (regex, message) => ({ regex, message });
const noRoutes = forbid(
  "(^|/)app(/|$)",
  "Business modules must not depend on app routes.",
);
const restrictions = (patterns) => ["error", { patterns }];

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([
    ".next/**",
    "next-env.d.ts",
    "themes/**",
    "src/features/bot/vendor/**",
    ".local/**",
    "test-results/**",
    "playwright-report/**",
  ]),
  {
    files: ["src/features/home/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": restrictions([
        noRoutes,
        forbid(
          "(^|/)projects/(?!(types|project-card)(\\.[jt]sx?)?$)",
          "Home may only use the public project types and card.",
        ),
        forbid(
          "(^|/)writing/(?!(types|article-card)(\\.[jt]sx?)?$)",
          "Home receives public article summaries; do not import content loaders or internals.",
        ),
        forbid(
          "(^|/)bot/(?!bot(\\.[jt]sx?)?$)",
          "Use the Bot component; keep the engine private.",
        ),
        forbid(
          "\\.server(\\.[jt]sx?)?$",
          "Home must not import server-only modules.",
        ),
      ]),
    },
  },
  ...["projects", "writing", "bot"].map((feature) => ({
    files: [`src/features/${feature}/**/*.{ts,tsx}`],
    rules: {
      "no-restricted-imports": restrictions([
        noRoutes,
        forbid(
          `(^|/)(${["home", "projects", "writing", "bot"].filter((name) => name !== feature).join("|")})(/|$)`,
          "Lower-level business modules must not depend on another feature.",
        ),
      ]),
    },
  })),
  {
    files: [
      "src/components/**/*.{ts,tsx}",
      "src/config/**/*.{ts,tsx}",
      "src/lib/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": restrictions([
        forbid(
          "(^|/)(features|app)(/|$)",
          "Shared UI, configuration and utilities must not depend on business modules or routes.",
        ),
      ]),
    },
  },
]);
