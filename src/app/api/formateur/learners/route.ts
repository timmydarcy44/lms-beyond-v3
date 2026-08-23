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
        // Staff org OU responsable école/entreprise (school_id / company_id).
        const { data: profile } = await supabase
          .from("profiles")
          .select("school_id, company_id")
          .eq("id", userId)
          .maybeSingle();
        const p = profile as { school_id?: string | null; company_id?: string | null } | null;
        const ownsOrg = p?.school_id === orgId || p?.company_id === orgId;

        const { data: staff, error: staffErr } = await supabase
          .from("org_memberships")
          .select("org_id")
          .eq("org_id", orgId)
          .eq("user_id", userId)
          .in("role", ["instructor", "formateur", "admin", "tutor", "entreprise", "admin_hr", "rh", "manager", "ecole"]);
        if (!ownsOrg && (staffErr || !staff?.length)) {
          return NextResponse.json({ learners: [] }, { status: 403 });
        }
      }

      // Utilise service role pour éviter les trous RLS côté org_memberships/profiles.
      const adminClient = await getServiceRoleClientOrFallback();
      const client = adminClient ?? supabase;

      // Learners strictly in this org (role learner | student | salarie…)
      const { data: memberships, error: mError } = await client
        .from("org_memberships")
        .select("user_id")
        .eq("org_id", orgId)
        .in("role", ["learner", "student", "apprenant", "salarie", "employee", "member"]);

      if (mError || !memberships) return NextResponse.json({ learners: [] });
      const userIds = Array.from(new Set(memberships.map((m: { user_id?: string }) => m.user_id).filter(Boolean)));

      const { data: linked } = await client
        .from("profiles")
        .select("id")
        .or(`school_id.eq.${orgId},company_id.eq.${orgId}`)
        .limit(2000);
      for (const row of linked ?? []) {
        const id = String((row as { id?: string }).id ?? "");
        if (id) userIds.push(id);
      }
      const uniqueUserIds = Array.from(new Set(userIds.map(String).filter(Boolean)));
      if (uniqueUserIds.length === 0) return NextResponse.json({ learners: [] });

      const { data: profiles, error: pError } = await client
        .from("profiles")
        .select("id, full_name, email")
        .in("id", uniqueUserIds)
        .order("full_name", { ascending: true });

      if (pError || !profiles) return NextResponse.json({ learners: [] });
      return NextResponse.json({
        learners: profiles.map((p: { id: string; full_name?: string | null; email?: string | null }) => ({
          id: String(p.id),
          full_name: p.full_name ?? null,
          email: p.email ?? null,
        })),
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

