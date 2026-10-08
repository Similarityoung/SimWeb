import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function textLanguage(text = "") {
  return /\p{Script=Han}/u.test(text) ? "zh-CN" : "en";
}
