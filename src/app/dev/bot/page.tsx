import { notFound } from "next/navigation";
import { BotPreview } from "@/features/bot/bot-preview";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Bot 动作预览",
  robots: { index: false, follow: false },
};

export default function BotPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <BotPreview />;
}
