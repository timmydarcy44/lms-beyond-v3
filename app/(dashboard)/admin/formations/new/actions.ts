'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabaseServerActions } from '@/lib/supabase/server-actions';
import { getDefaultOrgId } from '@/lib/org';

export async function createFormationAction(form: FormData) {
  const sb = await supabaseServerActions();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const orgId = await getDefaultOrgId();
  if (!orgId) throw new Error('Aucune organisation associée à votre compte');

  const title = String(form.get('title') || '').trim();
  if (!title) throw new Error('Titre obligatoire');

  const description = String(form.get('description') || '');
  const visibility_mode = String(form.get('visibility_mode') || 'catalog_only') as any;
  const reading_mode = String(form.get('reading_mode') || 'free') as any;
  const published = form.get('published') === 'on';
  const cover_url = String(form.get('cover_object_name') || '') || null;
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
  redirect(`/admin/formations/${inserted.id}`);
}