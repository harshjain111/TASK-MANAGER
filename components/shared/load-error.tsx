import { AlertCircle } from 'lucide-react';

/**
 * Shown when a screen's data query failed. Distinct from an empty state on
 * purpose: rendering "no team members" for an unreachable database tells the
 * user something false about their organization.
 */
export function LoadError({
  title = "Couldn't load this page",
  blurb = "We couldn't reach the server. Check your connection and refresh the page.",
}: {
  title?: string;
  blurb?: string;
}) {
  return (
    <div
      role="alert"
      className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center"
    >
      <AlertCircle className="size-8 text-destructive" aria-hidden="true" />
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{blurb}</p>
    </div>
  );
}
