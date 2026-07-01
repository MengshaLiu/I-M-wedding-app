import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/bff";

export async function GET() {
  const res = await backendFetch("/api/travel");
  if (res.status === 403) {
    return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"));
  }
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
