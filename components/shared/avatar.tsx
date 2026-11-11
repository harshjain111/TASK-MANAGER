import { avatarColor, initials, AVATAR_FOREGROUND } from '@/lib/utils/avatar-color';
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
    // role="img" + aria-label, not title: the visible content is initials only,
    // so without this a screen reader announces "PS" instead of the person.
    <div
      role="img"
      aria-label={name}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-semibold',
        SIZES[size],
        className,
      )}
      style={{ backgroundColor: avatarColor(seed ?? name), color: AVATAR_FOREGROUND }}
      title={name}
    >
      <span aria-hidden="true">{initials(name)}</span>
    </div>
  );
}
