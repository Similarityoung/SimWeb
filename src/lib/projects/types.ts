export type Project = {
  id: string;
  title: string;
  summary: string;
  role: string;
  icon: "component" | "panels-top-left" | "network" | "globe" | "workflow";
  href?: string;
  tags: readonly string[];
};
