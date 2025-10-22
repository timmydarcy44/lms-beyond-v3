export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST() {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  return NextResponse.redirect(new URL('/login/admin', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));
}
