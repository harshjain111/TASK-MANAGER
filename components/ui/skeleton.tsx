import { cn } from '@/lib/utils';

/**
 * Placeholder block for loading states. `animate-pulse` is motion-gated —
 * a pulsing page is exactly what prefers-reduced-motion asks us to stop.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn('rounded-md bg-muted motion-safe:animate-pulse', className)}
      {...props}
    />
  );
}
