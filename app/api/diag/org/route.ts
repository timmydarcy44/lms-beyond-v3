export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { resolveOrgFromSlugOrThrow } from '@/lib/org-server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug') || '';
  try {
    const ctx = await resolveOrgFromSlugOrThrow(slug);
    return NextResponse.json({ ok: true, ctx });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'ERR' }, { status: 400 });
  }
}
