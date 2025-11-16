import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const sessionClient = await getServerClient();
    if (!sessionClient) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: authData } = await sessionClient.auth.getUser();
    if (!authData?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const supabase = await getServiceRoleClientOrFallback();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const userId = authData.user.id;

    console.log("[drive/instructors] Fetching instructors for learner:", userId);

    // Récupérer les organisations de l'apprenant
    const { data: learnerMemberships, error: learnerError } = await supabase
      .from("org_memberships")
      .select("org_id, role")
      .eq("user_id", userId)
      .eq("role", "learner");

    console.log("[drive/instructors] Learner memberships:", {
      count: learnerMemberships?.length || 0,
      memberships: learnerMemberships,
      error: learnerError,
    });

    if (!learnerMemberships || learnerMemberships.length === 0) {
      console.warn("[drive/instructors] No learner memberships found for user:", userId);
      return NextResponse.json({ instructors: [] });
    }

    const orgIds = learnerMemberships.map((m) => m.org_id);
    console.log("[drive/instructors] Organization IDs:", orgIds);

    // Récupérer les formateurs dans ces organisations
    const { data: instructorMemberships, error: instructorError } = await supabase
      .from("org_memberships")
      .select("user_id, org_id, role")
      .in("org_id", orgIds)
      .eq("role", "instructor");

    if (instructorError) {
      console.warn("[drive/instructors] Error while fetching instructors:", instructorError);
    }

    const instructorIds = new Set<string>(
      (instructorMemberships ?? []).map((membership) => membership.user_id),
    );

    const { data: adminMemberships } = await supabase
      .from("org_memberships")
      .select("user_id")
      .in("org_id", orgIds)
      .eq("role", "admin");

    (adminMemberships ?? []).forEach((membership) => instructorIds.add(membership.user_id));

    if (instructorIds.size === 0) {
      console.warn("[drive/instructors] No instructors or admins found in organizations:", orgIds);
      return NextResponse.json({ instructors: [] });
    }

    const instructorIdsArray = Array.from(instructorIds);

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", instructorIdsArray);

    console.log("[drive/instructors] Profiles fetched:", {
      count: profiles?.length || 0,
      profiles: profiles,
      error: profilesError,
    });

    if (!profiles || profiles.length === 0) {
      console.warn("[drive/instructors] No profiles found for instructor IDs:", instructorIdsArray);
      return NextResponse.json({ instructors: [] });
    }

    const instructors = profiles.map((p) => ({
      id: p.id,
      name: p.full_name || p.email || "Formateur",
      email: p.email || "",
    }));

    console.log("[drive/instructors] Final instructors list:", instructors);

    return NextResponse.json({ instructors });
  } catch (error) {
    console.error("[drive/instructors] Error:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

