import type { Transition } from "motion/react";

// JS mirrors of the CSS motion tokens in globals.css. Keep the curves in sync
// with --ease-cds-enter / --ease-cds-out and the base duration.
export const LAYOUT_TRANSITION: Transition = {
  type: "tween",
  duration: 0.56,
  ease: [0.22, 1, 0.36, 1],
};

export const HIGHLIGHT_TRANSITION: Transition = {
  duration: 0.2,
  ease: [0.165, 0.84, 0.44, 1],
};

export function respectReducedMotion(
  transition: Transition,
  reduced: boolean,
): Transition {
  return reduced ? { ...transition, duration: 0, delay: 0 } : transition;
}
