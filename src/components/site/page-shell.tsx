import type { ReactNode } from "react";

export function PageShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main
      id="main-content"
      className="mx-auto max-w-4xl px-[18px] pt-10 pb-20 sm:px-7 sm:pt-16"
    >
      <header className="mb-10 max-w-xl sm:mb-12">
        <h1 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
          {title}
          <span className="text-accent">.</span>
        </h1>
        <p className="mt-5 text-[15px] leading-7 text-muted-foreground">
          {description}
        </p>
      </header>
      {children}
    </main>
  );
}
