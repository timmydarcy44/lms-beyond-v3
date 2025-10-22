export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getSingleOrg } from '@/lib/org-single';

export async function GET() {
  try {
    const org = await getSingleOrg();
    return NextResponse.json({
      success: true,
      organization: org,
      message: 'Configuration mono-org OK'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Configuration mono-org manquante',
      required: {
        SINGLE_ORG_SLUG: 'Slug de l\'organisation unique',
        SINGLE_ORG_ID: 'OU ID de l\'organisation unique',
        NEXT_PUBLIC_SUPABASE_URL: 'URL Supabase',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'Clé anonyme Supabase'
      }
    }, { status: 500 });
  }
}
