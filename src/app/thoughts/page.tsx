import type { Metadata } from "next";
import { WritingDirectory } from "@/app/_writing/directory";

export const metadata: Metadata = {
  title: "Thoughts",
  description: "Thoughts on building, learning, and working through problems.",
  alternates: { canonical: "/thoughts" },
};

export default function ThoughtsPage() {
  return <WritingDirectory kind="thoughts" />;
}
