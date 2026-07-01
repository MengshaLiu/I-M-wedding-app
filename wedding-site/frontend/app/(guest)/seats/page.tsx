"use client";

import { useState, useCallback } from "react";

interface SeatResult {
  display_name: string;
  table_label: string;
}

function useDebounce<T extends unknown[]>(fn: (...args: T) => void, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: T) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export default function SeatsPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SeatResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/seats?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setResults(data.results ?? []);
      setSearched(true);
    } catch {
      setResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedSearch = useCallback(
    (...args: [string]) => {
      let timer: ReturnType<typeof setTimeout>;
      clearTimeout(timer);
      timer = setTimeout(() => search(...args), 300);
    },
    [search]
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    debouncedSearch(val);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    search(query);
  }

  return (
    <div className="space-y-8">
      <section className="text-center space-y-1 pt-4">
        <h1 className="text-3xl font-serif text-charcoal">Find Your Seat</h1>
        <p className="text-sm text-gray-500">Type your name to find your table assignment.</p>
      </section>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Your name…"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blush bg-white"
          autoFocus
        />
        <button
          type="submit"
          className="px-5 py-3 bg-sage text-white text-sm rounded-xl hover:opacity-90 transition"
        >
          Search
        </button>
      </form>

      {loading && (
        <p className="text-center text-sm text-gray-400">Searching…</p>
      )}

      {!loading && searched && results !== null && results.length === 0 && (
        <div className="text-center bg-white rounded-2xl p-6 border border-blush space-y-2">
          <p className="text-sm text-gray-600">
            We couldn&apos;t find <strong>&ldquo;{query}&rdquo;</strong> in the guest list.
          </p>
          <p className="text-xs text-gray-400">
            Please refer to the physical seating board at the venue, or contact us for help.
          </p>
        </div>
      )}

      {!loading && results && results.length > 0 && (
        <ul className="space-y-3">
          {results.map((r, i) => (
            <li
              key={i}
              className="bg-white rounded-2xl border border-blush p-5 flex items-center justify-between shadow-sm"
            >
              <div>
                <p className="font-medium text-charcoal">{r.display_name}</p>
              </div>
              <div className="text-right">
                <span className="inline-block bg-blush text-charcoal text-xs font-medium px-3 py-1 rounded-full">
                  {r.table_label}
                </span>
              </div>
            </li>
          ))}
          {results.length > 1 && (
            <p className="text-xs text-center text-gray-400">
              Multiple matches found — select yours above.
            </p>
          )}
        </ul>
      )}
    </div>
  );
}
