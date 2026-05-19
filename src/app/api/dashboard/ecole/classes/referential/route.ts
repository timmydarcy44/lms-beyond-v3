import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import OpenAI from "openai";

import { resolveSchoolIdForEcoleDashboard } from "@/lib/auth/school-access";
import { getSession } from "@/lib/auth/session";
import { getServerClient } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
/** pdf-parse / pdfjs nécessitent l’API Node (canvas / workers). */
export const runtime = "nodejs";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

const MOCK_STRUCTURE = (className: string, excerpt: string) => ({
  titre_cursus: className,
  source_excerpt: excerpt.slice(0, 280),
  modules: [
    {
      titre: `Module 1 — Fondations (${className})`,
      objectifs: ["Poser le cadre réglementaire et les attendus du titre"],
      cours: [
        {
          titre: "Cadrage & référentiel",
          duree_estimee: "7h",
          contenu_resume: "Lecture guidée du référentiel et cartographie des compétences.",
        },
      ],
    },
    {
      titre: "Module 2 — Mise en pratique",
      objectifs: ["Relier les savoirs aux situations professionnelles"],
      cours: [{ titre: "Atelier terrain", duree_estimee: "14h", contenu_resume: "Études de cas et restitution." }],
    },
  ],
  missions_entreprise: [
    {
      titre: "Diagnostic organisationnel",
      description: "Cartographier un processus métier et proposer une piste d'amélioration.",
      duree_estimee: "4 semaines",
      competences: ["Analyse", "Communication écrite", "Esprit critique"],
    },
    {
      titre: "Restitution orale",
      description: "Présenter les apprentissages et préconisations devant un jury / tuteur.",
      duree_estimee: "1 semaine",
      competences: ["Prise de parole", "Synthèse"],
    },
  ],
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const schoolId = await resolveSchoolIdForEcoleDashboard(session.id, session.email, supabase);
    if (!schoolId) {
      return NextResponse.json({ error: "École non identifiée" }, { status: 403 });
    }

    const formData = await request.formData();
    const classId = String(formData.get("classId") ?? "").trim();
    const file = formData.get("file") as File | null;

    if (!isUuid(classId) || !file || file.size === 0) {
      return NextResponse.json({ error: "classId ou fichier manquant" }, { status: 400 });
    }

    const mime = (file.type || "").toLowerCase();
    if (!mime.includes("pdf")) {
      return NextResponse.json({ error: "Seuls les fichiers PDF sont acceptés pour l'instant." }, { status: 400 });
    }

    let writeClient = supabase;
    try {
      writeClient = await getServiceSupabase();
    } catch {
      /* RLS */
    }

    const { data: classRow, error: classErr } = await writeClient
      .from("school_classes")
      .select("id, school_id, name")
      .eq("id", classId)
      .eq("school_id", schoolId)
      .maybeSingle();

    if (classErr || !classRow) {
      return NextResponse.json({ error: "Cursus introuvable ou accès refusé" }, { status: 404 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    let extracted = "";
    try {
      const parser = new PDFParse({ data: buf });
      try {
        const textResult = await parser.getText();
        extracted = String(textResult.text ?? "").trim().slice(0, 24000);
      } finally {
        await parser.destroy();
      }
    } catch (pdfErr) {
      console.error("[referential] PDF extract:", pdfErr);
      extracted = "";
    }

    const className = String(classRow.name ?? "").trim() || "Cursus";

    const apiKey = process.env.OPENAI_API_KEY;
    let structure: Record<string, unknown>;
    let mode: string;

    if (!apiKey) {
      structure = MOCK_STRUCTURE(className, extracted || "Document sans texte extractible.");
      mode = "mock";
    } else {
      const client = new OpenAI({ apiKey });
      const system = [
        "Tu es concepteur pédagogique pour un CFA.",
        "À partir du texte d'un référentiel officiel (extrait PDF), tu produis une structure exploitable.",
        "Réponds UNIQUEMENT avec un JSON valide, sans markdown.",
        "Schéma attendu:",
        '{"titre_cursus":string,"modules":[{"titre":string,"objectifs":string[],"cours":[{"titre":string,"duree_estimee":string,"contenu_resume":string}]}],"missions_entreprise":[{"titre":string,"description":string,"duree_estimee":string,"competences":string[]}]}',
        "Invente au besoin des durées plausibles. Les missions_entreprise = situations longues en entreprise (stage / alternance).",
      ].join("\n");

      const user = `Nom du cursus: ${className}\n\nTEXTE RÉFÉRENTIEL (extrait):\n${extracted || "(vide)"}`;

      try {
        const resp = await client.chat.completions.create({
          model: "gpt-4.1-mini",
          temperature: 0.35,
          max_tokens: 4000,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          response_format: { type: "json_object" },
        });

        const text = resp.choices?.[0]?.message?.content ?? "{}";
        try {
          structure = JSON.parse(text) as Record<string, unknown>;
        } catch {
          structure = MOCK_STRUCTURE(className, extracted);
        }
        mode = "openai";
      } catch (aiErr) {
        console.error("[referential] OpenAI:", aiErr);
        structure = MOCK_STRUCTURE(className, extracted);
        mode = "openai_fallback";
      }
    }

    const payload = {
      referential_extracted_text: extracted.slice(0, 12000),
      referential_structure: structure,
      updated_at: new Date().toISOString(),
    };

    const { error: upErr } = await writeClient.from("school_classes").update(payload).eq("id", classId).eq("school_id", schoolId);

    if (upErr) {
      console.error("[referential] DB update:", upErr.message);
      return NextResponse.json({
        success: true,
        mode,
        structure,
        persisted: false,
        warning:
          "La structure a été générée mais n'a pas pu être enregistrée en base (colonnes référentiel absentes ou droits). Lancez la migration 20260503230000_school_classes_cover_referential.sql ou vérifiez SUPABASE_SERVICE_ROLE_KEY.",
        dbError: upErr.message,
      });
    }

    return NextResponse.json({ success: true, mode, structure, persisted: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[api/dashboard/ecole/classes/referential]", e);
    return NextResponse.json({ error: "Erreur lors de l'analyse du référentiel", detail: msg }, { status: 500 });
  }
}
