interface Event {
  id: string;
  starts_at: string;
  title: string;
  description: string;
  location?: string | null;
}

export default function Timeline({ events }: { events: Event[] }) {
  if (events.length === 0) return null;

  return (
    <ol className="relative border-l border-blush ml-3 space-y-8">
      {events.map((event) => (
        <li key={event.id} className="ml-6">
          <span className="absolute -left-2 w-4 h-4 rounded-full bg-blush border-2 border-white mt-1" />
          <p className="text-xs font-mono text-gray-400 mb-0.5">{event.starts_at}</p>
          <h3 className="font-serif text-base font-semibold text-charcoal">{event.title}</h3>
          <p className="text-sm text-gray-600 mt-0.5">{event.description}</p>
          {event.location && (
            <p className="text-xs text-gray-400 mt-1">📍 {event.location}</p>
          )}
        </li>
      ))}
    </ol>
  );
}
