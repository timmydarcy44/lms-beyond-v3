export default function EnvCheck() {
  return (
    <main className="min-h-screen bg-bg text-text p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Environment Variables Check</h1>
        <div className="bg-surfaceAlt border border-border rounded-xl p-6">
          <pre className="text-sm text-text whitespace-pre-wrap">
{JSON.stringify({
  NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || null,
  NEXT_PUBLIC_DEFAULT_ORG: process.env.NEXT_PUBLIC_DEFAULT_ORG || null,
  SINGLE_ORG_SLUG: process.env.SINGLE_ORG_SLUG || null,
}, null, 2)}
          </pre>
        </div>
        
        <div className="mt-6 p-4 bg-surfaceAlt border border-border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Status</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
