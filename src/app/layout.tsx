import type { Metadata } from "next";
import localFont from "next/font/local";
import { SiteHeader } from "@/components/site/site-header";
import { ThemeProvider } from "@/components/site/theme-provider";
import { site } from "@/config/site";
import { projects } from "@/lib/projects/data";
import { getArticleSummaries } from "@/lib/writing/content.server";
import { ConversationProvider } from "@/app/_home/conversation-provider";
import { validateCatalog } from "@/app/_home/answer-question";
import "./globals.css";

const sans = localFont({
  src: "../../node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-geist-sans",
  display: "swap",
  fallback: ["Arial", "sans-serif"],
});
const mono = localFont({
  src: "../../node_modules/@fontsource/geist-mono/files/geist-mono-latin-400-normal.woff2",
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} · Developer & notes`,
    template: `%s · ${site.name}`,
  },
  description: site.bio,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const catalog = { projects, articles: getArticleSummaries() };
  validateCatalog(catalog);
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <a
          href="#main-content"
          className="sr-only fixed top-2 left-4 z-10 rounded-md bg-foreground px-4 py-3 text-background focus:not-sr-only"
        >
          Skip to content
        </a>
        <ThemeProvider>
          <ConversationProvider catalog={catalog}>
            <SiteHeader />
            {children}
          </ConversationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
