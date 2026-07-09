'use client';

import { useEffect } from 'react';
import { touchPresenceAction } from '@/app/(app)/presence-actions';

/** Fires once per app-shell mount — a lightweight approximation of presence
 * without a DB write on every request. Renders nothing. */
export function PresenceHeartbeat() {
  useEffect(() => {
    void touchPresenceAction();
  }, []);

  return null;
}
