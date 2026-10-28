"use client";

import { motion } from "motion/react";
import { useReducedMotion } from "@/lib/browser-signals";
import { HIGHLIGHT_TRANSITION, respectReducedMotion } from "@/lib/motion";

export function FilterActivePill({ layoutId }: { layoutId: string }) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.span
      layoutId={layoutId}
      initial={false}
      transition={respectReducedMotion(HIGHLIGHT_TRANSITION, reducedMotion)}
      className="pointer-events-none absolute inset-0 -z-10 rounded-md bg-muted"
      aria-hidden
    />
  );
}
