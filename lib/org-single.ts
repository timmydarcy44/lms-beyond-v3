import { supabaseServer } from '@/lib/supabase/server';

export async function getSingleOrg() {
  const slug = process.env.SINGLE_ORG_SLUG || '';
  const id = process.env.SINGLE_ORG_ID || '';
  
  if (!slug && !id) {
    // En développement, retourner une org mock pour éviter les erreurs
    if (process.env.NODE_ENV === 'development') {
      console.warn('[getSingleOrg] Variables d\'environnement manquantes, utilisation d\'une org mock');
      return { orgId: 'mock-org-id', slug: 'mock-org' };
    }
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
    // En développement, retourner une org mock
    if (process.env.NODE_ENV === 'development') {
      console.warn('[getSingleOrg] Erreur Supabase, utilisation d\'une org mock:', error?.message);
      return { orgId: 'mock-org-id', slug: slug || 'mock-org' };
    }
    throw new Error(`Single org not found: ${error?.message || 'No data'}`);
  }
  
  return { orgId: data.id, slug: data.slug };
}
