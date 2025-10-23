'use client';
export default function OrgError({ error }: { error: Error & { digest?: string } }) {
  return (
    <main className="min-h-dvh grid place-items-center p-8 text-center">
      <div className="max-w-lg">
        <h1 className="text-2xl font-semibold mb-2">Erreur sur cette organisation</h1>
        {error?.digest && <p className="text-xs opacity-60">Code: <span className="font-mono">{error.digest}</span></p>}
      </div>
    </main>
  );
}
