export const site = {
  name: "Similarityoung",
  fullName: "Zerui Yang",
  url: "https://simi.host",
  github: "https://github.com/Similarityoung",
  role: "Backend developer · Apache Dubbo Committer",
  bio: "I work mainly in Go, around RPC and distributed systems. Lately exploring agent workflows.",
  slogan: ["I came", "I saw", "I wrote"],
  // About Me reads as one essay: about → log → thoughts → writing → heatmap.
  about: [
    "I’m Similarityoung, a backend engineer working mainly in Go and an Apache Dubbo committer. My work centers on RPC frameworks and gateways. These days I study agent development, and how the infrastructure beneath agents ought to be built. Most of what I know, I learned in open source.",
  ],
  // Newest first, written like commits; shown on About Me and given to the Bot.
  log: [
    {
      date: "2026.06",
      type: "feat",
      text: "Became an Apache Dubbo committer",
      href: "https://community.apache.org/blog/2026_06_committers.html#dubbo",
    },
    {
      date: "2026.05",
      type: "feat",
      text: "Joined Xianyu Agent Infra",
      detail:
        "Building observability and diagnostics for AI-driven development pipelines.",
    },
    {
      date: "2025.06",
      type: "feat",
      text: "Joined OSPP on the Dubbo-go-Pixiu AI gateway",
      detail:
        "My work on Pixiu has since covered gRPC streaming, MCP integration, authorization, and service discovery.",
    },
  ],
  thoughts: [
    "AI can write the code, but I remain responsible for what it produces. So rather than taking large strides, I start from a small loop that closes end to end.",
    "AI now produces more code than anyone can review line by line. Instead of reading all of it, I would confine it to narrow, well-defined interfaces and guard the output with verification that actually holds. Of everything here, I consider this the most important.",
    "Doing this well means studying the design of good projects: learning to define and decompose problems, and knowing how to abstract and how to generalize. Each of these is a broad subject, and I am still learning.",
  ],
  writing:
    "This site collects what I build, learn, and think about. The notes are working notes: a record of questions, and of the understanding that comes from following them.",
  navigation: [
    { label: "Home", href: "/" },
    { label: "Projects", href: "/projects" },
    { label: "Notes", href: "/notes" },
    { label: "Thoughts", href: "/thoughts" },
    { label: "About Me", href: "/about" },
  ],
} as const;
