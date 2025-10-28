export const dynamic = 'force-static';
export default function CspPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>🔎 CSP diagnostic</h1>
      <p>Si vous voyez cette page, testez la console (Network ➜ Headers) pour vérifier l'en-tête <code>Content-Security-Policy</code>.</p>
      <p>En DIAG_MODE, elle doit inclure <code>script-src 'strict-dynamic'</code>.</p>
    </main>
  );
}




