import { adminFetch } from "@/lib/adminBff";
import { NextResponse } from "next/server";

export async function GET() {
  const res = await adminFetch("/api/admin/invite-links");
  if (!res.ok) return NextResponse.json({ error: "Unauthorized" }, { status: res.status });
  return NextResponse.json(await res.json());
}
