import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClientOrFallback, getServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (!type) {
      return NextResponse.json({ error: "Type parameter required" }, { status: 400 });
    }

    // Récupérer l'utilisateur depuis la session Next.js (plus fiable)
    const serverClient = await getServerClient();
    const { data: { user }, error: userError } = await serverClient.auth.getUser();
    
    if (userError || !user) {
      console.error("[existing-content] User error:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Utiliser le service role client pour récupérer les contenus (bypass RLS)
    const supabase = await getServiceRoleClientOrFallback();

    let content = [];

    switch (type) {
      case "courses": {
        // Récupérer TOUS les modules/courses créés par ce Super Admin
        const { data: courses, error: coursesError } = await supabase
          .from("courses")
          .select("id, title, status, created_at")
          .or(`creator_id.eq.${user.id},owner_id.eq.${user.id}`)
          .order("created_at", { ascending: false });

        if (coursesError) {
          console.error("[existing-content] Error fetching courses:", coursesError);
          console.error("[existing-content] User ID:", user.id);
          return NextResponse.json({ error: coursesError.message }, { status: 500 });
        }

        console.log("[existing-content] Found courses:", courses?.length || 0, "for user:", user.id);
        content = courses || [];
        break;
      }
      case "paths": {
        const { data: paths, error: pathsError } = await supabase
          .from("paths")
          .select("id, title, status, created_at")
          .or(`creator_id.eq.${user.id},owner_id.eq.${user.id}`)
          .order("created_at", { ascending: false });

        if (pathsError) {
          console.error("[existing-content] Error fetching paths:", pathsError);
          return NextResponse.json({ error: pathsError.message }, { status: 500 });
        }

        console.log("[existing-content] Found paths:", paths?.length || 0, "for user:", user.id);
        content = paths || [];
        break;
      }
      case "resources": {
        const { data: resources, error: resourcesError } = await supabase
          .from("resources")
          .select("id, title, published, created_at")
          .eq("created_by", user.id)
          .order("created_at", { ascending: false });

        if (resourcesError) {
          console.error("[existing-content] Error fetching resources:", resourcesError);
          return NextResponse.json({ error: resourcesError.message }, { status: 500 });
        }

        console.log("[existing-content] Found resources:", resources?.length || 0, "for user:", user.id);
        content = (resources || []).map((r) => ({
          id: r.id,
          title: r.title,
          status: r.published ? "published" : "draft",
          created_at: r.created_at,
        }));
        break;
      }
      case "tests": {
        const { data: tests, error: testsError } = await supabase
          .from("tests")
          .select("id, title, status, created_at")
          .or(`created_by.eq.${user.id},owner_id.eq.${user.id}`)
          .order("created_at", { ascending: false });

        if (testsError) {
          console.error("[existing-content] Error fetching tests:", testsError);
          return NextResponse.json({ error: testsError.message }, { status: 500 });
        }

        console.log("[existing-content] Found tests:", tests?.length || 0, "for user:", user.id);
        content = tests || [];
        break;
      }
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error("[api/super-admin/catalogue/existing-content] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des contenus" },
      { status: 500 }
    );
  }
}

