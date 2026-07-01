export default function InvalidPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-6">
        <div className="text-5xl">💌</div>
        <h1 className="text-2xl font-serif text-charcoal">
          This link isn&apos;t valid
        </h1>
        <p className="text-gray-600 leading-relaxed">
          Please double-check the link in your invitation. If you&apos;re still
          having trouble, reach out to us and we&apos;ll help.
        </p>
        <p className="text-sm text-gray-400">
          Contact:{" "}
          <a
            href="mailto:hello@example.com"
            className="underline hover:text-sage transition-colors"
          >
            hello@example.com
          </a>
        </p>
      </div>
    </main>
  );
}
