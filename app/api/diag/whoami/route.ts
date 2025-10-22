export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ user_present: false });

  const { data, error } = await sb
    .from('org_memberships')
    .select('org_id, role, organizations!inner(slug,name)')
    .eq('user_id', user.id);

  return NextResponse.json({
    user_present: true,
    user: { id: user.id, email: user.email },
    orgs: (data || []).map((r: any) => ({ org_id: r.org_id, role: r.role, slug: r.organizations.slug, name: r.organizations.name })),
    error: error?.message ?? null,
  });
}