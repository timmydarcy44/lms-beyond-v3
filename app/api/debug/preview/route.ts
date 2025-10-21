// app/api/debug/preview/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const sb = await supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Test des tables
    const tests = {
      formations: await sb.from('formations').select('id, title').limit(1),
      sections: await sb.from('sections').select('id, title, formation_id').limit(1),
      chapters: await sb.from('chapters').select('id, title, section_id').limit(1),
      subchapters: await sb.from('subchapters').select('id, title, chapter_id').limit(1),
    };

    return NextResponse.json({
      user: user.email,
      tests: Object.fromEntries(
        Object.entries(tests).map(([key, result]) => [
          key,
          { data: result.data, error: result.error }
        ])
      )
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
