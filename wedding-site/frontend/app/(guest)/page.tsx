import { cookies } from "next/headers";
import Timeline from "@/components/Timeline";

const API_URL = process.env.API_URL ?? "http://localhost:8000";
const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? "wss";

async function getHomeData() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const res = await fetch(`${API_URL}/api/home`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function HomePage() {
  const data = await getHomeData();

  if (!data) {
    return (
      <p className="text-center text-gray-500 mt-20">
        Something went wrong loading the page. Please try again.
      </p>
    );
  }

  return (
    <div className="space-y-10">
      {/* Hero greeting */}
      <section className="text-center space-y-2 pt-4">
        <p className="text-sage text-sm tracking-widest uppercase">Welcome</p>
        <h1 className="text-4xl font-serif text-charcoal">I &amp; M</h1>
        <p className="text-gray-500 text-sm">We&apos;re so glad you could join us.</p>
      </section>

      {/* Date & venue */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-blush space-y-3">
        <h2 className="font-serif text-lg text-charcoal">The Wedding</h2>
        <div className="text-sm text-gray-600 space-y-1.5">
          <p>
            <span className="font-medium text-charcoal">Date</span>{" "}
            {data.date || "TBA"}
          </p>
          <p>
            <span className="font-medium text-charcoal">Venue</span>{" "}
            {data.venue_name || "TBA"}
          </p>
          {data.venue_address && (
            <p className="text-gray-500 text-xs">{data.venue_address}</p>
          )}
          {data.venue_map_url && (
            <a
              href={data.venue_map_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs text-sage underline"
            >
              Open in Maps →
            </a>
          )}
          <p>
            <span className="font-medium text-charcoal">Dress Code</span>{" "}
            {data.dress_code || "Formal"}
          </p>
        </div>
      </section>

      {/* Timeline */}
      {data.timeline?.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-serif text-lg text-charcoal">Programme</h2>
          <Timeline events={data.timeline} />
        </section>
      )}
    </div>
  );
}
