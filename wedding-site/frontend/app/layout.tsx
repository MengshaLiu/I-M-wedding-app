import type { Metadata } from "next";
import "./globals.css";
import { cormorant, greatVibes, mulish, dancingScript } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "I & M — Wedding",
  description: "You're invited.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${greatVibes.variable} ${mulish.variable} ${dancingScript.variable}`}
    >
      <body className="min-h-screen" suppressHydrationWarning>{children}</body>
    </html>
  );
}
