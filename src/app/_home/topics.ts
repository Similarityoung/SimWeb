import { topicQuestions, type TopicId } from "@/lib/answer/schema";

export const topics = (
  [
    { id: "projects", label: "Projects", description: "Things I build." },
    { id: "notes", label: "Notes", description: "Things I learn." },
    { id: "thoughts", label: "Thoughts", description: "Things I notice." },
    { id: "about", label: "About Me", description: "A little context." },
  ] satisfies { id: TopicId; label: string; description: string }[]
).map((topic) => ({ ...topic, question: topicQuestions[topic.id] }));
