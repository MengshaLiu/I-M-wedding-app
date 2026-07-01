import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/bff";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const res = await backendFetch(`/api/seats?q=${encodeURIComponent(q)}`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
