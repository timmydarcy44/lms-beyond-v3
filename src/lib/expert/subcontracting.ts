import type { SupabaseClient } from "@supabase/supabase-js";

export const EMPLOYMENT_STATUSES = ["salarie", "independant", "portage"] as const;
export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  salarie: "Salarié",
  independant: "Indépendant sous-traitant",
  portage: "Portage salarial",
};

export function parseEmploymentStatus(v: unknown): EmploymentStatus | null {
  const s = String(v ?? "").trim().toLowerCase();
  return (EMPLOYMENT_STATUSES as readonly string[]).includes(s)
    ? (s as EmploymentStatus)
    : null;
}

export function requiresSubcontractContract(status: EmploymentStatus | null): boolean {
  return status === "independant" || status === "portage";
}

export type SubcontractReadiness = {
  expert_id: string;
  employment_status: EmploymentStatus | null;
  requires_contract: boolean;
  contract_ok: boolean;
  commitment_ok: boolean;
  ready: boolean;
  subcontract_signed_at: string | null;
  subcontract_ends_at: string | null;
  quality_commitment_at: string | null;
  has_signed_contract_doc: boolean;
  contract_doc_expires_at: string | null;
  code: "ok" | "status_missing" | "contract_missing" | "contract_expired" | "commitment_missing";
  message: string | null;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function isExpired(endsAt: string | null | undefined, today = todayIso()): boolean {
  if (!endsAt) return false;
  return String(endsAt).slice(0, 10) < today;
}

export async function resolveExpertSubcontract(
  service: SupabaseClient,
  expertUserId: string,
): Promise<SubcontractReadiness> {
  const { data: expert } = await service
    .from("experts")
    .select(
      "id, employment_status, subcontract_signed_at, subcontract_ends_at, quality_commitment_at",
    )
    .eq("id", expertUserId)
    .maybeSingle();

  const employment_status = parseEmploymentStatus(expert?.employment_status);
  const subcontract_signed_at = expert?.subcontract_signed_at
    ? String(expert.subcontract_signed_at).slice(0, 10)
    : null;
  const subcontract_ends_at = expert?.subcontract_ends_at
    ? String(expert.subcontract_ends_at).slice(0, 10)
    : null;
  const quality_commitment_at = expert?.quality_commitment_at
    ? String(expert.quality_commitment_at)
    : null;

  const { data: docs } = await service
    .from("expert_documents")
    .select("id, status, expires_at, uploaded_at, url")
    .eq("expert_id", expertUserId)
    .eq("folder", "contrat")
    .order("uploaded_at", { ascending: false })
    .limit(10);

  const signedDoc = (docs ?? []).find(
    (d) => d.status === "signed" && String(d.url || "").trim(),
  );
  const has_signed_contract_doc = Boolean(signedDoc);
  const contract_doc_expires_at = signedDoc?.expires_at
    ? String(signedDoc.expires_at).slice(0, 10)
    : null;

  const requires_contract = requiresSubcontractContract(employment_status);
  const commitment_ok = Boolean(quality_commitment_at);

  const metaSigned = Boolean(subcontract_signed_at);
  const metaExpired = isExpired(subcontract_ends_at);
  const docExpired = isExpired(contract_doc_expires_at);
  const contractPresent = metaSigned || has_signed_contract_doc;
  const contract_ok = metaSigned
    ? !metaExpired
    : has_signed_contract_doc
      ? !docExpired
      : false;

  let code: SubcontractReadiness["code"] = "ok";
  let message: string | null = null;

  if (!requires_contract) {
    // Salarié ou statut non renseigné : pas de blocage SST (CV reste le gate historique)
    if (!employment_status) {
      code = "status_missing";
      message =
        "Statut d'emploi non renseigné sur la fiche expert (salarié / indépendant / portage).";
    }
    return {
      expert_id: expertUserId,
      employment_status,
      requires_contract: false,
      contract_ok: true,
      commitment_ok: true,
      ready: true,
      subcontract_signed_at,
      subcontract_ends_at,
      quality_commitment_at,
      has_signed_contract_doc,
      contract_doc_expires_at,
      code,
      message,
    };
  }

  if (!contract_ok) {
    if (!contractPresent) {
      code = "contract_missing";
      message =
        "Contrat de sous-traitance manquant : déposez/signéz un PDF dans Documents → Contrats, et renseignez les dates.";
    } else {
      code = "contract_expired";
      message = "Contrat de sous-traitance expiré — renouvelez-le avant d'assigner une session.";
    }
  } else if (!commitment_ok) {
    code = "commitment_missing";
    message =
      "Engagement de respect du référentiel qualité non daté sur la fiche expert.";
  }

  const ready = contract_ok && commitment_ok;

  return {
    expert_id: expertUserId,
    employment_status,
    requires_contract: true,
    contract_ok,
    commitment_ok,
    ready,
    subcontract_signed_at,
    subcontract_ends_at,
    quality_commitment_at,
    has_signed_contract_doc,
    contract_doc_expires_at,
    code: ready ? "ok" : code,
    message: ready ? null : message,
  };
}

export type IntervenantContractRow = {
  id: string;
  name: string;
  email: string | null;
  employment_status: EmploymentStatus | null;
  employment_label: string;
  subcontract_signed_at: string | null;
  subcontract_ends_at: string | null;
  quality_commitment_at: string | null;
  has_signed_contract_doc: boolean;
  contract_ok: boolean;
  ready: boolean;
  code: SubcontractReadiness["code"];
  message: string | null;
  review_status: string | null;
};

export async function listIntervenantsContractStatus(
  service: SupabaseClient,
): Promise<IntervenantContractRow[]> {
  const { data: experts } = await service
    .from("experts")
    .select(
      "id, first_name, last_name, email, employment_status, subcontract_signed_at, subcontract_ends_at, quality_commitment_at, review_status, is_active",
    )
    .eq("review_status", "approved")
    .order("last_name")
    .limit(300);

  const rows: IntervenantContractRow[] = [];
  for (const e of experts ?? []) {
    const readiness = await resolveExpertSubcontract(service, String(e.id));
    const name =
      [e.first_name, e.last_name].filter(Boolean).join(" ").trim() ||
      String(e.email ?? e.id);
    rows.push({
      id: String(e.id),
      name,
      email: e.email ? String(e.email) : null,
      employment_status: readiness.employment_status,
      employment_label: readiness.employment_status
        ? EMPLOYMENT_STATUS_LABELS[readiness.employment_status]
        : "Non renseigné",
      subcontract_signed_at: readiness.subcontract_signed_at,
      subcontract_ends_at: readiness.subcontract_ends_at,
      quality_commitment_at: readiness.quality_commitment_at,
      has_signed_contract_doc: readiness.has_signed_contract_doc,
      contract_ok: readiness.contract_ok,
      ready: readiness.ready,
      code: readiness.code,
      message: readiness.message,
      review_status: e.review_status ? String(e.review_status) : null,
    });
  }
  return rows;
}

/** Blocage assignation / session si SST requis et non conforme. */
export async function assertTrainerSubcontractReady(
  service: SupabaseClient,
  trainerUserId: string,
): Promise<{ ok: true } | { ok: false; error: string; code: string }> {
  const r = await resolveExpertSubcontract(service, trainerUserId);
  if (!r.requires_contract) return { ok: true };
  if (r.ready) return { ok: true };
  return {
    ok: false,
    code: r.code,
    error: r.message || "Sous-traitance non conforme",
  };
}

/** Vérifie lead + co-intervenants du dossier (formation_dossier_trainers). */
export async function listDossierTrainersReady(
  service: SupabaseClient,
  dossierId: string,
  fallbackTrainerUserId?: string | null,
): Promise<{ ready: boolean; checked: number; failing: SubcontractReadiness[] }> {
  const { data: rows, error } = await service
    .from("formation_dossier_trainers")
    .select("user_id")
    .eq("dossier_id", dossierId);

  let userIds = (rows ?? []).map((r) => String(r.user_id));
  if (error || !userIds.length) {
    if (fallbackTrainerUserId) userIds = [fallbackTrainerUserId];
    else return { ready: true, checked: 0, failing: [] };
  }

  const failing: SubcontractReadiness[] = [];
  for (const uid of [...new Set(userIds)]) {
    const r = await resolveExpertSubcontract(service, uid);
    if (r.requires_contract && !r.ready) failing.push(r);
  }
  return {
    ready: failing.length === 0,
    checked: userIds.length,
    failing,
  };
}
