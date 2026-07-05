"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const C = {
  deep: "oklch(36% .072 152)",
  sage: "oklch(55% .09 150)",
  line: "oklch(0.82 0.03 140)",
  bg: "#f8f5e8",
  card: "#ffffff",
  err: "#c0392b",
} as const;

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        setError("Invalid username or password.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", backgroundColor: C.bg,
      fontFamily: "'Mulish', sans-serif",
    }}>
      <div style={{
        width: "100%", maxWidth: 380, padding: "0 20px",
      }}>
        <div style={{
          backgroundColor: C.card, borderRadius: 16,
          padding: "40px 36px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 30, fontWeight: 500,
            color: C.deep, margin: "0 0 6px", textAlign: "center",
          }}>
            I &amp; M
          </h1>
          <p style={{
            fontSize: 12, letterSpacing: "0.25em", textTransform: "uppercase",
            color: C.sage, textAlign: "center", margin: "0 0 32px",
          }}>
            Wedding Admin
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: C.deep, marginBottom: 6 }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
                style={{
                  width: "100%", padding: "10px 14px",
                  border: `1px solid ${C.line}`, borderRadius: 8,
                  fontSize: 14, color: C.deep, outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: C.deep, marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{
                  width: "100%", padding: "10px 14px",
                  border: `1px solid ${C.line}`, borderRadius: 8,
                  fontSize: 14, color: C.deep, outline: "none",
                  boxSizing: "border-box",
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
                marginTop: 8,
                padding: "12px",
                backgroundColor: C.deep,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
