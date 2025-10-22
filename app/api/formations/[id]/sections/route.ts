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

    // Types minimalistes locaux pour satisfaire TS sans tout refactorer
    type ChapterLite = {
      id: string;
      position: number | null;
      created_at: string | null;
      // autres champs ignorés
      [key: string]: any;
    };

    type SubchapterLite = {
      id: string;
      position: number | null;
      created_at: string | null;
      // autres champs ignorés
      [key: string]: any;
    };

    // Trier les chapitres par position
    const sectionsWithSortedChapters = sections?.map(section => {
      const sortedChapters = (section.chapters as ChapterLite[] | null | undefined)
        ?.slice()
        .sort((a: ChapterLite, b: ChapterLite) => {
          // Tri par position si disponible, sinon par created_at
          const pa = a?.position ?? Number.MAX_SAFE_INTEGER;
          const pb = b?.position ?? Number.MAX_SAFE_INTEGER;
          if (pa !== pb) return pa - pb;

          const ca = a?.created_at ? Date.parse(a.created_at) : 0;
          const cb = b?.created_at ? Date.parse(b.created_at) : 0;
          return ca - cb; // (asc)
        }) ?? [];

      return {
        ...section,
        chapters: sortedChapters.map(chapter => {
          const sortedSubchapters = (chapter.subchapters as SubchapterLite[] | null | undefined)
            ?.slice()
            .sort((a: SubchapterLite, b: SubchapterLite) => {
              // Tri par position si disponible, sinon par created_at
              const pa = a?.position ?? Number.MAX_SAFE_INTEGER;
              const pb = b?.position ?? Number.MAX_SAFE_INTEGER;
              if (pa !== pb) return pa - pb;

              const ca = a?.created_at ? Date.parse(a.created_at) : 0;
              const cb = b?.created_at ? Date.parse(b.created_at) : 0;
              return ca - cb; // (asc)
            }) ?? [];

          return {
            ...chapter,
            subchapters: sortedSubchapters,
          };
        }),
      };
    });

    return NextResponse.json(sectionsWithSortedChapters || []);
  } catch (error) {
    console.error('Error in sections API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
