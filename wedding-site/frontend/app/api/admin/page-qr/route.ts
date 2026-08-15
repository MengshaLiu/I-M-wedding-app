import { adminFetch } from "@/lib/adminBff";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const page = req.nextUrl.searchParams.get("page") ?? "";
  const fill = req.nextUrl.searchParams.get("fill") ?? "#000000";
  const bg = req.nextUrl.searchParams.get("bg") ?? "transparent";
  const params = new URLSearchParams({ page, fill, bg });
  const res = await adminFetch(`/api/admin/page-qr?${params}`);
  if (!res.ok) return NextResponse.json({ error: "Failed" }, { status: res.status });
  const buf = await res.arrayBuffer();
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="qr-${page}.png"`,
    },
  });
}
