import "server-only";

export async function verifyTurnstile(
  request: Request,
): Promise<"valid" | "invalid" | "unavailable"> {
  const token = request.headers.get("x-turnstile-token");
  if (!token || token.length > 2048) return "invalid";
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return "unavailable";
  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({ secret, response: token }),
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(4000)]),
        cache: "no-store",
      },
    );
    if (!response.ok) return "unavailable";
    const result: unknown = await response.json();
    if (!result || typeof result !== "object") return "unavailable";
    const validation = result as Record<string, unknown>;
    return validation.success === true &&
      validation.hostname === new URL(request.url).hostname &&
      validation.action === "answer"
      ? "valid"
      : "invalid";
  } catch {
    return "unavailable";
  }
}
