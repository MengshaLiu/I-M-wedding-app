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
    }}>

      {/* ── Header ── */}
      <div style={{
        width: "100%", maxWidth: 720, margin: "0 auto",
        padding: "72px 24px 0",
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center",
        animation: "fadeInUp 1s ease-out",
      }}>
        <p style={{
          fontFamily: F.dancing, fontSize: "clamp(22px, 5vw, 30px)",
          color: C.sage, margin: "0 0 2px",
        }}>
          Explore Kota Kinabalu
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

      {/* ── Leaf divider ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        width: "100%", maxWidth: 300, padding: "40px 24px 44px",
        justifyContent: "center", margin: "0 auto",
      }}>
        <div style={{ flex: 1, height: 1, backgroundColor: C.line }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/wedding/watercolor-leaf.png" alt=""
          width={50} height={50}
          style={{ objectFit: "contain", opacity: 0.75, marginBottom: 14 }}
        />
        <div style={{ flex: 1, height: 1, backgroundColor: C.line }} />
      </div>

      {/* ── Accordion cards ── */}
      <div style={{ width: "100%", maxWidth: 720, margin: "0 auto", padding: "0 20px" }}>
        <TravelAccordion sections={sections} />
      </div>

      {/* ── Footer ── */}
      <div style={{
        width: "100%", maxWidth: 720, margin: "0 auto",
        padding: "64px 24px 24px",
        display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/wedding/watercolor-leaf.png" alt=""
          width={50} height={50}
          style={{ objectFit: "contain", opacity: 0.75, marginBottom: 14 }}
        />
        <p style={{
          fontFamily: F.greatVibes, fontSize: "clamp(34px, 8vw, 44px)",
          color: "oklch(0.42 0.08 150)", margin: 0,
        }}>
          See you in Sabah
        </p>
      </div>

    </div>
  );
}
