// Fixed, accessible palette so the same person always gets the same colored
// initials circle everywhere in the app (CLAUDE.md §5) — matches KarmaAxis's
// pattern, which is how staff scan lists fast.
const PALETTE = [
  '#F97066', // red
  '#F79009', // amber
  '#84CC16', // lime
  '#12B76A', // green
  '#15B8A6', // teal
  '#0EA5E9', // sky
  '#6366F1', // indigo
  '#A855F7', // violet
  '#EC4899', // pink
] as const;

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Deterministic hex color for a given user id/name — same input, same color, always. */
export function avatarColor(seed: string): string {
  return PALETTE[hashString(seed) % PALETTE.length];
}

/** "Priya Sharma" -> "PS", "cafe" -> "C" */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}
