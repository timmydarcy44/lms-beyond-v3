'use client';
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <main className="min-h-dvh grid place-items-center p-8 text-center">
      <div className="max-w-xl">
        <h1 className="text-2xl font-semibold mb-2">Une erreur s'est produite</h1>
        {error?.digest && <p className="text-xs opacity-60 mb-4">Code: <span className="font-mono">{error.digest}</span></p>}
        <button onClick={() => reset()} className="rounded px-3 py-2 bg-white/10">Réessayer</button>
      </div>
    </main>
  );
}