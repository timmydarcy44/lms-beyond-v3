'use client';
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  console.error(error);
  return (
    <html><body style={{ padding: 24, background:'#111', color:'#eee' }}>
      <h1>🔥 Erreur globale</h1>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{String(error?.message || error)}</pre>
    </body></html>
  );
}
