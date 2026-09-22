import { expect, test } from "@playwright/test";

for (const colorScheme of ["light", "dark"] as const) {
  test(`eyes remain clipped to the moving body in ${colorScheme} mode`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await page.addInitScript(() => {
      Object.defineProperty(window, "GrokCharacter", {
        configurable: true,
        set(
          Character: new (...args: unknown[]) => {
            eyeFrom: number;
            eyeTo: number;
            eyeMorph: { x: number };
          },
        ) {
          Object.defineProperty(window, "GrokCharacter", {
            configurable: true,
            writable: true,
            value: class extends Character {
              constructor(...args: unknown[]) {
                super(...args);
                Object.assign(window, { __bot: this });
              }
            },
          });
        },
      });
    });
    await page.goto("/");
    const svg = page
      .getByRole("img", { name: "Interactive character" })
      .locator("svg");
    await expect(svg).toHaveAttribute("data-state", "spawning");
    await expect(svg).toHaveAttribute("data-state", "idle");
    // Sample the real renderer through movement and body morphs, including the
    // final turn where an eye correctly disappears behind the silhouette.
    const result = await page.evaluate(
      () =>
        new Promise<{
          frames: number;
          states: string[];
          violations: string[];
          settledEyes: { from: number; to: number; progress: number };
        }>((resolve, reject) => {
          const svg = document.querySelector<SVGSVGElement>(
            '[aria-label="Interactive character"] svg',
          )!;
          const states = new Set<string>(),
            violations = new Set<string>();
          let frames = 0;
          const start = performance.now();
          const sample = () => {
            const state = svg.getAttribute("data-state") ?? "";
            states.add(state);
            frames++;
            const eyes = svg.querySelector<SVGGElement>("g[clip-path]");
            const clip = svg.querySelector("clipPath");
            const body = eyes?.previousElementSibling;
            const clipPath = clip?.querySelector("path");
            if (!eyes || !clip || !body || !clipPath)
              violations.add("missing body clipping");
            else {
              if (eyes.getAttribute("clip-path") !== `url(#${clip.id})`)
                violations.add("wrong clip reference");
              if (!getComputedStyle(eyes).clipPath.includes(`#${clip.id}`))
                violations.add("inactive clip");
              if (body.getAttribute("d") !== clipPath.getAttribute("d"))
                violations.add("stale silhouette");
              if (
                eyes.hasAttribute("transform") ||
                body.hasAttribute("transform")
              )
                violations.add("different coordinate systems");
              for (const eye of eyes.children) {
                const geometry = `${eye.getAttribute("d")} ${eye.getAttribute("transform")}`;
                if (/NaN|Infinity/.test(geometry))
                  violations.add("invalid eye geometry");
              }
            }
            if (states.has("celebrate") && state === "idle") {
              const bot = (
                window as unknown as {
                  __bot: {
                    eyeFrom: number;
                    eyeTo: number;
                    eyeMorph: { x: number };
                  };
                }
              ).__bot;
              resolve({
                frames,
                states: [...states],
                violations: [...violations],
                settledEyes: {
                  from: bot.eyeFrom,
                  to: bot.eyeTo,
                  progress: bot.eyeMorph.x,
                },
              });
            } else if (performance.now() - start > 12_000)
              reject(new Error("Answer did not settle"));
            else requestAnimationFrame(sample);
          };
          document
            .querySelector<HTMLButtonElement>(
              '[aria-label="Conversation topics"] > button:nth-child(2)',
            )!
            .click();
          requestAnimationFrame(sample);
        }),
    );
    expect(result.frames).toBeGreaterThan(30);
    expect(result.states).toContain("writing");
    expect(result.states).toContain("celebrate");
    expect(result.violations).toEqual([]);
    expect(result.settledEyes).toEqual({ from: 0, to: 0, progress: 1 });
  });
}
