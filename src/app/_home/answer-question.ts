import { preparedAnswers, topics } from "./presets";
import type {
  Answer,
  ContentReference,
  PublicCatalog,
  Question,
  ResolvedContent,
  TopicId,
} from "./types";

export class AnswerRateLimitError extends Error {}

function interleaveByCategory(
  articles: readonly PublicCatalog["articles"][number][],
) {
  const groups = new Map<string, PublicCatalog["articles"][number][]>();
  for (const article of articles) {
    const category = article.categories[0] ?? "Other";
    const group = groups.get(category) ?? [];
    group.push(article);
    groups.set(category, group);
  }
  const orderedGroups = [...groups.entries()]
    .sort(
      ([a, aArticles], [b, bArticles]) =>
        bArticles.length - aArticles.length || a.localeCompare(b),
    )
    .map(([, group]) => group);
  const interleaved: PublicCatalog["articles"][number][] = [];
  for (let index = 0; interleaved.length < articles.length; index++) {
    for (const group of orderedGroups) {
      if (group[index]) interleaved.push(group[index]);
    }
  }
  return interleaved;
}

function preparedAnswer(
  topic: TopicId,
  catalog: PublicCatalog,
  topicPage = 0,
): Answer {
  const preset = preparedAnswers[topic];
  if (topic !== "notes" && topic !== "thoughts") return preset;
  const articles = interleaveByCategory(
    catalog.articles.filter((article) => article.kind === topic),
  );
  if (!articles.length) return preset;
  const pageCount = Math.ceil(articles.length / 3);
  const page = Math.max(0, Math.floor(topicPage)) % pageCount;
  const selected = articles.slice(page * 3, page * 3 + 3);
  const categories = [
    ...new Set(selected.map((article) => article.categories[0] ?? "Other")),
  ];
  const label = topic === "notes" ? "Notes" : "Thoughts";
  return {
    ...preset,
    text: `I have ${articles.length} published ${topic}. This set covers ${categories.join(", ")}. ${pageCount > 1 ? `Tap ${label} again for another set, or open the full collection in the menu.` : "Open the full collection in the menu."}`,
    references: selected.map((article) => ({
      type: "article",
      id: article.id,
    })),
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

function isPreparedQuestion(question: Question): boolean {
  if (question.topic) return true;
  const text = question.text.trim().toLowerCase();
  return (
    /^(hello|hi|hey|你好|您好)[!！。\s]*$/i.test(text) ||
    /^(?:show me |what are your |tell me about your )?(?:notes|thoughts|projects)\??$/.test(
      text,
    ) ||
    /^(?:我想看|看看|看下|有哪些|介绍一下|给我看看)?(?:你的|你写的)?(?:笔记|随笔|项目)(?:有哪些|吗|？|\?)?$/.test(
      text,
    ) ||
    topics.some((topic) =>
      [
        topic.id,
        topic.label.toLowerCase(),
        topic.question.toLowerCase(),
      ].includes(text),
    ) ||
    ["项目", "笔记", "随笔", "介绍"].includes(text)
  );
}

async function remoteAnswer(
  question: string,
  catalog: PublicCatalog,
  signal?: AbortSignal,
): Promise<Answer> {
  const response = await fetch("/api/answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: question }),
    signal,
    cache: "no-store",
  });
  if (response.status === 429) throw new AnswerRateLimitError();
  if (!response.ok)
    throw new Error(`Answer request failed: ${response.status}`);
  const answer = (await response.json()) as Answer;
  answer.references.forEach((reference) =>
    resolveReference(reference, catalog),
  );
  return answer;
}

function matches(text: string, keyword: string) {
  return /^[a-z]+$/i.test(keyword)
    ? new RegExp(`\\b${keyword}\\b`, "i").test(text)
    : text.includes(keyword);
}

export async function answerQuestion(
  question: Question,
  catalog: PublicCatalog,
  signal?: AbortSignal,
  aiEnabled = false,
): Promise<Answer> {
  signal?.throwIfAborted();
  const text = question.text.trim().toLowerCase();
  if (!text || text.length > 300)
    throw new Error("A question must contain between 1 and 300 characters.");
  if (aiEnabled && !isPreparedQuestion(question))
    return remoteAnswer(question.text.trim(), catalog, signal);
  const topic =
    question.topic ??
    topics.find((item) =>
      [item.id, item.label.toLowerCase(), ...item.keywords].some((keyword) =>
        matches(text, keyword),
      ),
    )?.id;
  const answer: Answer = topic
    ? preparedAnswer(topic, catalog, question.topicPage)
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
