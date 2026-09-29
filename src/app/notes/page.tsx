import type { Metadata } from "next";
import { WritingDirectory } from "@/app/_writing/directory";

export const metadata: Metadata = {
  title: "Notes",
  description: "Notes on Go, RPC, and the questions I’m learning through.",
  alternates: { canonical: "/notes" },
};

export default function NotesPage() {
  return <WritingDirectory kind="notes" />;
}
