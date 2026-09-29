import type { Answer } from "@/lib/answer/schema";
import type { Project } from "@/lib/projects/types";
import type { ArticleSummary } from "@/lib/writing/types";

export type { TopicId, Question } from "@/lib/answer/schema";
export type PublicCatalog = {
  projects: readonly Project[];
  articles: readonly ArticleSummary[];
};
export type Message = {
  id: string;
  question: string;
  text?: string;
  complete: boolean;
  answer?: Answer;
  error?: string;
};
export type ResolvedContent =
  | { type: "project"; item: Project }
  | { type: "article"; item: ArticleSummary };
