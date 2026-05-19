import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import OpenAI from "openai";

import { resolveSchoolIdForEcoleDashboard } from "@/lib/auth/school-access";
import { getSession } from "@/lib/auth/session";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AnalyzeJsonBody = {
  rawText?: string;
  restructureWithAi?: boolean;
  extractSoftSkillsWithAi?: boolean;
};

function mockFromText(text: string) {
  const t = text.slice(0, 800);
  return {
    title: t.split("\n").find((l) => l.trim().length > 8)?.trim().slice(0, 120) || "Offre importée",
    city: null as string | null,
    salary: null as string | null,
    salary_range: null as string | null,
    contract_type: "Alternance",
    description: text.slice(0, 8000),
    soft_skills: ["Communication", "Autonomie", "Esprit d'équipe", "Organisation", "Rigueur"].filter(() => text.length > 0),
  };
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

  const schoolId = await resolveSchoolIdForEcoleDashboard(session.id, session.email, supabase);
  if (!schoolId) return NextResponse.json({ error: "École non identifiée" }, { status: 403 });

  const ct = request.headers.get("content-type") || "";
  let rawText = "";
  let restructureWithAi = false;
  let extractSoftSkillsWithAi = false;

  if (ct.includes("multipart/form-data")) {
    const fd = await request.formData();
    rawText = String(fd.get("rawText") ?? "").trim();
    const file = fd.get("file") as File | null;
    if (file && file.size > 0 && String(file.type || "").toLowerCase().includes("pdf")) {
      try {
        const buf = Buffer.from(await file.arrayBuffer());
        const parser = new PDFParse({ data: buf });
        try {
          const tr = await parser.getText();
          rawText = `${rawText}\n\n${String(tr.text ?? "").trim()}`.trim();
        } finally {
          await parser.destroy();
        }
      } catch (e) {
        console.error("[job-offers/analyze] pdf", e);
      }
    }
    restructureWithAi = String(fd.get("restructureWithAi") ?? "") === "true";
    extractSoftSkillsWithAi = String(fd.get("extractSoftSkillsWithAi") ?? "") === "true";
  } else {
    let body: AnalyzeJsonBody;
    try {
      body = (await request.json()) as AnalyzeJsonBody;
    } catch {
      return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
    }
    rawText = String(body.rawText ?? "").trim();
    restructureWithAi = Boolean(body.restructureWithAi);
    extractSoftSkillsWithAi = Boolean(body.extractSoftSkillsWithAi);
  }

  if (!rawText || rawText.length < 20) {
    return NextResponse.json({ error: "Texte trop court (au moins 20 caractères) ou PDF illisible." }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const m = mockFromText(rawText);
    return NextResponse.json({ success: true, mode: "mock", ...m });
  }

  const client = new OpenAI({ apiKey });
  const system = [
    "Tu aides un CFA à structurer une offre d'emploi / alternance à partir d'un texte brut (copier-coller ou extrait PDF).",
    "Réponds UNIQUEMENT avec un JSON valide.",
    'Schéma: {"title":string,"city":string|null,"salary":string|null,"salary_range":string|null,"contract_type":string|null,"description":string,"soft_skills":string[]}',
    "soft_skills : 5 à 12 compétences comportementales pertinentes, courtes.",
    "description : HTML interdit, texte brut structuré avec sauts de ligne.",
  ].join("\n");

  const userParts = [
    `Texte source:\n${rawText.slice(0, 14000)}`,
    restructureWithAi ? "Restructure et clarifie le contenu dans description." : "Garde le sens dans description sans trop raccourcir.",
    extractSoftSkillsWithAi ? "Déduis soft_skills depuis le texte." : "soft_skills peut rester générique si peu d'indices.",
  ];

  try {
    const resp = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.35,
      max_tokens: 3500,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userParts.join("\n") },
      ],
      response_format: { type: "json_object" },
    });
    const text = resp.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(text) as Record<string, unknown>;
    return NextResponse.json({
      success: true,
      mode: "openai",
      title: String(parsed.title ?? "").trim() || mockFromText(rawText).title,
      city: parsed.city != null ? String(parsed.city) : null,
      salary: parsed.salary != null ? String(parsed.salary) : null,
      salary_range: parsed.salary_range != null ? String(parsed.salary_range) : null,
      contract_type: parsed.contract_type != null ? String(parsed.contract_type) : "Alternance",
      description: String(parsed.description ?? "").trim() || rawText.slice(0, 4000),
      soft_skills: Array.isArray(parsed.soft_skills)
        ? (parsed.soft_skills as unknown[]).map((x) => String(x ?? "").trim()).filter(Boolean).slice(0, 16)
        : mockFromText(rawText).soft_skills,
    });
  } catch (e) {
    console.error("[job-offers/analyze]", e);
    const m = mockFromText(rawText);
    return NextResponse.json({ success: true, mode: "fallback", ...m });
  }
}
