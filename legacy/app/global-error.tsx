'use client';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  console.error(error);

  return (
    <html>
      <body style={{ padding: 24, background: '#111', color: '#eee' }}>
        <h1>🔥 Erreur globale (hors page)</h1>
        <pre style={{ whiteSpace: 'pre-wrap', color: '#f88' }}>
          {String(error?.message || error)}
        </pre>
        {error?.digest && <p>digest: {error.digest}</p>}
      </body>
    </html>
  );
}

