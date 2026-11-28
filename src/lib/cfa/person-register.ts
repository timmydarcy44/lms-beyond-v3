import type { SupabaseClient } from "@supabase/supabase-js";

import { formatCreatedByShort } from "@/lib/cfa/person-origin";

export const CFA_REGISTER_TYPES = [
  "brochure_download",
  "preregistration",
  "email_sent",
  "email_opened",
  "call",
  "meeting",
  "stage_change",
  "created",
  "follow_up",
  "field_change",
  "document",
  "placement",
  "curriculum",
  "note",
] as const;

export type CfaRegisterType = (typeof CFA_REGISTER_TYPES)[number];

export type CfaRegisterEntry = {
  id: string;
  occurredAt: string;
  type: string;
  title: string;
  detail: string | null;
  actorName: string;
  actorEmail: string | null;
  proofUrl: string | null;
};

export type CfaActorSnapshot = {
  id: string | null;
  name: string;
  email: string | null;
};

const SITE_ACTOR: CfaActorSnapshot = {
  id: null,
  name: "Site Byound (automatique)",
  email: null,
};

export function formatRegisterDateTime(iso: string | null | undefined) {
  if (!iso) return "Date inconnue";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(date);
}

export function registerTypeLabel(type: string) {
  const labels: Record<string, string> = {
    brochure_download: "Téléchargement de plaquette",
    preregistration: "Pré-inscription",
    email_sent: "E-mail envoyé",
    email_opened: "E-mail ouvert",
    call: "Appel",
    meeting: "Rencontre",
    stage_change: "Changement d’étape",
    created: "Création du dossier",
    follow_up: "Relance",
    field_change: "Modification",
    document: "Document",
    placement: "Entreprise / tuteur",
    curriculum: "Cursus",
    note: "Note",
  };
  return labels[type] ?? type;
}

export async function resolveCfaActor(db: SupabaseClient, actorId: string | null | undefined): Promise<CfaActorSnapshot> {
  const id = String(actorId ?? "").trim();
  if (!id) return SITE_ACTOR;
  const found = await db.from("profiles").select("id, first_name, last_name, full_name, email").eq("id", id).maybeSingle();
  const row = found.data as {
    first_name?: string | null;
    last_name?: string | null;
    full_name?: string | null;
    email?: string | null;
  } | null;
  if (!row) {
    return { id, name: "Équipe CFA", email: null };
  }
  const first = String(row.first_name ?? row.full_name?.split(" ")[0] ?? "").trim();
  const last = String(row.last_name ?? "").trim();
  return {
    id,
    name: formatCreatedByShort(first, last) || String(row.email ?? "Équipe CFA"),
    email: row.email ?? null,
  };
}

export async function appendCfaRegister(
  db: SupabaseClient,
  input: {
    personId: string;
    type: CfaRegisterType;
    detail?: string | null;
    actorId?: string | null;
    proofUrl?: string | null;
    payload?: Record<string, unknown> | null;
  },
) {
  const actor = await resolveCfaActor(db, input.actorId);
  const occurredAt = new Date().toISOString();
  const full = {
    person_id: input.personId,
    type: input.type,
    detail: input.detail ?? null,
    created_by: actor.id,
    actor_name: actor.name,
    actor_email: actor.email,
    proof_url: input.proofUrl ?? null,
    proof: input.payload ?? {},
    created_at: occurredAt,
  };
  let write = await db.from("cfa_person_touches").insert(full);
  if (write.error && /actor_name|actor_email|proof_url|proof|schema cache/i.test(write.error.message)) {
    write = await db.from("cfa_person_touches").insert({
      person_id: full.person_id,
      type: full.type,
      detail: full.detail,
      created_by: full.created_by,
      created_at: occurredAt,
    });
  }
  if (write.error && /cfa_person_touches_type_check|invalid input/i.test(write.error.message)) {
    write = await db.from("cfa_person_touches").insert({
      person_id: full.person_id,
      type: "created",
      detail: `${registerTypeLabel(input.type)}${input.detail ? ` — ${input.detail}` : ""}`,
      created_by: full.created_by,
      created_at: occurredAt,
    });
  }
  if (write.error && !/cfa_person_touches|schema cache/i.test(write.error.message)) {
    console.error("[cfa-register]", write.error.message);
  }
}

export async function loadCfaRegister(db: SupabaseClient, personId: string): Promise<CfaRegisterEntry[]> {
  const [touches, audits] = await Promise.all([
    db.from("cfa_person_touches").select("*").eq("person_id", personId).order("created_at", { ascending: false }).limit(200),
    db.from("cfa_audit_events").select("*").eq("application_id", personId).order("created_at", { ascending: false }).limit(200),
  ]);
  const actorIds = [
    ...new Set(
      [
        ...((touches.data ?? []) as Array<{ created_by?: string | null }>).map((row) => String(row.created_by ?? "")),
        ...((audits.data ?? []) as Array<{ actor_id?: string | null }>).map((row) => String(row.actor_id ?? "")),
      ].filter(Boolean),
    ),
  ];
  const profiles = actorIds.length
    ? await db.from("profiles").select("id, first_name, last_name, full_name, email").in("id", actorIds)
    : { data: [], error: null };
  const byId = new Map(
    ((profiles.data ?? []) as Array<{
      id: string;
      first_name?: string | null;
      last_name?: string | null;
      full_name?: string | null;
      email?: string | null;
    }>).map((row) => [
      row.id,
      {
        name: formatCreatedByShort(row.first_name || row.full_name?.split(" ")[0], row.last_name) || row.email || "Équipe CFA",
        email: row.email ?? null,
      },
    ]),
  );

  const fromTouches: CfaRegisterEntry[] = ((touches.error ? [] : touches.data ?? []) as Array<Record<string, unknown>>).map(
    (row) => {
      const actorId = String(row.created_by ?? "");
      const profile = byId.get(actorId);
      return {
        id: `touch-${row.id}`,
        occurredAt: String(row.created_at ?? ""),
        type: String(row.type ?? "note"),
        title: registerTypeLabel(String(row.type ?? "")),
        detail: row.detail ? String(row.detail) : null,
        actorName: String(row.actor_name ?? profile?.name ?? (actorId ? "Équipe CFA" : SITE_ACTOR.name)),
        actorEmail: (row.actor_email as string | null) ?? profile?.email ?? null,
        proofUrl: (row.proof_url as string | null) ?? null,
      };
    },
  );

  const touchKeys = new Set(fromTouches.map((row) => `${row.occurredAt}|${row.type}|${row.detail ?? ""}`));
  const fromAudits: CfaRegisterEntry[] = ((audits.error ? [] : audits.data ?? []) as Array<Record<string, unknown>>)
    .map((row) => {
      const actorId = String(row.actor_id ?? "");
      const profile = byId.get(actorId);
      const type = String(row.action ?? "field_change");
      const detail = row.new_value ? String(row.new_value) : null;
      const occurredAt = String(row.created_at ?? "");
      return {
        id: `audit-${row.id}`,
        occurredAt,
        type,
        title: registerTypeLabel(type),
        detail,
        actorName: profile?.name || (row.old_value && String(row.action).includes("create") ? String(row.old_value) : "") || (actorId ? "Équipe CFA" : SITE_ACTOR.name),
        actorEmail: profile?.email ?? null,
        proofUrl: detail && /^https?:\/\//.test(detail) ? detail : null,
      };
    })
    .filter((row) => !touchKeys.has(`${row.occurredAt}|${row.type}|${row.detail ?? ""}`));

  return [...fromTouches, ...fromAudits].sort((a, b) => String(b.occurredAt).localeCompare(String(a.occurredAt)));
}
