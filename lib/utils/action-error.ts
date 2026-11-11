// CLAUDE.md §6: "never throw raw Supabase errors to the client; map to
// user-facing messages." Raw driver strings either leak schema detail
// ('duplicate key value violates unique constraint "projects_name_key"') or
// mean nothing to staff ('fetch failed'), so they stop here.

const GENERIC = 'Something went wrong. Please try again.';
const OFFLINE = 'Unable to reach the server. Please check your connection and try again.';

type LooseError = { message?: unknown; code?: unknown; status?: unknown } | null | undefined;

function read(error: unknown): { message: string; code: string } {
  const e = (error ?? {}) as NonNullable<LooseError>;
  return {
    message: typeof e.message === 'string' ? e.message : '',
    code: typeof e.code === 'string' ? e.code : '',
  };
}

/**
 * True when the failure is transport-level rather than a rejected request.
 * The Supabase JS client surfaces these as a *returned value*, not a throw,
 * so a try/catch around the call never sees them.
 */
function isNetworkFailure(message: string): boolean {
  return /fetch failed|failed to fetch|networkerror|network request failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|socket hang up|aborted/i.test(
    message,
  );
}

/** Maps a Postgres/PostgREST error to something a user can act on. */
export function toUserMessage(error: unknown, fallback: string = GENERIC): string {
  const { message, code } = read(error);
  if (!message && !code) return fallback;

  // Keep the real cause where developers can see it; only the mapped string ships.
  console.error('[action]', code || 'no-code', message);

  if (isNetworkFailure(message)) return OFFLINE;

  switch (code) {
    case '23505':
      return 'That already exists. Try a different name.';
    case '23503':
      return 'That record no longer exists. Refresh and try again.';
    case '23502':
    case '23514':
      return 'Some details are missing or invalid. Check the form and try again.';
    case '22001':
      return 'That value is too long.';
    case '42501':
      return "You don't have permission to do that.";
    case 'PGRST116':
      return 'Not found — it may have been archived or moved.';
    case 'PGRST301':
      return 'Your session has expired. Please sign in again.';
    default:
      return fallback;
  }
}

// Supabase Auth returns a handful of messages that are already written for end
// users. Those pass through verbatim; everything else is mapped.
const SAFE_AUTH_MESSAGES: Record<string, string> = {
  'invalid login credentials': 'Incorrect email or password.',
  'email not confirmed': 'Please confirm your email address first, then sign in.',
  'user already registered': 'An account with that email already exists.',
  'email rate limit exceeded': 'Too many attempts. Please wait a few minutes and try again.',
  'over_email_send_rate_limit': 'Too many attempts. Please wait a few minutes and try again.',
  'password should be at least 6 characters': 'Password must be at least 6 characters.',
  'signups not allowed for this instance': 'New sign-ups are currently disabled.',
};

/** Same contract as `toUserMessage`, with the known-good auth strings allow-listed. */
export function toAuthMessage(error: unknown, fallback: string = GENERIC): string {
  const { message, code } = read(error);
  if (!message && !code) return fallback;

  console.error('[auth]', code || 'no-code', message);

  if (isNetworkFailure(message)) return OFFLINE;

  const safe = SAFE_AUTH_MESSAGES[message.trim().toLowerCase()] ?? SAFE_AUTH_MESSAGES[code];
  if (safe) return safe;

  return toUserMessage(error, fallback);
}
