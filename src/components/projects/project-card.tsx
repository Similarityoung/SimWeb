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

export function ProjectCard({
  project,
  layout = "compact",
}: {
  project: Project;
  layout?: "compact" | "directory";
}) {
  const Icon = projectIcons[project.icon];
  const card =
    layout === "directory" ? (
      <Card className="grid grid-cols-[1.75rem_minmax(0,1fr)_1rem] items-start gap-x-3 gap-y-4 p-5 shadow-none transition-colors group-hover:border-foreground/30 group-hover:bg-muted/50 group-focus-visible:border-foreground/30 group-focus-visible:bg-muted/50 sm:grid-cols-[2rem_minmax(0,1fr)_1.25rem] sm:gap-x-4 sm:px-6">
        <Icon
          className="mt-0.5 size-7 text-foreground-soft transition-colors group-hover:text-accent group-focus-visible:text-accent sm:size-8"
          strokeWidth={1.5}
          aria-hidden
        />
        <div className="min-w-0">
          <h2 className="text-lg leading-7 font-medium tracking-tight [overflow-wrap:anywhere] transition-colors group-hover:text-accent group-focus-visible:text-accent sm:text-xl">
            {project.title}
          </h2>
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
            {project.role}
          </p>
        </div>
        {project.href && (
          <ArrowUpRight
            className="mt-1.5 size-4 text-muted-foreground transition-colors group-hover:text-accent group-focus-visible:text-accent sm:size-5"
            strokeWidth={1.5}
            aria-hidden
          />
        )}
        <div className="col-span-full min-w-0 sm:col-start-2 sm:col-end-3">
          <p className="max-w-[64ch] text-sm leading-7 text-foreground-soft">
            {project.summary}
          </p>
          <ul
            className="mt-4 flex flex-wrap gap-1.5 font-mono text-[11px] leading-5 text-muted-foreground"
            aria-label="Technologies"
          >
            {project.tags.map((tag) => (
              <li key={tag} className="rounded bg-muted px-1.5 py-0.5">
                {tag}
              </li>
            ))}
          </ul>
        </div>
      </Card>
    ) : (
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
