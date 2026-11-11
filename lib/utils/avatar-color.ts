// Fixed, accessible palette so the same person always gets the same colored
// initials circle everywhere in the app (CLAUDE.md §5) — matches KarmaAxis's
// pattern, which is how staff scan lists fast.
//
// Every swatch is paired with AVATAR_FOREGROUND (not white) and clears WCAG AA
// 4.5:1 — measured ratios in the comments below. Indigo and violet are one
// shade lighter than the KarmaAxis reference for exactly this reason; the hues
// are unchanged so the scan-by-color habit still works.
const PALETTE = [
  '#F97066', // red     6.25:1
  '#F79009', // amber   7.42:1
  '#84CC16', // lime    8.81:1
  '#12B76A', // green   6.64:1
  '#15B8A6', // teal    6.99:1
  '#0EA5E9', // sky     6.28:1
  '#818CF8', // indigo  5.83:1
  '#C084FC', // violet  6.59:1
  '#EC4899', // pink    4.93:1
] as const;

/** Foreground for initials on any PALETTE swatch. White fails AA on all nine. */
export const AVATAR_FOREGROUND = '#1A1A1A';

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
