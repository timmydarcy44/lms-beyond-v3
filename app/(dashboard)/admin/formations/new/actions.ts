'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabaseServerActions } from '@/lib/supabase/server-actions';
import { resolveOrgFromSlugOrThrow } from '@/lib/org-server';

export async function createFormationAction(form: FormData, orgSlug?: string) {
  const sb = await supabaseServerActions();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  // Si orgSlug fourni, utiliser notre helper
  let orgId: string;
  if (orgSlug) {
    const { orgId: resolvedOrgId } = await resolveOrgFromSlugOrThrow(orgSlug);
    orgId = resolvedOrgId;
  } else {
    // Fallback pour compatibilité (à supprimer plus tard)
    const { getDefaultOrgId } = await import('@/lib/org');
    const defaultOrgId = await getDefaultOrgId();
    if (!defaultOrgId) throw new Error('Aucune organisation associée à votre compte');
    orgId = defaultOrgId;
  }

  const title = String(form.get('title') || '').trim();
  if (!title) throw new Error('Titre obligatoire');

  const description = String(form.get('description') || '');
  const visibility_mode = String(form.get('visibility_mode') || 'catalog_only') as any;
  const reading_mode = String(form.get('reading_mode') || 'free') as any;
  const published = form.get('published') === 'on';
  const cover_url = String(form.get('cover_url') || '').trim() || null;
  const theme = String(form.get('theme') || '').trim() || null;

  const { data: inserted, error } = await sb
    .from('formations')
    .insert({
      org_id: orgId,
      title,
      description,
      cover_url,
      visibility_mode,
      reading_mode,
      published,
      status: published ? 'published' : 'draft',
      created_by: user.id,
      theme,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message || 'Échec de création');

  revalidatePath('/admin/formations');
  
  return {
    ok: true,
    formation: { id: inserted.id }
  };
}