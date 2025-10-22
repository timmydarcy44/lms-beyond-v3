// app/admin-auth-only/page.tsx - Test auth seulement
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';

export default async function AdminAuthOnlyPage() {
  try {
    console.log('🔍 Admin Auth Only - Starting...');
    
    const sb = await supabaseServer();
    console.log('✅ Supabase client created');
    
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

    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-green-500 mb-4">Admin Auth Only - Success!</h1>
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
            <h2 className="text-lg font-semibold">Next Steps</h2>
            <p>Authentication works! The issue is likely in the organization logic.</p>
            <div className="mt-4 space-x-4">
              <a 
                href="/admin" 
                className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Try Full Admin Page
              </a>
              <a 
                href="/api/debug/production-error" 
                className="inline-block px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                Production Debug
              </a>
            </div>
          </div>
        </div>
      </div>
    );

  } catch (error) {
    console.error('🔍 Admin Auth Only - Unexpected error:', error);
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
