import { NextRequest, NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/auth/super-admin";
import { CFA_SPECIALIZATIONS, type CfaSpecialization } from "@/lib/cfa-applications";
import {
  listByoundLmsCourseOptions,
  listByoundProgramFacts,
} from "@/lib/byound-school/program-facts-server";
import { getServiceRoleClient } from "@/lib/supabase/server";

function isSpecialization(value: string): value is CfaSpecialization {
  return CFA_SPECIALIZATIONS.some((item) => item.value === value);
}

export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const [programs, courses] = await Promise.all([
    listByoundProgramFacts(),
    listByoundLmsCourseOptions(),
  ]);
  return NextResponse.json({ programs, courses });
}

export async function PATCH(request: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const specialization = String(body?.specialization ?? "").trim();
  if (!isSpecialization(specialization)) {
    return NextResponse.json({ error: "Spécialisation invalide." }, { status: 400 });
  }

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const lmsCourseIdRaw = String(body?.lmsCourseId ?? "").trim();
  const lmsCourseId = lmsCourseIdRaw || null;

  if (lmsCourseId) {
    const { data: course, error: courseError } = await db
      .from("courses")
      .select("id")
      .eq("id", lmsCourseId)
      .maybeSingle();
    if (courseError || !course) {
      return NextResponse.json({ error: "Formation LMS introuvable." }, { status: 400 });
    }
  }

  const patch: Record<string, unknown> = {
    specialization,
    format: String(body?.format ?? "").trim(),
    next_intake: String(body?.nextIntake ?? "").trim(),
    duration: String(body?.duration ?? "").trim(),
    volume: String(body?.volume ?? "").trim(),
    rhythm: String(body?.rhythm ?? "").trim(),
    location: String(body?.location ?? "").trim(),
    level: String(body?.level ?? "").trim(),
    seats_available: String(body?.seatsAvailable ?? "").trim(),
    program_pdf_url: String(body?.programPdfUrl ?? "").trim(),
    hero_image_url: String(body?.heroImageUrl ?? "").trim(),
    lms_course_id: lmsCourseId,
    updated_at: new Date().toISOString(),
  };

  let { error } = await db.from("byound_school_programs").upsert(patch, {
    onConflict: "specialization",
  });

  // Colonnes optionnelles selon migrations appliquées
  if (error && (error.code === "42703" || /lms_course_id|hero_image_url/i.test(error.message))) {
    const retryPatch = { ...patch };
    if (/lms_course_id/i.test(error.message) || error.message.includes("lms_course_id")) {
      delete retryPatch.lms_course_id;
    }
    if (/hero_image_url/i.test(error.message) || error.message.includes("hero_image_url")) {
      delete retryPatch.hero_image_url;
    }
    const retry = await db.from("byound_school_programs").upsert(retryPatch, {
      onConflict: "specialization",
    });
    error = retry.error;
    if (!error && lmsCourseId && !("lms_course_id" in retryPatch)) {
      return NextResponse.json(
        {
          error:
            "Applique la migration byound_school_programs.lms_course_id pour rattacher une formation.",
        },
        { status: 400 },
      );
    }
  }

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message.includes("byound_school_programs") || error.code === "42P01"
            ? "Applique la migration byound_school_programs pour activer l’édition."
            : error.message,
      },
      { status: 400 },
    );
  }

  const [programs, courses] = await Promise.all([
    listByoundProgramFacts(),
    listByoundLmsCourseOptions(),
  ]);
  return NextResponse.json({
    programs,
    courses,
    program: programs.find((item) => item.specialization === specialization),
  });
}
