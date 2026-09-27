import {
  ArrowUpRight,
  Component,
  Globe,
  Network,
  PanelsTopLeft,
  Workflow,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Project } from "@/lib/projects/types";

const projectIcons = {
  component: Component,
  "panels-top-left": PanelsTopLeft,
  network: Network,
  globe: Globe,
  workflow: Workflow,
};

export function ProjectCard({ project }: { project: Project }) {
  const Icon = projectIcons[project.icon];
  const card = (
    <Card className="h-full gap-5 p-5 shadow-none transition-colors group-hover:border-foreground/30 group-hover:bg-muted/50">
      <div className="flex items-start justify-between gap-3">
        <Icon
          className="size-5 text-muted-foreground"
          strokeWidth={1.5}
          aria-hidden
        />
        {project.href && (
          <ArrowUpRight
            className="size-4 text-muted-foreground transition-colors group-hover:text-accent"
            strokeWidth={1.5}
            aria-hidden
          />
        )}
      </div>
      <div>
        <p className="mb-2 font-mono text-[11px] text-muted-foreground">
          {project.role}
        </p>
        <h3 className="text-base font-medium tracking-tight">
          {project.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {project.summary}
        </p>
      </div>
      <p className="mt-auto font-mono text-[11px] text-muted-foreground">
        {project.tags.join(" / ")}
      </p>
    </Card>
  );

  if (!project.href) {
    return (
      <article aria-label={project.title} className="h-full">
        {card}
      </article>
    );
  }

  return (
    <a
      href={project.href}
      target="_blank"
      rel="noreferrer"
      className="group block h-full rounded-xl"
      aria-label={`${project.title}, view on GitHub`}
    >
      {card}
    </a>
  );
}
