import { NextRequest, NextResponse } from "next/server";

import { CFA_SPECIALIZATIONS, type CfaSpecialization } from "@/lib/cfa-applications";
import { getServiceRoleClient } from "@/lib/supabase/server";

function isSpecialization(value: string): value is CfaSpecialization {
  return CFA_SPECIALIZATIONS.some((item) => item.value === value);
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const firstName = String(body?.firstName ?? "").trim();
  const lastName = String(body?.lastName ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const phone = String(body?.phone ?? "").trim();
  const specialization = String(body?.specialization ?? "").trim();

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "Indiquez votre nom et votre prénom." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Indiquez une adresse mail valide." }, { status: 400 });
  }
  if (phone.replace(/\D/g, "").length < 8) {
    return NextResponse.json({ error: "Indiquez un numéro de téléphone." }, { status: 400 });
  }
  if (!isSpecialization(specialization)) {
    return NextResponse.json({ error: "Cursus introuvable." }, { status: 400 });
  }

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const { data: program, error: programError } = await db
    .from("byound_school_programs")
    .select("program_pdf_url")
    .eq("specialization", specialization)
    .maybeSingle();

  const downloadUrl = String(program?.program_pdf_url ?? "").trim();
  if (programError || !downloadUrl) {
    return NextResponse.json(
      { error: "Le programme n’est pas encore disponible au téléchargement." },
      { status: 404 },
    );
  }

  const { error } = await db.from("cfa_program_downloads").insert({
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    specialization,
  });

  if (error) {
    const missing =
      error.code === "42P01" || error.message.includes("cfa_program_downloads");
    return NextResponse.json(
      {
        error: missing
          ? "Le téléchargement n’est pas encore activé."
          : "Enregistrement impossible.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ downloadUrl });
}
