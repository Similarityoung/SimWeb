import "server-only";
import { PeleError, render } from "pele";

export type MermaidRenderResult =
  { ok: true; svg: string } | { ok: false; error: string };

export function renderMermaid(
  source: string,
  idPrefix: string,
): MermaidRenderResult {
  try {
    return {
      ok: true,
      svg: render(source, {
        idPrefix,
        links: false,
        images: false,
        responsive: false,
      }).svg,
    };
  } catch (error) {
    if (!(error instanceof PeleError)) throw error;
    return { ok: false, error: error.message };
  }
}
