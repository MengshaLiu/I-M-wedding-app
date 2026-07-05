import { adminFetch } from "@/lib/adminBff";
import { NextResponse } from "next/server";

export async function GET() {
  const res = await adminFetch("/api/admin/guests/export");
  if (!res.ok) return NextResponse.json({ error: "Failed" }, { status: res.status });
  const text = await res.text();
  return new NextResponse(text, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="guests.csv"',
    },
  });
}
