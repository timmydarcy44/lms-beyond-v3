import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getServerClient } from "@/lib/supabase/server";
import { isUserAdminWithFeature } from "@/lib/queries/organization-features";

export async function GET() {
  try {
    const session = await getSession();
    console.log("[beyond-care/check-access] Session:", session?.id);
    
    if (!session?.id) {
      console.log("[beyond-care/check-access] No session");
      return NextResponse.json({ hasAccess: false, isAdmin: false });
    }

    // Vérifier si l'utilisateur a accès à Beyond Care (n'importe quel rôle)
    const supabase = await getServerClient();
    if (!supabase) {
      console.log("[beyond-care/check-access] No supabase client");
      return NextResponse.json({ hasAccess: false, isAdmin: false });
    }

    // Récupérer TOUTES les organisations de l'utilisateur (pas seulement la première)
    const { data: memberships, error: membershipError } = await supabase
      .from("org_memberships")
      .select("org_id, role")
      .eq("user_id", session.id);

    console.log("[beyond-care/check-access] Memberships:", { memberships, error: membershipError, count: memberships?.length || 0 });

    if (membershipError || !memberships || memberships.length === 0) {
      console.log("[beyond-care/check-access] No membership found");
      return NextResponse.json({ hasAccess: false, isAdmin: false });
    }

    const orgIds = memberships.map(m => m.org_id);
    console.log("[beyond-care/check-access] Checking feature for org_ids:", orgIds);

    // Vérifier si AU MOINS UNE organisation a Beyond Care activé
    let hasAccess = false;
    
    for (const orgId of orgIds) {
      const { data: hasAccessRPC, error: rpcError } = await supabase.rpc("has_feature", {
        p_org_id: orgId,
        p_feature_key: "beyond_care",
      });

      console.log("[beyond-care/check-access] RPC result for org", orgId, ":", { hasAccessRPC, error: rpcError });

      if (!rpcError && hasAccessRPC === true) {
        console.log("[beyond-care/check-access] Access granted via RPC for org:", orgId);
        hasAccess = true;
        break;
      }
    }

    // Si la RPC n'a pas trouvé d'accès, vérifier directement dans la table
    if (!hasAccess) {
      console.log("[beyond-care/check-access] RPC didn't find access, trying direct query for all orgs");
      const { data: features, error: featureError } = await supabase
        .from("organization_features")
        .select("is_enabled, org_id, feature_key")
        .in("org_id", orgIds)
        .eq("feature_key", "beyond_care")
        .eq("is_enabled", true);

      console.log("[beyond-care/check-access] Direct query result:", { 
        features, 
        error: featureError ? { message: featureError.message, code: featureError.code, details: featureError.details } : null 
      });

      hasAccess = !!features && features.length > 0 && features.some(f => f.is_enabled === true);
    }

    // Vérifier si l'utilisateur est admin dans au moins une organisation avec Beyond Care
    const isAdmin = await isUserAdminWithFeature("beyond_care");
    
    console.log("[beyond-care/check-access] Final result:", { hasAccess, isAdmin });
    
    return NextResponse.json({ hasAccess, isAdmin });
  } catch (error) {
    console.error("[beyond-care/check-access] Unexpected error:", error);
    return NextResponse.json({ hasAccess: false, isAdmin: false });
  }
}

