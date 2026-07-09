export function ComingSoon({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{blurb}</p>
    </div>
  );
}
