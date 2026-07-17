"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const C = {
  deep: "oklch(36% .072 152)",
  sage: "oklch(55% .09 150)",
  muted: "oklch(0.5 0.04 150)",
  line: "oklch(0.82 0.03 140)",
  bg: "#f8f5e8",
  err: "#c0392b",
} as const;

const F = {
  cormorant: "var(--font-cormorant), 'Cormorant Garamond', serif",
  greatVibes: "var(--font-great-vibes), 'Great Vibes', cursive",
  mulish: "var(--font-mulish), 'Mulish', sans-serif",
} as const;

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError("Incorrect password. Please try again.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      backgroundColor: C.bg, fontFamily: F.mulish,
      padding: "24px 20px",
    }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <p style={{
          fontFamily: F.greatVibes,
          fontSize: "clamp(42px, 12vw, 60px)",
          color: C.deep, margin: "0 0 6px", lineHeight: 1.1,
        }}>
          Ivan &amp; Mengsha
        </p>
        <p style={{
          fontFamily: F.mulish, fontSize: 11, fontWeight: 600,
          letterSpacing: "0.3em", textTransform: "uppercase",
          color: C.muted, margin: 0,
        }}>
          12 September 2026 · Kota Kinabalu
        </p>
      </div>

      <div style={{
        width: "100%", maxWidth: 360,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: "36px 32px",
        boxShadow: "0 4px 32px oklch(0.36 0.07 152 / 0.08), 0 1px 6px oklch(0.36 0.07 152 / 0.06)",
      }}>
        <p style={{
          fontFamily: F.cormorant, fontSize: 22, fontWeight: 500,
          color: C.deep, textAlign: "center", margin: "0 0 8px",
        }}>
          You&apos;re invited
        </p>
        <p style={{
          fontFamily: F.mulish, fontSize: 13, color: C.muted,
          textAlign: "center", margin: "0 0 28px", lineHeight: 1.6,
        }}>
          Enter the password from your invitation to access the site.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{
              display: "block", fontSize: 10, fontWeight: 700,
              letterSpacing: "0.2em", textTransform: "uppercase",
              color: C.deep, marginBottom: 8,
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoFocus
              autoComplete="current-password"
              placeholder="Enter password"
              style={{
                width: "100%", padding: "11px 14px",
                border: `1px solid ${C.line}`,
                borderRadius: 8, fontSize: 14,
                color: C.deep, outline: "none",
                boxSizing: "border-box",
                fontFamily: F.mulish,
                backgroundColor: C.bg,
              }}
            />
          </div>

          {error && (
            <p style={{ color: C.err, fontSize: 13, margin: 0, textAlign: "center" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              padding: "12px",
              backgroundColor: C.deep,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 11, fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              fontFamily: F.mulish,
            }}
          >
            {loading ? "Entering…" : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
