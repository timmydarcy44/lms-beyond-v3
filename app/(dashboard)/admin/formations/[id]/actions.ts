'use server';

import { revalidatePath } from 'next/cache';
import { supabaseServerActions } from '@/lib/supabase/server-actions';
import { supabaseAdmin } from '@/lib/supabase/admin';

async function sbUser() {
  const sb = await supabaseServerActions();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Non authentifié');
  return { sb, user };
}

// Helper to check user permissions for a given formation
async function checkFormationPermissions(sb: any, userId: string, formationId: string) {
  const { data: formation, error: formationError } = await sb.from('formations').select('org_id').eq('id', formationId).single();
  if (formationError || !formation) {
    console.error('Formation not found or error fetching formation:', formationError);
    throw new Error('Formation non trouvée ou erreur de permission.');
  }

  const { data: membership, error: membershipError } = await sb.from('org_memberships')
    .select('role')
    .eq('user_id', userId)
    .eq('org_id', formation.org_id)
    .in('role', ['admin', 'instructor'])
    .single();

  if (membershipError || !membership) {
    console.error('Permissions check failed:', membershipError);
    throw new Error('Permissions insuffisantes.');
  }
  return formation.org_id;
}

// Sections
export async function createSection(formationId: string, title: string) {
  const { sb, user } = await sbUser();
  await checkFormationPermissions(sb, user.id, formationId);

  const { data: last } = await sb.from('sections').select('position').eq('formation_id', formationId).order('position', { ascending: false }).limit(1).maybeSingle();
  const pos = (last?.position ?? -1) + 1;
  const { data, error } = await sb.from('sections').insert({ formation_id: formationId, title, position: pos }).select('id, title, position').single();
  if (error) {
    console.error('Error creating section:', error);
    throw error;
  }
  revalidatePath(`/admin/formations/${formationId}`);
  return data;
}

// Chapters
export async function createChapter(sectionId: string, title: string) {
  const { sb, user } = await sbUser();
  const { data: section, error: sectionError } = await sb.from('sections').select('formation_id').eq('id', sectionId).single();
  if (sectionError || !section) throw new Error('Section non trouvée.');
  await checkFormationPermissions(sb, user.id, section.formation_id);

  const { data: last } = await sb.from('chapters').select('position').eq('section_id', sectionId).order('position', { ascending: false }).limit(1).maybeSingle();
  const pos = (last?.position ?? -1) + 1;
  const { data, error } = await sb.from('chapters').insert({ section_id: sectionId, title, position: pos }).select('id, title, position, section_id').single();
  if (error) {
    console.error('Error creating chapter:', error);
    throw error;
  }
  revalidatePath(`/admin/formations/${section.formation_id}`);
  return data;
}

// Subchapters
export async function createSubchapter(chapterId: string, title: string) {
  const { sb, user } = await sbUser();
  const { data: chapter, error: chapterError } = await sb.from('chapters').select('section_id, sections!inner(formation_id)').eq('id', chapterId).single();
  if (chapterError || !chapter) throw new Error('Chapitre non trouvé.');
  await checkFormationPermissions(sb, user.id, (chapter as any).sections.formation_id);

  const { data: last } = await sb.from('subchapters').select('position').eq('chapter_id', chapterId).order('position', { ascending: false }).limit(1).maybeSingle();
  const pos = (last?.position ?? -1) + 1;
  const { data, error } = await sb.from('subchapters').insert({ chapter_id: chapterId, title, position: pos }).select('id, title, position, chapter_id').single();
  if (error) {
    console.error('Error creating subchapter:', error);
    throw error;
  }
  revalidatePath(`/admin/formations/${(chapter as any).sections.formation_id}`);
  return data;
}

// Generic Rename
export async function renameNode(type: 'section' | 'chapter' | 'subchapter', id: string, title: string) {
  const { sb } = await sbUser();
  let error;
  
  if (type === 'section') {
    ({ error } = await sb.from('sections').update({ title }).eq('id', id));
  } else if (type === 'chapter') {
    ({ error } = await sb.from('chapters').update({ title }).eq('id', id));
  } else {
    ({ error } = await sb.from('subchapters').update({ title }).eq('id', id));
  }
  
  if (error) throw error;
  return { ok: true };
}

// Generic Delete
export async function deleteNode(type: 'section' | 'chapter' | 'subchapter', id: string) {
  const { sb } = await sbUser();
  let error;
  let formationIdToRevalidate: string | null = null;

  if (type === 'section') {
    const { data: section, error: fetchError } = await sb.from('sections').select('formation_id').eq('id', id).single();
    if (fetchError || !section) throw new Error('Section non trouvée.');
    formationIdToRevalidate = section.formation_id;
    ({ error } = await sb.from('sections').delete().eq('id', id));
  } else if (type === 'chapter') {
    const { data: chapter, error: fetchError } = await sb.from('chapters').select('sections!inner(formation_id)').eq('id', id).single();
    if (fetchError || !chapter) throw new Error('Chapitre non trouvé.');
    formationIdToRevalidate = (chapter as any).sections.formation_id;
    ({ error } = await sb.from('chapters').delete().eq('id', id));
  } else {
    const { data: subchapter, error: fetchError } = await sb.from('subchapters').select('chapters!inner(sections!inner(formation_id))').eq('id', id).single();
    if (fetchError || !subchapter) throw new Error('Sous-chapitre non trouvé.');
    formationIdToRevalidate = (subchapter as any).chapters.sections.formation_id;
    ({ error } = await sb.from('subchapters').delete().eq('id', id));
  }

  if (error) throw error;
  if (formationIdToRevalidate) {
    revalidatePath(`/admin/formations/${formationIdToRevalidate}`);
  } else {
    revalidatePath('/admin/formations');
  }
  return { ok: true };
}

// Rich Content
export async function saveRichContent(args: {
  orgId: string; formationId: string; chapterId?: string; subchapterId?: string;
  editor: any; plainText?: string | null;
}) {
  const { sb, user } = await sbUser();
  const { orgId, formationId, chapterId, subchapterId, editor, plainText = null } = args;

  // Vérifier les permissions avec le client normal
  const { data: membership } = await sb.from('org_memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('org_id', orgId)
    .in('role', ['admin', 'instructor'])
    .single();

  if (!membership) throw new Error('Permissions insuffisantes pour modifier le contenu');

  try {
    const targetId = chapterId || subchapterId;
    const targetColumn = chapterId ? 'chapter_id' : 'subchapter_id';

    if (!targetId) {
      throw new Error('Chapter ID or Subchapter ID must be provided.');
    }

    // Utiliser le client admin pour contourner RLS
    const admin = supabaseAdmin();

    const { data: existingContent, error: selectError } = await admin
      .from('rich_contents')
      .select('id')
      .eq(targetColumn, targetId)
      .single();

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing rich content:', selectError);
      throw selectError;
    }

    if (existingContent) {
      const { error } = await admin
        .from('rich_contents')
        .update({ editor, plain_text: plainText, updated_at: new Date().toISOString() })
        .eq('id', existingContent.id);

      if (error) {
        console.error('Error updating rich content:', error);
        throw error;
      }
    } else {
      const { error } = await admin.from('rich_contents').insert({
        formation_id: formationId,
        chapter_id: chapterId || null,
        subchapter_id: subchapterId || null,
        editor,
        plain_text: plainText,
      });

      if (error) {
        console.error('Error inserting rich content:', error);
        throw error;
      }
    }

    revalidatePath(`/admin/formations/${formationId}`);
    return { ok: true };
  } catch (error) {
    console.error('Error in saveRichContent:', error);
    throw error;
  }
}

export async function mockGenerateAIContent(prompt: string) {
  await new Promise(resolve => setTimeout(resolve, 1500));
  return `<p>Ceci est un contenu généré par l'IA basé sur votre prompt : "${prompt}".</p><p>Il pourrait inclure des informations pertinentes sur le sujet.</p>`;
}

// Formation publication actions
export async function saveAsDraft(formationId: string) {
  const { sb, user } = await sbUser();
  await checkFormationPermissions(sb, user.id, formationId);

  const { error } = await sb.from('formations').update({ published: false }).eq('id', formationId);
  if (error) {
    console.error('Error saving as draft:', error);
    throw error;
  }

  revalidatePath(`/admin/formations/${formationId}`);
  return { ok: true, status: 'draft' };
}

export async function publishFormation(formationId: string) {
  const { sb, user } = await sbUser();
  await checkFormationPermissions(sb, user.id, formationId);

  const { error } = await sb.from('formations').update({ published: true }).eq('id', formationId);
  if (error) {
    console.error('Error publishing formation:', error);
    throw error;
  }

  revalidatePath(`/admin/formations/${formationId}`);
  return { ok: true, status: 'published' };
}

export async function updateFormationReadingMode(formationId: string, readingMode: 'free' | 'linear') {
  const { sb, user } = await sbUser();
  await checkFormationPermissions(sb, user.id, formationId);

  const { error } = await sb.from('formations').update({ reading_mode: readingMode }).eq('id', formationId);
  if (error) {
    console.error('Error updating reading mode:', error);
    throw error;
  }

  revalidatePath(`/admin/formations/${formationId}`);
  return { ok: true };
}

// Load existing content
export async function loadRichContent(type: 'chapter' | 'subchapter', id: string) {
  const { sb } = await sbUser(); // No need for user permissions here, RLS handles it

  try {
    const { data, error } = await sb
      .from('rich_contents')
      .select('editor, plain_text')
      .eq(type === 'chapter' ? 'chapter_id' : 'subchapter_id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading rich content:', error);
      throw error;
    }

    return {
      richContent: data?.editor || null,
      plainText: data?.plain_text || null,
    };
  } catch (error) {
    console.error('Error in loadRichContent:', error);
    return {
      richContent: null,
      plainText: null,
    };
  }
}

// Reorder functions
export async function reorderSections(formationId: string, sectionIds: string[]) {
  const { sb, user } = await sbUser();
  await checkFormationPermissions(sb, user.id, formationId);

  for (let i = 0; i < sectionIds.length; i++) {
    const { error } = await sb.from('sections')
      .update({ position: i })
      .eq('id', sectionIds[i])
      .eq('formation_id', formationId);

    if (error) {
      console.error('Error reordering sections:', error);
      throw error;
    }
  }
  revalidatePath(`/admin/formations/${formationId}`);
  return { ok: true };
}

export async function reorderChapters(sectionId: string, chapterIds: string[]) {
  const { sb, user } = await sbUser();
  const { data: section, error: sectionError } = await sb.from('sections').select('formation_id').eq('id', sectionId).single();
  if (sectionError || !section) throw new Error('Section non trouvée.');
  await checkFormationPermissions(sb, user.id, section.formation_id);

  for (let i = 0; i < chapterIds.length; i++) {
    const { error } = await sb.from('chapters')
      .update({ position: i })
      .eq('id', chapterIds[i])
      .eq('section_id', sectionId);

    if (error) {
      console.error('Error reordering chapters:', error);
      throw error;
    }
  }
  revalidatePath(`/admin/formations/${section.formation_id}`);
  return { ok: true };
}

export async function reorderSubchapters(chapterId: string, subchapterIds: string[]) {
  const { sb, user } = await sbUser();
  const { data: chapter, error: chapterError } = await sb.from('chapters').select('section_id, sections!inner(formation_id)').eq('id', chapterId).single();
  if (chapterError || !chapter) throw new Error('Chapitre non trouvé.');
  await checkFormationPermissions(sb, user.id, (chapter as any).sections.formation_id);

  for (let i = 0; i < subchapterIds.length; i++) {
    const { error } = await sb.from('subchapters')
      .update({ position: i })
      .eq('id', subchapterIds[i])
      .eq('chapter_id', chapterId);

    if (error) {
      console.error('Error reordering subchapters:', error);
      throw error;
    }
  }
  revalidatePath(`/admin/formations/${(chapter as any).sections.formation_id}`);
  return { ok: true };
}

// Fonctions pour les assignations (mock pour l'instant)
export async function assignToPathway(formationId: string, pathwayId: string) {
  // Mock implementation
  console.log(`Assigning formation ${formationId} to pathway ${pathwayId}`);
  return { ok: true };
}

export async function unassignFromPathway(formationId: string, pathwayId: string) {
  // Mock implementation
  console.log(`Unassigning formation ${formationId} from pathway ${pathwayId}`);
  return { ok: true };
}

export async function assignContentAction(contentId: string, contentType: 'formation' | 'test' | 'resource', targetType: 'learner' | 'group', targetId: string) {
  // Mock implementation
  console.log(`Assigning ${contentType} ${contentId} to ${targetType} ${targetId}`);
  return { ok: true };
}

// Assign formation content to learners, groups, or pathways
export async function assignFormationContent(
  formationId: string, 
  targetType: 'learner' | 'group' | 'pathway', 
  targetId: string, 
  orgId: string,
  unassign = false
) {
  const { sb, user } = await sbUser();
  
  // Vérifier les permissions sur la formation
  await checkFormationPermissions(sb, user.id, formationId);

  try {
    if (targetType === 'learner') {
      if (unassign) {
        const { error } = await sb
          .from('learner_assignments')
          .delete()
          .eq('learner_id', targetId)
          .eq('content_id', formationId)
          .eq('content_type', 'formation');
        
        if (error) throw error;
      } else {
        const { error } = await sb
          .from('learner_assignments')
          .upsert({
            learner_id: targetId,
            content_id: formationId,
            content_type: 'formation',
            assigned_by: user.id,
            assigned_at: new Date().toISOString()
          });
        
        if (error) throw error;
      }
    } else if (targetType === 'group') {
      if (unassign) {
        const { error } = await sb
          .from('group_assignments')
          .delete()
          .eq('group_id', targetId)
          .eq('content_id', formationId)
          .eq('content_type', 'formation');
        
        if (error) throw error;
      } else {
        const { error } = await sb
          .from('group_assignments')
          .upsert({
            group_id: targetId,
            content_id: formationId,
            content_type: 'formation',
            assigned_by: user.id,
            assigned_at: new Date().toISOString()
          });
        
        if (error) throw error;
      }
    } else if (targetType === 'pathway') {
      if (unassign) {
        const { error } = await sb
          .from('pathway_items')
          .delete()
          .eq('pathway_id', targetId)
          .eq('content_id', formationId)
          .eq('content_type', 'formation');
        
        if (error) throw error;
      } else {
        // Récupérer la position maximale pour ce parcours
        const { data: maxPos } = await sb
          .from('pathway_items')
          .select('position')
          .eq('pathway_id', targetId)
          .order('position', { ascending: false })
          .limit(1)
          .single();

        const { error } = await sb
          .from('pathway_items')
          .upsert({
            pathway_id: targetId,
            content_id: formationId,
            content_type: 'formation',
            position: (maxPos?.position || 0) + 1,
            created_at: new Date().toISOString()
          });
        
        if (error) throw error;
      }
    }

    revalidatePath(`/admin/formations/${formationId}`);
    return { ok: true };
  } catch (error) {
    console.error('Error in assignFormationContent:', error);
    throw error;
  }
}