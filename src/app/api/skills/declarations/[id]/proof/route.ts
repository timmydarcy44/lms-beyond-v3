import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { uploadWithBucketFallback } from "@/lib/storage/ensure-bucket";
import { getServiceRoleClient } from "@/lib/supabase/server";
import {
  analyzeSkillProof,
  statusesFromProofDecision,
} from "@/lib/skills/analyze-skill-proof";
import { extractProofPdfText } from "@/lib/skills/extract-proof-pdf";

export const dynamic = "force-dynamic";
/** pdf-parse / pdfjs nécessitent l’API Node (pas Edge). */
export const runtime = "nodejs";
export const maxDuration = 60;

const PROOF_BUCKET = "skill-proofs";

function sanitizeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

async function extractProofText(
  file: File,
  buffer: Buffer,
): Promise<{ text: string; extractError: string | null }> {
  const mime = (file.type || "").toLowerCase();
  const name = file.name.toLowerCase();

  try {
    if (mime.includes("pdf") || name.endsWith(".pdf")) {
      const extracted = await extractProofPdfText(buffer);
      console.info("[skills/proof] pdf extract", {
        bytes: buffer.length,
        mime: file.type || null,
        name: file.name,
        chars: extracted.chars,
        engine: extracted.engine,
        error: extracted.error,
      });
      return { text: extracted.text, extractError: extracted.error };
    }

    if (mime.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".md")) {
      return { text: buffer.toString("utf8").trim().slice(0, 12_000), extractError: null };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn("[skills/proof] extract failed", msg);
    return { text: "", extractError: msg };
  }

  return { text: "", extractError: null };
}

/** Dépose / met à jour une preuve et lance l’analyse Byound. */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const db = getServiceRoleClient();
    if (!db) return NextResponse.json({ error: "NO_DB" }, { status: 503 });

    const { id } = await context.params;
    const { data: decl } = await db
      .from("skill_declarations")
      .select("id, user_id, raw_label, level, context, skill_id, proof_url, proof_note")
      .eq("id", id)
      .eq("user_id", session.id)
      .maybeSingle();

    if (!decl) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    let skillLabel = String(decl.raw_label ?? "Compétence");
    if (decl.skill_id) {
      const { data: skill } = await db
        .from("skills")
        .select("label")
        .eq("id", decl.skill_id)
        .maybeSingle();
      if (skill?.label) skillLabel = String(skill.label);
    }

    const contentType = request.headers.get("content-type") ?? "";
    let proofUrl = "";
    let proofNote = "";
    let file: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      proofUrl = String(form.get("proofUrl") ?? "").trim();
      proofNote = String(form.get("proofNote") ?? "").trim();
      const raw = form.get("file");
      file = raw instanceof File && raw.size > 0 ? raw : null;
    } else {
      const body = (await request.json().catch(() => null)) as {
        proofUrl?: string;
        proofNote?: string;
      } | null;
      proofUrl = String(body?.proofUrl ?? "").trim();
      proofNote = String(body?.proofNote ?? "").trim();
    }

    if (!proofUrl && !proofNote && !file) {
      return NextResponse.json(
        { error: "Ajoute un lien, une note ou un fichier comme preuve." },
        { status: 400 },
      );
    }

    let proofFilePath: string | null = null;
    let extractedText = "";
    let extractError: string | null = null;
    if (file) {
      if (file.size > 80 * 1024 * 1024) {
        return NextResponse.json({ error: "Fichier trop volumineux (max 80 Mo)." }, { status: 400 });
      }
      const safe = sanitizeFileName(file.name || "preuve");
      const path = `${session.id}/${id}/${Date.now()}-${safe}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const extracted = await extractProofText(file, buffer);
      extractedText = extracted.text;
      extractError = extracted.extractError;
      const uploaded = await uploadWithBucketFallback(db, {
        preferredBucket: PROOF_BUCKET,
        path,
        buffer,
        contentType: file.type || "application/octet-stream",
        preferredPublic: false,
        fallbacks: [
          { bucket: "cfa-applications", pathPrefix: "skill-proofs", public: false },
          { bucket: "public", pathPrefix: "skill-proofs", public: true },
        ],
      });
      if ("error" in uploaded) {
        return NextResponse.json({ error: `Upload impossible : ${uploaded.error}` }, { status: 400 });
      }
      proofFilePath =
        uploaded.bucket === PROOF_BUCKET
          ? uploaded.path
          : `${uploaded.bucket}:${uploaded.path}`;
      if (!proofUrl) {
        if (uploaded.public) {
          const { data: pub } = db.storage.from(uploaded.bucket).getPublicUrl(uploaded.path);
          proofUrl = pub?.publicUrl || "";
        } else {
          const signed = await db.storage
            .from(uploaded.bucket)
            .createSignedUrl(uploaded.path, 60 * 60 * 24 * 7);
          proofUrl = signed.data?.signedUrl || "";
        }
      }
    }

    await db
      .from("skill_declarations")
      .update({
        status: "declared",
        proof_url: proofUrl || null,
        proof_note: proofNote || null,
        proof_file_path: proofFilePath,
        proof_review_status: "pending",
        proof_review_note: "Analyse Byound en cours…",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", session.id);

    let analysis;
    try {
      analysis = await analyzeSkillProof({
        skillLabel,
        rawLabel: String(decl.raw_label ?? ""),
        level: String(decl.level ?? "intermediaire"),
        context: decl.context ? String(decl.context) : null,
        proofUrl: proofUrl || null,
        proofNote: proofNote || null,
        hasFile: Boolean(proofFilePath),
        fileName: file?.name ?? null,
        extractedText,
        extractError,
      });
    } catch (error) {
      console.warn("[skills/proof] analyze failed", error);
      analysis = {
        decision: "needs_more" as const,
        note: "Preuve reçue — l’analyse automatique a échoué. Ajoute une note concrète (faits, dates, résultat) pour avancer.",
        confidence: 0.3,
      };
    }

    const next = statusesFromProofDecision(analysis.decision);
    const patch: Record<string, unknown> = {
      status: next.status,
      proof_review_status: next.proof_review_status,
      proof_review_note: analysis.note,
      proof_url: proofUrl || null,
      proof_note: proofNote || null,
      updated_at: new Date().toISOString(),
    };
    if (proofFilePath) patch.proof_file_path = proofFilePath;

    let { data, error } = await db
      .from("skill_declarations")
      .update(patch)
      .eq("id", id)
      .eq("user_id", session.id)
      .select("id, status, proof_review_status, proof_review_note, proof_url, proof_note")
      .maybeSingle();

    if (error && /proof_review|proof_file|column/i.test(error.message)) {
      const fallbackStatus = next.status === "proven" ? "declared" : next.status;
      const retry = await db
        .from("skill_declarations")
        .update({
          status: fallbackStatus,
          proof_url: proofUrl || null,
          proof_note: proofNote || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", session.id)
        .select("id, status, proof_url, proof_note")
        .maybeSingle();
      if (retry.error) return NextResponse.json({ error: retry.error.message }, { status: 400 });
      return NextResponse.json({
        declaration: retry.data,
        analysis,
        warning: "Colonnes proof_review absentes — appliquez la migration 20261122200000.",
      });
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ declaration: data, analysis });
  } catch (error) {
    console.error("[skills/proof] fatal", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Analyse impossible : ${error.message}`
            : "Analyse impossible. Réessaie dans un instant.",
      },
      { status: 500 },
    );
  }
}
