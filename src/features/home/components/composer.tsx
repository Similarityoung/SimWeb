"use client";

import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Composer({
  pending,
  value,
  onChange,
  onSubmit,
  onFocusChange,
}: {
  pending: boolean;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (text: string) => void;
  onFocusChange: (focused: boolean) => void;
}) {
  return (
    <form
      className="mt-3.5 flex min-h-14 items-center gap-3 rounded-[15px] border border-border-strong bg-background p-2 pl-4 transition-colors focus-within:border-foreground sm:min-h-[60px] sm:rounded-[16px] sm:px-2.5 sm:pl-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!value.trim() || pending) return;
        onSubmit(value);
      }}
    >
      <label htmlFor="question" className="sr-only">
        Ask a question
      </label>
      <Input
        id="question"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => onFocusChange(true)}
        onBlur={() => onFocusChange(false)}
        maxLength={300}
        autoComplete="off"
        placeholder="What would you like to know?"
        className="h-9 min-w-0 border-0 bg-transparent px-0 text-base shadow-none ring-0 placeholder:font-mono placeholder:text-[13px] focus-visible:border-transparent focus-visible:ring-0 focus-visible:outline-none sm:text-[15px] dark:bg-transparent"
        onKeyDown={(event) => {
          if (event.key === "Enter" && event.nativeEvent.isComposing)
            event.preventDefault();
        }}
      />
      <Button
        type="submit"
        size="icon"
        disabled={!value.trim() || pending}
        aria-label="Send question"
        className="size-10 rounded-full bg-foreground text-background shadow-none hover:bg-accent active:scale-95 disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100"
      >
        <ArrowUp className="size-5" strokeWidth={1.7} />
      </Button>
    </form>
  );
}
