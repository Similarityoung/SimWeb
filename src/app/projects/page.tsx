import { PageShell } from "@/components/site/page-shell";
import type { Metadata } from "next";
import { ProjectDirectory } from "@/components/projects/project-directory";

export const metadata: Metadata = {
  title: "Projects",
  description: "Open-source projects and things I’m building.",
};

export default function ProjectsPage() {
  return (
    <PageShell
      title="Projects"
      description="Open source, experiments, and things I’m building. Each project leads to the place where the work lives."
    >
      <ProjectDirectory />
    </PageShell>
  );
}
