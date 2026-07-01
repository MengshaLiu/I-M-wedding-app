import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? "wss";
const SESSION_SECRET = new TextEncoder().encode(process.env.SESSION_SECRET ?? "");

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!isGuestPath(pathname)) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.redirect(new URL("/invalid", req.url));

  try {
    await jwtVerify(token, SESSION_SECRET);
    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL("/invalid", req.url));
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }
}

function isGuestPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname.startsWith("/seats") ||
    pathname.startsWith("/gallery") ||
    pathname.startsWith("/travel")
  );
}

export const config = {
  matcher: ["/", "/seats/:path*", "/gallery/:path*", "/travel/:path*"],
};
