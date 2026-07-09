'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { globalSearchAction, type SearchResults } from '@/app/(app)/search-actions';

const EMPTY: SearchResults = { tasks: [], karmas: [], projects: [], people: [] };

export function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults(EMPTY);
      return;
    }
    debounceRef.current = setTimeout(() => {
      globalSearchAction(query).then(setResults);
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const hasResults =
    results.tasks.length + results.karmas.length + results.projects.length + results.people.length > 0;

  const go = (href: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(href);
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        placeholder="Search tasks, karmas, people…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        className="h-9 w-full rounded-lg border border-border bg-muted/40 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />

      {isOpen && query.trim().length >= 2 && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-md">
          {!hasResults ? (
            <p className="p-3 text-sm text-muted-foreground">No results.</p>
          ) : (
            <div className="max-h-80 overflow-auto p-1">
              {results.projects.length > 0 && (
                <div className="mb-1">
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase text-muted-foreground">
                    Projects
                  </p>
                  {results.projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => go(`/projects/${p.id}/board`)}
                      className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
              {results.tasks.length > 0 && (
                <div className="mb-1">
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase text-muted-foreground">Tasks</p>
                  {results.tasks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => go(`/projects/${t.projectId}/board`)}
                      className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                    >
                      {t.title}
                    </button>
                  ))}
                </div>
              )}
              {results.karmas.length > 0 && (
                <div className="mb-1">
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase text-muted-foreground">Karmas</p>
                  {results.karmas.map((k) => (
                    <button
                      key={k.id}
                      onClick={() => go('/karmas')}
                      className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                    >
                      {k.title}
                    </button>
                  ))}
                </div>
              )}
              {results.people.length > 0 && (
                <div>
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase text-muted-foreground">People</p>
                  {results.people.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => go('/team')}
                      className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
