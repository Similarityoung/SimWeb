"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="h-11 w-8 text-muted-foreground hover:bg-muted hover:text-foreground sm:w-9 dark:hover:bg-muted"
    >
      <Moon className="size-4 dark:hidden" strokeWidth={1.5} aria-hidden />
      <Sun className="hidden size-4 dark:block" strokeWidth={1.5} aria-hidden />
      <span className="sr-only dark:hidden">Switch to dark theme</span>
      <span className="sr-only hidden dark:inline">Switch to light theme</span>
    </Button>
  );
}
