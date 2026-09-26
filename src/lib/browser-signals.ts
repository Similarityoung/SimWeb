"use client";

import { useSyncExternalStore } from "react";

const motionQuery = () => window.matchMedia("(prefers-reduced-motion: reduce)");
const serverSnapshot = () => false;
const reducedMotionSnapshot = () => motionQuery().matches;
const hiddenSnapshot = () => document.hidden;

function subscribeMotion(notify: () => void) {
  const query = motionQuery();
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
}

function subscribeVisibility(notify: () => void) {
  document.addEventListener("visibilitychange", notify);
  return () => document.removeEventListener("visibilitychange", notify);
}

export function useReducedMotion() {
  return useSyncExternalStore(
    subscribeMotion,
    reducedMotionSnapshot,
    serverSnapshot,
  );
}

export function usePageHidden() {
  return useSyncExternalStore(
    subscribeVisibility,
    hiddenSnapshot,
    serverSnapshot,
  );
}
