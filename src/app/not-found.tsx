import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main-content" className="mx-auto max-w-4xl px-6 py-24">
      <p className="font-mono text-sm text-accent">404</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        This page isn’t here.
      </h1>
      <p className="mt-4 text-muted-foreground">
        It may have moved, or the link may be incomplete.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-md bg-foreground px-5 py-3 text-sm text-background"
      >
        Back to home
      </Link>
    </main>
  );
}
