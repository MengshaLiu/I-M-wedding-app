import { adminFetch } from "@/lib/adminBff";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get("ids") ?? "";
  const qs = ids ? `?ids=${encodeURIComponent(ids)}` : "";
  const res = await adminFetch(`/api/admin/photos/download-zip${qs}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json(err, { status: res.status });
  }
  const buf = await res.arrayBuffer();
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="wedding-photos.zip"',
    },
  });
}
