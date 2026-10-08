import { answerErrors } from "@/lib/answer/schema";

export interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      appearance: "interaction-only";
      size: "flexible";
      retry: "never";
      "refresh-expired": "never";
      "refresh-timeout": "never";
      callback: (token: string) => void;
      "error-callback": () => false;
      "timeout-callback": () => void;
      "expired-callback": () => void;
    },
  ) => string;
  remove: (widget: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export function createTurnstileChallenge(sitekey: string | undefined) {
  let api: TurnstileApi | undefined;
  let container: HTMLElement | undefined;
  let widget: string | undefined;
  let pending: { run: () => void; cancel: (error: Error) => void } | undefined;
  let scriptFailed = false;
  function remove() {
    if (widget !== undefined) api?.remove(widget);
    widget = undefined;
  }
  return {
    mount(nextApi: TurnstileApi, element: HTMLElement) {
      api = nextApi;
      container = element;
      pending?.run();
    },
    fail() {
      scriptFailed = true;
      pending?.cancel(new Error(answerErrors.verification));
    },
    dispose() {
      pending?.cancel(new DOMException("Cancelled", "AbortError"));
      remove();
      api = undefined;
      container = undefined;
    },
    getToken(signal?: AbortSignal | null): Promise<string> {
      if (!sitekey) return Promise.reject(new Error(answerErrors.unavailable));
      if (scriptFailed || pending)
        return Promise.reject(new Error(answerErrors.verification));
      return new Promise((resolve, reject) => {
        const finish = (token?: string, error?: Error) => {
          if (pending !== request) return;
          pending = undefined;
          clearTimeout(timer);
          signal?.removeEventListener("abort", abort);
          remove();
          if (token) resolve(token);
          else reject(error ?? new Error(answerErrors.verification));
        };
        const abort = () =>
          finish(undefined, new DOMException("Cancelled", "AbortError"));
        const fail = () => finish();
        const request = {
          cancel: (error: Error) => finish(undefined, error),
          run() {
            if (!api || !container || widget !== undefined) return;
            try {
              widget = api.render(container, {
                sitekey,
                action: "answer",
                appearance: "interaction-only",
                size: "flexible",
                retry: "never",
                "refresh-expired": "never",
                "refresh-timeout": "never",
                callback: (token) => finish(token),
                "error-callback": () => {
                  fail();
                  return false;
                },
                "timeout-callback": fail,
                "expired-callback": fail,
              });
            } catch {
              fail();
            }
          },
        };
        const timer = setTimeout(fail, 30_000);
        pending = request;
        signal?.addEventListener("abort", abort, { once: true });
        if (signal?.aborted) abort();
        else request.run();
      });
    },
  };
}
