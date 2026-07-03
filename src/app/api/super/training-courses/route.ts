import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { catalogModuleToCourseRow } from "@/lib/training-courses/catalog-fallback";
import { EDGE_TRAINING_MODULES } from "@/lib/edge-site/training-catalog";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

const SELECT_COLS =
  "id,slug,title,short_description,long_description,domain,cover_url,duration,level,formats,objectives,skills,program,prerequisites,audience,intra_price,inter_price,max_intra_participants,badge_name,meta_description,seo_tags,faq,why_choose,trainer_id,trainer_name,trainer_headline,trainer_photo_url,is_active,created_at,updated_at";

export async function GET() {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }

  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("training_courses")
    .select(SELECT_COLS)
    .order("title", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ courses: data ?? [] });
}

export async function POST(request: NextRequest) {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }

  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  try {
    const body = await request.json();

    if (body.action === "sync-catalog") {
      const rows = EDGE_TRAINING_MODULES.map((m) => {
        const row = catalogModuleToCourseRow(m.id);
        const { id: _id, created_at: _c, updated_at: _u, ...rest } = row;
        return { ...rest, updated_at: new Date().toISOString() };
      });

      const { data, error } = await supabase
        .from("training_courses")
        .upsert(rows, { onConflict: "slug" })
        .select("slug");

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ synced: data?.length ?? 0 });
    }

    const payload = {
      slug: body.slug,
      title: body.title,
      short_description: body.short_description ?? null,
      long_description: body.long_description ?? null,
      domain: body.domain ?? null,
      cover_url: body.cover_url ?? null,
      duration: body.duration ?? null,
      level: body.level ?? null,
      formats: body.formats ?? null,
      objectives: body.objectives ?? null,
      skills: body.skills ?? null,
      program: body.program ?? null,
      prerequisites: body.prerequisites ?? null,
      audience: body.audience ?? null,
      intra_price: body.intra_price ?? null,
      inter_price: body.inter_price ?? null,
      max_intra_participants: body.max_intra_participants ?? 12,
      badge_name: body.badge_name ?? null,
      trainer_id: body.trainer_id ?? null,
      trainer_name: body.trainer_name ?? null,
      trainer_headline: body.trainer_headline ?? null,
      trainer_photo_url: body.trainer_photo_url ?? null,
      is_active: body.is_active ?? true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("training_courses").insert(payload).select().single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ course: data });
  } catch (error) {
    console.error("[api/super/training-courses] POST error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
