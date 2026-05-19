import { NextRequest, NextResponse } from "next/server";
import { getFormateurLearners } from "@/lib/queries/formateur";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const orgId = url.searchParams.get("orgId");
    if (orgId) {
      const supabase = await getServerClient();
      if (!supabase) return NextResponse.json({ learners: [] });
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user?.id) return NextResponse.json({ learners: [] });
      const userId = authData.user.id;

      const superAdmin = await isSuperAdmin();
      if (!superAdmin) {
        // Vérifie que l'utilisateur a un rôle staff dans cette org avant de lister des apprenants.
        const { data: staff, error: staffErr } = await supabase
          .from("org_memberships")
          .select("org_id")
          .eq("org_id", orgId)
          .eq("user_id", userId)
          .in("role", ["instructor", "formateur", "admin"]);
        if (staffErr || !staff?.length) {
          return NextResponse.json({ learners: [] }, { status: 403 });
        }
      }

      // Utilise service role pour éviter les trous RLS côté org_memberships/profiles.
      const adminClient = await getServiceRoleClientOrFallback();
      const client = adminClient ?? supabase;

      // Learners strictly in this org (role learner | student)
      const { data: memberships, error: mError } = await client
        .from("org_memberships")
        .select("user_id")
        .eq("org_id", orgId)
        .in("role", ["learner", "student"]);

      if (mError || !memberships) return NextResponse.json({ learners: [] });
      const userIds = Array.from(new Set(memberships.map((m: any) => m.user_id).filter(Boolean)));
      if (userIds.length === 0) return NextResponse.json({ learners: [] });

      const { data: profiles, error: pError } = await client
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds)
        .order("full_name", { ascending: true });

      if (pError || !profiles) return NextResponse.json({ learners: [] });
      return NextResponse.json({
        learners: profiles.map((p: any) => ({ id: String(p.id), full_name: p.full_name ?? null, email: p.email ?? null })),
      });
    }

    const learners = await getFormateurLearners();
    console.log("[api/formateur/learners] Returning learners:", {
      count: learners.length,
      learners: learners.map(l => ({ id: l.id, email: l.email, name: l.full_name })),
    });
    return NextResponse.json({ learners });
  } catch (error) {
    console.error("[api/formateur/learners] Error:", error);
    return NextResponse.json(
      { 
        error: "Erreur lors de la récupération des apprenants",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

