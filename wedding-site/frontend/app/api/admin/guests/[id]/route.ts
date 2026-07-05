import { adminFetch } from "@/lib/adminBff";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const res = await adminFetch(`/api/admin/guests/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await adminFetch(`/api/admin/guests/${id}`, { method: "DELETE" });
  if (res.status === 204) return new NextResponse(null, { status: 204 });
  return NextResponse.json(await res.json(), { status: res.status });
}
