import { NextRequest, NextResponse } from "next/server";
import { getFormateurScopeForSession } from "@/lib/formateur/scope-server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

const COURSE_SELECT = "id, title, status, updated_at, created_at, cover_image, builder_snapshot";

export async function GET(_request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const scope = await getFormateurScopeForSession();
    const serviceOnly = getServiceRoleClient();
    const fullCatalog = Boolean(scope?.fullCatalog && serviceOnly);
    const db = fullCatalog ? serviceOnly! : supabase;

    let courses: unknown[] = [];

    if (fullCatalog) {
      const { data, error } = await db
        .from("courses")
        .select(COURSE_SELECT)
        .order("updated_at", { ascending: false })
        .limit(500);
      if (error) {
        console.error("[api/formateur/courses] Erreur:", error);
        return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
      }
      courses = data ?? [];
    } else if (scope?.orgIds?.length) {
      const ownedRes = await supabase
        .from("courses")
        .select(COURSE_SELECT)
        .or(`creator_id.eq.${user.id},owner_id.eq.${user.id}`)
        .order("updated_at", { ascending: false })
        .limit(100);

      const orgRes = await supabase
        .from("courses")
        .select(COURSE_SELECT)
        .in("org_id", scope.orgIds)
        .order("updated_at", { ascending: false })
        .limit(200);

      const byId = new Map<string, Record<string, unknown>>();
      for (const row of [...(ownedRes.data ?? []), ...(orgRes.data ?? [])]) {
        const r = row as { id?: string | null };
        const id = r?.id != null ? String(r.id) : "";
        if (id) byId.set(id, row as Record<string, unknown>);
      }
      courses = Array.from(byId.values()).sort((a, b) => {
        const ta = String(a.updated_at ?? a.created_at ?? "");
        const tb = String(b.updated_at ?? b.created_at ?? "");
        return tb.localeCompare(ta);
      });
    } else {
      const ownedRes = await supabase
        .from("courses")
        .select(COURSE_SELECT)
        .or(`creator_id.eq.${user.id},owner_id.eq.${user.id}`)
        .order("updated_at", { ascending: false })
        .limit(100);

      if (ownedRes.error) {
        console.error("[api/formateur/courses] Erreur:", ownedRes.error);
        return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
      }

      const { data: memRows, error: memErr } = await supabase
        .from("org_memberships")
        .select("org_id")
        .eq("user_id", user.id)
        .in("role", ["admin", "instructor", "tutor"]);

      if (memErr) {
        console.warn("[api/formateur/courses] org_memberships:", memErr);
      }

      const orgIds = [
        ...new Set(
          (memRows ?? [])
            .map((m: { org_id?: string | null }) => m.org_id)
            .filter(Boolean) as string[],
        ),
      ];

      let orgCourses: unknown[] = [];
      if (orgIds.length > 0) {
        const orgRes = await supabase
          .from("courses")
          .select(COURSE_SELECT)
          .in("org_id", orgIds)
          .order("updated_at", { ascending: false })
          .limit(200);
        if (orgRes.error) {
          console.warn("[api/formateur/courses] courses org:", orgRes.error);
        } else {
          orgCourses = orgRes.data ?? [];
        }
      }

      const byId = new Map<string, Record<string, unknown>>();
      for (const row of [...(ownedRes.data ?? []), ...orgCourses]) {
        const r = row as { id?: string | null };
        const id = r?.id != null ? String(r.id) : "";
        if (id) byId.set(id, row as Record<string, unknown>);
      }
      courses = Array.from(byId.values()).sort((a, b) => {
        const ta = String(a.updated_at ?? a.created_at ?? "");
        const tb = String(b.updated_at ?? b.created_at ?? "");
        return tb.localeCompare(ta);
      });
    }

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("[api/formateur/courses] Erreur inattendue:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
