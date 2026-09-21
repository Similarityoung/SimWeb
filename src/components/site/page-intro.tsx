export function PageIntro({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="mb-10 max-w-xl sm:mb-12">
      <h1 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
        {title}
        <span className="text-accent">.</span>
      </h1>
      <p className="mt-5 text-[15px] leading-7 text-muted-foreground">
        {description}
      </p>
    </header>
  );
}
