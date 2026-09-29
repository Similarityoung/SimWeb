import { projects } from "@/lib/projects/data";
import { ProjectCard } from "./project-card";

export function ProjectDirectory() {
  return (
    <section aria-label="All projects" lang="en">
      <ul className="space-y-4">
        {projects.map((project) => (
          <li key={project.id}>
            <ProjectCard project={project} layout="directory" />
          </li>
        ))}
      </ul>
    </section>
  );
}
