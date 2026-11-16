import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Snapshot = {
  general?: Record<string, unknown> & { publisher?: string; title?: string };
  meta?: Record<string, unknown>;
  [key: string]: unknown;
};

/**
 * Supprime (ou archive) une formation LMS Byound.
 * - Soft : publisher → byound-deleted (disparaît de /super/lms/formations)
 * - Hard : delete row si aucune inscription / rattachement bloquant
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }
  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "id manquant" }, { status: 400 });

  const { data: course, error: loadErr } = await supabase
    .from("courses")
    .select("id, title, status, builder_snapshot")
    .eq("id", id)
    .maybeSingle();

  if (loadErr || !course) {
    return NextResponse.json({ error: loadErr?.message || "Formation introuvable" }, { status: 404 });
  }

  const snap = (course.builder_snapshot ?? {}) as Snapshot;
  const publisher = String(snap.general?.publisher ?? "").toLowerCase();
  if (publisher && publisher !== "byound" && publisher !== "byound-deleted") {
    return NextResponse.json(
      { error: "Seules les formations Byound (LMS super) peuvent être supprimées ici." },
      { status: 403 },
    );
  }

  // Détecter inscriptions / rattachements
  let enrollmentCount = 0;
  for (const col of ["course_id", "online_course_id"] as const) {
    const { count, error } = await supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq(col, id);
    if (!error && typeof count === "number") {
      enrollmentCount = Math.max(enrollmentCount, count);
      break;
    }
  }
  const { count: pathCount } = await supabase
    .from("path_courses")
    .select("id", { count: "exact", head: true })
    .eq("course_id", id);

  const blocked = enrollmentCount > 0 || (pathCount ?? 0) > 0;

  if (!blocked) {
    // Nettoyage léger avant hard delete
    await supabase.from("path_courses").delete().eq("course_id", id);
    const { error: delErr } = await supabase.from("courses").delete().eq("id", id);
    if (!delErr) {
      return NextResponse.json({
        success: true,
        mode: "hard",
        title: course.title,
      });
    }
    // FK elsewhere → soft
    console.warn("[super/lms/formations DELETE] hard failed, soft archive:", delErr.message);
  }

  const nextSnap: Snapshot = {
    ...snap,
    general: {
      ...(snap.general ?? {}),
      publisher: "byound-deleted",
    },
    meta: {
      ...(snap.meta ?? {}),
      deleted_at: new Date().toISOString(),
      deleted_from: "super/lms",
    },
  };

  const { error: softErr } = await supabase
    .from("courses")
    .update({
      builder_snapshot: nextSnap,
      status: "draft",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (softErr) {
    return NextResponse.json({ error: softErr.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    mode: "soft",
    title: course.title,
    reason: blocked
      ? "Formation archivée (inscriptions ou parcours liés) — retirée de la liste Byound."
      : "Formation archivée (suppression définitive bloquée par des dépendances).",
  });
}
