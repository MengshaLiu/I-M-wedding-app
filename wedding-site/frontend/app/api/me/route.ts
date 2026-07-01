import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/bff";

export async function GET() {
  const res = await backendFetch("/api/me");
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
