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
      { label: "Home", href: "/" },
      { label: "Travel Guide", href: "/travel" },
      // { label: "Seat Finder", href: "/seats" },
      { label: "Moments", href: "/moments" },
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

  // Reception guest layout — Chinese red theme
  const receptionLinks = [
    { label: "Home", chinese: "首页", href: "/" },
    { label: "Seat Finder", chinese: "座位查询", href: "/seats" },
    { label: "Moments", chinese: "美好瞬间", href: "/moments" }
  ];
  const RC = {
    red: "#b23a2b",
    cream: "#faf2e0",
    line: "#e3cf9f",
    bg: "#faf2e0",
  } as const;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: RC.bg }}>
      <header style={{ backgroundColor: RC.red, position: "sticky", top: 0, zIndex: 10 }}>
        <nav style={{
          maxWidth: 720, margin: "0 auto", padding: "14px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <Link href="/" style={{
            fontFamily: F.cormorant,
            fontSize: 22, fontWeight: 500,
            color: RC.cream, textDecoration: "none",
            letterSpacing: "0.05em",
          }}>
            I &amp; M
          </Link>
          <div style={{ display: "flex", gap: 24, flexWrap: "nowrap" }}>
            {receptionLinks.map(({ label, chinese, href }) => (
              <Link key={label} href={href} className="nav-link-reception" style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                textDecoration: "none", whiteSpace: "nowrap",
              }}>
                <span style={{
                  fontFamily: F.mulish,
                  fontSize: 10, fontWeight: 600,
                  letterSpacing: "0.2em", textTransform: "uppercase",
                  color: RC.line,
                }}>
                  {label}
                </span>
                <span style={{
                  fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif",
                  fontSize: 9, color: RC.line, opacity: 0.8, letterSpacing: "0.05em",
                }}>
                  {chinese}
                </span>
              </Link>
            ))}
          </div>
        </nav>
        <style>{`.nav-link-reception:hover { color: ${RC.cream} !important; }`}</style>
      </header>
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}
