'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex h-screen flex-col items-center justify-center gap-3 bg-white p-6 text-center text-neutral-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
            F
          </div>
          <h1 className="text-lg font-semibold">Flowdesk hit a snag</h1>
          <p className="max-w-sm text-sm text-neutral-500">
            Something went wrong loading the app. Please try again.
          </p>
          <button
            onClick={reset}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
