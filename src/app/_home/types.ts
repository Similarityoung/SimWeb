import type { Answer } from "@/lib/answer";
import type { Project } from "@/lib/projects/types";
import type { ArticleSummary } from "@/lib/writing/types";

export type TopicId = "projects" | "notes" | "thoughts" | "about";
export type PublicCatalog = {
  projects: readonly Project[];
  articles: readonly ArticleSummary[];
};
export type Question = { text: string; topic?: TopicId; topicPage?: number };
export type Message = {
  id: string;
  question: string;
  answer?: Answer;
  error?: string;
};
export type ResolvedContent =
  | { type: "project"; item: Project }
  | { type: "article"; item: ArticleSummary };
