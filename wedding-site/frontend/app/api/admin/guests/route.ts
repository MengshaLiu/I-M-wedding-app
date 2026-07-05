import { adminFetch } from "@/lib/adminBff";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const res = await adminFetch("/api/admin/guests");
  if (!res.ok) return NextResponse.json({ error: "Unauthorized" }, { status: res.status });
  return NextResponse.json(await res.json());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await adminFetch("/api/admin/guests", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
