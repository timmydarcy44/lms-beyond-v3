import type { SupabaseClient } from "@supabase/supabase-js";
import { BYOUND_COMPANY } from "@/lib/company";
import type { DossierDocContext } from "@/lib/formation-documents/context";

export type TimelineStep = {
  key: string;
  label: string;
  state: "done" | "current" | "todo";
  detail: string | null;
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("") || "BY";
}

export function buildDossierTimeline(params: {
  dossierStatus: string;
  signedAt: string | null;
  signerName: string | null;
  fundingType: string | null;
  opcoName: string | null;
}): TimelineStep[] {
  const status = params.dossierStatus;
  const wantsOpco =
    (params.fundingType || "").toLowerCase().includes("opco") ||
    Boolean(params.opcoName);

  const order = [
    "qualification",
    "devis",
    "convention",
    "mise_en_place",
    "session",
    "fin",
    "cloture",
  ];
  const idx = Math.max(0, order.indexOf(status));
  const devisDone = Boolean(params.signedAt) || idx >= order.indexOf("convention");
  const conventionDone = idx >= order.indexOf("mise_en_place");
  const miseDone = idx >= order.indexOf("session");
  const sessionDone = idx >= order.indexOf("fin");

  const steps: TimelineStep[] = [
    {
      key: "devis",
      label: "Devis accepté",
      state: devisDone ? "done" : "current",
      detail: params.signedAt
        ? `${new Date(params.signedAt).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
          })} · ${params.signerName || "Client"}`
        : null,
    },
    {
      key: "convention",
      label: "Convention de formation",
      state: conventionDone ? "done" : devisDone ? "current" : "todo",
      detail: conventionDone
        ? "Signée"
        : devisDone
          ? "Envoyée sous 48 h, à signer en ligne"
          : null,
    },
  ];

  if (wantsOpco) {
    steps.push({
      key: "opco",
      label: "Dossier OPCO",
      state: miseDone ? "done" : conventionDone ? "current" : "todo",
      detail: "Si vous souhaitez une prise en charge",
    });
  }

  steps.push(
    {
      key: "convocations",
      label: "Convocations",
      state: sessionDone ? "done" : miseDone ? "current" : "todo",
      detail: "Programme et accès envoyés aux participants",
    },
    {
      key: "formation",
      label: "Formation",
      state: sessionDone ? "done" : "todo",
      detail: "Dates à convenir ensemble",
    },
  );

  return steps;
}

export async function loadAccountManager(
  service: SupabaseClient,
  organizationId: string | null | undefined,
): Promise<{
  name: string;
  email: string | null;
  phone: string | null;
  initials: string;
} | null> {
  if (!organizationId) {
    return {
      name: "Timmy Darcy",
      email: "timmydarcy44@gmail.com",
      phone: null,
      initials: "TD",
    };
  }
  const { data: org } = await service
    .from("organizations")
    .select("account_manager_id")
    .eq("id", organizationId)
    .maybeSingle();
  const managerId = org?.account_manager_id ? String(org.account_manager_id) : null;
  if (!managerId) {
    return {
      name: "Timmy Darcy",
      email: "timmydarcy44@gmail.com",
      phone: null,
      initials: "TD",
    };
  }
  const { data: profile } = await service
    .from("profiles")
    .select("full_name, first_name, last_name, email, phone")
    .eq("id", managerId)
    .maybeSingle();
  const name =
    String(profile?.full_name || "").trim() ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
    "Contact Byound";
  return {
    name,
    email: profile?.email ? String(profile.email) : null,
    phone: profile?.phone ? String(profile.phone) : null,
    initials: initials(name),
  };
}

export function resolvePublicPageState(doc: {
  status: string;
  signed_at?: string | null;
  valid_until?: string | null;
  superseded_by?: string | null;
}): "pending" | "accepted" | "expired" | "superseded" {
  if (doc.superseded_by) return "superseded";
  if (doc.status === "signed" || doc.signed_at) return "accepted";
  if (doc.valid_until && new Date(doc.valid_until).getTime() < Date.now()) {
    return "expired";
  }
  return "pending";
}

export function buildPublicDocMeta(
  doc: Record<string, unknown>,
  docCtx: DossierDocContext | null,
  accountManager: Awaited<ReturnType<typeof loadAccountManager>>,
) {
  const pageState = resolvePublicPageState({
    status: String(doc.status || ""),
    signed_at: doc.signed_at ? String(doc.signed_at) : null,
    valid_until: doc.valid_until ? String(doc.valid_until) : null,
    superseded_by: doc.superseded_by ? String(doc.superseded_by) : null,
  });
  const dossierStatus = docCtx?.dossier.status || "qualification";
  const signableKinds = doc.kind === "devis" || doc.kind === "convention";

  return {
    kind: doc.kind,
    title: doc.title,
    status: doc.status,
    signed_at: doc.signed_at ?? null,
    course_title: docCtx?.dossier.course_title ?? docCtx?.session?.title ?? null,
    organization_name: docCtx?.organization.name ?? null,
    of_name: docCtx?.of.legal_name ?? BYOUND_COMPANY.legal_name,
    amount_ht_cents: docCtx?.dossier.amount_ht_cents ?? null,
    amount_tva_cents: docCtx?.dossier.amount_tva_cents ?? null,
    amount_ttc_cents: docCtx?.dossier.amount_ttc_cents ?? null,
    signable: Boolean(signableKinds) && pageState === "pending",
    quote_number: doc.quote_number ?? null,
    valid_until: doc.valid_until ?? null,
    issued_at: doc.generated_at ?? doc.sent_at ?? null,
    contact_name: docCtx?.dossier.contact_name ?? null,
    signer_name: doc.signer_name ?? null,
    signer_role: doc.signer_role ?? null,
    cgv_version: doc.cgv_version ?? BYOUND_COMPANY.cgv_version,
    cgv_path: BYOUND_COMPANY.cgv_public_path,
    superseded: pageState === "superseded",
    expired: pageState === "expired",
    page_state: pageState,
    timeline: buildDossierTimeline({
      dossierStatus,
      signedAt: doc.signed_at ? String(doc.signed_at) : null,
      signerName: doc.signer_name ? String(doc.signer_name) : null,
      fundingType: docCtx?.dossier.funding_type ?? null,
      opcoName: docCtx?.dossier.opco_name || docCtx?.organization.opco_name || null,
    }),
    account_manager: accountManager,
  };
}
