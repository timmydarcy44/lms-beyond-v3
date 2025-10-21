import { supabaseServer } from '@/lib/supabase/server';
import FormationBuilder from './FormationBuilder';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic'; export const revalidate = 0;

export default async function Page({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ org?: string }>;
}) {
  const sb = await supabaseServer();
  const { id: formationId } = await params;
  const { org: orgSlug } = await searchParams;

  // Récupérer toutes les données en parallèle
  const [{ data: formation }, { data: sections }] = await Promise.all([
    sb.from('formations').select('id, title, reading_mode, visibility_mode, published, org_id').eq('id', formationId).single(),
    sb.from('sections').select('id, title, position').eq('formation_id', formationId).order('position', { ascending:true })
  ]);

  if (!formation) {
    return <div className="text-red-400">Formation non trouvée</div>;
  }

  // Si un contexte d'organisation est fourni, vérifier la cohérence
  if (orgSlug) {
    const { data: organization } = await sb
      .from('organizations')
      .select('id, slug')
      .eq('slug', orgSlug)
      .single();

    if (!organization || organization.id !== formation.org_id) {
      console.error('Organization mismatch for formation');
      redirect(`/admin/formations/${formationId}`);
    }
  }

  // Récupérer les chapitres pour toutes les sections
  const sectionIds = sections?.map(s => s.id) ?? [];
  const { data: chapters } = sectionIds.length > 0 
    ? await sb.from('chapters').select('id, section_id, title, position').in('section_id', sectionIds).order('position', { ascending:true })
    : { data: [] };

  // Récupérer les sous-chapitres pour tous les chapitres
  const chapterIds = chapters?.map(c => c.id) ?? [];
  const { data: subchapters } = chapterIds.length > 0
    ? await sb.from('subchapters').select('id, chapter_id, title, position').in('chapter_id', chapterIds).order('position', { ascending:true })
    : { data: [] };

  return (
    <FormationBuilder
      formation={formation}
      sections={sections ?? []}
      chapters={chapters ?? []}
      subchapters={subchapters ?? []}
    />
  );
}