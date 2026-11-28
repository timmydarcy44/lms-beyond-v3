import type { SupabaseClient } from "@supabase/supabase-js";

import { looksLikeTestCfaEmail } from "@/lib/cfa/admission-draft";
import { appendCfaRegister, type CfaRegisterType } from "@/lib/cfa/person-register";
import {
  isCfaSourceChannel,
  shouldPromoteStage,
  type CfaPrescriberType,
  type CfaProspectStatus,
  type CfaSourceChannel,
  type CfaSourceFamily,
  type CfaTouchType,
} from "@/lib/cfa/person-origin";
import type { UtmAttribution } from "@/lib/cfa/utm-attribution";

export type CfaPersonRow = Record<string, unknown> & {
  id: string;
  status: string;
  email: string;
  first_name: string;
  last_name: string;
};

export async function findCfaPersonByEmail(db: SupabaseClient, email: string) {
  const normalized = email.trim().toLowerCase();
  const active = await db
    .from("cfa_applications")
    .select("*")
    .ilike("email", normalized)
    .neq("status", "rejected")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (active.data) return active.data as CfaPersonRow;
  const any = await db
    .from("cfa_applications")
    .select("*")
    .ilike("email", normalized)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (any.data as CfaPersonRow | null) ?? null;
}

export async function recordCfaTouch(
  db: SupabaseClient,
  input: {
    personId: string;
    type: CfaTouchType | CfaRegisterType;
    detail?: string | null;
    createdBy?: string | null;
    proofUrl?: string | null;
  },
) {
  await appendCfaRegister(db, {
    personId: input.personId,
    type: input.type as CfaRegisterType,
    detail: input.detail,
    actorId: input.createdBy,
    proofUrl: input.proofUrl,
  });
}

function keepFirst(current: unknown, incoming: unknown) {
  const left = String(current ?? "").trim();
  if (left) return left;
  const right = String(incoming ?? "").trim();
  return right || null;
}

export async function upsertCfaPerson(
  db: SupabaseClient,
  input: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    specialization: string;
    intendedStage: "prospect" | "candidate";
    candidateStatus?: "profile" | "challenge";
    prospectStatus?: CfaProspectStatus;
    sourceFamily: CfaSourceFamily;
    sourceChannel: CfaSourceChannel;
    sourceDetail?: string | null;
    prescriberType?: CfaPrescriberType | null;
    prescriberOrg?: string | null;
    prescriberContact?: string | null;
    brochureId?: string | null;
    formationId?: string | null;
    utm?: UtmAttribution | null;
    createdBy?: string | null;
    contactConsent?: boolean;
    followUpHours?: number | null;
    touchType: CfaTouchType;
    touchDetail?: string | null;
    extra?: Record<string, unknown>;
    notifyResume?: boolean;
  },
): Promise<{ person: CfaPersonRow; created: boolean; promoted: boolean }> {
  const email = input.email.trim().toLowerCase();
  const existing = await findCfaPersonByEmail(db, email);
  const now = new Date();
  const followUp =
    input.followUpHours != null
      ? new Date(now.getTime() + input.followUpHours * 36e5).toISOString()
      : null;
  const isTest = looksLikeTestCfaEmail(email);
  const formationId = input.formationId || input.specialization;
  const originPatch: Record<string, unknown> = {
    first_name: input.firstName,
    last_name: input.lastName,
    phone: input.phone?.trim() || existing?.phone || null,
    specialization: input.specialization,
    last_touch: input.sourceChannel,
    source_detail: keepFirst(existing?.source_detail, input.sourceDetail),
    prescriber_type: keepFirst(existing?.prescriber_type, input.prescriberType),
    prescriber_org: keepFirst(existing?.prescriber_org, input.prescriberOrg),
    prescriber_contact: keepFirst(existing?.prescriber_contact, input.prescriberContact),
    brochure_id: keepFirst(existing?.brochure_id, input.brochureId || (input.sourceChannel === "web_brochure" ? input.specialization : null)),
    formation_id: keepFirst(existing?.formation_id, formationId),
    utm_source: keepFirst(existing?.utm_source, input.utm?.utm_source),
    utm_medium: keepFirst(existing?.utm_medium, input.utm?.utm_medium),
    utm_campaign: keepFirst(existing?.utm_campaign, input.utm?.utm_campaign),
    referrer: keepFirst(existing?.referrer, input.utm?.referrer),
    is_test: existing?.is_test === true || isTest,
    ...(input.extra ?? {}),
  };
  if (input.contactConsent) {
    originPatch.contact_consent = true;
    originPatch.contact_consent_at = existing?.contact_consent_at || now.toISOString();
  }
  if (followUp && !existing?.follow_up_at) originPatch.follow_up_at = followUp;

  if (!existing) {
    const status = input.intendedStage === "prospect" ? "prospect" : input.candidateStatus || "profile";
    const insertPayload: Record<string, unknown> = {
      status,
      email,
      first_touch: input.sourceChannel,
      source_family: input.sourceFamily,
      source_channel: input.sourceChannel,
      created_by: input.createdBy ?? null,
      prospect_status: input.intendedStage === "prospect" ? input.prospectStatus || "new" : null,
      ...originPatch,
    };
    let inserted = await db.from("cfa_applications").insert(insertPayload).select("*").single();
    if (inserted.error && /schema cache|column/i.test(inserted.error.message)) {
      const fallback: Record<string, unknown> = {
        status: status === "prospect" ? "brochure" : status,
        first_name: input.firstName,
        last_name: input.lastName,
        email,
        phone: input.phone?.trim() || null,
        specialization: input.specialization,
        lead_source: input.sourceChannel === "jpo" ? "jpo" : input.sourceFamily === "web" ? "website" : "other",
      };
      inserted = await db.from("cfa_applications").insert(fallback).select("*").single();
    }
    if (inserted.error || !inserted.data) {
      throw new Error(inserted.error?.message || "Création impossible");
    }
    const person = inserted.data as CfaPersonRow;
    await recordCfaTouch(db, {
      personId: person.id,
      type: input.touchType,
      detail: input.touchDetail,
      createdBy: input.createdBy,
    });
    return { person, created: true, promoted: false };
  }

  const promoted = shouldPromoteStage(String(existing.status), input.intendedStage);
  const nextStatus = promoted
    ? input.candidateStatus || "profile"
    : existing.status === "brochure" && input.intendedStage === "prospect"
      ? "prospect"
      : existing.status;
  const updatePayload: Record<string, unknown> = {
    ...originPatch,
    status: nextStatus,
  };
  if (!isCfaSourceChannel(String(existing.source_channel ?? ""))) {
    updatePayload.source_family = input.sourceFamily;
    updatePayload.source_channel = input.sourceChannel;
  }
  if (!String(existing.first_touch ?? "").trim()) {
    updatePayload.first_touch = existing.source_channel || input.sourceChannel;
  }
  if (promoted) updatePayload.prospect_status = null;
  else if (input.intendedStage === "prospect" && !existing.prospect_status) {
    updatePayload.prospect_status = input.prospectStatus || "new";
  }
  if (!existing.created_by && input.createdBy) updatePayload.created_by = input.createdBy;

  const updated = await db.from("cfa_applications").update(updatePayload).eq("id", existing.id).select("*").single();
  const person = (updated.data as CfaPersonRow | null) ?? existing;
  await recordCfaTouch(db, {
    personId: person.id,
    type: promoted ? "stage_change" : input.touchType,
    detail: promoted
      ? `prospect → ${nextStatus}`
      : input.touchDetail,
    createdBy: input.createdBy,
  });
  if (promoted) {
    await recordCfaTouch(db, {
      personId: person.id,
      type: input.touchType,
      detail: input.touchDetail,
      createdBy: input.createdBy,
    });
  }
  return { person, created: false, promoted };
}
