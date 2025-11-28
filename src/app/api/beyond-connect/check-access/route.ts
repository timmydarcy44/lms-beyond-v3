import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { isUserAdminWithFeature } from "@/lib/queries/organization-features";

export async function GET() {
  try {
    const session = await getSession();
    console.log("[beyond-connect/check-access] Session:", session?.id);
    
    if (!session?.id) {
      console.log("[beyond-connect/check-access] No session");
      return NextResponse.json({ hasAccess: false, isAdmin: false });
    }

    // Utiliser le service role client pour contourner RLS (vérification d'autorisation)
    const supabase = getServiceRoleClient() || await getServerClient();
    if (!supabase) {
      console.log("[beyond-connect/check-access] No supabase client");
      return NextResponse.json({ hasAccess: false, isAdmin: false });
    }

    // Récupérer TOUTES les organisations de l'utilisateur (pas seulement la première)
    const { data: memberships, error: membershipError } = await supabase
      .from("org_memberships")
      .select("org_id, role")
      .eq("user_id", session.id);

    console.log("[beyond-connect/check-access] Memberships:", { memberships, error: membershipError, count: memberships?.length || 0 });

    if (membershipError) {
      console.error("[beyond-connect/check-access] Error fetching memberships:", membershipError);
      return NextResponse.json({ hasAccess: false, isAdmin: false });
    }

    if (!memberships || memberships.length === 0) {
      console.log("[beyond-connect/check-access] No membership found");
      return NextResponse.json({ hasAccess: false, isAdmin: false });
    }

    const orgIds = memberships.map(m => m.org_id);
    console.log("[beyond-connect/check-access] Checking feature for org_ids:", orgIds);

    // Vérifier directement dans la table (plus fiable que la RPC)
    console.log("[beyond-connect/check-access] Checking features directly for org_ids:", orgIds);
    const { data: features, error: featureError } = await supabase
      .from("organization_features")
      .select("is_enabled, org_id, feature_key")
      .in("org_id", orgIds)
      .eq("feature_key", "beyond_connect")
      .eq("is_enabled", true);

    console.log("[beyond-connect/check-access] Direct query result:", { 
      features, 
      featureCount: features?.length || 0,
      error: featureError ? { message: featureError.message, code: featureError.code, details: featureError.details } : null 
    });

    const hasAccess = !!features && features.length > 0 && features.some(f => f.is_enabled === true);
    
    if (hasAccess) {
      console.log("[beyond-connect/check-access] ✅ Access granted for orgs:", features?.map(f => f.org_id));
    } else {
      console.log("[beyond-connect/check-access] ❌ No access found for any organization");
    }

    // Vérifier si l'utilisateur est admin dans au moins une organisation avec Beyond Connect
    const isAdmin = await isUserAdminWithFeature("beyond_connect");
    
    console.log("[beyond-connect/check-access] Final result:", { hasAccess, isAdmin });
    
    return NextResponse.json({ hasAccess, isAdmin });
  } catch (error) {
    console.error("[beyond-connect/check-access] Unexpected error:", error);
    return NextResponse.json({ hasAccess: false, isAdmin: false });
  }
}

