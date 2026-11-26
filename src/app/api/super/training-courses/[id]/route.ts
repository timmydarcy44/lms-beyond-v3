import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import { assessQualiopiFicheCompliance } from "@/lib/training-courses/qualiopi-fiche";

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
  "program_structure",
  "prerequisites",
  "audience",
  "intra_price",
  "inter_price",
  "max_intra_participants",
  "badge_name",
  "badge_class_id",
  "meta_description",
  "seo_tags",
  "faq",
  "why_choose",
  "instructors",
  "page_blocks",
  "sessions",
  "benefits",
  "case_studies",
  "deliverables",
  "methodology",
  "illustrations",
  "trainer_id",
  "trainer_name",
  "trainer_headline",
  "trainer_photo_url",
  "is_active",
  "recognition_type",
  "recognition_detail",
  "pedagogical_modality",
  "pedagogical_modality_detail",
  "financing_modalities",
  "price_on_quote",
  "results_method_override",
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

    // Garde-fou Qualiopi : une fiche active (site public) doit être « Qualiopi OK ».
    const activating = patch.is_active === true || patch.is_active === "true";
    if (activating || patch.is_active === undefined) {
      const { data: current } = await supabase
        .from("training_courses")
        .select(
          "objectives, recognition_type, recognition_detail, pedagogical_modality, pedagogical_modality_detail, financing_modalities, duration, price_on_quote, intra_price, inter_price, is_active",
        )
        .eq("id", id)
        .maybeSingle();
      const merged = { ...(current ?? {}), ...patch } as Record<string, unknown>;
      const willBeActive = Boolean(merged.is_active);
      if (willBeActive) {
        const compliance = assessQualiopiFicheCompliance({
          objectives: (merged.objectives as string[] | null) ?? null,
          recognition_type: (merged.recognition_type as string | null) ?? null,
          recognition_detail: (merged.recognition_detail as string | null) ?? null,
          pedagogical_modality: (merged.pedagogical_modality as string | null) ?? null,
          pedagogical_modality_detail:
            (merged.pedagogical_modality_detail as string | null) ?? null,
          financing_modalities: (merged.financing_modalities as string | null) ?? null,
          duration: (merged.duration as string | null) ?? null,
          price_on_quote: Boolean(merged.price_on_quote),
          intra_price:
            merged.intra_price == null ? null : Number(merged.intra_price),
          inter_price:
            merged.inter_price == null ? null : Number(merged.inter_price),
        });
        if (!compliance.ok) {
          return NextResponse.json(
            {
              error: `Impossible de publier sur le site public : la fiche n’est pas « Qualiopi OK ». Manque : ${compliance.missing.join(", ")}.`,
              missing: compliance.missing,
            },
            { status: 400 },
          );
        }
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
