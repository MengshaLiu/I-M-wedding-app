import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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

const SECTION_ICONS: Record<string, string> = {
  "Places to Visit": "🌿",
  "Places to Eat": "🍜",
  "Before You Enter Malaysia": "✈️",
};

export default async function TravelPage() {
  const sections = await getTravelData();
  if (!sections) redirect("/");

  return (
    <div style={{
      minHeight: "calc(100vh - 53px)", backgroundColor: C.bg,
      fontFamily: F.mulish, color: C.deep, overflowX: "hidden",
    }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "52px 20px 72px" }}>

        {/* ── Header ── */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p style={{ fontFamily: F.dancing, fontSize: "clamp(20px,5vw,24px)", color: C.sage, margin: "0 0 4px" }}>
            explore Kota Kinabalu
          </p>
          <h1 style={{
            fontFamily: F.cormorant, fontSize: "clamp(36px,8vw,56px)",
            fontWeight: 400, color: C.deep, margin: "0 0 16px",
          }}>
            Travel Guide
          </h1>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, maxWidth: 440, margin: "0 auto" }}>
            A little guide to help you make the most of your time in Sabah, Malaysia.
            We can&apos;t wait to show you this part of the world.
          </p>
          <div style={{ width: "100%", maxWidth: 260, margin: "32px auto 0",
            display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 1, backgroundColor: C.line }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/wedding/watercolor-leaf.png" alt="" width={36} height={36}
              style={{ objectFit: "contain", opacity: 0.8 }} />
            <div style={{ flex: 1, height: 1, backgroundColor: C.line }} />
          </div>
        </div>

        {/* ── Sections ── */}
        {sections.map((section, si) => (
          <div key={si} style={{ marginBottom: si < sections.length - 1 ? 56 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <span style={{ fontSize: 22 }}>{SECTION_ICONS[section.title] ?? "📍"}</span>
              <h2 style={{
                fontFamily: F.cormorant, fontSize: "clamp(24px,5vw,32px)",
                fontWeight: 400, color: C.deep, margin: 0,
              }}>
                {section.title}
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {section.items.map((item, ii) => (
                <div key={ii} style={{
                  backgroundColor: "rgba(255,255,255,0.65)",
                  border: `1px solid ${C.line}`,
                  borderRadius: 16, padding: "20px 22px",
                }}>
                  <h3 style={{
                    fontFamily: F.cormorant, fontSize: 22, fontWeight: 500,
                    color: C.deep, margin: "0 0 6px",
                  }}>
                    {item.name}
                  </h3>
                  <p style={{ fontSize: 13, color: C.muted, margin: "0 0 8px", lineHeight: 1.65 }}>
                    {item.description}
                  </p>
                  {item.tip && (
                    <p style={{
                      fontSize: 12, color: C.sage, margin: 0, lineHeight: 1.5,
                      borderLeft: `2px solid ${C.sage}`, paddingLeft: 10,
                    }}>
                      💡 {item.tip}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
