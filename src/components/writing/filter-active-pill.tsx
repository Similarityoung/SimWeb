"use client";

import { motion } from "motion/react";
import { useReducedMotion } from "@/lib/browser-signals";

export function FilterActivePill({ layoutId }: { layoutId: string }) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.span
      layoutId={layoutId}
      initial={false}
      transition={{ duration: reducedMotion ? 0 : 0.2, ease: "easeOut" }}
      className="pointer-events-none absolute inset-0 -z-10 rounded-md bg-muted"
      aria-hidden
    />
  );
}
