// Shared wire contract: safe to import from the browser and the API route.
export type ContentReference =
  { type: "project"; id: string } | { type: "article"; id: string };

export type Answer = {
  kind: "answer" | "unmatched";
  text: string;
  references: readonly ContentReference[];
};

export const MAX_QUESTION_LENGTH = 300;
export const QUESTION_LENGTH_ERROR = `A question must contain between 1 and ${MAX_QUESTION_LENGTH} characters.`;

export function normalizeQuestion(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  return text && text.length <= MAX_QUESTION_LENGTH ? text : undefined;
}
