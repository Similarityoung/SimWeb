"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { createTurnstileChallenge } from "./turnstile";

export function useTurnstile() {
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [challenge] = useState(() => createTurnstileChallenge(sitekey));
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => () => challenge.dispose(), [challenge]);
  return {
    getToken: challenge.getToken,
    widget: sitekey ? (
      <>
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          onReady={() => {
            if (window.turnstile && container.current)
              challenge.mount(window.turnstile, container.current);
          }}
          onError={() => challenge.fail()}
        />
        <div
          ref={container}
          className="fixed right-4 bottom-4 z-50 w-[min(320px,calc(100vw-2rem))]"
          aria-label="Security verification"
        />
      </>
    ) : null,
  };
}
