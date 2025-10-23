export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getSessionUser, getOrgsForUser } from '@/lib/orgs';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ ok: false, error: 'UNAUTH' }, { status: 401 });
    const orgs = await getOrgsForUser(user.id);
    return NextResponse.json({ ok: true, orgs });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
