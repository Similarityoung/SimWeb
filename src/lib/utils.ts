import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "caption",
        "footnote",
        "code",
        "body",
        "prose",
        "heading",
        "card-title",
        "title",
      ],
      radius: ["panel", "bubble", "composer", "pill"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function textLanguage(text = "") {
  return /\p{Script=Han}/u.test(text) ? "zh-CN" : "en";
}
