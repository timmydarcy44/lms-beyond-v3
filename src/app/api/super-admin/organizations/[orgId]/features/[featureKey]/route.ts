import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { enableOrganizationFeature, disableOrganizationFeature } from "@/lib/queries/organization-features";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; featureKey: string }> }
) {
  const { orgId, featureKey } = await params;
  
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const metadata = body.metadata || null;

    await enableOrganizationFeature(orgId, featureKey, metadata);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/features] Error enabling feature:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'activation de la fonctionnalité" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; featureKey: string }> }
) {
  const { orgId, featureKey } = await params;
  
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    await disableOrganizationFeature(orgId, featureKey);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/features] Error disabling feature:", error);
    return NextResponse.json(
      { error: "Erreur lors de la désactivation de la fonctionnalité" },
      { status: 500 }
    );
  }
}


