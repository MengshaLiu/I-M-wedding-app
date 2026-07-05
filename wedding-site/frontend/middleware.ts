import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? "wss";
const ADMIN_COOKIE = process.env.ADMIN_COOKIE_NAME ?? "wsa";
const SESSION_SECRET = new TextEncoder().encode(process.env.SESSION_SECRET ?? "");

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin routes — require admin JWT cookie
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    if (!token) return NextResponse.redirect(new URL("/admin/login", req.url));
    try {
      const { payload } = await jwtVerify(token, SESSION_SECRET);
      if (!payload.admin) throw new Error("not admin");
      return NextResponse.next();
    } catch {
      const res = NextResponse.redirect(new URL("/admin/login", req.url));
      res.cookies.delete(ADMIN_COOKIE);
      return res;
    }
  }

  // Guest routes — require guest JWT cookie with a tier claim
  if (!isGuestPath(pathname)) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.redirect(new URL("/invalid", req.url));

  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET);
    // Admin tokens must not grant guest page access
    if (!payload.tier) throw new Error("no tier");
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
    pathname.startsWith("/moments") ||
    pathname.startsWith("/travel")
  );
}

export const config = {
  matcher: ["/", "/seats/:path*", "/moments/:path*", "/travel/:path*", "/admin/:path*"],
};
