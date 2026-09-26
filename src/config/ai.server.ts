import "server-only";

export function isAiEnabled(): boolean {
  return (
    process.env.DEEPSEEK_PUBLIC_ENABLED === "true" &&
    Boolean(process.env.DEEPSEEK_API_KEY)
  );
}
