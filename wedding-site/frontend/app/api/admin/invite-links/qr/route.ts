import { adminFetch } from "@/lib/adminBff";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const tier = req.nextUrl.searchParams.get("tier") ?? "full";
  const fill = req.nextUrl.searchParams.get("fill") ?? "#000000";
  const bg = req.nextUrl.searchParams.get("bg") ?? "#ffffff";
  const params = new URLSearchParams({ tier, fill, bg });
  const res = await adminFetch(`/api/admin/invite-links/qr?${params}`);
  if (!res.ok) return NextResponse.json({ error: "Failed" }, { status: res.status });
  const buf = await res.arrayBuffer();
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="invite-qr-${tier}.png"`,
    },
  });
}
