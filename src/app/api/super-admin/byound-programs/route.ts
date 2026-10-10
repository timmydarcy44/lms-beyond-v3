import { NextRequest, NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/auth/super-admin";
import { CFA_SPECIALIZATIONS, type CfaSpecialization } from "@/lib/cfa-applications";
import { listByoundProgramFacts } from "@/lib/byound-school/program-facts-server";
import { getServiceRoleClient } from "@/lib/supabase/server";

function isSpecialization(value: string): value is CfaSpecialization {
  return CFA_SPECIALIZATIONS.some((item) => item.value === value);
}

export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const programs = await listByoundProgramFacts();
  return NextResponse.json({ programs });
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

  const patch = {
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
    updated_at: new Date().toISOString(),
  };

  let { error } = await db.from("byound_school_programs").upsert(patch, {
    onConflict: "specialization",
  });
  if (error && (error.code === "42703" || error.message.includes("hero_image_url"))) {
    const withoutHero = { ...patch };
    delete withoutHero.hero_image_url;
    const retry = await db.from("byound_school_programs").upsert(withoutHero, {
      onConflict: "specialization",
    });
    error = retry.error;
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

  const programs = await listByoundProgramFacts();
  return NextResponse.json({
    programs,
    program: programs.find((item) => item.specialization === specialization),
  });
}
