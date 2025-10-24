export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { getUserMemberships } from "@/lib/server/org-context";
import { withOrg } from "@/lib/urls";

export async function GET(request: NextRequest) {
  try {
    const { sb, user } = await requireUser();
    
    const { searchParams } = new URL(request.url);
    const to = searchParams.get('to');
    const next = searchParams.get('next');
    
    if (!to) {
      return NextResponse.json(
        { ok: false, error: 'Missing "to" parameter' },
        { status: 400 }
      );
    }
    
    // Vérifier que l'utilisateur est membre de l'org cible
    const memberships = await getUserMemberships(sb, user.id);
    const targetOrg = memberships.find(m => m.slug === to.toLowerCase());
    
    if (!targetOrg) {
      // Non membre -> redirect vers org-picker avec message
      return NextResponse.redirect(
        new URL(`/org-picker?denied=${to}`, request.url),
        302
      );
    }
    
    // Construire l'URL de destination
    const destination = next || `/admin/${targetOrg.slug}`;
    const finalUrl = withOrg(destination, targetOrg.slug);
    
    return NextResponse.redirect(new URL(finalUrl, request.url), 302);
    
  } catch (error) {
    console.error('Switch org error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
