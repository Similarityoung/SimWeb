import { preparedAnswers, topics } from "./presets";
import type {
  Answer,
  ContentReference,
  PublicCatalog,
  Question,
  ResolvedContent,
  TopicId,
} from "./types";

function preparedAnswer(topic: TopicId, catalog: PublicCatalog): Answer {
  const preset = preparedAnswers[topic];
  if (topic !== "notes" && topic !== "thoughts") return preset;
  return {
    ...preset,
    references: catalog.articles
      .filter((article) => article.kind === topic)
      .slice(0, 3)
      .map((article) => ({ type: "article" as const, id: article.id })),
  };
}

export function resolveReference(
  reference: ContentReference,
  catalog: PublicCatalog,
): ResolvedContent {
  if (reference.type === "project") {
    const item = catalog.projects.find(
      (project) => project.id === reference.id,
    );
    if (!item) throw new Error(`Unknown project reference: ${reference.id}`);
    return { type: "project", item };
  }
  const item = catalog.articles.find((article) => article.id === reference.id);
  if (!item) throw new Error(`Unknown article reference: ${reference.id}`);
  return { type: "article", item };
}

export function validateCatalog(catalog: PublicCatalog): void {
  for (const items of [catalog.projects, catalog.articles]) {
    if (new Set(items.map((item) => item.id)).size !== items.length)
      throw new Error("Duplicate content ID");
  }
  for (const answer of Object.values(preparedAnswers)) {
    answer.references.forEach((reference) =>
      resolveReference(reference, catalog),
    );
  }
}

function matches(text: string, keyword: string) {
  return /^[a-z]+$/i.test(keyword)
    ? new RegExp(`\\b${keyword}\\b`, "i").test(text)
    : text.includes(keyword);
}

// The only answer-generation seam. A future remote implementation returns the same typed references.
export async function answerQuestion(
  question: Question,
  catalog: PublicCatalog,
  signal?: AbortSignal,
): Promise<Answer> {
  signal?.throwIfAborted();
  const text = question.text.trim().toLowerCase();
  if (!text || text.length > 300)
    throw new Error("A question must contain between 1 and 300 characters.");
  const topic =
    question.topic ??
    topics.find((item) =>
      [item.id, item.label.toLowerCase(), ...item.keywords].some((keyword) =>
        matches(text, keyword),
      ),
    )?.id;
  const answer: Answer = topic
    ? preparedAnswer(topic, catalog)
    : /^(hello|hi|hey|你好|您好)[!！。\s]*$/i.test(text)
      ? {
          kind: "answer",
          text: "Hello! Make yourself at home. Ask me about my projects, notes, or what I’ve been thinking about.",
          references: [],
        }
      : {
          kind: "unmatched",
          text: "I don’t have a prepared answer for that yet. Try one of the topics below, or browse the complete collections in the menu.",
          references: [],
        };
  answer.references.forEach((reference) =>
    resolveReference(reference, catalog),
  );
  signal?.throwIfAborted();
  return answer;
}
