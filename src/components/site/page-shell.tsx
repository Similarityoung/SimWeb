import type { ReactNode } from "react";

export function PageFrame({ children }: { children: ReactNode }) {
  return (
    <main id="main-content" className="site-container pt-4 pb-20 sm:pt-6">
      {children}
    </main>
  );
}

export function PageTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="text-4xl font-semibold leading-tight tracking-[-0.045em]">
      {children}
      <span className="text-accent">.</span>
    </h1>
  );
}

export function PageShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <PageFrame>
      <header className="mb-10 max-w-xl sm:mb-12">
        <PageTitle>{title}</PageTitle>
        {description && (
          <p className="mt-5 text-[15px] leading-7 text-muted-foreground">
            {description}
          </p>
        )}
      </header>
      {children}
    </PageFrame>
  );
}
