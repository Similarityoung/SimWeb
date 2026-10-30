"use client";

import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_QUESTION_LENGTH, normalizeQuestion } from "@/lib/answer/schema";
import { Input } from "@/components/ui/input";

export function Composer({
  submitDisabled,
  value,
  onChange,
  onSubmit,
}: {
  submitDisabled: boolean;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (text: string) => void;
}) {
  const text = normalizeQuestion(value);
  return (
    <form
      className="field-shell mt-3.5 flex min-h-14 items-center gap-3 rounded-composer p-2 pl-4 sm:min-h-[60px] sm:px-2.5 sm:pl-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!text || submitDisabled) return;
        onSubmit(text);
      }}
    >
      <label htmlFor="question" className="sr-only">
        Ask a question
      </label>
      <Input
        id="question"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={MAX_QUESTION_LENGTH}
        autoComplete="off"
        placeholder="What would you like to know?"
        data-focus-ring="none"
        className="h-9 min-w-0 border-0 bg-transparent px-0 text-base shadow-none ring-0 placeholder:font-mono placeholder:text-body focus-visible:border-transparent sm:text-body dark:bg-transparent"
        onKeyDown={(event) => {
          if (event.key === "Enter" && event.nativeEvent.isComposing)
            event.preventDefault();
        }}
      />
      <Button
        type="submit"
        size="icon"
        disabled={!text || submitDisabled}
        aria-label="Send question"
        className="size-10 rounded-full bg-foreground text-background shadow-none hover:bg-accent disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100"
      >
        <ArrowUp className="size-5" strokeWidth={1.7} />
      </Button>
    </form>
  );
}
