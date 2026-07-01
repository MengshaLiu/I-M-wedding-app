import { cookies } from "next/headers";
import Link from "next/link";
import { jwtVerify } from "jose";

const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? "wss";
const SESSION_SECRET = new TextEncoder().encode(process.env.SESSION_SECRET ?? "");

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
} as const;

async function getTier(): Promise<string | null> {
  try {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SESSION_SECRET);
    return (payload.tier as string) ?? null;
  } catch {
    return null;
  }
}

export default async function GuestLayout({ children }: { children: React.ReactNode }) {
  const tier = await getTier();
  const isFullGuest = tier === "full";

  if (isFullGuest) {
    const links = [
      { label: "Gallery", href: "/gallery" },
      { label: "Seat Finder", href: "/seats" },
      { label: "Travel", href: "/travel" },
    ];
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: C.bg }}>
        <header style={{
          backgroundColor: C.deep,
          borderBottom: `1px solid ${C.line}`,
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <nav style={{
            maxWidth: 720, margin: "0 auto", padding: "14px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <Link href="/" style={{
              fontFamily: F.cormorant,
              fontSize: 22, fontWeight: 500,
              color: C.line, textDecoration: "none",
              letterSpacing: "0.05em",
            }}>
              I &amp; M
            </Link>
            <div style={{ display: "flex", gap: 24, flexWrap: "nowrap" }}>
              {links.map(({ label, href }) => (
                <Link key={label} href={href} className="nav-link-full" style={{
                  fontFamily: F.mulish,
                  fontSize: 10, fontWeight: 600,
                  letterSpacing: "0.2em", textTransform: "uppercase",
                  color: C.line, textDecoration: "none",
                  whiteSpace: "nowrap",
                }}>
                  {label}
                </Link>
              ))}
            </div>
          </nav>
          <style>{`.nav-link-full:hover { color: ${C.sage} !important; }`}</style>
        </header>
        <main style={{ flex: 1 }}>{children}</main>
      </div>
    );
  }

  // Reception guest layout
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-blush shadow-sm sticky top-0 z-10">
        <nav className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-serif text-lg text-charcoal tracking-wide">
            I &amp; M
          </Link>
          <div className="flex gap-5 text-sm">
            <Link href="/" className="hover:text-sage transition-colors">Home</Link>
            <Link href="/gallery" className="hover:text-sage transition-colors">Gallery</Link>
            <Link href="/seats" className="hover:text-sage transition-colors">Seat Finder</Link>
          </div>
        </nav>
      </header>
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">{children}</main>
      <footer className="text-center text-xs text-gray-400 py-6">Made with love ♡</footer>
    </div>
  );
}
