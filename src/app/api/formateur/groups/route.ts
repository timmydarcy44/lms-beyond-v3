import { NextRequest, NextResponse } from "next/server";
import { getFormateurGroups } from "@/lib/queries/formateur";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const orgId = url.searchParams.get("orgId");

    if (!orgId) {
      const groups = await getFormateurGroups();
      return NextResponse.json({ groups });
    }

    const supabase = await getServerClient();
    if (!supabase) return NextResponse.json({ groups: [] });

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) return NextResponse.json({ groups: [] });

    const userId = authData.user.id;
    const superAdmin = await isSuperAdmin();
    if (!superAdmin) {
      const { data: staff, error: staffErr } = await supabase
        .from("org_memberships")
        .select("org_id")
        .eq("org_id", orgId)
        .eq("user_id", userId)
        .in("role", ["instructor", "formateur", "admin"]);
      if (staffErr || !staff?.length) return NextResponse.json({ groups: [] }, { status: 403 });
    }

    const adminClient = await getServiceRoleClientOrFallback();
    const client = adminClient ?? supabase;

    const { data: groups, error } = await client
      .from("groups")
      .select("id, name, group_members(count)")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error || !groups) return NextResponse.json({ groups: [] });

    return NextResponse.json({
      groups: groups.map((g: any) => ({
        id: String(g.id),
        name: String(g.name ?? "Groupe"),
        members_count: Array.isArray(g.group_members) ? g.group_members.length : 0,
      })),
    });
  } catch (error) {
    console.error("[api/formateur/groups] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}









