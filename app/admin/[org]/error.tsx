'use client';
export default function OrgError({ error }: { error: Error & { digest?: string } }) {
  return (
    <main className="min-h-dvh grid place-items-center p-8 text-center">
      <div className="max-w-lg">
        <h1 className="text-2xl font-semibold mb-2">Oups — erreur sur cette organisation</h1>
        <p className="text-sm opacity-80 mb-4">Recharge la page ou reviens au choix d'organisation.</p>
        {error?.digest && <p className="text-xs opacity-60">Code: <span className="font-mono">{error.digest}</span></p>}
      </div>
    </main>
  );
}