'use client';

import { useEffect, useRef } from 'react';

// The TopBar "Create" menu is global, but each create dialog lives on the page
// that owns it (a project dialog needs the org member list; a recurring-task
// dialog needs delegate options). This carries the intent across that gap
// without lifting either dialog's data requirements into the app shell.

export type CreateIntent = 'project' | 'recurring';

const EVENT = 'flowdesk:create-intent';
const STORAGE_KEY = 'flowdesk:create-intent';

/**
 * Ask the page owning `intent`'s dialog to open it. When that page is already
 * mounted this is a synchronous event; otherwise the intent is parked and
 * consumed by the dialog when it mounts after navigation.
 */
export function requestCreate(intent: CreateIntent, alreadyOnPage: boolean): void {
  if (alreadyOnPage) {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: intent }));
    return;
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, intent);
  } catch {
    // Private browsing / storage disabled — navigation still happens, the
    // user just has to click the page's own create button.
  }
}

/** Opens a dialog when a matching intent arrives, live or parked. */
export function useCreateIntent(intent: CreateIntent, open: () => void): void {
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === intent) {
        sessionStorage.removeItem(STORAGE_KEY);
        openRef.current();
      }
    } catch {
      // ignore — see requestCreate
    }

    const handler = (event: Event) => {
      if ((event as CustomEvent<CreateIntent>).detail === intent) openRef.current();
    };
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, [intent]);
}
