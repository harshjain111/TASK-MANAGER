'use client';

import { useEffect, useState, useTransition } from 'react';
import { getDigestOptOutAction, setDigestOptOutAction } from './notification-prefs-actions';

export function DigestToggle() {
  const [optOut, setOptOut] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [, startTransition] = useTransition();

  useEffect(() => {
    getDigestOptOutAction().then((value) => {
      setOptOut(value);
      setIsLoading(false);
    });
  }, []);

  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span className="text-foreground">
        Daily digest email
        <span className="block text-xs text-muted-foreground">
          &ldquo;You have N tasks and N karmas today, N overdue&rdquo; — sent each morning.
        </span>
      </span>
      <input
        type="checkbox"
        checked={!optOut}
        disabled={isLoading}
        onChange={(e) => {
          const nextOptOut = !e.target.checked;
          setOptOut(nextOptOut);
          startTransition(async () => {
            await setDigestOptOutAction(nextOptOut);
          });
        }}
      />
    </label>
  );
}
