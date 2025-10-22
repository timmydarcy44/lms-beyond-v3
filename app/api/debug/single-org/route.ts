export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getSingleOrg } from '@/lib/org-single';

export async function GET() {
  try {
    const r = await getSingleOrg();
    return NextResponse.json({
      ok: true,
      env: {
        slug: process.env.SINGLE_ORG_SLUG ?? null,
        id: process.env.SINGLE_ORG_ID ?? null,
      },
      resolved: r,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
