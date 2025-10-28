'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <main style={{ padding: 24 }}>
      <h1>⚠️ Erreur sur la page</h1>
      <pre style={{ whiteSpace: 'pre-wrap', background: '#111', color: '#f66', padding: 12, borderRadius: 8 }}>
        {String(error?.message || error)}
      </pre>
      {error?.digest && <p>digest: {error.digest}</p>}
      <button onClick={() => reset()} style={{ marginTop: 20 }}>↻ Réessayer</button>
    </main>
  );
}
