import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getServerClient } from "@/lib/supabase/server";
import { hasUserFeature } from "@/lib/queries/organization-features";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ hasAccess: false, isAdmin: false }, { status: 200 });
    }

    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ hasAccess: false, isAdmin: false }, { status: 200 });
    }

    // Vérifier si l'utilisateur a accès à Beyond Note
    const hasAccess = await hasUserFeature("beyond_note");

    // Vérifier si l'utilisateur est admin dans au moins une organisation
    const { data: memberships } = await supabase
      .from("org_memberships")
      .select("role")
      .eq("user_id", session.id)
      .eq("role", "admin")
      .limit(1);

    const isAdmin = memberships && memberships.length > 0;

    return NextResponse.json({
      hasAccess,
      isAdmin,
    });
  } catch (error) {
    console.error("[beyond-note/check-access] Error:", error);
    return NextResponse.json(
      { hasAccess: false, isAdmin: false },
      { status: 500 }
    );
  }
}

