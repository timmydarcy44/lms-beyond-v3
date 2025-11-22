import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client unavailable" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json({ error: "courseId required" }, { status: 400 });
    }

    // Récupérer le cours
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, title, status, creator_id, builder_snapshot")
      .eq("id", courseId)
      .single();

    if (courseError) {
      return NextResponse.json({ error: "Course not found", details: courseError }, { status: 404 });
    }

    // Extraire target_audience du snapshot
    const snapshot = course.builder_snapshot as any;
    const targetAudience = snapshot?.general?.target_audience || "all";

    // Vérifier si un catalog_item existe
    const { data: catalogItem, error: catalogError } = await supabase
      .from("catalog_items")
      .select("*")
      .eq("content_id", courseId)
      .eq("item_type", "module")
      .maybeSingle();

    // Vérifier si l'utilisateur est un Super Admin
    const { data: superAdmin } = await supabase
      .from("super_admins")
      .select("user_id")
      .eq("user_id", course.creator_id)
      .eq("is_active", true)
      .maybeSingle();

    return NextResponse.json({
      course: {
        id: course.id,
        title: course.title,
        status: course.status,
        creator_id: course.creator_id,
        target_audience: targetAudience,
      },
      catalogItem: catalogItem || null,
      isSuperAdmin: !!superAdmin,
      catalogError: catalogError || null,
    });
  } catch (error) {
    console.error("[debug/catalog-check] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}



