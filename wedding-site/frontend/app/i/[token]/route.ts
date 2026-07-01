import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:8000";
const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? "wss";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let jwt: string;
  try {
    const res = await fetch(`${API_URL}/api/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) {
      return NextResponse.redirect(new URL("/invalid", req.url));
    }
    const data = await res.json();
    jwt = data.jwt;
  } catch {
    return NextResponse.redirect(new URL("/invalid", req.url));
  }

  const response = NextResponse.redirect(new URL("/", req.url));
  response.cookies.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS,
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
