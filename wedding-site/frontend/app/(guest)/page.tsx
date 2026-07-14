import { cookies } from "next/headers";
import EnvelopeGate from "./EnvelopeGate";

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
      <img src="/wedding/watercolor-leaf.png" alt="" width={80} height={80}
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
    <EnvelopeGate>
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
            objectFit: "cover", objectPosition: "top",
            backgroundColor: "#f5f0e8",
            filter: "sepia(0.18) saturate(0.88) brightness(1.03)",
            WebkitMaskImage: [
              "linear-gradient(to right,  transparent 0%, #000 10%, #000 90%, transparent 100%)",
              "linear-gradient(to bottom, transparent 0%, #000 22%, #000 88%, transparent 100%)",
            ].join(", "),
            WebkitMaskComposite: "source-in",
            maskImage: [
              "linear-gradient(to right,  transparent 0%, #000 10%, #000 90%, transparent 100%)",
              "linear-gradient(to bottom, transparent 0%, #000 22%, #000 88%, transparent 100%)",
            ].join(", "),
            maskComposite: "intersect",
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
              mixBlendMode: "multiply",
            }} />
          {/* Right sprig */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/wedding/watercolor-sprig-right.png" alt="" aria-hidden="true"
            className="sprig sprig-right" style={{
              position: "absolute", right: -8, bottom: -60,
              transform: "scaleX(-1) rotate(-15deg)",
              width: 110, height: "auto", opacity: 0.8, pointerEvents: "none",
              mixBlendMode: "multiply",
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
        <img src="/wedding/watercolor-leaf.png" alt="" width={80} height={80}
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
    </EnvelopeGate>
  );
}

const RC = {
  red: "#b23a2b",
  gold: "#c49a3c",
  warmGold: "#b08a54",
  pink: "#c07d6c",
  brown: "#7c6a5b",
  bg: "#faf2e0",
  border: "#e3cf9f",
  cardBg: "rgba(255, 251, 240, 0.5)",
  btnText: "#faf2e0",
} as const;

const RF = {
  cormorant: "var(--font-cormorant), 'Cormorant Garamond', serif",
  greatVibes: "var(--font-great-vibes), 'Great Vibes', cursive",
  mulish: "var(--font-mulish), 'Mulish', sans-serif",
  dancing: "var(--font-dancing), 'Dancing Script', cursive",
  maShanZheng: "var(--font-ma-shan-zheng), 'Ma Shan Zheng', cursive",
} as const;

function DoubleHappinessDivider() {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 20,
      width: "100%", maxWidth: 300, padding: "42px 24px",
      margin: "0 auto",
    }}>
      <div style={{ flex: 1, height: 1, backgroundColor: RC.border }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/wedding/double-happiness.png" alt="Double happiness 囍" width={42} height={42}
        style={{ objectFit: "contain" }} />
      <div style={{ flex: 1, height: 1, backgroundColor: RC.border }} />
    </div>
  );
}

function ReceptionGuestHome({ data }: { data: Record<string, unknown> }) {
  const timeline = (data.timeline as Array<{
    id: string; starts_at: string; title: string; description: string;
  }>) ?? [];

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", fontFamily: RF.mulish, color: RC.brown,
      overflowX: "hidden", position: "relative", backgroundColor: RC.bg,
      paddingBottom: 20,
    }}>

      {/* ── Hero ── */}
      <div className="rc-hero-section" style={{
        width: "100%", maxWidth: 720, padding: "60px 24px 0",
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center", animation: "fadeInUp 1s ease-out",
      }}>
        <h1 style={{
          fontFamily: RF.greatVibes,
          fontSize: "clamp(52px, 13vw, 76px)",
          fontWeight: 400, margin: "0 0 4px", lineHeight: 1.08,
        }}>
          <span style={{ color: RC.red }}>Ivan</span>{" "}
          <span style={{ color: RC.gold }}>&amp;</span>{" "}
          <span style={{ color: RC.red }}>Mengsha</span>
        </h1>
        <p style={{
          fontFamily: RF.maShanZheng,
          fontSize: "clamp(36px, 10vw, 56px)",
          margin: "0 0 8px", lineHeight: 1.15, letterSpacing: "0.05em",
        }}>
          <span style={{ color: RC.red }}>蔡昭文</span>{" "}
          <span style={{ color: RC.gold }}>&amp;</span>{" "}
          <span style={{ color: RC.red }}>刘梦莎</span>
        </p>
        <div style={{ width: "100%", marginTop: 6, animation: "fadeIn 1.2s ease-out 0.3s both" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/wedding/hero-chinese.jpg"
            alt="Watercolour red lanterns, silk drapes and peonies"
            className="rc-hero-img"
            style={{
              width: "100%", height: "auto", display: "block",
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 8%, #000 92%, transparent 100%), linear-gradient(to bottom, transparent 0%, #000 5%, #000 88%, transparent 100%)",
              WebkitMaskComposite: "source-in",
              maskImage: "linear-gradient(to right, transparent 0%, #000 8%, #000 92%, transparent 100%), linear-gradient(to bottom, transparent 0%, #000 5%, #000 88%, transparent 100%)",
              maskComposite: "intersect",
            }}
          />
        </div>
        <p style={{
          fontFamily: RF.dancing,
          fontSize: "clamp(22px, 6vw, 31px)",
          fontWeight: 500, color: RC.gold, margin: "18px 0 0",
        }}>
          We are getting married
        </p>
        <p style={{
          fontFamily: "'PingFang SC', 'Microsoft YaHei', 'Noto Serif SC', serif",
          fontSize: "clamp(14px, 3.5vw, 18px)", color: RC.warmGold,
          letterSpacing: "0.3em", margin: "6px 0 0",
        }}>
          喜结良缘
        </p>
      </div>

      {/* ── Date ── */}
      <div style={{
        width: "100%", maxWidth: 720, padding: "46px 24px 0",
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center", animation: "fadeInUp 1s ease-out 0.5s both",
      }}>
        <p style={{
          fontFamily: RF.mulish, fontSize: 13, fontWeight: 500,
          letterSpacing: "0.4em", textTransform: "uppercase",
          color: RC.pink, margin: "0 0 8px",
        }}>
          Saturday · 星期六
        </p>
        <div style={{
          display: "flex", alignItems: "center", gap: 22,
          width: "100%", maxWidth: 430, justifyContent: "center",
        }}>
          <div style={{ flex: 1, height: 1, backgroundColor: RC.border }} />
          <h2 style={{
            fontFamily: RF.cormorant,
            fontSize: "clamp(32px, 9vw, 52px)",
            fontWeight: 500, color: RC.red, margin: 0, whiteSpace: "nowrap",
          }}>
            {String(data.date || "September 12, 2026").replace(", 2026", "")}
          </h2>
          <div style={{ flex: 1, height: 1, backgroundColor: RC.border }} />
        </div>
        <p style={{
          fontFamily: RF.mulish, fontSize: 15, fontWeight: 500,
          letterSpacing: "0.42em", color: RC.warmGold, margin: "12px 0 0",
        }}>
          2026
        </p>
      </div>

      <DoubleHappinessDivider />

      {/* ── Venue card ── */}
      <div className="rc-venue-wrap" style={{
        width: "100%", maxWidth: 620, padding: "22px 24px 0", position: "relative",
      }}>
        <div className="rc-venue-card" style={{
          position: "relative", border: `1px solid ${RC.border}`, borderRadius: 18,
          padding: "50px 40px", display: "flex", flexDirection: "column",
          alignItems: "center", textAlign: "center", overflow: "visible",
          backgroundColor: RC.cardBg,
        }}>
          {/* Left lantern sprig */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/wedding/sprig-red.png" alt="" aria-hidden="true"
            className="rc-sprig rc-sprig-left" style={{
              position: "absolute", left: -39, top: -64,
              width: 94, height: "auto", pointerEvents: "none",
            }} />
          {/* Right lantern sprig */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/wedding/sprig-red.png" alt="" aria-hidden="true"
            className="rc-sprig rc-sprig-right" style={{
              position: "absolute", top: 295, right: -38,
              width: 94, height: "auto", pointerEvents: "none",
              transform: "scaleX(-1)",
            }} />

          <p style={{ fontFamily: RF.dancing, fontSize: 27, fontWeight: 500, color: RC.gold, margin: "0 0 2px" }}>
            the celebration
          </p>
          <p style={{
            fontFamily: "'PingFang SC', 'Microsoft YaHei', serif",
            fontSize: 13, color: RC.warmGold, letterSpacing: "0.25em", margin: "0 0 10px",
          }}>
            喜宴庆典
          </p>
          <h3 style={{
            fontFamily: RF.cormorant, fontSize: 30, fontWeight: 500,
            color: RC.red, margin: "0 0 4px", lineHeight: 1.15,
          }}>
            {String(data.venue_room || "Kinabalu Room")}
          </h3>
          <h3 style={{
            fontFamily: RF.cormorant, fontSize: "clamp(26px, 6vw, 38px)", fontWeight: 500,
            color: RC.red, margin: "0 0 16px", lineHeight: 1.15,
          }}>
            {String(data.venue_name || "Shangri-La Tanjung Aru")}
          </h3>
          <p style={{ fontFamily: RF.mulish, fontSize: 15, color: RC.brown, margin: 0, lineHeight: 1.65 }}>
            No. 20, Jalan Aru, Tanjung Aru,
          </p>
          <p style={{ fontFamily: RF.mulish, fontSize: 15, color: RC.brown, margin: 0, lineHeight: 1.65 }}>
            88100 Kota Kinabalu, Sabah, Malaysia
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "18px 0 28px" }}>
            <div style={{ width: 26, height: 1, backgroundColor: RC.border }} />
            <p style={{
              fontFamily: RF.mulish, fontSize: 13, fontWeight: 600,
              letterSpacing: "0.3em", textTransform: "uppercase",
              color: RC.gold, margin: 0,
            }}>
              6:30 PM
            </p>
            <div style={{ width: 26, height: 1, backgroundColor: RC.border }} />
          </div>
          <a
            href="/seats"
            style={{
              display: "inline-flex", flexDirection: "column", alignItems: "center",
              fontFamily: RF.mulish, fontSize: 12, fontWeight: 600, letterSpacing: "0.25em",
              textTransform: "uppercase", color: RC.btnText,
              backgroundColor: RC.red, padding: "13px 34px",
              textDecoration: "none", borderRadius: 22, gap: 2,
            }}
          >
            <span>Find My Seat</span>
            <span style={{
              fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif",
              fontSize: 10, letterSpacing: "0.1em", textTransform: "none", opacity: 0.9,
            }}>查找我的座位</span>
          </a>
        </div>
      </div>

      {/* ── Dress code (commented out) ── */}
      {/* <div style={{
        width: "100%", maxWidth: 720, padding: "92px 24px 0",
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center", animation: "fadeInUp 1s ease-out 0.9s both",
      }}>
        <p>Dress Code · 着装要求</p>
        <h2>{String(data.dress_code || "Warm & Festive")}</h2>
        <p>温馨喜庆</p>
        <p>Guests are warmly invited to dress in light and elegant colors...</p>
        <p>我们诚邀宾客着淡雅色系服装出席。烦请避免全黑、全白或大红色。</p>
      </div> */}

      {/* ── With Gratitude ── */}
      <div style={{
        width: "100%", maxWidth: 720, padding: "80px 28px 0",
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center", animation: "fadeInUp 1s ease-out 0.9s both",
      }}>
        <p style={{
          fontFamily: RF.mulish, fontSize: 12, fontWeight: 600,
          letterSpacing: "0.38em", textTransform: "uppercase",
          color: RC.pink, margin: "0 0 4px",
        }}>
          With Gratitude
        </p>
        <p style={{
          fontFamily: "'PingFang SC', 'Microsoft YaHei', serif",
          fontSize: 13, color: RC.warmGold, letterSpacing: "0.28em",
          margin: "0 0 18px",
        }}>
          衷心感谢
        </p>
        <h2 style={{
          fontFamily: RF.cormorant,
          fontSize: "clamp(36px, 9vw, 58px)",
          fontWeight: 500, color: RC.red, margin: "0 0 6px", lineHeight: 1.15,
        }}>
          It is Our Big Day
        </h2>
        <p style={{
          fontFamily: "'PingFang SC', 'Microsoft YaHei', serif",
          fontSize: 17, color: RC.warmGold, letterSpacing: "0.18em", margin: "0 0 24px",
        }}>
          今天是我们的大日子
        </p>
        <div style={{
          fontFamily: RF.mulish, fontSize: 15, color: RC.brown,
          maxWidth: 560, lineHeight: 1.85, margin: "0 0 16px",
        }}>
          <p>Today, our two families become one,</p>
          <p>and we get to share it with the people who mean the most to us.</p>
          <p>Thank you for travelling near and far to stand by our side.</p>
          <p>Here&apos;s to red envelopes, good tea, great food, and a night full of laughter. </p>  
          <p>We&apos;re so glad you&apos;re here.</p>
        </div>
        <div style={{
          fontFamily: "'PingFang SC', 'Microsoft YaHei', serif",
          fontSize: 14, color: RC.brown, maxWidth: 500,
          lineHeight: 2, margin: 0, opacity: 0.88,
        }}>
          <p>今天，两个家庭合二为一</p>
          <p>我们有幸与最重要的人共同分享这一刻</p>
          <p>感谢您跋山涉水 前来见证我们的幸福</p>
          <p>愿</p>
          <p>红包满载 好茶飘香</p>
          <p>美食不断 笑声不绝</p>
          <p>很高兴今天有您共见欢喜</p>
          </div>
      </div>

      {/* ── Timeline ── */}
      {timeline.length > 0 && (
        <>
          <DoubleHappinessDivider />
          <div style={{
            width: "100%", maxWidth: 720, padding: "0 20px 20px",
            display: "flex", flexDirection: "column", alignItems: "center",
            textAlign: "center",
          }}>
            <h2 style={{
              fontFamily: RF.cormorant,
              fontSize: "clamp(28px, 7vw, 42px)",
              fontWeight: 500, margin: "0 0 4px", color: RC.red,
            }}>
              The Day · 当天流程
            </h2>
            <p style={{ fontFamily: RF.dancing, fontSize: "clamp(20px, 5vw, 24px)", color: RC.gold, margin: "0 0 40px" }}>
              a little timeline · 婚礼时程
            </p>

            <div className="rc-tl-container" style={{ width: "100%", maxWidth: 560, position: "relative" }}>
              <div className="rc-tl-line" style={{
                position: "absolute", top: 0, bottom: 0,
                width: 1.5, backgroundColor: RC.border,
              }} />

              {timeline.map((event, i) => {
                const isLeft = i % 2 === 0;
                const isLast = i === timeline.length - 1;
                const pb = isLast ? 0 : 44;

                const cardContent = (
                  <>
                    <p style={{
                      fontFamily: RF.mulish, fontSize: 11, fontWeight: 500,
                      letterSpacing: "0.25em", textTransform: "uppercase",
                      color: RC.pink, margin: "0 0 4px",
                    }}>
                      {event.starts_at}
                    </p>
                    <p style={{
                      fontFamily: RF.cormorant, fontSize: 24, fontWeight: 500,
                      color: RC.red, margin: "0 0 4px",
                    }}>
                      {event.title}
                    </p>
                    <p style={{
                      fontFamily: RF.mulish, fontSize: 13, color: RC.brown,
                      margin: 0, lineHeight: 1.6,
                    }}>
                      {event.description}
                    </p>
                  </>
                );

                const dot = (
                  <div className="rc-tl-dot-wrap" style={{
                    display: "flex", justifyContent: "center",
                    alignItems: "flex-start", paddingTop: 2,
                  }}>
                    <div style={{
                      width: 13, height: 13, borderRadius: "50%",
                      border: `2px solid ${RC.red}`, backgroundColor: RC.bg,
                      position: "relative", zIndex: 1,
                    }} />
                  </div>
                );

                return (
                  <div key={event.id} className="rc-tl-row" style={{
                    display: "grid", gridTemplateColumns: "1fr 40px 1fr",
                  }}>
                    <div
                      className={isLeft ? "rc-tl-card rc-tl-card-l" : "rc-tl-empty"}
                      style={isLeft ? { textAlign: "right", padding: `0 16px ${pb}px 0` } : {}}
                    >
                      {isLeft ? cardContent : null}
                    </div>
                    {dot}
                    <div
                      className={!isLeft ? "rc-tl-card rc-tl-card-r" : "rc-tl-empty"}
                      style={!isLeft ? { textAlign: "left", padding: `0 0 ${pb}px 16px` } : {}}
                    >
                      {!isLeft ? cardContent : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ── Footer ── */}
      <div style={{
        width: "100%", maxWidth: 720, padding: "76px 24px 60px",
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/wedding/double-happiness.png" alt="" width={58} height={58}
          style={{ objectFit: "contain", marginBottom: 24 }} />
        <p style={{
          fontFamily: RF.greatVibes,
          fontSize: "clamp(30px, 8vw, 46px)",
          color: RC.red, margin: "0 0 6px", lineHeight: 1.25,
        }}>
          Thank you for celebrating with us
        </p>
        <p style={{
          fontFamily: "'PingFang SC', 'Microsoft YaHei', serif",
          fontSize: 16, color: RC.warmGold, letterSpacing: "0.25em", margin: "0 0 16px",
        }}>
          期待与您共庆此刻
        </p>
        <p style={{
          fontFamily: RF.mulish, fontSize: 12, fontWeight: 500,
          letterSpacing: "0.28em", textTransform: "uppercase",
          color: RC.warmGold, margin: 0,
        }}>
          September 12, 2026 · 二〇二六年九月十二日
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

        .rc-tl-line { left: 50%; transform: translateX(-50%); }

        @media (max-width: 600px) {
          .rc-hero-section { padding-top: 32px !important; }
          .rc-hero-img { max-height: 280px; object-fit: cover; }
          .rc-venue-wrap { padding: 0 16px !important; }
          .rc-venue-card { padding: 36px 24px !important; }
          .rc-sprig { width: 60px !important; }
          .rc-sprig-left { left: -20px !important; top: -40px !important; }
          .rc-sprig-right { right: -20px !important; top: 200px !important; }

          .rc-tl-line { left: 10px !important; transform: none !important; }
          .rc-tl-row {
            grid-template-columns: 22px 1fr !important;
          }
          .rc-tl-dot-wrap {
            grid-column: 1 !important;
            grid-row: 1 !important;
          }
          .rc-tl-card {
            grid-column: 2 !important;
            grid-row: 1 !important;
            text-align: left !important;
            padding-left: 14px !important;
            padding-right: 0 !important;
          }
          .rc-tl-empty { display: none !important; }
        }
      `}</style>
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
