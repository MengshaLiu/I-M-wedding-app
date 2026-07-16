"use client";

import { useState, useCallback, useRef } from "react";

interface SeatResult {
  name: string;
  table_label: string;
}

const C = {
  deep: "#5c1810",
  red: "#b23a2b",
  muted: "#9a6a5a",
  line: "#e3cf9f",
  bg: "#faf2e0",
  btnBg: "#b23a2b",
  btnText: "#faf2e0",
} as const;

const F = {
  cormorant: "var(--font-cormorant), 'Cormorant Garamond', serif",
  mulish: "var(--font-mulish), 'Mulish', sans-serif",
  dancing: "var(--font-dancing), 'Dancing Script', cursive",
} as const;

const ZH = "'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif";

export default function SeatsPageReception() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SeatResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => search(...args), 300);
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
        <p style={{ fontFamily: F.dancing, fontSize: "clamp(20px, 5vw, 24px)", color: C.red, margin: "0 0 2px" }}>
          Where are you sitting?
        </p>
        <p style={{ fontFamily: ZH, fontSize: 13, color: C.muted, letterSpacing: "0.2em", margin: "0 0 10px" }}>
          您的座位在哪里？
        </p>
        <h1 style={{
          fontFamily: F.cormorant, fontSize: "clamp(32px, 8vw, 48px)", fontWeight: 400,
          color: C.deep, margin: "0 0 4px", textAlign: "center",
        }}>
          Find Your Seat
        </h1>
        <p style={{ fontFamily: ZH, fontSize: 18, color: C.deep, letterSpacing: "0.25em", margin: "0 0 12px" }}>
          婚宴座位查询
        </p>
        <p style={{
          fontFamily: F.mulish, fontSize: 13, color: C.muted,
          margin: "0 0 6px", textAlign: "center", letterSpacing: "0.01em",
        }}>
          Type your name to find your table assignment.
        </p>
        <p style={{ fontFamily: ZH, fontSize: 12, color: C.muted, margin: "0 0 36px", textAlign: "center" }}>
          请输入您的姓名以查询座位安排。
        </p>

        {/* ── Search form ── */}
        <form onSubmit={handleSubmit} style={{ width: "100%", display: "flex", gap: 10 }}>
          <input
            type="text"
            value={query}
            onChange={handleChange}
            placeholder="Your name · 您的姓名"
            autoFocus
            className="seats-input-reception"
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
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              fontFamily: F.mulish, fontSize: 11, fontWeight: 600,
              letterSpacing: "0.22em", textTransform: "uppercase",
              color: C.btnText, backgroundColor: C.btnBg,
              padding: "10px 20px", border: "none", cursor: "pointer",
              borderRadius: 12, whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            <span>Search</span>
            <span style={{ fontFamily: ZH, fontSize: 10, letterSpacing: "0.05em", textTransform: "none" }}>搜索</span>
          </button>
        </form>

        {/* ── Loading ── */}
        {loading && (
          <p style={{ fontFamily: F.mulish, fontSize: 13, color: C.muted, marginTop: 36 }}>
            Searching… <span style={{ fontFamily: ZH, fontSize: 12 }}>搜索中…</span>
          </p>
        )}

        {/* ── No results ── */}
        {!loading && searched && results !== null && results.length === 0 && (
          <div style={{
            width: "100%", marginTop: 28, border: `1px solid ${C.line}`,
            borderRadius: 16, padding: "28px 24px", textAlign: "center",
            backgroundColor: "rgba(255,255,255,0.65)",
          }}>
            <p style={{ fontFamily: F.cormorant, fontSize: 22, fontWeight: 400, color: C.deep, margin: "0 0 2px" }}>
              Name not found · <span style={{ fontFamily: ZH, fontSize: 18 }}>未找到姓名</span>
            </p>
            <p style={{ fontFamily: F.mulish, fontSize: 13, color: C.muted, margin: "0 0 6px", lineHeight: 1.6 }}>
              We couldn&apos;t find <strong>&ldquo;{query}&rdquo;</strong> in the guest list.
              Please refer to the seating board at the venue.
            </p>
            <p style={{ fontFamily: ZH, fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.8 }}>
              宾客名单中未找到该姓名，请参考现场座位指引牌。
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
                  {r.name}
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
                Multiple matches — select yours above.{" "}
                <span style={{ fontFamily: ZH, fontSize: 11 }}>有多个符合结果，请在上方选择您的姓名。</span>
              </p>
            )}
          </div>
        )}
      </div>

      <style>{`
        .seats-input-reception:focus { border-color: ${C.red} !important; box-shadow: 0 0 0 3px rgba(178,58,43,0.12); }
      `}</style>
    </div>
  );
}
