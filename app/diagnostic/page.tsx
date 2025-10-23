import { supabaseServer } from '@/lib/supabase/server';
import { getSessionUser, getOrgsForUser } from '@/lib/orgs';

export const dynamic = 'force-dynamic';

export default async function DiagnosticPage() {
  try {
    console.log('[DIAGNOSTIC] Starting diagnostic page...');
    
    // Test 1: Supabase connection
    console.log('[DIAGNOSTIC] Testing Supabase connection...');
    const sb = await supabaseServer();
    console.log('[DIAGNOSTIC] Supabase client created successfully');
    
    // Test 2: User session
    console.log('[DIAGNOSTIC] Testing user session...');
    const user = await getSessionUser();
    console.log('[DIAGNOSTIC] User session result:', user ? 'User found' : 'No user');
    
    // Test 3: Organizations (only if user exists)
    let orgs: Array<{ id: string; slug: string; name: string }> = [];
    if (user) {
      console.log('[DIAGNOSTIC] Testing organizations...');
      orgs = await getOrgsForUser(user.id);
      console.log('[DIAGNOSTIC] Organizations found:', orgs.length);
    }
    
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold mb-4">🔍 Diagnostic Server Components</h1>
        <div className="space-y-2">
          <p><strong>Supabase:</strong> ✅ Connected</p>
          <p><strong>User:</strong> {user ? `✅ ${user.email}` : '❌ Not authenticated'}</p>
          <p><strong>Organizations:</strong> {orgs.length} found</p>
          {orgs.length > 0 && (
            <ul className="ml-4">
              {orgs.map(org => (
                <li key={org.id}>• {org.name} ({org.slug})</li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Test Links:</h2>
          <ul className="space-y-1">
            <li><a href="/api/_debug/session" className="text-blue-500 underline">Session Debug</a></li>
            <li><a href="/api/_debug/orgs" className="text-blue-500 underline">Organizations Debug</a></li>
            <li><a href="/admin/test" className="text-blue-500 underline">Admin Test</a></li>
          </ul>
        </div>
      </main>
    );
  } catch (error) {
    console.error('[DIAGNOSTIC] Error in diagnostic page:', error);
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold mb-4 text-red-500">❌ Diagnostic Error</h1>
        <div className="bg-red-100 p-4 rounded">
          <p><strong>Error:</strong> {error instanceof Error ? error.message : String(error)}</p>
          <p><strong>Stack:</strong></p>
          <pre className="text-xs mt-2 overflow-auto">
            {error instanceof Error ? error.stack : 'No stack trace'}
          </pre>
        </div>
      </main>
    );
  }
}
