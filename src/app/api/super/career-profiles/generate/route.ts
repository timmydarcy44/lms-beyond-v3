import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { generateCareerProfileWithAi } from "@/lib/career-profiles/generate-career-profile-ai";

export async function POST(request: NextRequest) {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const sector = String(body.sector ?? "").trim();
    const prompt = String(body.prompt ?? "").trim();

    if (!title && !prompt) {
      return NextResponse.json({ error: "Indiquez au minimum un titre de métier ou un brief." }, { status: 400 });
    }

    if (body.mode === "improve" && !title) {
      return NextResponse.json({ error: "Le titre est requis pour améliorer une fiche." }, { status: 400 });
    }

    const existing = body.existing ?? {};
    const content = await generateCareerProfileWithAi({
      title: title || String(existing.title ?? ""),
      sector,
      prompt,
      existing: body.mode === "improve" ? existing : undefined,
      mode: body.mode === "improve" ? "improve" : "generate",
    });

    if (!content) {
      return NextResponse.json({ error: "IA indisponible — vérifiez OPENAI_API_KEY" }, { status: 503 });
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error("[api/super/career-profiles/generate] error:", error);
    return NextResponse.json({ error: "Erreur interne lors de la génération" }, { status: 500 });
  }
}
