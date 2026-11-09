import type { SupabaseClient } from "@supabase/supabase-js";
import { downloadFormationPdf } from "@/lib/formation-documents/storage";
import { buildStoreZip } from "@/lib/formation-documents/zip-store";

export type CoffreItemStatus = "ready" | "partial" | "missing" | "not_due";

export type CoffreItem = {
  key: string;
  label: string;
  status: CoffreItemStatus;
  detail?: string | null;
  document_ids?: string[];
  kind?: string | null;
};

export type CoffreSnapshot = {
  dossier_id: string;
  course_title: string | null;
  status: string;
  items: CoffreItem[];
  ready_count: number;
  total_count: number;
};

type DocRow = {
  id: string;
  kind: string;
  title: string;
  status: string;
  file_url: string | null;
  storage_path: string | null;
  signed_at: string | null;
  sent_at: string | null;
  generated_at: string | null;
  participant_id: string | null;
  slot_id: string | null;
  acceptance_method?: string | null;
  signer_name?: string | null;
  accept_otp_sent_to?: string | null;
  meta?: Record<string, unknown> | null;
};

function hasFile(d: DocRow | undefined): boolean {
  return Boolean(d && (d.file_url || d.storage_path || d.generated_at || d.signed_at));
}

function pick(docs: DocRow[], kind: string, scoped = false): DocRow[] {
  return docs.filter((d) => {
    if (d.kind !== kind) return false;
    if (scoped) return Boolean(d.participant_id || d.slot_id);
    return !d.participant_id && !d.slot_id;
  });
}

/** Checklist coffre Qualiopi pour un dossier formation. */
export async function buildCoffreSnapshot(
  service: SupabaseClient,
  dossierId: string,
): Promise<CoffreSnapshot | null> {
  const { data: dossier } = await service
    .from("formation_dossiers")
    .select("id, course_title, status, session_id, invoice_validated_at, trainer_user_id")
    .eq("id", dossierId)
    .maybeSingle();
  if (!dossier) return null;

  const { data: docsRaw } = await service
    .from("formation_documents")
    .select(
      "id, kind, title, status, file_url, storage_path, signed_at, sent_at, generated_at, participant_id, slot_id, acceptance_method, signer_name, accept_otp_sent_to, meta",
    )
    .eq("dossier_id", dossierId)
    .order("kind");

  const docs = (docsRaw ?? []) as DocRow[];

  const { count: participantCount } = await service
    .from("formation_participants")
    .select("id", { count: "exact", head: true })
    .eq("dossier_id", dossierId);

  let slotCount = 0;
  let closedCount = 0;
  if (dossier.session_id) {
    const { data: slots } = await service
      .from("formation_slots")
      .select("id")
      .eq("session_id", dossier.session_id);
    slotCount = slots?.length ?? 0;
    if (slotCount) {
      const { data: closures } = await service
        .from("attendance_closures")
        .select("slot_id")
        .in(
          "slot_id",
          slots!.map((s) => String(s.id)),
        );
      closedCount = closures?.length ?? 0;
    }
  }

  const { data: attempts } = await service
    .from("formation_assessment_attempts")
    .select("id, kind, status, completed_at, participant_id")
    .eq("dossier_id", dossierId);

  const attemptsByKind = (kind: string) =>
    (attempts ?? []).filter((a) => String(a.kind) === kind);
  const completedAttempts = (kind: string) =>
    attemptsByKind(kind).filter((a) => a.status === "completed");

  const devis = pick(docs, "devis")[0];
  const convention = pick(docs, "convention")[0];
  const convocs = docs.filter((d) => d.kind === "convocation");
  const programme = pick(docs, "programme")[0];
  const livret = pick(docs, "livret")[0];
  const reglement = pick(docs, "reglement")[0];
  const cv = pick(docs, "formateur_cv")[0];
  const emargs = pick(docs, "emargement", true);
  const preuves = docs.filter(
    (d) => d.kind === "preuve_devis" || d.kind === "preuve_convention" || d.kind === "preuve_signature",
  );
  const certificats = docs.filter((d) => d.kind === "certificat" && d.participant_id);
  const attestations = docs.filter((d) => d.kind === "attestation" && d.participant_id);
  const facture = pick(docs, "facture")[0];

  const participants = participantCount ?? 0;
  const dossierStatus = String(dossier.status);
  const pastSession = ["session", "fin", "cloture"].includes(dossierStatus);
  const pastFin = ["fin", "cloture"].includes(dossierStatus);

  const items: CoffreItem[] = [
    {
      key: "devis",
      label: "Devis signé",
      status: devis?.status === "signed" ? "ready" : hasFile(devis) ? "partial" : "missing",
      detail:
        devis?.status === "signed"
          ? `Signé${devis.signer_name ? ` · ${devis.signer_name}` : ""}${
              devis.acceptance_method ? ` · ${devis.acceptance_method}` : ""
            }`
          : null,
      document_ids: devis ? [devis.id] : [],
      kind: "devis",
    },
    {
      key: "convention",
      label: "Convention signée",
      status: convention?.status === "signed" ? "ready" : hasFile(convention) ? "partial" : "missing",
      detail:
        convention?.status === "signed"
          ? `Signée${convention.signer_name ? ` · ${convention.signer_name}` : ""}`
          : null,
      document_ids: convention ? [convention.id] : [],
      kind: "convention",
    },
    {
      key: "preuve_signature",
      label: "Preuves de signature (OTP)",
      status:
        preuves.length >= 2
          ? "ready"
          : preuves.length === 1
            ? "partial"
            : devis?.status === "signed" || convention?.status === "signed"
              ? "partial"
              : "missing",
      detail: `${preuves.length} preuve(s) archivée(s)`,
      document_ids: preuves.map((p) => p.id),
      kind: "preuve_devis",
    },
    {
      key: "convocation",
      label: "Convocations",
      status: convocs.some((c) => c.sent_at) ? "ready" : hasFile(convocs[0]) ? "partial" : "missing",
      detail: convocs[0]?.sent_at
        ? `Envoyées ${new Date(String(convocs[0].sent_at)).toLocaleDateString("fr-FR")}`
        : null,
      document_ids: convocs.map((c) => c.id),
      kind: "convocation",
    },
    {
      key: "programme_pack",
      label: "Programme / livret / règlement",
      status:
        [programme, livret, reglement].filter(hasFile).length >= 2
          ? "ready"
          : [programme, livret, reglement].some(hasFile)
            ? "partial"
            : "missing",
      document_ids: [programme, livret, reglement].filter(Boolean).map((d) => d!.id),
    },
    {
      key: "formateur_cv",
      label: "CV formateur (snapshot)",
      status: hasFile(cv) ? "ready" : dossier.trainer_user_id ? "missing" : "missing",
      detail: cv?.title || (dossier.trainer_user_id ? "Formateur sans CV archivé" : "Formateur non assigné"),
      document_ids: cv ? [cv.id] : [],
      kind: "formateur_cv",
    },
    {
      key: "emargement",
      label: "Feuilles d'émargement",
      status:
        slotCount === 0
          ? pastSession
            ? "missing"
            : "not_due"
          : emargs.length >= closedCount && closedCount > 0
            ? "ready"
            : emargs.length > 0
              ? "partial"
              : closedCount > 0
                ? "missing"
                : "not_due",
      detail: `${emargs.length} feuille(s) · ${closedCount}/${slotCount} créneau(x) clôturé(s)`,
      document_ids: emargs.map((e) => e.id),
      kind: "emargement",
    },
    {
      key: "positionnement",
      label: "Positionnement",
      status: (() => {
        const archived = docs.filter((d) => d.kind === "reponses_positionnement");
        const all = attemptsByKind("positionnement");
        const done = completedAttempts("positionnement");
        if (archived.length >= Math.max(done.length, 1) && done.length > 0) return "ready";
        if (!all.length) return pastSession ? "missing" : "not_due";
        if (done.length >= all.length) return archived.length ? "ready" : "partial";
        if (done.length > 0) return "partial";
        return "missing";
      })(),
      detail: `${completedAttempts("positionnement").length}/${attemptsByKind("positionnement").length || participants} complété(s) · ${docs.filter((d) => d.kind === "reponses_positionnement").length} au coffre`,
      document_ids: docs.filter((d) => d.kind === "reponses_positionnement").map((d) => d.id),
      kind: "reponses_positionnement",
    },
    {
      key: "eval_chaud",
      label: "Évaluation à chaud",
      status: (() => {
        const archived = docs.filter((d) => d.kind === "reponses_chaud");
        const all = attemptsByKind("eval_chaud");
        const done = completedAttempts("eval_chaud");
        if (!pastFin && !all.length) return "not_due";
        if (!all.length) return "missing";
        if (done.length >= all.length && archived.length > 0) return "ready";
        if (done.length > 0) return "partial";
        return "missing";
      })(),
      detail: `${completedAttempts("eval_chaud").length}/${attemptsByKind("eval_chaud").length || participants} · coffre ${docs.filter((d) => d.kind === "reponses_chaud").length}`,
      document_ids: docs.filter((d) => d.kind === "reponses_chaud").map((d) => d.id),
      kind: "reponses_chaud",
    },
    {
      key: "eval_froid",
      label: "Évaluation à froid",
      status: (() => {
        const archived = docs.filter((d) => d.kind === "reponses_froid");
        const all = attemptsByKind("eval_froid");
        const done = completedAttempts("eval_froid");
        if (!all.length) return "not_due";
        if (done.length >= all.length && archived.length > 0) return "ready";
        if (done.length > 0) return "partial";
        return "missing";
      })(),
      detail: `${completedAttempts("eval_froid").length}/${attemptsByKind("eval_froid").length} · coffre ${docs.filter((d) => d.kind === "reponses_froid").length}`,
      document_ids: docs.filter((d) => d.kind === "reponses_froid").map((d) => d.id),
      kind: "reponses_froid",
    },
    {
      key: "certificat",
      label: "Certificats par apprenant",
      status:
        participants === 0
          ? "not_due"
          : certificats.length >= participants
            ? "ready"
            : certificats.length > 0
              ? "partial"
              : pastFin
                ? "missing"
                : "not_due",
      detail: `${certificats.length}/${participants}`,
      document_ids: certificats.map((c) => c.id),
      kind: "certificat",
    },
    {
      key: "attestation",
      label: "Attestations par apprenant",
      status:
        participants === 0
          ? "not_due"
          : attestations.length >= participants
            ? "ready"
            : attestations.length > 0
              ? "partial"
              : pastFin
                ? "missing"
                : "not_due",
      detail: `${attestations.length}/${participants}`,
      document_ids: attestations.map((a) => a.id),
      kind: "attestation",
    },
    {
      key: "facture",
      label: "Facture",
      status: dossier.invoice_validated_at || hasFile(facture) ? "ready" : pastFin ? "missing" : "not_due",
      document_ids: facture ? [facture.id] : [],
      kind: "facture",
    },
  ];

  const countable = items.filter((i) => i.status !== "not_due");
  const ready_count = countable.filter((i) => i.status === "ready").length;

  return {
    dossier_id: dossierId,
    course_title: dossier.course_title ? String(dossier.course_title) : null,
    status: dossierStatus,
    items,
    ready_count,
    total_count: countable.length,
  };
}

export async function exportCoffreZip(
  service: SupabaseClient,
  dossierId: string,
): Promise<{ ok: true; buffer: Buffer; filename: string } | { ok: false; error: string }> {
  const snap = await buildCoffreSnapshot(service, dossierId);
  if (!snap) return { ok: false, error: "Dossier introuvable" };

  const { data: docs } = await service
    .from("formation_documents")
    .select("id, kind, title, file_url, storage_bucket, storage_path, participant_id, slot_id, meta")
    .eq("dossier_id", dossierId);

  const entries: Array<{ name: string; data: Buffer }> = [];
  const usedNames = new Set<string>();

  for (const doc of docs ?? []) {
    if (!doc.file_url && !doc.storage_path) continue;
    let buffer = await downloadFormationPdf(service, {
      bucket: doc.storage_bucket,
      path: doc.storage_path,
      fileUrl: doc.file_url,
    });
    if (!buffer && doc.file_url && /^https?:\/\//i.test(String(doc.file_url))) {
      try {
        const res = await fetch(String(doc.file_url));
        if (res.ok) buffer = Buffer.from(await res.arrayBuffer());
      } catch {
        /* ignore */
      }
    }
    if (!buffer) continue;
    const base = `${doc.kind}/${String(doc.title || doc.kind)
      .replace(/[^\w\-àâäéèêëïîôùûüç\s]+/gi, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60)}`;
    let name = `${base}.pdf`;
    let i = 2;
    while (usedNames.has(name)) {
      name = `${base}-${i}.pdf`;
      i += 1;
    }
    usedNames.add(name);
    entries.push({ name, data: buffer });
  }

  const { data: attempts } = await service
    .from("formation_assessment_attempts")
    .select(
      "id, kind, status, score_pct, completed_at, participant_id, profile_id, answers, created_at",
    )
    .eq("dossier_id", dossierId);
  const assessmentsJson = Buffer.from(
    JSON.stringify(
      {
        dossier_id: dossierId,
        exported_at: new Date().toISOString(),
        attempts: attempts ?? [],
      },
      null,
      2,
    ),
    "utf8",
  );

  const manifest = Buffer.from(JSON.stringify(snap, null, 2), "utf8");
  entries.unshift({ name: "evaluations/attempts.json", data: assessmentsJson });
  entries.unshift({ name: "coffre-manifest.json", data: manifest });

  if (entries.length <= 2) {
    return { ok: false, error: "Aucun fichier PDF à exporter dans le coffre" };
  }

  const slug = (snap.course_title || "formation")
    .replace(/[^\w\-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);
  return {
    ok: true,
    buffer: buildStoreZip(entries),
    filename: `coffre-qualiopi-${slug}-${dossierId.slice(0, 8)}.zip`,
  };
}
