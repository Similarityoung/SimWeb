import "server-only";
import { site } from "@/config/site";
import { projects } from "@/lib/projects/data";
import type { PublishedArticle } from "@/lib/writing/catalog";
import { getPublishedArticles } from "@/lib/writing/content.server";
import { articleExcerpt, rankArticles } from "@/lib/writing/search.server";
import {
  answerSchema,
  questionTextOf,
  referenceKey,
  type Answer,
  type AnswerRequest,
  type ContentReference,
} from "./schema";

export class InvalidContextError extends Error {}

const articleInfo = ({ article }: PublishedArticle) => ({
  id: article.id,
  title: article.title,
  kind: article.kind,
  summary: article.summary,
  date: article.date,
});

export function selectRecentArticles(
  articles: readonly PublishedArticle[],
  random: () => number = Math.random,
): PublishedArticle[] {
  const sorted = [...articles].sort(
    (a, b) =>
      b.article.date.localeCompare(a.article.date) ||
      a.article.id.localeCompare(b.article.id),
  );
  const selected = sorted.splice(0, 3);
  while (selected.length < 5 && sorted.length) {
    selected.push(...sorted.splice(Math.floor(random() * sorted.length), 1));
  }
  return selected;
}

function locateTarget(
  text: string,
  previous: readonly ContentReference[],
  all: readonly { ref: ContentReference; title: string }[],
) {
  const ids = all.filter(({ ref }) =>
    new RegExp(`(?<![a-z0-9-])${ref.id}(?![a-z0-9-])`, "i").test(text),
  );
  const explicit = ids.length
    ? ids
    : all.filter(({ title }) =>
        text.toLowerCase().includes(title.toLowerCase()),
      );
  if (explicit.length)
    return {
      target: explicit.length === 1 ? explicit[0].ref : undefined,
      clarify: explicit.length !== 1,
    };
  const ordinal = text.match(
    /第\s*([一二三四五六七八九十\d]+)\s*(个项目|篇笔记|篇随笔|个|篇|项)?|\b(first|second|third|fourth|fifth|\d+(?:st|nd|rd|th))\s*(project|note|article|thought|one)?\b/i,
  );
  if (ordinal) {
    const words = [
      "一",
      "二",
      "三",
      "四",
      "五",
      "first",
      "second",
      "third",
      "fourth",
      "fifth",
    ];
    const number = (ordinal[1] ?? ordinal[3]).toLowerCase();
    const index = /^\d/.test(number)
      ? parseInt(number, 10) - 1
      : words.indexOf(number) % 5;
    const kind = ordinal[2] ?? ordinal[4] ?? "";
    const list = /项目|project/i.test(kind)
      ? previous.filter((r) => r.type === "project")
      : /篇|note|article|thought/i.test(kind)
        ? previous.filter((r) => r.type === "article")
        : previous;
    const target = index >= 0 && index < 5 ? list[index] : undefined;
    return { target, clarify: !target };
  }
  const continuation =
    /它|这篇|那篇|这个项目|那个项目|展开|接着|继续|详细说|\b(it|that one|this one|that article|that project|elaborate|tell me more|expand)\b/i.test(
      text,
    );
  if (continuation) {
    const target = previous.length === 1 ? previous[0] : undefined;
    const wrongType =
      target &&
      ((/篇|\barticle\b|\bnote\b/i.test(text) && target.type !== "article") ||
        (/项目|\bproject\b/i.test(text) && target.type !== "project"));
    return {
      target: wrongType ? undefined : target,
      clarify: !target || Boolean(wrongType),
    };
  }
  return { clarify: false };
}

export function buildAnswerContext(
  request: AnswerRequest,
  published: readonly PublishedArticle[] = getPublishedArticles(),
  random: () => number = Math.random,
) {
  const all = [
    ...projects.map((p) => ({
      ref: { type: "project" as const, id: p.id },
      title: p.title,
    })),
    ...published.map((p) => ({
      ref: { type: "article" as const, id: p.article.id },
      title: p.article.title,
    })),
  ];
  const valid = new Set(all.map(({ ref }) => referenceKey(ref)));
  if (
    request.lastShownReferences.some((ref) => !valid.has(referenceKey(ref)))
  ) {
    throw new InvalidContextError("Unknown or withdrawn reference");
  }
  const text = questionTextOf(request.question);
  const topic =
    request.question.type === "topic" ? request.question.topic : undefined;
  const selection =
    topic === "notes" || topic === "thoughts"
      ? selectRecentArticles(
          published.filter((p) => p.article.kind === topic),
          random,
        )
      : [];
  const fixedReferences: ContentReference[] | undefined =
    topic === "projects"
      ? projects.map((p) => ({ type: "project", id: p.id }))
      : topic === "notes" || topic === "thoughts"
        ? selection.map((p) => ({ type: "article", id: p.article.id }))
        : undefined;
  const followup = !topic
    ? locateTarget(text, request.lastShownReferences, all)
    : { clarify: false };
  const historyArticles = request.lastShownReferences.flatMap((ref) => {
    const item =
      ref.type === "article"
        ? published.find((p) => p.article.id === ref.id)
        : undefined;
    return item ? [item] : [];
  });
  const direct =
    followup.target?.type === "article"
      ? published.find((p) => p.article.id === followup.target?.id)
      : undefined;
  const matches =
    !topic && !followup.clarify ? rankArticles(text, published) : [];
  const excerpts = [
    ...(direct
      ? [
          {
            article: direct,
            excerpt: articleExcerpt(
              direct.article.body,
              request.previous ? `${text} ${request.previous.question}` : text,
            ),
          },
        ]
      : []),
    ...matches.filter((p) => p.article.article.id !== direct?.article.id),
  ].slice(0, 3);
  const articles = [
    ...new Map([
      ...selection.map((p) => [p.article.id, articleInfo(p)] as const),
      ...historyArticles.map((p) => [p.article.id, articleInfo(p)] as const),
      ...excerpts.map(
        (p) =>
          [
            p.article.article.id,
            { ...articleInfo(p.article), excerpt: p.excerpt },
          ] as const,
      ),
    ]).values(),
  ];
  const candidates = new Set([
    ...projects.map((p) => `project:${p.id}`),
    ...articles.map((p) => `article:${p.id}`),
  ]);
  return {
    candidates,
    fixedReferences,
    data: {
      profile: {
        name: site.name,
        fullName: site.fullName,
        role: site.role,
        bio: site.bio,
        about: site.about,
        experience: site.log.map((entry) =>
          "detail" in entry
            ? `${entry.date} ${entry.text}. ${entry.detail}`
            : `${entry.date} ${entry.text}`,
        ),
        thoughts: site.thoughts,
        writing: site.writing,
        github: site.github,
      },
      projects: projects.map(({ id, title, role, summary }) => ({
        id,
        title,
        role,
        summary,
      })),
      articles,
      selectedReferences: fixedReferences,
      recentReferences: request.lastShownReferences,
      followup: followup.clarify
        ? "Ask which item the visitor means; do not guess or attach cards."
        : followup.target,
      previous: request.previous,
      question: text,
    },
    clarify: followup.clarify,
  };
}

export function validateAnswer(
  answer: Answer,
  context: ReturnType<typeof buildAnswerContext>,
): Answer {
  const parsed = answerSchema.parse(answer);
  if (
    parsed.references.some((ref) => !context.candidates.has(referenceKey(ref)))
  )
    throw new Error("Reference outside supplied context");
  if (context.clarify && parsed.references.length)
    throw new Error("Ambiguous answer references");
  return {
    ...parsed,
    references:
      parsed.kind === "unmatched"
        ? []
        : (context.fixedReferences ?? parsed.references),
  };
}
