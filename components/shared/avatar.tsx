import { avatarColor, initials } from '@/lib/utils/avatar-color';
import { cn } from '@/lib/utils';

const SIZES = {
  sm: 'size-6 text-[10px]',
  md: 'size-8 text-xs',
  lg: 'size-10 text-sm',
} as const;

export function Avatar({
  name,
  seed,
  size = 'md',
  className,
}: {
  name: string;
  /** Stable id to hash for color — falls back to `name` if omitted. */
  seed?: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        SIZES[size],
        className,
      )}
      style={{ backgroundColor: avatarColor(seed ?? name) }}
      title={name}
    >
      {initials(name)}
    </div>
  );
}
