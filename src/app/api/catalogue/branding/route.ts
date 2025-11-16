import { NextResponse } from "next/server";
import { getSuperAdminBranding } from "@/lib/queries/super-admin-branding";
import { getServerClient } from "@/lib/supabase/server";

const TIM_SUPER_ADMIN_ID = "60c88469-3c53-417f-a81d-565a662ad2f5";
const TIM_BRANDING = {
  primary_color: "#0f0f10",
  secondary_color: "#1a1b1d",
  accent_color: "#7c7cff",
  background_color: "#000000",
  surface_color: "#111113",
  text_primary_color: "#f5f5f5",
  text_secondary_color: "#c7c7c7",
};

export async function GET() {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ branding: null });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ branding: null });
    }

    // Pour les apprenants B2C, trouver leur Super Admin via catalog_access
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, org_id")
      .eq("id", user.id)
      .single();

    let superAdminId: string | undefined;

    // Si pas d'organisation et que c'est un learner B2C
    if (!profile?.org_id && profile?.role === "learner") {
      const { data: access } = await supabase
        .from("catalog_access")
        .select("catalog_item_id, catalog_items!inner(creator_id)")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      
      if (access && (access as any).catalog_items?.creator_id) {
        superAdminId = (access as any).catalog_items.creator_id;
      }
    }

    let targetSuperAdminId: string | undefined;

    // 1. Si l'utilisateur est lui-même Tim
    if (
      user.id === TIM_SUPER_ADMIN_ID ||
      user.email?.toLowerCase() === "timdarcypro@gmail.com" ||
      profile?.org_id === TIM_SUPER_ADMIN_ID
    ) {
      targetSuperAdminId = TIM_SUPER_ADMIN_ID;
    }

    // 2. Si un superAdminId a été déduit via catalog_access (cas B2C)
    if (!targetSuperAdminId && superAdminId) {
      targetSuperAdminId = superAdminId;
    }

    // 3. Si aucune info, retourner branding par défaut
    if (!targetSuperAdminId) {
      return NextResponse.json({ branding: null });
    }

    if (targetSuperAdminId === TIM_SUPER_ADMIN_ID) {
      // Essayer d'abord de récupérer un branding personnalisé en base
      const branding = await getSuperAdminBranding(targetSuperAdminId);
      return NextResponse.json({ branding: branding ?? TIM_BRANDING });
    }

    // Pour les autres super admins, on renvoie leur branding (ou null)
    const branding = await getSuperAdminBranding(targetSuperAdminId);
    return NextResponse.json({ branding });
  } catch (error) {
    console.error("[api/catalogue/branding] Error:", error);
    return NextResponse.json({ branding: null });
  }
}



