import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session?.id) {
      return NextResponse.json({ hasOrganization: false });
    }

    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ hasOrganization: false });
    }

    // Vérifier si l'utilisateur est membre d'au moins une organisation
    const { data: memberships, error: membershipError } = await supabase
      .from("org_memberships")
      .select("org_id")
      .eq("user_id", session.id)
      .limit(1);

    if (membershipError || !memberships || memberships.length === 0) {
      return NextResponse.json({ hasOrganization: false });
    }

    return NextResponse.json({ hasOrganization: true });
  } catch (error) {
    console.error("[api/beyond-connect/check-organization] Error:", error);
    return NextResponse.json({ hasOrganization: false });
  }
}


