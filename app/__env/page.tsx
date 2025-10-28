export const dynamic = 'force-static';
const keys = ['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY'];
function flag(k: string) { return process.env[k as any] ? '✅ présent' : '❌ manquant'; }
export default function EnvPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>🔎 Variables publiques</h1>
      <ul style={{ lineHeight: 1.8 }}>
        {keys.map(k => <li key={k}><code>{k}</code>: {flag(k)}</li>)}
      </ul>
    </main>
  );
}
