// app/test-server-components/page.tsx
import { supabaseServer } from '@/lib/supabase/server';
import { getUserOrganizations } from '@/lib/org-server';

export default async function TestServerComponentsPage() {
  try {
    console.log('🔍 Test Server Components - Starting...');
    
    const sb = await supabaseServer();
    const { data: { user }, error: userError } = await sb.auth.getUser();
    
    if (userError) {
      console.error('❌ Auth error:', userError);
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Auth Error</h1>
          <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(userError, null, 2)}</pre>
        </div>
      );
    }
    
    if (!user) {
      console.log('⚠️ No user found');
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold text-yellow-500 mb-4">No User</h1>
          <p>No authenticated user found. Please log in.</p>
        </div>
      );
    }

    console.log('✅ User authenticated:', user.email);

    // Test getUserOrganizations
    let organizations;
    try {
      console.log('🔄 Testing getUserOrganizations...');
      organizations = await getUserOrganizations();
      console.log('✅ Organizations fetched:', organizations.length);
    } catch (error) {
      console.error('❌ getUserOrganizations error:', error);
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold text-red-500 mb-4">getUserOrganizations Error</h1>
          <pre className="bg-gray-100 p-4 rounded">{JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
          }, null, 2)}</pre>
        </div>
      );
    }

    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-green-500 mb-4">Server Components Test - Success!</h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">User Info</h2>
            <pre className="bg-gray-100 p-4 rounded">{JSON.stringify({
              id: user.id,
              email: user.email,
              created_at: user.created_at
            }, null, 2)}</pre>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold">Organizations ({organizations.length})</h2>
            <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(organizations, null, 2)}</pre>
          </div>
        </div>
      </div>
    );

  } catch (error) {
    console.error('🔍 Test Server Components - Unexpected error:', error);
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Unexpected Error</h1>
        <pre className="bg-gray-100 p-4 rounded">{JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }, null, 2)}</pre>
      </div>
    );
  }
}
