"use client";

import { useState } from "react";

const C = {
  deep: "oklch(36% .072 152)",
  sage: "oklch(55% .09 150)",
  muted: "oklch(0.5 0.04 150)",
  line: "oklch(0.82 0.03 140)",
} as const;

const F = {
  cormorant: "var(--font-cormorant), 'Cormorant Garamond', serif",
  mulish: "var(--font-mulish), 'Mulish', sans-serif",
  dancing: "var(--font-dancing), 'Dancing Script', cursive",
} as const;

const SECTION_META: Record<string, { label: string; intro?: string }> = {
  "Places to Visit": {
    label: "explore",
    // intro: "A few of our favourite corners of Kota Kinabalu and beyond.",
  },
  "Things to Eat": {
    label: "taste",
    // intro: "Flavours of Sabah you shouldn't leave without trying.",
  },
  "Places to Eat": {
    label: "taste",
    // intro: "Flavours of Sabah you shouldn't leave without trying.",
  },
  "Where to Shop": {
    label: "shop",
    // intro: "From handcrafted souvenirs to sea pearls — what to buy and where to find it.",
  },
  "Entertainment & Activities": {
    label: "unwind",
    // intro: "Ways to fill the days around the celebration.",
  },
  "Before You Enter Malaysia": {
    label: "prepare",
    // intro: "A few practical notes to smooth your arrival.",
  },
};

const FALLBACK_LABELS = ["explore", "taste", "unwind", "prepare", "discover"];

interface TravelItem { name: string; description: string; tip?: string | null; link?: string | null; ios_link?: string | null; android_link?: string | null; }
interface TravelSection { title: string; items: TravelItem[]; }

export function TravelAccordion({ sections }: { sections: TravelSection[] }) {
  const [open, setOpen] = useState<number>(-1);

  return (
    <div>
      {/* top divider */}
      <div style={{ height: 1, backgroundColor: C.line }} />

      {sections.map((section, i) => {
        const meta = SECTION_META[section.title];
        const label = meta?.label ?? FALLBACK_LABELS[i] ?? "discover";
        const intro = meta?.intro ?? "";
        const isOpen = open === i;
        const num = String(i + 1).padStart(2, "0") + ".";

        return (
          <div key={i}>
            {/* Clickable header */}
            <div
              onClick={() => setOpen(isOpen ? -1 : i)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                padding: "28px 8px",
                cursor: "pointer",
              }}
            >
              {/* Number */}
              <span style={{
                fontFamily: F.cormorant,
                fontSize: "clamp(20px, 4vw, 26px)",
                fontStyle: "italic",
                fontWeight: 400,
                color: C.deep,
                flexShrink: 0,
                width: 48,
                lineHeight: 1,
                paddingTop: 4,
                alignSelf: "flex-start",
              }}>
                {num}
              </span>

              {/* Label + Title */}
              <div style={{ flex: 1, textAlign: "left" }}>
                <p style={{
                  fontFamily: F.dancing,
                  fontSize: 18,
                  color: C.sage,
                  margin: "0 0 2px 0",
                  lineHeight: 1,
                }}>
                  {label}
                </p>
                <p style={{
                  fontFamily: F.cormorant,
                  fontSize: "clamp(24px, 5vw, 32px)",
                  fontWeight: 500,
                  color: C.deep,
                  margin: 0,
                  lineHeight: 1.1,
                }}>
                  {section.title}
                </p>
              </div>

              {/* Chevron */}
              <svg
                width="22" height="22" viewBox="0 0 24 24" fill="none"
                style={{
                  flexShrink: 0,
                  transition: "transform 0.35s ease",
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              >
                <path d="M6 9L12 15L18 9" stroke="oklch(0.5 0.06 150)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Collapsible body */}
            <div style={{
              overflow: "hidden",
              transition: "max-height 0.45s ease, opacity 0.35s ease",
              maxHeight: isOpen ? "10000px" : "0px",
              opacity: isOpen ? 1 : 0,
            }}>
              <div style={{ padding: "0 8px 34px 68px" }}>
                {intro && (
                  <p style={{
                    fontFamily: F.mulish, fontSize: 15,
                    color: C.muted, margin: "0 0 26px 0",
                    lineHeight: 1.6,
                  }}>
                    {intro}
                  </p>
                )}
                {section.items.map((item, j) => (
                  <div key={j} style={{ marginBottom: j < section.items.length - 1 ? 26 : 0 }}>
                    {j > 0 && (
                      <div style={{
                        height: 1,
                        backgroundColor: "oklch(0.9 0.02 140)",
                        margin: "0 0 26px 0",
                      }} />
                    )}
                    <h3 style={{
                      fontFamily: F.cormorant, fontSize: 25, fontWeight: 500,
                      color: C.deep, margin: "0 0 8px",
                    }}>
                      {item.name}
                    </h3>
                    <p style={{
                      fontFamily: F.mulish, fontSize: 15,
                      color: C.muted, margin: "0 0 12px", lineHeight: 1.65,
                    }}>
                      {item.description}
                    </p>
                    {item.tip && (
                      <p style={{
                        fontFamily: F.mulish, fontStyle: "italic", fontSize: 14,
                        color: C.sage, margin: item.link ? "0 0 10px" : "0", paddingLeft: 14,
                        borderLeft: `2px solid ${C.sage}`, lineHeight: 1.55,
                      }}>
                        {item.tip}
                      </p>
                    )}
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          fontFamily: F.mulish, fontSize: 12, fontWeight: 600,
                          letterSpacing: "0.08em", textTransform: "uppercase",
                          color: C.sage, textDecoration: "none",
                          borderBottom: `1px solid oklch(0.75 0.07 150)`,
                          paddingBottom: 1,
                        }}
                      >
                        {item.link.includes("google.com/maps") ? "View on Google Maps" : "Visit Website"}
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                          <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </a>
                    )}
                    {(item.ios_link || item.android_link) && (
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: item.tip ? 10 : 0 }}>
                        {item.ios_link && (
                          <a
                            href={item.ios_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 6,
                              fontFamily: F.mulish, fontSize: 12, fontWeight: 600,
                              letterSpacing: "0.06em", textTransform: "uppercase",
                              color: C.sage, textDecoration: "none",
                              border: `1px solid oklch(0.75 0.07 150)`,
                              borderRadius: 6, padding: "5px 11px",
                            }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                            </svg>
                            App Store
                          </a>
                        )}
                        {item.android_link && (
                          <a
                            href={item.android_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 6,
                              fontFamily: F.mulish, fontSize: 12, fontWeight: 600,
                              letterSpacing: "0.06em", textTransform: "uppercase",
                              color: C.sage, textDecoration: "none",
                              border: `1px solid oklch(0.75 0.07 150)`,
                              borderRadius: 6, padding: "5px 11px",
                            }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.523 15.341 20 11l-2.477-4.341A1 1 0 0 0 16.634 6H7.366a1 1 0 0 0-.889.659L4 11l2.477 4.341A1 1 0 0 0 7.366 16h9.268a1 1 0 0 0 .889-.659zM8.5 13a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm7 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
                            </svg>
                            Google Play
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* bottom divider */}
            <div style={{ height: 1, backgroundColor: C.line }} />
          </div>
        );
      })}
    </div>
  );
}
