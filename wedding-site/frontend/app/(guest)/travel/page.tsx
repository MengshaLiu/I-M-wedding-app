import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TravelAccordion } from "./TravelAccordion";

const API_URL = process.env.API_URL ?? "http://localhost:8000";
const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? "wss";

const C = {
  deep: "oklch(36% .072 152)",
  sage: "oklch(55% .09 150)",
  muted: "oklch(0.5 0.04 150)",
  line: "oklch(0.82 0.03 140)",
  bg: "#f8f5e8",
} as const;

const F = {
  cormorant: "var(--font-cormorant), 'Cormorant Garamond', serif",
  greatVibes: "var(--font-great-vibes), 'Great Vibes', cursive",
  mulish: "var(--font-mulish), 'Mulish', sans-serif",
  dancing: "var(--font-dancing), 'Dancing Script', cursive",
} as const;

interface TravelItem { name: string; description: string; tip?: string | null; }
interface TravelSection { title: string; items: TravelItem[]; }

async function getTravelData(): Promise<TravelSection[] | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const res = await fetch(`${API_URL}/api/travel`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 403) return null;
  if (!res.ok) return null;
  const data = await res.json();
  return data.sections ?? [];
}

export default async function TravelPage() {
  const sections = await getTravelData();
  if (!sections) redirect("/");

  return (
    <div style={{
      minHeight: "calc(100vh - 53px)", backgroundColor: C.bg,
      fontFamily: F.mulish, color: C.deep,
      overflowX: "hidden", paddingBottom: 40,
      position: "relative",
    }}>

      {/* ── Header ── */}
      <div style={{
        width: "100%", maxWidth: 720, margin: "0 auto",
        padding: "72px 24px 0",
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center",
        animation: "fadeInUp 1s ease-out",
        position: "relative", zIndex: 1,
      }}>
        <p style={{
          fontFamily: F.dancing, fontSize: "clamp(22px, 5vw, 30px)",
          color: C.sage, margin: "0 0 2px",
        }}>
          Welcome to Sabah
        </p>
        <h1 style={{
          fontFamily: F.cormorant, fontSize: "clamp(48px, 10vw, 68px)",
          fontWeight: 600, color: C.deep, margin: 0, lineHeight: 1.05,
        }}>
          Travel Guide
        </h1>
        <p style={{
          fontFamily: F.mulish, fontSize: 16, color: C.muted,
          maxWidth: 460, lineHeight: 1.7, margin: "24px 0 0",
        }}>
          A little guide to help you make the most of your time in Sabah, Malaysia.{" "}
          We can&apos;t wait to show you this part of the world.
        </p>
      </div>

      {/* ── Moodboard ── */}
      <div className="moodboard-wrap" style={{
        width: "100%", maxWidth: 720, margin: "44px auto 0",
        padding: "0 24px",
        position: "relative", zIndex: 1,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/wedding/sabah-moodboard.jpg"
          alt="Explore Sabah — a moodboard of Kota Kinabalu highlights"
          className="moodboard-img"
          style={{
            width: "100%", height: "auto", display: "block",
            borderRadius: 18,
            boxShadow: "0 4px 32px oklch(0.36 0.07 152 / 0.12), 0 1px 6px oklch(0.36 0.07 152 / 0.08)",
            filter: "sepia(0.08) saturate(0.95) brightness(1.01)",
          }}
        />
      </div>

      {/* ── Accordion ── */}
      <div style={{
        width: "100%", maxWidth: 720, margin: "52px auto 0",
        padding: "0 24px",
        position: "relative", zIndex: 1,
      }}>
        <TravelAccordion sections={sections} />
      </div>

      {/* ── Footer ── */}
      <div style={{
        width: "100%", maxWidth: 720, margin: "0 auto",
        padding: "64px 24px 24px",
        display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
        position: "relative", zIndex: 1,
      }}>
        <p style={{
          fontFamily: F.greatVibes, fontSize: "clamp(34px, 8vw, 44px)",
          color: "oklch(0.42 0.08 150)", margin: 0,
        }}>
          See you in Sabah
        </p>
      </div>

      {/* ── Watercolor floral — desktop: absolute left; mobile: centered below footer ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/wedding/watercolor-floral-left.png"
        alt=""
        className="floral-left"
        style={{ pointerEvents: "none" }}
      />

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .floral-left {
          position: absolute;
          left: -40px;
          top: 52%;
          width: clamp(220px, 28vw, 340px);
          opacity: 0.92;
          z-index: 0;
        }
        @media (max-width: 700px) {
          .floral-left {
            position: static;
            display: block;
            width: 72%;
            max-width: 280px;
            margin: 24px auto 0;
            opacity: 0.85;
          }
        }
      `}</style>

    </div>
  );
}
