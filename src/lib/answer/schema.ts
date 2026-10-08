import { z } from "zod";
import type { UIMessage } from "ai";

export const MAX_QUESTION_LENGTH = 300;
export const MAX_ANSWER_LENGTH = 1200;
export const MAX_BODY_BYTES = 16 * 1024;
export const QUESTION_LENGTH_ERROR = `A question must contain between 1 and ${MAX_QUESTION_LENGTH} characters.`;
export const topicQuestions = {
  projects: "What have you been building?",
  notes: "What have you been learning?",
  thoughts: "What do you write about beyond code?",
  about: "Tell me a little about yourself.",
} as const;
export const topicSchema = z.enum(["projects", "notes", "thoughts", "about"]);
export type TopicId = z.infer<typeof topicSchema>;
const questionText = z.string().trim().min(1).max(MAX_QUESTION_LENGTH);
export const questionSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("topic"), topic: topicSchema }),
  z.strictObject({ type: z.literal("text"), text: questionText }),
]);
export type Question = z.infer<typeof questionSchema>;
export function questionTextOf(question: Question): string {
  return question.type === "topic"
    ? topicQuestions[question.topic]
    : question.text;
}
export function normalizeQuestion(value: unknown): string | undefined {
  const result = questionText.safeParse(value);
  return result.success ? result.data : undefined;
}

export const referenceSchema = z.strictObject({
  type: z.enum(["project", "article"]),
  id: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});
export type ContentReference = z.infer<typeof referenceSchema>;
export const referenceKey = (ref: ContentReference) => `${ref.type}:${ref.id}`;
const referencesSchema = z
  .array(referenceSchema)
  .max(5)
  .refine(
    (refs) => new Set(refs.map(referenceKey)).size === refs.length,
    "Duplicate references",
  );
export const answerSchema = z
  .strictObject({
    kind: z.enum(["answer", "unmatched"]),
    text: z.string().trim().min(1).max(MAX_ANSWER_LENGTH),
    references: referencesSchema,
  })
  .refine(
    (answer) => answer.kind !== "unmatched" || answer.references.length === 0,
    "Unmatched answers cannot have references",
  );
export type Answer = z.infer<typeof answerSchema>;
export const answerRequestSchema = z.strictObject({
  question: questionSchema,
  previous: z
    .strictObject({
      question: questionText,
      text: z.string().trim().min(1).max(MAX_ANSWER_LENGTH),
    })
    .optional(),
  lastShownReferences: referencesSchema,
});
export type AnswerRequest = z.infer<typeof answerRequestSchema>;
export const answerDataSchema = z.discriminatedUnion("status", [
  z.strictObject({
    status: z.literal("streaming"),
    text: z.string().max(MAX_ANSWER_LENGTH),
  }),
  z.strictObject({ status: z.literal("complete"), answer: answerSchema }),
]);
export type AnswerData = z.infer<typeof answerDataSchema>;
export type AnswerMessage = UIMessage<
  {
    question: Question;
    outcome?: "success" | "failed";
    error?: string;
  },
  { answer: AnswerData }
>;

export const answerErrors = {
  verification: "Could not verify this request. Please try asking again.",
  unavailable:
    "AI answers are not available right now. You can still browse the collections in the menu.",
  limited: "Too many questions for now. Please wait a little and try again.",
  failed: "Could not finish this answer. Please try asking again.",
  invalid:
    "Invalid question or conversation context. Please clear the conversation and try again.",
  timeout: "The answer took too long. Please try asking again.",
} as const;
