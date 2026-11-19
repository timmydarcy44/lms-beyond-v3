import { NextRequest, NextResponse } from "next/server";

import { loadAdmissionQuestionsForSpecialization, loadPrerequisiteLabel } from "@/lib/cfa/load-admission-questions";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const specialization = request.nextUrl.searchParams.get("specialization")?.trim();
  if (!specialization) {
    return NextResponse.json({ error: "Spécialisation manquante." }, { status: 400 });
  }

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const [questions, prerequisiteLabel] = await Promise.all([
    loadAdmissionQuestionsForSpecialization(db, specialization),
    loadPrerequisiteLabel(db, specialization),
  ]);

  return NextResponse.json({ questions, prerequisiteLabel });
}
