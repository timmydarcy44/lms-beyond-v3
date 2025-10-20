export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get('email') || '';
  if (!email) return NextResponse.json({ error: 'missing email' }, { status: 400 });

  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1, email });
  return NextResponse.json({
    ok: !error,
    found: !!data?.users?.length,
    id: data?.users?.[0]?.id ?? null,
    error: error?.message ?? null,
  });
}
