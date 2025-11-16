import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export async function GET() {
  try {
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    // Récupérer le Super Admin actuel
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Récupérer tous les contenus créés par le Super Admin (timdarcypro@gmail.com)
    const [coursesResult, pathsResult, resourcesResult, testsResult] = await Promise.all([
      supabase
        .from("courses")
        .select("id, title, published, org_id")
        .or(`creator_id.eq.${user.id},owner_id.eq.${user.id}`)
        .order("created_at", { ascending: false }),
      supabase
        .from("paths")
        .select("id, title, published, org_id")
        .or(`creator_id.eq.${user.id},owner_id.eq.${user.id}`)
        .order("created_at", { ascending: false }),
      supabase
        .from("resources")
        .select("id, title, published, org_id")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("tests")
        .select("id, title, published, org_id")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false }),
    ]);

    return NextResponse.json({
      courses: (coursesResult.data || []).map((c) => ({
        id: c.id,
        title: c.title,
        type: "course" as const,
        status: c.published ? "Publié" : "Brouillon",
      })),
      paths: (pathsResult.data || []).map((p) => ({
        id: p.id,
        title: p.title,
        type: "path" as const,
        status: p.published ? "Publié" : "Brouillon",
      })),
      resources: (resourcesResult.data || []).map((r) => ({
        id: r.id,
        title: r.title,
        type: "resource" as const,
        status: r.published ? "Publié" : "Brouillon",
      })),
      tests: (testsResult.data || []).map((t) => ({
        id: t.id,
        title: t.title,
        type: "test" as const,
        status: t.published ? "Publié" : "Brouillon",
      })),
    });
  } catch (error) {
    console.error("[super-admin] Error fetching assignable content:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du contenu" },
      { status: 500 }
    );
  }
}




