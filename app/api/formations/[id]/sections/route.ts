import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getCurrentOrgId } from '@/lib/org';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const formationId = params.id;
    const sb = await supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await getCurrentOrgId();
    if (!orgId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
    }

    // Charger les sections avec tri par position (fallback created_at)
    const { data: sections, error: sectionsError } = await sb
      .from('sections')
      .select(`
        id,
        title,
        position,
        created_at,
        chapters (
          id,
          title,
          position,
          created_at,
          subchapters (
            id,
            title,
            position,
            created_at
          )
        )
      `)
      .eq('formation_id', formationId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (sectionsError) {
      console.error('Error fetching sections:', sectionsError);
      return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 });
    }

    // Trier les chapitres par position
    const sectionsWithSortedChapters = sections?.map(section => ({
      ...section,
      chapters: section.chapters
        ?.sort((a, b) => {
          // Tri par position si disponible, sinon par created_at
          if (a.position !== null && b.position !== null) {
            return a.position - b.position;
          }
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        })
        .map(chapter => ({
          ...chapter,
          subchapters: chapter.subchapters
            ?.sort((a, b) => {
              // Tri par position si disponible, sinon par created_at
              if (a.position !== null && b.position !== null) {
                return a.position - b.position;
              }
              return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            })
        }))
    }));

    return NextResponse.json(sectionsWithSortedChapters || []);
  } catch (error) {
    console.error('Error in sections API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
