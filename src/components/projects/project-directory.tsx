import { projects } from "@/lib/projects/data";
import { ProjectCard } from "./project-card";

export function ProjectDirectory() {
  return (
    <section aria-label="All projects" className="grid gap-4 sm:grid-cols-2">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </section>
  );
}
