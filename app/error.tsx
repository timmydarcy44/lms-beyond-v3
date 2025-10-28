'use client';
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  console.error(error);
  return (
    <main style={{ padding: 24 }}>
      <h1>⚠️ Erreur sur la page</h1>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{String(error?.message || error)}</pre>
      <button onClick={() => reset()} style={{ marginTop: 16 }}>↻ Réessayer</button>
    </main>
  );
}
