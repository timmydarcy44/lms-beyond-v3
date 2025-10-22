// app/admin-simple-org/page.tsx - Test avec helper simplifié
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { getUserOrganizationsSimple } from '@/lib/org-server-simple';

export default async function AdminSimpleOrgPage() {
  try {
    console.log('🔍 Admin Simple Org - Starting...');
    
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
      console.log('⚠️ No user found, redirecting to login');
      redirect('/login/admin');
    }

    console.log('✅ User authenticated:', user.email);

    // Test avec le helper simplifié
    let organizations;
    try {
      console.log('🔄 Testing getUserOrganizationsSimple...');
      organizations = await getUserOrganizationsSimple();
      console.log('✅ Organizations fetched:', organizations.length);
    } catch (error) {
      console.error('❌ getUserOrganizationsSimple error:', error);
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Organizations Error</h1>
          <pre className="bg-gray-100 p-4 rounded">{JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
          }, null, 2)}</pre>
        </div>
      );
    }

    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-green-500 mb-4">Admin Simple Org - Success!</h1>
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
          
          <div>
            <h2 className="text-lg font-semibold">Next Steps</h2>
            <p>Both authentication and organization fetching work!</p>
            <div className="mt-4 space-x-4">
              <a 
                href="/admin" 
                className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Try Full Admin Page
              </a>
            </div>
          </div>
        </div>
      </div>
    );

  } catch (error) {
    console.error('🔍 Admin Simple Org - Unexpected error:', error);
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
