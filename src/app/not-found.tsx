import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <main id="main-content" className="site-container py-24">
      <p className="font-mono text-sm text-accent">404</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        This page isn’t here.
      </h1>
      <p className="mt-4 text-muted-foreground">
        It may have moved, or the link may be incomplete.
      </p>
      <Button asChild className="mt-8 h-11 px-5">
        <Link href="/">Back to home</Link>
      </Button>
    </main>
  );
}
