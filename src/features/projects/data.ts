import type { Project } from "./types";

export const projects: readonly Project[] = [
  {
    id: "dubbo-go-pixiu",
    title: "Dubbo-go-Pixiu",
    summary:
      "Contributing gRPC streaming, MCP integration, authorization, and service discovery to the Apache Dubbo gateway.",
    role: "Open-source contributor",
    href: "https://github.com/apache/dubbo-go-pixiu",
    tags: ["Go", "Gateway", "RPC"],
  },
  {
    id: "pixiu-admin",
    title: "Pixiu Admin",
    summary:
      "An interface prototype for exploring how to configure and manage a Pixiu gateway.",
    role: "Personal project",
    href: "https://github.com/Similarityoung/admin-web",
    tags: ["Frontend", "Gateway"],
  },
];
