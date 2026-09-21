import type { WritingKind } from "./types";

export type WritingEntry = {
  id: string;
  file: string;
  kind: WritingKind;
  slug: string;
  summary: string;
};

// Development selection only. Titles, dates, tags and bodies belong to the source Markdown.
export const entries: readonly WritingEntry[] = [
  {
    id: "pixiu-grpc-streaming",
    file: "Dubbo-go-Pixiu 实现 grpc 双向流.md",
    kind: "notes",
    slug: "pixiu-grpc-streaming",
    summary:
      "在 Pixiu 网关中实现原生 gRPC 流式代理，梳理监听器、过滤器、连接池与优雅关闭的职责。",
  },
  {
    id: "go-design-philosophy",
    file: "go 设计哲学.md",
    kind: "notes",
    slug: "go-design-philosophy",
    summary:
      "从循环依赖出发，理解 Go 的接口与依赖注入，以及如何在消费者一侧定义真正需要的行为。",
  },
  {
    id: "paper-reading-prompts",
    file: "用于阅读论文的提示词.md",
    kind: "notes",
    slug: "paper-reading-prompts",
    summary:
      "用于分析论文方法、阅读综述和筛选研究方向的提示词，关注方法动机、实验依据与可复现性。",
  },
  {
    id: "thinking-through-problems",
    file: "解决问题的思路.md",
    kind: "thoughts",
    slug: "thinking-through-problems",
    summary:
      "动手之前，先写清楚背景、约束和设计取舍。从理解问题到验证改进，整理思考与行动的顺序。",
  },
];
