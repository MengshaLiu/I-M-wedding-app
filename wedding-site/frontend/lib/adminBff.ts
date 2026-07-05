import { cookies } from "next/headers";

const API_URL = process.env.API_URL ?? "http://localhost:8000";
const ADMIN_COOKIE = process.env.ADMIN_COOKIE_NAME ?? "wsa";

export async function adminFetch(path: string, init?: RequestInit) {
  const cookieStore = await cookies();
  const jwt = cookieStore.get(ADMIN_COOKIE)?.value;

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  return res;
}
