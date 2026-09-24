import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const forbid = (regex, message) => ({ regex, message });
const restrictions = (patterns) => ["error", { patterns }];
const domains = ["projects", "writing", "bot"];

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([
    ".next/**",
    "next-env.d.ts",
    "src/components/bot/vendor/**",
    ".local/**",
    "test-results/**",
    "playwright-report/**",
  ]),
  {
    files: ["src/app/_home/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": restrictions([
        forbid(
          "(^|/)app/(?!_home(/|$))|^(\\.\\./)+(page|layout|notes|thoughts|projects|about|dev)(/|\\.|$)",
          "Home must not depend on route files.",
        ),
        forbid(
          "(^|/)lib/projects/(?!types(\\.[jt]sx?)?$)|(^|/)components/projects/(?!project-card(\\.[jt]sx?)?$)",
          "Home may only use the public project type and card.",
        ),
        forbid(
          "(^|/)lib/writing/(?!types(\\.[jt]sx?)?$)|(^|/)components/writing/(?!article-card(\\.[jt]sx?)?$)",
          "Home receives public article summaries; do not import content loaders or internals.",
        ),
        forbid(
          "(^|/)components/bot/(?!bot(\\.[jt]sx?)?$)",
          "Use the Bot component; keep the engine private.",
        ),
        forbid(
          "\\.server(\\.[jt]sx?)?$",
          "Home must not import server-only modules.",
        ),
      ]),
    },
  },
  ...domains.map((domain) => {
    const otherDomains = domains.filter((name) => name !== domain).join("|");
    return {
      files: [`src/components/${domain}/**/*.{ts,tsx}`],
      rules: {
        "no-restricted-imports": restrictions([
          forbid("(^|/)app(/|$)", "Shared modules must not depend on routes."),
          forbid(
            `(^|/)(components|lib)/(${otherDomains})(/|$)|^(\\.\\./)+(${otherDomains})(/|$)`,
            "A domain must not depend on another domain's internals.",
          ),
        ]),
      },
    };
  }),
  ...["projects", "writing"].map((domain) => {
    const otherDomains = domains.filter((name) => name !== domain).join("|");
    return {
      files: [`src/lib/${domain}/**/*.{ts,tsx}`],
      rules: {
        "no-restricted-imports": restrictions([
          forbid("(^|/)app(/|$)", "Data modules must not depend on routes."),
          forbid("(^|/)components(/|$)", "Data modules must not depend on UI."),
          forbid(
            `(^|/)lib/(${otherDomains})(/|$)|^(\\.\\./)+(${otherDomains})(/|$)`,
            "A domain must not depend on another domain's internals.",
          ),
        ]),
      },
    };
  }),
  {
    files: [
      "src/components/{ui,site}/**/*.{ts,tsx}",
      "src/config/**/*.{ts,tsx}",
      "src/lib/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": restrictions([
        forbid(
          "(^|/)(app|bot|projects|writing)(/|$)",
          "Shared UI, configuration and utilities must not depend on routes or domain modules.",
        ),
      ]),
    },
  },
]);
