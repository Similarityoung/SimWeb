import type { Metadata } from "next";
import { PageIntro } from "@/components/site/page-intro";
import { ProjectDirectory } from "@/components/projects/project-directory";

export const metadata: Metadata = {
  title: "Projects",
  description: "Open-source projects and things I’m building.",
};

export default function ProjectsPage() {
  return (
    <main
      id="main-content"
      className="mx-auto max-w-4xl px-[18px] pt-10 pb-20 sm:px-7 sm:pt-16"
    >
      <PageIntro
        title="Projects"
        description="Open source, experiments, and things I’m building. Each project leads to the place where the work lives."
      />
      <ProjectDirectory />
    </main>
  );
}
