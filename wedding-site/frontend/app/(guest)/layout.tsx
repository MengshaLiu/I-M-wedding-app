import { cookies } from "next/headers";
import Link from "next/link";
import { jwtVerify } from "jose";

const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? "wss";
const SESSION_SECRET = new TextEncoder().encode(process.env.SESSION_SECRET ?? "");

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

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-blush shadow-sm sticky top-0 z-10">
        <nav className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-serif text-lg text-charcoal tracking-wide">
            I &amp; M
          </Link>
          <div className="flex gap-5 text-sm">
            <Link href="/" className="hover:text-sage transition-colors">
              Home
            </Link>
            <Link href="/seats" className="hover:text-sage transition-colors">
              Seat Finder
            </Link>
            {isFullGuest && (
              <Link href="/travel" className="hover:text-sage transition-colors">
                Travel
              </Link>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {children}
      </main>

      <footer className="text-center text-xs text-gray-400 py-6">
        Made with love ♡
      </footer>
    </div>
  );
}
