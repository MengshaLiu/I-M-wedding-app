"use client";

import { useState, useCallback } from "react";

interface SeatResult {
  display_name: string;
  table_label: string;
}

const C = {
  deep: "oklch(36% .072 152)",
  sage: "oklch(55% .09 150)",
  muted: "oklch(0.5 0.04 150)",
  line: "oklch(0.82 0.03 140)",
  bg: "#f8f5e8",
  btnBg: "#59745B",
  btnText: "oklch(0.985 0.012 110)",
} as const;

const F = {
  cormorant: "var(--font-cormorant), 'Cormorant Garamond', serif",
  mulish: "var(--font-mulish), 'Mulish', sans-serif",
  dancing: "var(--font-dancing), 'Dancing Script', cursive",
} as const;

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
    <div style={{
      minHeight: "calc(100vh - 53px)", display: "flex", flexDirection: "column",
      alignItems: "center", fontFamily: F.mulish, color: C.deep,
      backgroundColor: C.bg, overflowX: "hidden",
    }}>
      <div style={{
        width: "100%", maxWidth: 520, padding: "56px 20px 64px",
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>

        {/* ── Header ── */}
        <p style={{ fontFamily: F.dancing, fontSize: "clamp(20px, 5vw, 24px)", color: C.sage, margin: "0 0 6px" }}>
          where are you sitting?
        </p>
        <h1 style={{
          fontFamily: F.cormorant, fontSize: "clamp(32px, 8vw, 48px)", fontWeight: 400,
          color: C.deep, margin: "0 0 10px", textAlign: "center",
        }}>
          Find Your Seat
        </h1>
        <p style={{
          fontFamily: F.mulish, fontSize: 13, color: C.muted,
          margin: "0 0 40px", textAlign: "center", letterSpacing: "0.01em",
        }}>
          Type your name to find your table assignment.
        </p>

        {/* ── Search form ── */}
        <form onSubmit={handleSubmit} style={{ width: "100%", display: "flex", gap: 10 }}>
          <input
            type="text"
            value={query}
            onChange={handleChange}
            placeholder="Your name…"
            autoFocus
            className="seats-input"
            style={{
              flex: 1, border: `1px solid ${C.line}`, borderRadius: 12,
              padding: "13px 16px", fontSize: 14, fontFamily: F.mulish,
              color: C.deep, backgroundColor: "rgba(255,255,255,0.8)",
              outline: "none", minWidth: 0,
            }}
          />
          <button
            type="submit"
            style={{
              fontFamily: F.mulish, fontSize: 11, fontWeight: 600,
              letterSpacing: "0.22em", textTransform: "uppercase",
              color: C.btnText, backgroundColor: C.btnBg,
              padding: "13px 20px", border: "none", cursor: "pointer",
              borderRadius: 12, whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            Search
          </button>
        </form>

        {/* ── Loading ── */}
        {loading && (
          <p style={{ fontFamily: F.mulish, fontSize: 13, color: C.muted, marginTop: 36 }}>
            Searching…
          </p>
        )}

        {/* ── No results ── */}
        {!loading && searched && results !== null && results.length === 0 && (
          <div style={{
            width: "100%", marginTop: 28, border: `1px solid ${C.line}`,
            borderRadius: 16, padding: "28px 24px", textAlign: "center",
            backgroundColor: "rgba(255,255,255,0.65)",
          }}>
            <p style={{ fontFamily: F.cormorant, fontSize: 22, fontWeight: 400, color: C.deep, margin: "0 0 8px" }}>
              Name not found
            </p>
            <p style={{ fontFamily: F.mulish, fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.6 }}>
              We couldn&apos;t find <strong>&ldquo;{query}&rdquo;</strong> in the guest list.
              Please refer to the seating board at the venue.
            </p>
          </div>
        )}

        {/* ── Results ── */}
        {!loading && results && results.length > 0 && (
          <div style={{ width: "100%", marginTop: 28, display: "flex", flexDirection: "column", gap: 10 }}>
            {results.map((r, i) => (
              <div key={i} style={{
                border: `1px solid ${C.line}`, borderRadius: 16,
                padding: "18px 22px", display: "flex", alignItems: "center",
                justifyContent: "space-between", gap: 12,
                backgroundColor: "rgba(255,255,255,0.65)",
              }}>
                <p style={{
                  fontFamily: F.cormorant, fontSize: 24, fontWeight: 500,
                  color: C.deep, margin: 0,
                }}>
                  {r.display_name}
                </p>
                <span style={{
                  fontFamily: F.mulish, fontSize: 10, fontWeight: 600,
                  letterSpacing: "0.18em", textTransform: "uppercase",
                  color: C.btnText, backgroundColor: C.btnBg,
                  padding: "6px 14px", borderRadius: 20, whiteSpace: "nowrap",
                }}>
                  {r.table_label}
                </span>
              </div>
            ))}
            {results.length > 1 && (
              <p style={{
                fontFamily: F.mulish, fontSize: 11, color: C.muted,
                textAlign: "center", margin: "4px 0 0",
              }}>
                Multiple matches — select yours above.
              </p>
            )}
          </div>
        )}
      </div>

      <style>{`
        .seats-input:focus { border-color: ${C.sage} !important; box-shadow: 0 0 0 3px oklch(55% .09 150 / 0.12); }
      `}</style>
    </div>
  );
}
