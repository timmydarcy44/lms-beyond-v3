export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic'; export const revalidate = 0;

export async function GET() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  const res = { user: user ? { id: user.id, email: user.email } : null } as any;

  const q = await sb.from('formations')
    .select('id, title, org_id, created_by, visibility_mode, published, updated_at')
    .order('updated_at', { ascending: false });

  res.error = q.error ?? null;
  res.count = q.data?.length ?? 0;
  res.sample = q.data?.slice(0, 5) ?? [];

  return NextResponse.json(res);
}
