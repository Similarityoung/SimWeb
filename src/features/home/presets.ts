import type { Answer, TopicId } from "./types";

export const topics: readonly {
  id: TopicId;
  label: string;
  description: string;
  question: string;
  keywords: readonly string[];
}[] = [
  {
    id: "projects",
    label: "Projects",
    description: "Things I build.",
    question: "What have you been building?",
    keywords: [
      "project",
      "build",
      "work",
      "pixiu",
      "dubbo",
      "mcp",
      "grpc",
      "项目",
      "作品",
      "开源",
    ],
  },
  {
    id: "notes",
    label: "Notes",
    description: "Things I learn.",
    question: "What have you been learning?",
    keywords: [
      "note",
      "learn",
      "agent",
      "study",
      "paper",
      "笔记",
      "学习",
      "论文",
      "上下文",
    ],
  },
  {
    id: "thoughts",
    label: "Thoughts",
    description: "Things I notice.",
    question: "What do you write about beyond code?",
    keywords: [
      "thought",
      "essay",
      "story",
      "community",
      "随笔",
      "记录",
      "思考",
      "社区",
    ],
  },
  {
    id: "about",
    label: "About Me",
    description: "A little context.",
    question: "Tell me a little about yourself.",
    keywords: [
      "about",
      "who",
      "yourself",
      "name",
      "stack",
      "skill",
      "go",
      "contact",
      "github",
      "介绍",
      "技术栈",
      "联系",
      "你是谁",
    ],
  },
];

export const preparedAnswers: Record<TopicId, Answer> = {
  projects: {
    kind: "answer",
    text: "Much of my work lives in open source. Here are the projects I contribute to and the ideas I’m exploring.",
    references: [
      { type: "project", id: "dubbo-go-pixiu" },
      { type: "project", id: "pixiu-admin" },
    ],
  },
  notes: {
    kind: "answer",
    text: "I write things down as I learn. These notes follow the questions I run into while building with Go, RPC, and AI tools.",
    references: [],
  },
  thoughts: {
    kind: "answer",
    text: "Some questions need a little distance from the code. Here are a few thoughts beyond the day-to-day work.",
    references: [],
  },
  about: {
    kind: "answer",
    text: "I’m Zerui Yang, a backend developer and Apache Dubbo Committer. I work mainly in Go, around RPC and distributed systems, and I’m exploring agent workflows. You can find more in About Me above.",
    references: [],
  },
};
