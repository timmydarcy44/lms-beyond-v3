import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { generateJSON } from "@/lib/ai/openai-client";
import { defaultsForPath } from "@/lib/seo/byound-seo";

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const body = (await req.json().catch(() => null)) as { path?: string } | null;
  const path = String(body?.path ?? "").trim();
  if (!path.startsWith("/")) return NextResponse.json({ error: "Chemin invalide" }, { status: 400 });
  const defaults = defaultsForPath(path);
  const generated = await generateJSON(
    `Page Byound (www.byound.fr${path}).
Titre actuel: ${defaults.title}
H1 actuel: ${defaults.h1}
Description actuelle: ${defaults.meta_description}
Rédige un SEO français vouvoiement, factuel, sans superlatifs creux.
title 50-60 car, meta_description 140-160 car, h1 une phrase, 3 à 5 h2, ai_summary 400-700 car pour citations IA (ChatGPT, Perplexity), 3 FAQ question/answer.
Réponds uniquement en JSON.`,
    {
      type: "object",
      properties: {
        title: { type: "string" },
        meta_description: { type: "string" },
        h1: { type: "string" },
        h2: { type: "array", items: { type: "string" } },
        ai_summary: { type: "string" },
        faq: { type: "array", items: { type: "object", properties: { question: { type: "string" }, answer: { type: "string" } } } },
        keywords: { type: "array", items: { type: "string" } },
      },
    },
    "Tu es un expert SEO et GEO (référencement dans les moteurs d'IA) pour Byound, organisme de formation et compétences.",
  );
  if (!generated) return NextResponse.json({ error: "Génération IA indisponible." }, { status: 503 });
  return NextResponse.json({ ok: true, draft: generated });
}
