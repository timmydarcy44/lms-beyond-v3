import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  NEED_ANALYSIS_SELECT,
  NEED_ANALYSIS_SELECT_LEGACY,
  assessNeedAnalysisCompleteness,
  buildNeedAnalysisWritePayload,
  mapNeedAnalysisRow,
  normalizeNeedAnalysisDetails,
  type OrganizationNeedAnalysis,
} from "@/lib/control/need-analyses";
import {
  buildNeedAnalysisPdf,
  needAnalysisPdfFileName,
} from "@/lib/control/need-analysis-pdf";
import { sendEmail } from "@/lib/email/resend-client";
import { publicAppUrl } from "@/lib/env";
import { newDocToken, uploadFormationPdf } from "@/lib/formation-documents/storage";

const TABLE = "organization_need_analyses";

/** Message d'erreur Postgres/PostgREST indiquant des colonnes v2 absentes (migration non appliquée). */
const COLUMN_ERROR =
  /request_type|exchange_|interlocutor_|conducted_by|accessibility_|validated_|client_|pdf_storage|column|schema cache/i;

export function isNeedAnalysisTableMissing(message: string | undefined | null): boolean {
  return /organization_need_analyses|schema cache|does not exist/i.test(message ?? "");
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type QueryApply = (query: any) => any;
/* eslint-enable @typescript-eslint/no-explicit-any */

type DbResult = { data: unknown; error: { message: string } | null };

const LEGACY_WRITE_KEYS = new Set([
  "organization_id",
  "deal_id",
  "title",
  "context_problem",
  "expected_outcomes",
  "audience",
  "constraints",
  "disability_accommodations",
  "decided_adaptations",
  "details",
  "recommendations",
  "status",
  "completed_at",
  "created_by",
  "updated_by",
  "updated_at",
]);

function toLegacyPayload(payload: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(payload).filter(([key]) => LEGACY_WRITE_KEYS.has(key)));
}

/** SELECT avec repli sur les colonnes legacy si les colonnes v2 n'existent pas encore. */
export async function selectNeedAnalysisRows(
  service: SupabaseClient,
  apply: QueryApply,
): Promise<DbResult & { usedLegacy: boolean }> {
  const run = async (cols: string) =>
    (await apply(service.from(TABLE).select(cols))) as DbResult;
  const first = await run(NEED_ANALYSIS_SELECT);
  if (first.error && COLUMN_ERROR.test(first.error.message)) {
    const second = await run(NEED_ANALYSIS_SELECT_LEGACY);
    return { ...second, usedLegacy: true };
  }
  return { ...first, usedLegacy: false };
}

async function writeNeedAnalysisRow(
  service: SupabaseClient,
  params:
    | { kind: "insert"; payload: Record<string, unknown> }
    | { kind: "update"; payload: Record<string, unknown>; apply: QueryApply },
): Promise<DbResult> {
  const run = async (payload: Record<string, unknown>, cols: string) => {
    const base = service.from(TABLE);
    const query =
      params.kind === "insert" ? base.insert(payload) : params.apply(base.update(payload));
    return (await query.select(cols).single()) as DbResult;
  };
  const first = await run(params.payload, NEED_ANALYSIS_SELECT);
  if (first.error && COLUMN_ERROR.test(first.error.message)) {
    return run(toLegacyPayload(params.payload), NEED_ANALYSIS_SELECT_LEGACY);
  }
  return first;
}

function profileDisplayName(p: Record<string, unknown>): string {
  return (
    String(p.full_name ?? "").trim() ||
    [p.first_name, p.last_name].filter(Boolean).join(" ").trim() ||
    String(p.email ?? p.id ?? "")
  );
}

/** id → nom affichable (profils). */
export async function loadProfileNames(
  service: SupabaseClient,
  ids: Array<string | null | undefined>,
): Promise<Record<string, string>> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (!unique.length) return {};
  const { data } = await service
    .from("profiles")
    .select("id, full_name, first_name, last_name, email")
    .in("id", unique);
  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    const rec = row as Record<string, unknown>;
    map[String(rec.id)] = profileDisplayName(rec);
  }
  return map;
}

export async function resolveClientName(
  service: SupabaseClient,
  analysis: Pick<OrganizationNeedAnalysis, "organization_id" | "deal_id">,
): Promise<string> {
  if (analysis.organization_id) {
    const { data } = await service
      .from("organizations")
      .select("name")
      .eq("id", analysis.organization_id)
      .maybeSingle();
    const name = String((data as { name?: string } | null)?.name ?? "").trim();
    if (name) return name;
  }
  if (analysis.deal_id) {
    const { data } = await service
      .from("crm_pipeline_deals")
      .select("company_name")
      .eq("id", analysis.deal_id)
      .maybeSingle();
    const name = String((data as { company_name?: string } | null)?.company_name ?? "").trim();
    if (name) return name;
  }
  return "Client";
}

export async function buildPdfForAnalysis(
  service: SupabaseClient,
  analysis: OrganizationNeedAnalysis,
): Promise<{ buffer: Buffer; fileName: string; clientName: string }> {
  const [clientName, names] = await Promise.all([
    resolveClientName(service, analysis),
    loadProfileNames(service, [
      analysis.conducted_by,
      analysis.validated_by,
      analysis.created_by,
      analysis.updated_by,
    ]),
  ]);
  const buffer = buildNeedAnalysisPdf(analysis, {
    clientName,
    conductedByName: analysis.conducted_by ? names[analysis.conducted_by] : null,
    validatedByName: analysis.validated_by ? names[analysis.validated_by] : null,
    createdByName: analysis.created_by ? names[analysis.created_by] : null,
    updatedByName: analysis.updated_by ? names[analysis.updated_by] : null,
  });
  return {
    buffer,
    clientName,
    fileName: needAnalysisPdfFileName(clientName, analysis.exchange_date),
  };
}

/** Génère + téléverse le PDF preuve et mémorise le chemin (best effort, ne bloque jamais l'enregistrement). */
export async function persistNeedAnalysisPdf(
  service: SupabaseClient,
  analysis: OrganizationNeedAnalysis,
): Promise<OrganizationNeedAnalysis> {
  try {
    const { buffer } = await buildPdfForAnalysis(service, analysis);
    const uploaded = await uploadFormationPdf(service, {
      dossierId: analysis.id,
      kind: "analyse-besoin",
      buffer,
    });
    if (!uploaded) return analysis;
    const { error } = await service
      .from(TABLE)
      .update({ pdf_storage_path: uploaded.path, pdf_storage_bucket: uploaded.bucket })
      .eq("id", analysis.id);
    if (error) {
      console.warn("[need-analyses] pdf path not saved:", error.message);
      return analysis;
    }
    return { ...analysis, pdf_storage_path: uploaded.path, pdf_storage_bucket: uploaded.bucket };
  } catch (e) {
    console.warn("[need-analyses] pdf generation failed:", e instanceof Error ? e.message : e);
    return analysis;
  }
}

export function newClientValidationToken(): string {
  return newDocToken();
}

export function hashClientValidationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

const MERGE_KEYS = [
  "request_type",
  "exchange_date",
  "exchange_mode",
  "interlocutor_name",
  "interlocutor_role",
  "conducted_by",
  "accessibility_asked",
  "accessibility_needed",
  "validated_by",
  "client_validated_at",
  "context_problem",
  "expected_outcomes",
  "audience",
  "constraints",
  "disability_accommodations",
  "decided_adaptations",
  "recommendations",
] as const;

export type NeedAnalysisSaveResult =
  | { ok: true; analysis: OrganizationNeedAnalysis }
  | { ok: false; status: number; error: string; missing?: string[] };

function prepareWrite(body: Record<string, unknown>, current: OrganizationNeedAnalysis | null) {
  const merged: Record<string, unknown> = {};
  for (const key of MERGE_KEYS) {
    merged[key] =
      body[key] !== undefined
        ? body[key]
        : current
          ? (current as unknown as Record<string, unknown>)[key]
          : undefined;
  }
  merged.details =
    body.details !== undefined
      ? normalizeNeedAnalysisDetails(body.details)
      : current
        ? current.details
        : normalizeNeedAnalysisDetails(null);

  const fields = buildNeedAnalysisWritePayload(merged);

  // Date d'échange verrouillée une fois l'analyse complète.
  if (current?.status === "complete" && current.exchange_date) {
    fields.exchange_date = current.exchange_date;
  }

  const now = new Date().toISOString();
  let validated_at = current?.validated_at ?? null;
  if (!fields.validated_by) validated_at = null;
  else if (!current || current.validated_by !== fields.validated_by || !validated_at) {
    validated_at = now;
  }

  const completeness = assessNeedAnalysisCompleteness({
    request_type: fields.request_type,
    exchange_date: fields.exchange_date,
    exchange_mode: fields.exchange_mode,
    interlocutor_name: fields.interlocutor_name,
    conducted_by: fields.conducted_by,
    context_problem: fields.context_problem,
    expected_outcomes: fields.expected_outcomes,
    accessibility_asked: fields.accessibility_asked,
    accessibility_needed: fields.accessibility_needed,
    disability_accommodations: fields.disability_accommodations,
    decided_adaptations: fields.decided_adaptations,
    validated_by: fields.validated_by,
    details: fields.details,
  });

  return { fields, validated_at, completeness, now };
}

function incompleteError(missing: string[]): NeedAnalysisSaveResult {
  return {
    ok: false,
    status: 400,
    error: `Pour marquer l’analyse complète, il manque : ${missing.join(", ")}.`,
    missing,
  };
}

export async function createNeedAnalysis(
  service: SupabaseClient,
  params: {
    userId: string;
    organizationId: string | null;
    dealId: string | null;
    title: string;
    body: Record<string, unknown>;
  },
): Promise<NeedAnalysisSaveResult> {
  const { fields, validated_at, completeness, now } = prepareWrite(params.body, null);
  const wantComplete = params.body.markComplete === true;
  if (wantComplete && !completeness.ready) return incompleteError(completeness.missing);
  const complete = wantComplete && completeness.ready;

  const payload = {
    organization_id: params.organizationId,
    deal_id: params.dealId,
    title: params.title,
    ...fields,
    validated_at,
    status: complete ? "complete" : "draft",
    completed_at: complete ? now : null,
    created_by: params.userId,
    updated_by: params.userId,
    updated_at: now,
  };

  const { data, error } = await writeNeedAnalysisRow(service, { kind: "insert", payload });
  if (error) return { ok: false, status: 500, error: error.message };

  let analysis = mapNeedAnalysisRow(data as Record<string, unknown>);
  if (complete) analysis = await persistNeedAnalysisPdf(service, analysis);
  return { ok: true, analysis };
}

export async function updateNeedAnalysis(
  service: SupabaseClient,
  params: {
    userId: string;
    current: OrganizationNeedAnalysis;
    /** Applique les filtres de portée (id + org/deal) sur la requête update. */
    apply: QueryApply;
    patch: { title?: string; deal_id?: string | null; organization_id?: string | null };
    body: Record<string, unknown>;
  },
): Promise<NeedAnalysisSaveResult> {
  const { current, body } = params;
  const { fields, validated_at, completeness, now } = prepareWrite(body, current);

  const wantComplete = body.markComplete === true || current.status === "complete";
  if (body.markComplete === true && !completeness.ready) {
    return incompleteError(completeness.missing);
  }
  const forceDraft = body.markComplete === false;
  const complete = !forceDraft && wantComplete && completeness.ready;
  const payload: Record<string, unknown> = {
    title:
      params.patch.title !== undefined
        ? params.patch.title.trim() || current.title
        : current.title,
    deal_id: params.patch.deal_id !== undefined ? params.patch.deal_id : current.deal_id,
    ...(params.patch.organization_id !== undefined
      ? { organization_id: params.patch.organization_id }
      : {}),
    ...fields,
    validated_at,
    status: complete ? "complete" : "draft",
    completed_at: complete ? current.completed_at ?? now : null,
    updated_by: params.userId,
    updated_at: now,
  };

  const { data, error } = await writeNeedAnalysisRow(service, {
    kind: "update",
    payload,
    apply: params.apply,
  });
  if (error) return { ok: false, status: 500, error: error.message };

  let analysis = mapNeedAnalysisRow(data as Record<string, unknown>);
  // PDF : généré à la complétion, régénéré à chaque sauvegarde d'une analyse complète.
  if (complete) analysis = await persistNeedAnalysisPdf(service, analysis);
  return { ok: true, analysis };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Envoie l'analyse (PDF en pièce jointe + lien de validation) à l'interlocuteur.
 * Le jeton n'est stocké que sous forme de hash SHA-256.
 */
export async function sendNeedAnalysisToClient(
  service: SupabaseClient,
  params: { analysis: OrganizationNeedAnalysis; interlocutorEmail: string },
): Promise<NeedAnalysisSaveResult> {
  const email = params.interlocutorEmail.trim();
  if (!EMAIL_RE.test(email)) {
    return { ok: false, status: 400, error: "Email de l’interlocuteur invalide ou manquant." };
  }

  const token = newClientValidationToken();
  const tokenUpdate = await service
    .from(TABLE)
    .update({ client_validation_token: hashClientValidationToken(token) })
    .eq("id", params.analysis.id);
  if (tokenUpdate.error) {
    return {
      ok: false,
      status: 503,
      error: isNeedAnalysisTableMissing(tokenUpdate.error.message)
        ? "Migration Qualiopi v2 non appliquée (supabase/migrations/20261123190000_need_analyses_qualiopi_v2.sql)."
        : tokenUpdate.error.message,
    };
  }

  const sentAt = new Date().toISOString();
  const { buffer, fileName, clientName } = await buildPdfForAnalysis(service, {
    ...params.analysis,
    client_sent_at: sentAt,
  });

  const link = `${publicAppUrl()}/besoin/valider/${token}`;
  const greeting = params.analysis.interlocutor_name.trim()
    ? `Bonjour ${escapeHtml(params.analysis.interlocutor_name.trim())},`
    : "Bonjour,";
  const subject = `Byound — Validation de l’analyse de votre besoin${
    params.analysis.title.trim() ? ` : ${params.analysis.title.trim()}` : ""
  }`;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#0A0F1E">
      <p>${greeting}</p>
      <p>Suite à notre échange, vous trouverez en pièce jointe l’analyse de votre besoin de formation
      (${escapeHtml(clientName)}).</p>
      <p>Merci de la relire puis de la valider en cliquant sur le lien ci-dessous :</p>
      <p><a href="${link}" style="display:inline-block;background:#6E5BFF;color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px;font-weight:bold">Valider l’analyse du besoin</a></p>
      <p style="color:#5C615C;font-size:12px">Si le bouton ne fonctionne pas, copiez ce lien : ${link}</p>
      <p>L’équipe Byound</p>
    </div>`;

  const sent = await sendEmail({
    to: email,
    subject,
    html,
    attachments: [{ filename: fileName, content: buffer }],
  });
  if (!sent.success) {
    return { ok: false, status: 502, error: sent.error || "Envoi de l’email impossible." };
  }

  const sentUpdate = await service
    .from(TABLE)
    .update({ client_sent_at: sentAt })
    .eq("id", params.analysis.id);
  if (sentUpdate.error) {
    console.warn("[need-analyses] client_sent_at not saved:", sentUpdate.error.message);
  }

  return { ok: true, analysis: { ...params.analysis, client_sent_at: sentAt } };
}
