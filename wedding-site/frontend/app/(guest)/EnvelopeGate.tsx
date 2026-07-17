"use client";

import { useEffect, useState } from "react";

const SEEN_KEY = "envelope-intro-seen";

export default function EnvelopeGate({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [opened, setOpened] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (sessionStorage.getItem(SEEN_KEY)) {
      setShowContent(true);
    }
  }, []);

  // Keep the html class in sync with the overlay state
  // (the inline script in layout.tsx adds it on first load; this handles dismiss)
  useEffect(() => {
    if (!mounted) return;
    if (!showContent) {
      document.documentElement.classList.add("envelope-active");
    } else {
      document.documentElement.classList.remove("envelope-active");
    }
    return () => { document.documentElement.classList.remove("envelope-active"); };
  }, [mounted, showContent]);

  function dismiss() {
    setDismissing(true);
    sessionStorage.setItem(SEEN_KEY, "1");
    setTimeout(() => setShowContent(true), 900);
  }

  // After the flap opens, auto-dismiss to load the home page
  useEffect(() => {
    if (!opened) return;
    const t = setTimeout(dismiss, 300);
    return () => clearTimeout(t);
  }, [opened]);

  if (!mounted) return null;
  if (showContent) return <>{children}</>;

  return (
    <>
      <style>{`
        @keyframes envFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-14px); }
        }
        @keyframes gateFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes namesSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sealGlow {
          0%, 100% { box-shadow: 0 6px 20px rgba(0,0,0,0.32); }
          55%       { box-shadow: 0 6px 20px rgba(0,0,0,0.32), 0 0 0 10px rgba(255,255,255,0.10), 0 0 0 20px rgba(255,255,255,0.04); }
        }
      `}</style>

      {/* ── Full-screen overlay ── */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 100,
        backgroundColor: "#f8f5e8",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "0 24px",
        opacity: dismissing ? 0 : 1,
        pointerEvents: dismissing ? "none" : "auto",
        transition: "opacity 0.9s ease",
        animation: "gateFadeIn 0.5s ease both",
      }}>

        {/* ── Names (pre-open header) ── */}
        <div style={{
          textAlign: "center",
          opacity: opened ? 0 : 1,
          transform: opened ? "translateY(-10px)" : "translateY(0)",
          transition: "opacity 0.35s ease, transform 0.35s ease",
          marginBottom: 20,
          animation: "namesSlideIn 0.9s ease 0.25s both",
          pointerEvents: "none",
        }}>
          <p style={{
            fontFamily: "var(--font-mulish), Mulish, sans-serif",
            fontSize: 10, fontWeight: 600,
            letterSpacing: "0.45em", textTransform: "uppercase",
            color: "oklch(36% .072 152)",
            margin: "0 0 20px",
          }}>
            Guess what? We&apos;re officially doing it!
          </p>
          <h1 style={{
            fontFamily: "var(--font-great-vibes), 'Great Vibes', cursive",
            fontSize: "clamp(56px, 17vw, 80px)",
            fontWeight: 400,
            lineHeight: 1.08,
            margin: 0,
            letterSpacing: "-0.01em",
          }}>
            <span style={{ color: "oklch(36% .072 152)" }}>Ivan</span>{" "}
            <span style={{ color: "oklch(55% .09 150)" }}>&amp;</span>
            <br />
            <span style={{ color: "oklch(36% .072 152)" }}>Mengsha</span>
          </h1>
        </div>

        {/* ── Scene: envelope is the only flow element; card is absolute above it ── */}
        <div style={{
          position: "relative",
          width: "100%",
          maxWidth: 380,
        }}>

          {/* ── Envelope ── */}
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "1.62 / 1",
              filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.18)) drop-shadow(0 6px 16px rgba(60,80,50,0.18)) drop-shadow(0 24px 64px rgba(50,70,40,0.20))",
              animation: opened ? undefined : "envFloat 3.5s ease-in-out infinite",
              cursor: opened ? "default" : "pointer",
            }}
            onClick={opened ? undefined : () => setOpened(true)}
            role={opened ? undefined : "button"}
            aria-label={opened ? undefined : "Open your invitation"}
          >
            {/* Envelope body — paper base with directional lighting */}
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(145deg, #a2b494 0%, #97a583 42%, #8a9876 100%)",
              borderRadius: 7,
              overflow: "hidden",
            }}>
              {/* Four folded-flap triangles with realistic shading */}
              {/* Top triangle — catches the most light */}
              <div style={{ position: "absolute", inset: 0, clipPath: "polygon(0 0, 100% 0, 50% 52%)", background: "rgba(255,255,255,0.13)" }} />
              {/* Bottom triangle — in shadow */}
              <div style={{ position: "absolute", inset: 0, clipPath: "polygon(0 100%, 100% 100%, 50% 52%)", background: "rgba(0,0,0,0.11)" }} />
              {/* Left triangle — slight shadow */}
              <div style={{ position: "absolute", inset: 0, clipPath: "polygon(0 0, 0 100%, 50% 52%)", background: "rgba(0,0,0,0.07)" }} />
              {/* Right triangle — secondary light */}
              <div style={{ position: "absolute", inset: 0, clipPath: "polygon(100% 0, 100% 100%, 50% 52%)", background: "rgba(0,0,0,0.04)" }} />

              {/* SVG diagonal crease lines from each corner to the fold centre */}
              <svg
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <line x1="0"   y1="0"   x2="50" y2="52" stroke="rgba(0,0,0,0.20)" strokeWidth="0.45"/>
                <line x1="100" y1="0"   x2="50" y2="52" stroke="rgba(0,0,0,0.20)" strokeWidth="0.45"/>
                <line x1="0"   y1="100" x2="50" y2="52" stroke="rgba(0,0,0,0.16)" strokeWidth="0.45"/>
                <line x1="100" y1="100" x2="50" y2="52" stroke="rgba(0,0,0,0.16)" strokeWidth="0.45"/>
                {/* Tiny highlight alongside each crease (paper ridge effect) */}
                <line x1="0"   y1="0"   x2="50" y2="52" stroke="rgba(255,255,255,0.12)" strokeWidth="0.9" strokeDasharray="0" opacity="0.6"/>
                <line x1="100" y1="0"   x2="50" y2="52" stroke="rgba(255,255,255,0.12)" strokeWidth="0.9" strokeDasharray="0" opacity="0.6"/>
              </svg>

              {/* Perimeter edge — defines paper edge */}
              <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.07)" }} />
              {/* Corner-to-edge vignette for depth */}
              <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 40px rgba(0,0,0,0.14)" }} />
            </div>

            {/* Flap — slightly darker outside face, gradient toward fold line */}
            <div style={{
              position: "absolute",
              top: 0, left: 0, width: "100%", height: "100%",
              zIndex: 2,
              transformOrigin: "top center",
              transform: opened
                ? "perspective(800px) rotateX(-172deg)"
                : "perspective(800px) rotateX(0deg)",
              transition: "transform 0.65s cubic-bezier(0.4, 0, 0.2, 1)",
            }}>
              <div style={{
                width: "100%", height: "100%",
                clipPath: "polygon(0 0, 100% 0, 50% 52%)",
                background: "linear-gradient(170deg, #82917a 0%, #8f9e84 60%, #97a583 100%)",
                borderRadius: "7px 7px 0 0",
              }} />
              {/* Fold shadow at the crease (bottom edge of flap) */}
              <div style={{
                position: "absolute", inset: 0,
                clipPath: "polygon(0 0, 100% 0, 50% 52%)",
                background: "linear-gradient(to bottom, transparent 55%, rgba(0,0,0,0.18) 100%)",
                opacity: opened ? 0 : 1,
                transition: "opacity 0.3s ease",
              }} />
            </div>

            {/* Wax seal */}
            <div style={{
              position: "absolute",
              top: "50%", left: "50%",
              width: 84, height: 84,
              zIndex: 4,
              transform: `translate(-50%, -50%) scale(${opened ? 0.2 : 1})`,
              opacity: opened ? 0 : 1,
              transition: "opacity 0.3s ease 0.08s, transform 0.3s ease 0.08s",
              borderRadius: "50%",
              background: `radial-gradient(circle at 31% 28%,
                #fff3a0 0%, #f0d055 15%, #d4a020 32%, #c08a10 50%, #9a6c08 68%, #6a4806 85%, #3e2804 100%)`,
              boxShadow: "0 3px 8px rgba(0,0,0,0.25), 0 8px 24px rgba(0,0,0,0.30), inset 0 2px 4px rgba(255,255,255,0.35), inset 0 -2px 4px rgba(0,0,0,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: opened ? undefined : "sealGlow 3s ease-in-out infinite 2s",
            }}>
              <div style={{ position: "absolute", inset: 5, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.18)", boxShadow: "inset 0 0 4px rgba(0,0,0,0.2)" }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/wedding/logo.png" alt="I & M" style={{ width: "82%", height: "82%", objectFit: "contain", mixBlendMode: "screen", position: "relative" }} />
            </div>
          </div>
        </div>

        {/* ── Bottom prompt ── */}
        <p style={{
          fontFamily: "var(--font-mulish), Mulish, sans-serif",
          fontSize: 10, fontWeight: 600,
          letterSpacing: "0.42em", textTransform: "uppercase",
          color: "oklch(36% .072 152)",
          margin: "22px 0 0",
          opacity: opened ? 0 : 1,
          transition: "opacity 0.3s ease",
          animation: "namesSlideIn 1s ease 1.3s both",
        }}>
          Tap to reveal the awesomeness!
        </p>
      </div>
    </>
  );
}
