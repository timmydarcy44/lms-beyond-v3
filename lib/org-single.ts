import { supabaseServer } from '@/lib/supabase/server';

export async function getSingleOrg() {
  const slug = process.env.SINGLE_ORG_SLUG;
  const id = process.env.SINGLE_ORG_ID;
  
  if (!slug && !id) {
    throw new Error('SINGLE_ORG_SLUG or SINGLE_ORG_ID must be set in environment variables');
  }

  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Si on a un slug, chercher par slug
  if (slug) {
    const { data: org, error } = await sb
      .from('organizations')
      .select('id, slug, name')
      .eq('slug', slug)
      .single();
    
    if (error || !org) {
      throw new Error(`Organization with slug '${slug}' not found`);
    }
    
    return org;
  }
  
  // Sinon chercher par ID
  if (id) {
    const { data: org, error } = await sb
      .from('organizations')
      .select('id, slug, name')
      .eq('id', id)
      .single();
    
    if (error || !org) {
      throw new Error(`Organization with ID '${id}' not found`);
    }
    
    return org;
  }
  
  throw new Error('No organization identifier provided');
}
