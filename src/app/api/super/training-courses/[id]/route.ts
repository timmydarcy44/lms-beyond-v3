import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

const UPDATABLE_FIELDS = [
  "slug",
  "title",
  "short_description",
  "long_description",
  "domain",
  "cover_url",
  "duration",
  "level",
  "formats",
  "objectives",
  "skills",
  "program",
  "prerequisites",
  "audience",
  "intra_price",
  "inter_price",
  "max_intra_participants",
  "badge_name",
  "trainer_id",
  "trainer_name",
  "trainer_headline",
  "trainer_photo_url",
  "is_active",
] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }

  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

    for (const key of UPDATABLE_FIELDS) {
      if (key in body) {
        patch[key] = body[key];
      }
    }

    const { data, error } = await supabase
      .from("training_courses")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ course: data });
  } catch (error) {
    console.error("[api/super/training-courses/[id]] PATCH error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }

  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  try {
    const { id } = await params;
    const { error } = await supabase.from("training_courses").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/super/training-courses/[id]] DELETE error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
