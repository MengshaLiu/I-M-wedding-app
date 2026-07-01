import {
  Cormorant_Garamond,
  Great_Vibes,
  Mulish,
  Dancing_Script,
} from "next/font/google";

export const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

export const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-great-vibes",
  display: "swap",
});

export const mulish = Mulish({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-mulish",
  display: "swap",
});

export const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dancing",
  display: "swap",
});
