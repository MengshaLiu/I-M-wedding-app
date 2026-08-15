import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:8000";
const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? "wss";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

// Behind Railway's reverse proxy, req.url uses the internal host (0.0.0.0:PORT).
// Read x-forwarded-host / x-forwarded-proto to get the real public origin.
function getOrigin(req: NextRequest): string {
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host;
  return `${proto}://${host}`;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const origin = getOrigin(req);

  let jwt: string;
  try {
    const res = await fetch(`${API_URL}/api/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) {
      return NextResponse.redirect(new URL("/invalid", origin));
    }
    const data = await res.json();
    jwt = data.jwt;
  } catch {
    return NextResponse.redirect(new URL("/invalid", origin));
  }

  const rawRedirect = req.nextUrl.searchParams.get("redirect") ?? "/";
  // Only allow relative paths to prevent open-redirect abuse
  const safePath = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/";
  const response = NextResponse.redirect(new URL(safePath, origin));
  response.cookies.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS,
    secure: true,
  });
  return response;
}
