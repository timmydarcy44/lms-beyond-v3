// lib/org-server-simple.ts - Version simplifiée du helper
import { supabaseServer } from '@/lib/supabase/server';

export async function getUserOrganizationsSimple(): Promise<Array<{ id: string; slug: string; name: string; cover_url?: string }>> {
  try {
    console.log('🔄 getUserOrganizationsSimple - Starting...');
    
    const sb = await supabaseServer();
    console.log('✅ Supabase client created');
    
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      console.log('❌ No user found');
      throw new Error('UNAUTH');
    }
    
    console.log('✅ User authenticated:', user.email);

    // Requête simplifiée sans join complexe
    const { data: memberships, error: membershipsError } = await sb
      .from('org_memberships')
      .select('org_id, role')
      .eq('user_id', user.id);

    if (membershipsError) {
      console.error('❌ Memberships error:', membershipsError);
      throw new Error(`Failed to fetch memberships: ${membershipsError.message}`);
    }

    if (!memberships || memberships.length === 0) {
      console.log('⚠️ No memberships found');
      return [];
    }

    console.log('✅ Memberships found:', memberships.length);

    // Récupérer les organisations séparément
    const orgIds = memberships.map(m => m.org_id);
    const { data: organizations, error: orgsError } = await sb
      .from('organizations')
      .select('id, slug, name, cover_url')
      .in('id', orgIds);

    if (orgsError) {
      console.error('❌ Organizations error:', orgsError);
      throw new Error(`Failed to fetch organizations: ${orgsError.message}`);
    }

    console.log('✅ Organizations found:', organizations?.length || 0);

    return organizations || [];

  } catch (error) {
    console.error('❌ getUserOrganizationsSimple error:', error);
    throw error;
  }
}
