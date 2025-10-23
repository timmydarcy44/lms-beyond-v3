'use client';
export default function AdminError({ error }: { error: Error & { digest?: string } }) {
  return (
    <main className="min-h-dvh grid place-items-center p-8 text-center">
      <div className="max-w-lg">
        <h1 className="text-2xl font-semibold mb-2">Une erreur s'est produite</h1>
        <p className="text-sm opacity-80 mb-4">Recharge la page.</p>
        {error?.digest && <p className="text-xs opacity-60">Code: <span className="font-mono">{error.digest}</span></p>}
      </div>
    </main>
  );
}
