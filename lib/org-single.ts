import { supabaseServer } from '@/lib/supabase/server';

export async function getSingleOrg() {
  const slug = process.env.SINGLE_ORG_SLUG || '';
  const id = process.env.SINGLE_ORG_ID || '';
  
  if (!slug && !id) {
    throw new Error('SINGLE_ORG_{SLUG|ID} missing');
  }

  // Si ID fourni → renvoyer directement
  if (id) {
    return { orgId: id, slug: slug || null };
  }

  // Sinon résoudre l'ID via le slug
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from('organizations')
    .select('id, slug')
    .eq('slug', slug)
    .maybeSingle();
    
  if (error || !data) {
    throw new Error(`Single org not found: ${error?.message || 'No data'}`);
  }
  
  return { orgId: data.id, slug: data.slug };
}
