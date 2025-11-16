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
    const contentId = searchParams.get("contentId");

    if (!type || !contentId) {
      return NextResponse.json({ error: "Type and contentId parameters required" }, { status: 400 });
    }

    const supabase = await getServiceRoleClientOrFallback();
    let content: any = null;

    switch (type) {
      case "module":
      case "courses": {
        const { data: course, error: courseError } = await supabase
          .from("courses")
          .select("id, title, description, builder_snapshot, cover_image")
          .eq("id", contentId)
          .single();

        if (courseError) {
          console.error("[content-details] Error fetching course:", courseError);
          return NextResponse.json({ error: courseError.message }, { status: 500 });
        }

        // Extraire les métadonnées du builder_snapshot
        const snapshot = course.builder_snapshot;
        content = {
          id: course.id,
          title: snapshot?.general?.title || course.title,
          description: snapshot?.general?.subtitle || course.description || "",
          short_description: snapshot?.general?.subtitle || course.description || "",
          hero_image_url: snapshot?.general?.heroImage || course.cover_image,
          thumbnail_url: course.cover_image || snapshot?.general?.heroImage,
          category: snapshot?.general?.category || "",
          duration: snapshot?.general?.duration || "",
          level: snapshot?.general?.level || "",
          target_audience: snapshot?.general?.target_audience || "pro",
        };
        break;
      }
      case "paths": {
        const { data: path, error: pathError } = await supabase
          .from("paths")
          .select("id, title, description, builder_snapshot")
          .eq("id", contentId)
          .single();

        if (pathError) {
          console.error("[content-details] Error fetching path:", pathError);
          return NextResponse.json({ error: pathError.message }, { status: 500 });
        }

        const snapshot = path.builder_snapshot;
        content = {
          id: path.id,
          title: snapshot?.general?.title || path.title,
          description: snapshot?.general?.subtitle || path.description || "",
          short_description: snapshot?.general?.subtitle || path.description || "",
          hero_image_url: snapshot?.general?.heroImage,
          thumbnail_url: snapshot?.general?.heroImage,
          category: snapshot?.general?.category || "",
          duration: snapshot?.general?.duration || "",
          level: snapshot?.general?.level || "",
          target_audience: snapshot?.general?.target_audience || "pro",
        };
        break;
      }
      case "resources": {
        const { data: resource, error: resourceError } = await supabase
          .from("resources")
          .select("id, title, description")
          .eq("id", contentId)
          .single();

        if (resourceError) {
          console.error("[content-details] Error fetching resource:", resourceError);
          return NextResponse.json({ error: resourceError.message }, { status: 500 });
        }

        content = {
          id: resource.id,
          title: resource.title,
          description: resource.description || "",
          short_description: resource.description || "",
          hero_image_url: null,
          thumbnail_url: null,
          category: "",
          duration: "",
          level: "",
          target_audience: "pro",
        };
        break;
      }
      case "tests": {
        const { data: test, error: testError } = await supabase
          .from("tests")
          .select("id, title, description")
          .eq("id", contentId)
          .single();

        if (testError) {
          console.error("[content-details] Error fetching test:", testError);
          return NextResponse.json({ error: testError.message }, { status: 500 });
        }

        content = {
          id: test.id,
          title: test.title,
          description: test.description || "",
          short_description: test.description || "",
          hero_image_url: null,
          thumbnail_url: null,
          category: "",
          duration: "",
          level: "",
          target_audience: "pro",
        };
        break;
      }
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error("[api/super-admin/catalogue/content-details] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des détails du contenu" },
      { status: 500 }
    );
  }
}

