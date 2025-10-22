export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  // Utiliser le client normal pour récupérer l'utilisateur connecté
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ role: null });

  // Utiliser le service role pour bypasser RLS sur org_memberships
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !serviceKey) {
    return NextResponse.json({ role: null });
  }

  const adminSb = createClient(url, serviceKey);
  const { data, error } = await adminSb.from('org_memberships').select('role').eq('user_id', user.id);
  if (error || !data || data.length === 0) return NextResponse.json({ role: null });
  
  const priority = ['admin','instructor','tutor','learner'];
  const role = priority.find(r => data.some(d => d.role === r)) ?? (data[0].role as any);
  
  return NextResponse.json({ role });
}
