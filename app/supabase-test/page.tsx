import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function SupabaseTestPage() {
  try {
    console.log('[SUPABASE_TEST] Starting Supabase test...');
    const sb = await supabaseServer();
    console.log('[SUPABASE_TEST] Supabase client created successfully');
    
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold mb-4">✅ Supabase Test</h1>
        <p>Supabase client created successfully!</p>
        <p>This page only tests the Supabase connection.</p>
      </main>
    );
  } catch (error) {
    console.error('[SUPABASE_TEST] Error:', error);
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold mb-4 text-red-500">❌ Supabase Error</h1>
        <div className="bg-red-100 p-4 rounded">
          <p><strong>Error:</strong> {error instanceof Error ? error.message : String(error)}</p>
        </div>
      </main>
    );
  }
}
