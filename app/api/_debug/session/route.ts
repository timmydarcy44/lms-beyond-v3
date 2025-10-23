export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/orgs';

export async function GET() {
  try {
    const user = await getSessionUser();
    return NextResponse.json({ ok: true, user });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
