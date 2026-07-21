import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const ADMIN_COOKIE = process.env.ADMIN_COOKIE_NAME ?? "wsa";
const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET ?? "");

export async function GET() {
  try {
    const token = (await cookies()).get(ADMIN_COOKIE)?.value;
    if (!token) return NextResponse.json({ role: null }, { status: 401 });
    const { payload } = await jwtVerify(token, SECRET);
    // Tokens issued before the planner feature have no role — treat as owner.
    const role = (payload.role as string) ?? "owner";
    return NextResponse.json({ role });
  } catch {
    return NextResponse.json({ role: null }, { status: 401 });
  }
}
