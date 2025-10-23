import { getSessionUser } from '@/lib/orgs';

export const dynamic = 'force-dynamic';

export default async function OrgsTestPage() {
  try {
    console.log('[ORGS_TEST] Starting orgs test...');
    const user = await getSessionUser();
    console.log('[ORGS_TEST] getSessionUser result:', user ? 'User found' : 'No user');
    
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold mb-4">✅ Orgs Test</h1>
        <p>getSessionUser() executed successfully!</p>
        <p><strong>User:</strong> {user ? `Found (${user.email})` : 'Not authenticated'}</p>
      </main>
    );
  } catch (error) {
    console.error('[ORGS_TEST] Error:', error);
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold mb-4 text-red-500">❌ Orgs Error</h1>
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
