import { NextRequest, NextResponse } from "next/server";

import { generateJSON } from "@/lib/ai/openai-client";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { kind?: string; title?: string; prompt?: string } | null;
  const kind = body?.kind === "prerequis" ? "prérequis" : "objectifs pédagogiques";
  const title = String(body?.title ?? "").trim();
  const prompt = String(body?.prompt ?? "").trim();
  if (prompt.length < 8 && title.length < 3) {
    return NextResponse.json({ error: "Décrivez le sujet, ou donnez d'abord un titre à la formation." }, { status: 400 });
  }
  const result = await generateJSON(
    `Formation : ${title || "sans titre"}. Consigne : ${prompt || title}. Propose 5 ${kind}, une idée par ligne, concrets et en français.`,
    { type: "object", properties: { lines: { type: "array", items: { type: "string" } } }, required: ["lines"] },
    "Tu réponds uniquement avec un JSON {\"lines\": string[]}.",
  );
  const lines = Array.isArray(result?.lines) ? result.lines.map((line: unknown) => String(line ?? "").trim()).filter(Boolean).slice(0, 8) : [];
  if (!lines.length) return NextResponse.json({ error: "L'IA n'a pas pu générer de lignes." }, { status: 502 });
  return NextResponse.json({ lines });
}
