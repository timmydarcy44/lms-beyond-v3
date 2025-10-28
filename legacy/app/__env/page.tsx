export const dynamic = 'force-static';

const keys = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SENTRY_DSN',
  'NEXT_PUBLIC_DIAG_MODE',
];

function safe(val?: string) {
  if (!val) return '❌ missing';
  return '✅ present';
}

export default function EnvDiag() {
  return (
    <main style={{ padding: 24 }}>
      <h1>🔎 NEXT_PUBLIC env checks (presence only)</h1>
      <ul style={{ lineHeight: 1.8 }}>
        {keys.map(k => (
          <li key={k}><code>{k}</code>: {safe(process.env[k as keyof typeof process.env])}</li>
        ))}
      </ul>
      <p style={{ marginTop: 12, opacity: 0.8 }}>
        (Les valeurs ne sont pas affichées, uniquement leur présence.)
      </p>
    </main>
  );
}




