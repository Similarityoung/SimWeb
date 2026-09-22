import type { Project } from "@/features/projects/types";
import type { ArticleSummary } from "@/features/writing/types";

export type TopicId = "projects" | "notes" | "thoughts" | "about";
export type ContentReference =
  { type: "project"; id: string } | { type: "article"; id: string };
export type PublicCatalog = {
  projects: readonly Project[];
  articles: readonly ArticleSummary[];
};
export type Answer = {
  kind: "answer" | "unmatched";
  text: string;
  references: readonly ContentReference[];
};
export type Question = { text: string; topic?: TopicId };
export type Message = {
  id: string;
  question: string;
  answer?: Answer;
  error?: string;
};
export type ResolvedContent =
  | { type: "project"; item: Project }
  | { type: "article"; item: ArticleSummary };
