export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  try {
    const sb = await supabaseServer();
    const { data: { user }, error: authError } = await sb.auth.getUser();
    
    if (authError) {
      return NextResponse.json({ 
        user_present: false, 
        auth_error: authError.message 
      });
    }
    
    if (!user) {
      return NextResponse.json({ user_present: false });
    }

    const { data, error } = await sb
      .from('org_memberships')
      .select('org_id, role, organizations!inner(slug,name)')
      .eq('user_id', user.id);

    return NextResponse.json({
      user_present: true,
      user: { id: user.id, email: user.email },
      memberships: data?.map(r => ({ 
        org_id: r.org_id, 
        role: r.role, 
        slug: (r as any).organizations?.slug,
        name: (r as any).organizations?.name
      })) ?? [],
      error: error?.message ?? null
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      user_present: false 
    });
  }
}
