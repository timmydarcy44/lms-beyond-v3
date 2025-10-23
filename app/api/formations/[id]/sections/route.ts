export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getOrgBySlug, getSessionUser, requireOrgAccess } from '@/lib/orgs';

type Ctx = { params: Promise<{ org: string; id: string }> };

export async function GET(_req: Request, context: Ctx) {
  const { org, id } = await context.params;

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok:false, error:'UNAUTH' }, { status:401 });

  const orgRow = await getOrgBySlug(org);
  if (!orgRow) return NextResponse.json({ ok:false, error:'ORG_NOT_FOUND' }, { status:404 });

  await requireOrgAccess(user.id, orgRow.id);

  const sb = await supabaseServer();

  // Exemple de tri typé pour éviter noImplicitAny
  type ChapterLite = { id: string; position: number | null; created_at: string | null; [k: string]: any };

  const { data: sections, error } = await sb
    .from('sections')
    .select('id,title,chapters(id,title,position,created_at)')
    .eq('org_id', orgRow.id)
    .eq('formation_id', id);

  if (error) return NextResponse.json({ ok:false, error: error.message }, { status:400 });

  const payload = (sections ?? []).map((section: any) => {
    const chapters = (section.chapters as ChapterLite[] | undefined)?.slice()?.sort(
      (a: ChapterLite, b: ChapterLite) => {
        const pa = a?.position ?? Number.MAX_SAFE_INTEGER;
        const pb = b?.position ?? Number.MAX_SAFE_INTEGER;
        if (pa !== pb) return pa - pb;
        const ca = a?.created_at ? Date.parse(a.created_at) : 0;
        const cb = b?.created_at ? Date.parse(b.created_at) : 0;
        return ca - cb;
      }
    ) ?? [];
    return { ...section, chapters };
  });

  return NextResponse.json({ ok:true, data: payload });
}