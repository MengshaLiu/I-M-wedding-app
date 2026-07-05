import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import AdminDashboard from "./AdminDashboard";

const ADMIN_COOKIE = process.env.ADMIN_COOKIE_NAME ?? "wsa";
const SESSION_SECRET = new TextEncoder().encode(process.env.SESSION_SECRET ?? "");

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;

  if (!token) redirect("/admin/login");

  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET);
    if (!payload.admin) redirect("/admin/login");
  } catch {
    redirect("/admin/login");
  }

  return <AdminDashboard />;
}
