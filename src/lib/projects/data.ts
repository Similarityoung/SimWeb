import type { Project } from "./types";

export const projects: readonly Project[] = [
  {
    id: "dubbo-go-pixiu",
    title: "Dubbo-go-Pixiu",
    icon: "component",
    summary:
      "Contributing gRPC streaming, MCP integration, authorization, and service discovery to the Apache Dubbo gateway.",
    role: "Open-source contributor",
    href: "https://github.com/apache/dubbo-go-pixiu",
    tags: ["Go", "Gateway", "RPC"],
  },
  {
    id: "dubbo-admin",
    title: "Dubbo Admin",
    icon: "panels-top-left",
    summary:
      "Contributing service method introspection, provider discovery, and generic invocation APIs to the Apache Dubbo console.",
    role: "Open-source contributor",
    href: "https://github.com/apache/dubbo-admin",
    tags: ["Go", "Console", "RPC"],
  },
  {
    id: "dubbo-go",
    title: "Dubbo-go",
    icon: "network",
    summary:
      "Improving routing configuration and context handling for Tag and Polaris routers in Apache Dubbo’s Go implementation.",
    role: "Open-source contributor",
    href: "https://github.com/apache/dubbo-go",
    tags: ["Go", "RPC", "Distributed systems"],
  },
  {
    id: "simweb",
    title: "SimWeb",
    icon: "globe",
    summary:
      "Building a conversational personal site with an interactive Bot, Markdown publishing, and automated content sync.",
    role: "Personal project",
    href: "https://github.com/Similarityoung/SimWeb",
    tags: ["Next.js", "TypeScript", "Personal site"],
  },
  {
    id: "xianyu-ai-engineering",
    title: "Xianyu AI Engineering",
    icon: "workflow",
    summary:
      "Building session observability and diagnostics for agent workflows, and contributing to knowledge integration and artifact archiving.",
    role: "Internship · Xianyu",
    tags: ["Agent", "Observability", "AI Infra"],
  },
];
