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

const SECTION_META: Record<string, { label: string; intro: string }> = {
  "Places to Visit": {
    label: "explore",
    intro: "A few of our favourite corners of Kota Kinabalu and beyond.",
  },
  "Things to Eat": {
    label: "taste",
    intro: "Flavours of Sabah you shouldn't leave without trying.",
  },
  "Places to Eat": {
    label: "taste",
    intro: "Flavours of Sabah you shouldn't leave without trying.",
  },
  "Entertainment & Activities": {
    label: "unwind",
    intro: "Ways to fill the days around the celebration.",
  },
  "Where to Shop": {
    label: "shop",
    intro: "From handcrafted souvenirs to sea pearls — what to buy and where to find it.",
  },
  "Before You Enter Malaysia": {
    label: "prepare",
    intro: "A few practical notes to smooth your arrival.",
  },
};

const FALLBACK_LABELS = ["explore", "taste", "unwind", "prepare", "discover"];

interface TravelItem { name: string; description: string; tip?: string | null; }
interface TravelSection { title: string; items: TravelItem[]; }

export function TravelAccordion({ sections }: { sections: TravelSection[] }) {
  const [open, setOpen] = useState<number>(-1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      {sections.map((section, i) => {
        const meta = SECTION_META[section.title];
        const label = meta?.label ?? FALLBACK_LABELS[i] ?? "discover";
        const intro = meta?.intro ?? "";
        const isOpen = open === i;

        return (
          <div key={i} style={{
            borderRadius: 16,
            backgroundColor: "#fcfbf1",
            border: "1px solid oklch(0.9 0.02 140)",
            boxShadow: "0 6px 22px rgba(70, 90, 60, 0.06)",
            overflow: "hidden",
          }}>
            {/* Clickable header */}
            <div
              onClick={() => setOpen(isOpen ? -1 : i)}
              style={{
                display: "flex", alignItems: "center", gap: 18,
                padding: "28px 30px", cursor: "pointer",
              }}
            >
              <div style={{ flex: 1, textAlign: "left" }}>
                <p style={{
                  fontFamily: F.dancing, fontSize: 21,
                  color: "#60a082", margin: "0 0 -2px 0",
                }}>
                  {label}
                </p>
                <p style={{
                  fontFamily: F.cormorant, fontSize: "clamp(22px, 5vw, 30px)",
                  fontWeight: 500, color: C.deep, margin: 0, lineHeight: 1.15,
                }}>
                  {section.title}
                </p>
              </div>
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
              maxHeight: isOpen ? "2000px" : "0px",
              opacity: isOpen ? 1 : 0,
            }}>
              <div style={{ padding: "4px 30px 34px" }}>
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
                        color: C.sage, margin: 0, paddingLeft: 14,
                        borderLeft: `2px solid ${C.sage}`, lineHeight: 1.55,
                      }}>
                        {item.tip}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
