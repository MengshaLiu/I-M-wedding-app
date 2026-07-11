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

const SECTION_META: Record<string, { label: string;}> = {
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

interface TravelItem { name: string; description: string; tip?: string | null; link?: string | null; }
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
                        View on Google Maps
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                          <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </a>
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
