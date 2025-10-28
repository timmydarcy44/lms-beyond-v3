import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  return NextResponse.json({
    hasSession: !!user,
    user: user?.email ?? null,
    userId: user?.id ?? null,
    error: error?.message ?? null,
    ts: new Date().toISOString(),
  });
}