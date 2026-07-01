import { cookies } from "next/headers";

const API_URL = process.env.API_URL ?? "http://localhost:8000";
const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? "wss";

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
  greatVibes: "var(--font-great-vibes), 'Great Vibes', cursive",
  mulish: "var(--font-mulish), 'Mulish', sans-serif",
  dancing: "var(--font-dancing), 'Dancing Script', cursive",
} as const;

async function getHomeData() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const res = await fetch(`${API_URL}/api/home`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

function LeafDivider({ py = 48 }: { py?: number }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      width: "100%", maxWidth: 320, padding: `${py}px 24px`,
      justifyContent: "center", margin: "0 auto",
    }}>
      <div style={{ flex: 1, height: 1, backgroundColor: C.line }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/wedding/watercolor-leaf.png" alt="" width={44} height={44}
        style={{ objectFit: "contain", opacity: 0.85 }} />
      <div style={{ flex: 1, height: 1, backgroundColor: C.line }} />
    </div>
  );
}

function FullGuestHome({ data }: { data: Record<string, unknown> }) {
  const timeline = (data.timeline as Array<{
    id: string; starts_at: string; title: string; description: string;
  }>) ?? [];

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", fontFamily: F.mulish, color: C.deep,
      overflowX: "hidden", position: "relative", backgroundColor: C.bg,
    }}>

      {/* ── Hero ── */}
      <div className="hero-section" style={{
        width: "100%", maxWidth: 720, padding: "60px 20px 0",
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center", animation: "fadeInUp 1s ease-out",
      }}>
        <h1 style={{
          fontFamily: F.greatVibes, fontSize: "clamp(48px, 13vw, 72px)",
          fontWeight: 400, margin: "0 0 10px", lineHeight: 1.1, marginTop: 20,
        }}>
          <span style={{ color: C.deep }}>Ivan</span>{" "}
          <span style={{ color: C.sage }}>&amp;</span>{" "}
          <span style={{ color: C.deep }}>Mengsha</span>
        </h1>
        <div style={{ width: "100%", marginTop: 4, animation: "fadeIn 1.2s ease-out 0.3s both" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/wedding/hero.jpg" alt="Ivan and Mengsha" className="hero-img" style={{
            width: "100%", height: 440, display: "block",
            borderRadius: 10, objectFit: "cover", objectPosition: "top",
            backgroundColor: "#f5f0e8",
          }} />
        </div>
        <p style={{
          fontFamily: F.dancing, fontSize: "clamp(22px, 6vw, 28px)", color: C.sage,
          margin: "8px 0 0",
        }}>
          We are getting married
        </p>
      </div>

      {/* ── Date ── */}
      <div style={{
        width: "100%", maxWidth: 720, padding: "40px 24px 0",
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center", animation: "fadeInUp 1s ease-out 0.5s both",
      }}>
        <p style={{
          fontFamily: F.mulish, fontSize: 12, fontWeight: 500,
          letterSpacing: "0.3em", textTransform: "uppercase",
          color: C.muted, margin: "0 0 6px",
        }}>
          Saturday
        </p>
        <div style={{
          display: "flex", alignItems: "center", gap: 16,
          width: "100%", maxWidth: 400, justifyContent: "center",
        }}>
          <div style={{ flex: 1, height: 1, backgroundColor: C.line, minWidth: 16 }} />
          <h2 style={{
            fontFamily: F.cormorant, fontSize: "clamp(28px, 8vw, 48px)",
            fontWeight: 400, color: C.deep, margin: 0,
          }}>
            {String(data.date || "September 12, 2026").replace(", 2026", "")}
          </h2>
          <div style={{ flex: 1, height: 1, backgroundColor: C.line, minWidth: 16 }} />
        </div>
        <p style={{
          fontFamily: F.mulish, fontSize: 13, fontWeight: 500,
          letterSpacing: "0.35em", textTransform: "uppercase",
          color: C.muted, margin: "4px 0 0",
        }}>
          2026
        </p>
      </div>

      <LeafDivider py={36} />

      {/* ── Venue card ── */}
      <div className="venue-wrap" style={{
        width: "100%", maxWidth: 720, padding: "0 20px",
        animation: "fadeInUp 1s ease-out 0.7s both", position: "relative",
      }}>
        <div className="venue-card" style={{
          position: "relative", borderRadius: 20, padding: "48px 40px",
          display: "flex", flexDirection: "column", alignItems: "center",
          textAlign: "center", overflow: "visible",
          backgroundImage: "url('/wedding/paper-texture.jpg')",
          backgroundSize: "cover", backgroundPosition: "center",
        }}>
          {/* Left sprig */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/wedding/watercolor-sprig-left.png" alt="" aria-hidden="true"
            className="sprig sprig-left" style={{
              position: "absolute", left: -8, top: 40,
              transform: "translateY(-50%) rotate(-15deg)",
              width: 110, height: "auto", opacity: 0.8, pointerEvents: "none",
            }} />
          {/* Right sprig */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/wedding/watercolor-sprig-right.png" alt="" aria-hidden="true"
            className="sprig sprig-right" style={{
              position: "absolute", right: -8, bottom: -60,
              transform: "scaleX(-1) rotate(-15deg)",
              width: 110, height: "auto", opacity: 0.8, pointerEvents: "none",
            }} />

          <p style={{ fontFamily: F.dancing, fontSize: 22, color: C.sage, margin: "0 0 4px" }}>
            The celebration
          </p>
          <h3 style={{
            fontFamily: F.cormorant, fontSize: "clamp(26px, 6vw, 36px)", fontWeight: 500,
            color: C.deep, margin: "0 0 12px",
          }}>
            {String(data.venue_name || "Shangri-La Tanjung Aru")}
          </h3>
          <p style={{
            fontFamily: F.mulish, fontSize: 14, color: C.muted,
            margin: 0, lineHeight: 1.7,
          }}>
            {String(data.venue_address || "Kota Kinabalu, Sabah, Malaysia")}
          </p>
          {!!data.venue_map_url && (
            <a
              href={String(data.venue_map_url)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block", marginTop: 24,
                fontFamily: F.mulish, fontSize: 12, fontWeight: 600,
                letterSpacing: "0.25em", textTransform: "uppercase",
                color: C.btnText, backgroundColor: C.btnBg,
                padding: "12px 32px", textDecoration: "none",
                borderRadius: 20,
              }}
            >
              View Map
            </a>
          )}
        </div>
      </div>

      {/* ── Dress code ── */}
      <div style={{
        width: "100%", maxWidth: 720, padding: "48px 24px 0",
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center", animation: "fadeInUp 1s ease-out 0.9s both",
      }}>
        <p style={{
          fontFamily: F.mulish, fontSize: 12, fontWeight: 500,
          letterSpacing: "0.3em", textTransform: "uppercase",
          color: C.muted, margin: "0 0 8px",
        }}>
          Dress Code
        </p>
        <h2 style={{
          fontFamily: F.cormorant, fontSize: "clamp(28px, 7vw, 42px)",
          fontWeight: 400, color: C.deep, margin: "0 0 12px",
        }}>
          {String(data.dress_code || "Garden Formal")}
        </h2>
        <p style={{
          fontFamily: F.mulish, fontSize: 14, color: C.muted,
          maxWidth: 380, lineHeight: 1.7, margin: 0,
        }}>
          Soft, elegant and earthy. Forest greens, light and warm neutrals are warmly encouraged.
        </p>
      </div>

      <LeafDivider py={44} />

      {/* ── Timeline ── */}
      <div style={{
        width: "100%", maxWidth: 720, padding: "0 20px 20px",
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center",
      }}>
        <h2 style={{
          fontFamily: F.cormorant, fontSize: "clamp(28px, 7vw, 42px)",
          fontWeight: 400, margin: "0 0 6px", color: C.deep,
        }}>
          The Day
        </h2>
        <p style={{ fontFamily: F.dancing, fontSize: "clamp(20px, 5vw, 24px)", color: C.sage, margin: "0 0 40px" }}>
          a little timeline
        </p>

        {/* Desktop: 3-col alternating  |  Mobile: left-rail single col */}
        <div className="tl-container" style={{ width: "100%", maxWidth: 560, position: "relative" }}>
          {/* Centre line (desktop) / left rail (mobile) — toggled via CSS */}
          <div className="tl-line" style={{
            position: "absolute", top: 0, bottom: 0,
            width: 1.5, backgroundColor: C.line,
          }} />

          {timeline.map((event, i) => {
            const isLeft = i % 2 === 0;
            const isLast = i === timeline.length - 1;
            const pb = isLast ? 0 : 44;

            const cardContent = (
              <>
                <p className="tl-time" style={{
                  fontFamily: F.mulish, fontSize: 11, fontWeight: 500,
                  letterSpacing: "0.25em", textTransform: "uppercase",
                  color: C.muted, margin: "0 0 4px",
                }}>
                  {event.starts_at}
                </p>
                <p style={{
                  fontFamily: F.cormorant, fontSize: 24, fontWeight: 500,
                  color: C.deep, margin: "0 0 4px",
                }}>
                  {event.title}
                </p>
                <p style={{
                  fontFamily: F.mulish, fontSize: 13, color: C.muted,
                  margin: 0, lineHeight: 1.6,
                }}>
                  {event.description}
                </p>
              </>
            );

            const dot = (
              <div className="tl-dot-wrap" style={{
                display: "flex", justifyContent: "center",
                alignItems: "flex-start", paddingTop: 2,
              }}>
                <div style={{
                  width: 13, height: 13, borderRadius: "50%",
                  border: `2px solid ${C.sage}`, backgroundColor: C.bg,
                  position: "relative", zIndex: 1,
                }} />
              </div>
            );

            return (
              <div key={event.id} className="tl-row" style={{
                display: "grid", gridTemplateColumns: "1fr 40px 1fr",
              }}>
                {/* Left cell: has card when isLeft=true */}
                <div
                  className={isLeft ? "tl-card tl-card-l" : "tl-empty"}
                  style={isLeft ? {
                    textAlign: "right",
                    padding: `0 16px ${pb}px 0`,
                  } : {}}
                >
                  {isLeft ? cardContent : null}
                </div>

                {dot}

                {/* Right cell: has card when isLeft=false */}
                <div
                  className={!isLeft ? "tl-card tl-card-r" : "tl-empty"}
                  style={!isLeft ? {
                    textAlign: "left",
                    padding: `0 0 ${pb}px 16px`,
                  } : {}}
                >
                  {!isLeft ? cardContent : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{
        width: "100%", maxWidth: 720, padding: "56px 24px 48px",
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/wedding/watercolor-leaf.png" alt="" width={44} height={44}
          style={{ objectFit: "contain", opacity: 0.85, marginBottom: 16 }} />
        <p style={{
          fontFamily: F.dancing, fontSize: "clamp(26px, 8vw, 36px)",
          color: C.sage, margin: "0 0 8px",
        }}>
          We can&apos;t wait to celebrate with you
        </p>
        <p style={{
          fontFamily: F.mulish, fontSize: 11, letterSpacing: "0.2em",
          color: "oklch(0.6 0.03 150)", margin: 0,
        }}>
          SEPTEMBER 12, 2026
        </p>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* ── Desktop: centre line sits in the middle ── */
        .tl-line { left: 50%; transform: translateX(-50%); }

        /* ── Mobile ── */
        @media (max-width: 600px) {
          /* Hero */
          .hero-section { padding-top: 32px !important; }
          .hero-img { height: 260px !important; }

          /* Venue card */
          .venue-wrap { padding: 0 16px !important; }
          .venue-card { padding: 36px 24px !important; }
          .sprig { width: 72px !important; }
          .sprig-left { left: -4px !important; top: 28px !important; }
          .sprig-right { right: -4px !important; bottom: -40px !important; }

          /* Timeline: switch to left-rail single column */
          /* dot is 13px wide centred in a 22px column → centre at 11px; line is 1.5px → left = 11 - 0.75 = 10.25px */
          .tl-line { left: 10px !important; transform: none !important; }

          .tl-row {
            grid-template-columns: 22px 1fr !important;
            grid-template-rows: auto !important;
          }

          /* Always place dot in column 1, card in column 2 */
          .tl-dot-wrap {
            grid-column: 1 !important;
            grid-row: 1 !important;
          }

          .tl-card {
            grid-column: 2 !important;
            grid-row: 1 !important;
            text-align: left !important;
            padding-left: 14px !important;
            padding-right: 0 !important;
          }

          /* Hide the empty placeholder cell */
          .tl-empty { display: none !important; }

          /* Left-side cards need bottom padding carried over */
          .tl-card-l { padding-bottom: inherit; }
        }
      `}</style>
    </div>
  );
}

function ReceptionGuestHome({ data }: { data: Record<string, unknown> }) {
  const timeline = (data.timeline as Array<{
    id: string; starts_at: string; title: string; description: string;
  }>) ?? [];

  return (
    <div className="space-y-10">
      <section className="text-center space-y-2 pt-4">
        <p className="text-sage text-sm tracking-widest uppercase">Welcome</p>
        <h1 className="text-4xl font-serif text-charcoal">I &amp; M</h1>
        <p className="text-gray-500 text-sm">We&apos;re so glad you could join us.</p>
      </section>

      <section className="bg-white rounded-2xl p-6 shadow-sm border border-blush space-y-3">
        <h2 className="font-serif text-lg text-charcoal">The Wedding</h2>
        <div className="text-sm text-gray-600 space-y-1.5">
          <p><span className="font-medium text-charcoal">Date</span> {String(data.date || "")}</p>
          <p><span className="font-medium text-charcoal">Venue</span> {String(data.venue_name || "")}</p>
          {!!data.venue_address && <p className="text-gray-500 text-xs">{String(data.venue_address)}</p>}
          {!!data.venue_map_url && (
            <a href={String(data.venue_map_url)} target="_blank" rel="noopener noreferrer"
              className="inline-block text-xs text-sage underline">
              Open in Maps →
            </a>
          )}
          <p><span className="font-medium text-charcoal">Dress Code</span> {String(data.dress_code || "")}</p>
        </div>
      </section>

      {timeline.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-serif text-lg text-charcoal">Programme</h2>
          <ol className="relative border-l border-blush ml-3 space-y-8">
            {timeline.map((e) => (
              <li key={e.id} className="ml-6">
                <span className="absolute -left-2 w-4 h-4 rounded-full bg-blush border-2 border-white mt-1" />
                <p className="text-xs font-mono text-gray-400 mb-0.5">{e.starts_at}</p>
                <h3 className="font-serif text-base font-semibold text-charcoal">{e.title}</h3>
                <p className="text-sm text-gray-600 mt-0.5">{e.description}</p>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

export default async function HomePage() {
  const data = await getHomeData();

  if (!data) {
    return (
      <p className="text-center text-gray-500 mt-20">
        Something went wrong. Please try again.
      </p>
    );
  }

  if (data.tier === "full") {
    return <FullGuestHome data={data} />;
  }

  return <ReceptionGuestHome data={data} />;
}
