import { NextResponse } from "next/server";

const ADMIN_COOKIE = process.env.ADMIN_COOKIE_NAME ?? "wsa";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(ADMIN_COOKIE);
  return response;
}
