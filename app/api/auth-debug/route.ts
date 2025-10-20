export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get('email') || '';
  if (!email) return NextResponse.json({ error: 'missing email' }, { status: 400 });

  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const user = data?.users?.find(u => u.email === email);
  return NextResponse.json({
    ok: !error,
    found: !!user,
    id: user?.id ?? null,
    error: error?.message ?? null,
  });
}
