import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import SeatsPageFull from "./SeatsPageFull";
import SeatsPageReception from "./SeatsPageReception";

const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? "wss";
const SESSION_SECRET = new TextEncoder().encode(process.env.SESSION_SECRET ?? "");

async function getTier(): Promise<string | null> {
  try {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SESSION_SECRET);
    return (payload.tier as string) ?? null;
  } catch {
    return null;
  }
}

export default async function SeatsPage() {
  const tier = await getTier();
  return tier === "full" ? <SeatsPageFull /> : <SeatsPageReception />;
}
