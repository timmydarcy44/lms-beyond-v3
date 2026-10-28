"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { getSession } from "@/lib/auth/session";
import { mergeRegistrationMeta, parseRegistrationMeta, type ExpertDocumentMeta } from "@/lib/expert/expert-registration-meta";
import {
  loadExpertSpace,
  readJadeOverrides,
  writeJadeOverrides,
  type JadeOverrides,
} from "@/lib/expert/space-server";
import { encodeSlotRule, NOTICE_HOUR_OPTIONS, slotsOverlap, type ExpertMission, type NoticeHours, type SlotFormat, type SlotKind } from "@/lib/expert/space-model";
import { writeCareAgendaSlot } from "@/lib/care/expert-agenda";
import { ensureCareProfile } from "@/lib/care/ensure-profile";
import { CARE_DOMAIN_IDS } from "@/lib/care/domains";
import type { CareListingSettings } from "@/lib/care/listing-settings";
import { revalidateCarePublicProfile } from "@/lib/care/revalidate-profile";
import { sendEmail } from "@/lib/email/resend-client";
import { buildCareEmail } from "@/lib/expert/care-email";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

const decisionSchema = z.object({
  id: z.string().min(1),
  decision: z.enum(["accepted", "cancelled"]),
});

const slotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
  format: z.enum(["visio", "presentiel"]),
  kind: z.enum(["indisponible", "rendez_vous", "formation", "disponible"]),
  location: z.string().trim().max(120).optional(),
  weekly: z.boolean().optional(),
  clientId: z.string().uuid().optional().nullable(),
  notify: z.boolean().optional(),
});

const settingsSchema = z.object({
  format: z.enum(["visio", "presentiel"]).optional(),
  noticeHours: z
    .number()
    .refine((value): value is NoticeHours => NOTICE_HOUR_OPTIONS.some((option) => option.value === value))
    .optional(),
});

const documentSchema = z.object({
  name: z.string().min(1),
  url: z.string().min(1),
  folder: z.enum(["contrat", "cv", "attestation", "facture", "modele", "autre"]),
  mime: z.string().optional(),
  size: z.number().optional(),
});

function refresh() {
  revalidatePath("/dashboard/expert", "layout");
}

async function mutateJade(patch: (current: JadeOverrides) => JadeOverrides) {
  const current = await readJadeOverrides();
  await writeJadeOverrides(patch(current));
  refresh();
}

export async function loadMissionPreview(id: string): Promise<ExpertMission | null> {
  const space = await loadExpertSpace();
  return space.missions.find((mission) => mission.id === id) ?? null;
}

export async function decideMission(input: z.infer<typeof decisionSchema>) {
  const parsed = decisionSchema.parse(input);
  const session = await getSession();
  if (!session?.id) return { ok: false, error: "Connexion requise" };
  if (isJadeDemoEmail(session.email)) {
    await mutateJade((current) => ({
      ...current,
      missionStatus: { ...current.missionStatus, [parsed.id]: parsed.decision === "accepted" ? "acceptee" : "annulee" },
      missionBilling: {
        ...current.missionBilling,
        [parsed.id]: parsed.decision === "accepted" ? "upcoming" : "none",
      },
    }));
    return { ok: true };
  }
  const supabase = await getServerClient();
  if (!supabase) return { ok: false, error: "Service indisponible" };
  const existing = await supabase.from("action_requests").select("id,expert_id,metadata,scheduled_at").eq("id", parsed.id).maybeSingle();
  if (!existing.data || existing.data.expert_id !== session.id) return { ok: false, error: "Mission introuvable" };
  const status = parsed.decision === "accepted" ? "accepted" : "cancelled";
  const { error } = await supabase.from("action_requests").update({ status }).eq("id", parsed.id);
  if (error) return { ok: false, error: error.message };
  if (parsed.decision === "cancelled") {
    await supabase.from("expert_slots").delete().eq("mission_id", parsed.id).eq("expert_id", session.id);
  } else {
    const metadata = (existing.data.metadata ?? {}) as Record<string, unknown>;
    const starts = typeof existing.data.scheduled_at === "string" ? existing.data.scheduled_at : typeof metadata.starts_at === "string" ? metadata.starts_at : new Date().toISOString();
    const ends = new Date(new Date(starts).getTime() + 60 * 60 * 1000).toISOString();
    await supabase.from("expert_slots").insert({
      expert_id: session.id,
      starts_at: starts,
      ends_at: ends,
      format: metadata.format === "presentiel" ? "presentiel" : "visio",
      location: typeof metadata.location === "string" ? metadata.location : "Visio",
      mission_id: parsed.id,
    });
  }
  const metadata = (existing.data.metadata ?? {}) as Record<string, unknown>;
  const requester = metadata.requester_id || metadata.requested_by || metadata.created_by;
  if (typeof requester === "string" && requester.includes("-")) {
    await supabase.from("notifications").insert({
      user_id: requester,
      type: "info",
      title: parsed.decision === "accepted" ? "Mission acceptée" : "Mission refusée",
      message: parsed.decision === "accepted" ? "Votre demande a été acceptée par l'experte." : "Votre demande a été refusée.",
      read: false,
    });
  }
  refresh();
  return { ok: true };
}

export async function createExpertSlot(input: z.infer<typeof slotSchema>) {
  const parsed = slotSchema.parse(input);
  const start = new Date(`${parsed.date}T${parsed.start}`);
  const end = new Date(`${parsed.date}T${parsed.end}`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return { ok: false, error: "L'heure de fin doit être après le début." };
  }
  const session = await getSession();
  if (!session?.id) return { ok: false, error: "Connexion requise" };
  const space = await loadExpertSpace();
  const occurrences = [start];
  if (parsed.weekly) {
    for (let week = 1; week <= 4; week += 1) {
      const next = new Date(start);
      next.setDate(next.getDate() + week * 7);
      occurrences.push(next);
    }
  }
  const built = occurrences.map((occurrence) => {
    const slotEnd = new Date(occurrence.getTime() + (end.getTime() - start.getTime()));
    return { startsAt: occurrence.toISOString(), endsAt: slotEnd.toISOString() };
  });
  const clash = built.some((slot) =>
    space.slots.some((existing) => {
      if (!slotsOverlap(slot.startsAt, slot.endsAt, existing.startsAt, existing.endsAt)) return false;
      if (parsed.kind === "rendez_vous" && existing.kind === "disponible") return false;
      return true;
    }),
  );
  if (clash) return { ok: false, error: "Ce créneau chevauche un créneau existant." };
  const location = parsed.location?.trim() || (parsed.format === "visio" ? "Visio" : "");
  const clientId = parsed.clientId || null;
  let clientLabel: string | null = null;
  let clientEmail: string | null = null;
  let clientFirst = "";
  const supabase = await getServerClient();
  const admin = getServiceRoleClient();
  const patientsDb = admin ?? supabase;
  if (clientId && patientsDb) {
    const { data: patient } = await patientsDb
      .from("expert_care_clients")
      .select("first_name,last_name,email")
      .eq("id", clientId)
      .eq("expert_id", session.id)
      .maybeSingle();
    if (patient) {
      clientFirst = String(patient.first_name ?? "").trim();
      clientLabel = [patient.first_name, patient.last_name].filter(Boolean).join(" ").trim() || String(patient.email ?? "");
      clientEmail = String(patient.email ?? "").trim() || null;
    }
  }
  if (isJadeDemoEmail(session.email)) {
    await mutateJade((current) => ({
      ...current,
      extraSlots: [
        ...(current.extraSlots ?? []),
        ...built.map((slot, index) => ({
          id: `jade-slot-${Date.now()}-${index}`,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          format: parsed.format as SlotFormat,
          kind: parsed.kind as SlotKind,
          location,
          missionId: null,
          title: parsed.kind === "rendez_vous" ? "Rendez-vous" : null,
          client: clientLabel,
          clientId,
        })),
      ],
    }));
  } else {
    const dates = occurrences.map((occurrence) => {
      const y = occurrence.getFullYear();
      const m = String(occurrence.getMonth() + 1).padStart(2, "0");
      const d = String(occurrence.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    });
    const uniqueDates = parsed.weekly && parsed.kind === "disponible" ? [parsed.date] : dates;
    for (const date of uniqueDates) {
      const written = await writeCareAgendaSlot({
        expertId: session.id,
        date,
        start: parsed.start,
        end: parsed.end,
        format: parsed.format,
        kind: parsed.kind,
        weekly: Boolean(parsed.weekly) && parsed.kind === "disponible" && date === parsed.date,
        client: clientId
          ? {
              first_name: clientFirst,
              last_name: (clientLabel ?? "").replace(clientFirst, "").trim(),
              email: clientEmail ?? "",
            }
          : null,
      });
      if (!written.ok) return { ok: false, error: written.error };
    }
    if (parsed.kind === "formation") {
      if (!supabase) return { ok: false, error: "Service indisponible" };
      const rows = built.map((slot) => ({
        expert_id: session.id,
        starts_at: slot.startsAt,
        ends_at: slot.endsAt,
        format: parsed.format,
        location,
        mission_id: null,
        recurrence_rule: encodeSlotRule(parsed.kind, Boolean(parsed.weekly), clientId, clientLabel),
      }));
      await supabase.from("expert_slots").insert(rows);
    }
  }
  let emailed = false;
  let emailError: string | null = null;
  const shouldNotify = parsed.kind === "rendez_vous" && Boolean(clientEmail);
  if (shouldNotify) {
    const when = start.toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
    const expertName = space.profile?.name?.trim() || "Votre expert Byound Care";
    const mailed = await sendEmail({
      to: clientEmail as string,
      subject: "Byound Care — votre rendez-vous",
      html: buildCareEmail({
        preheader: `Rendez-vous le ${when}.`,
        greeting: clientFirst ? `Bonjour ${clientFirst},` : "Bonjour,",
        title: "Votre rendez-vous est confirmé",
        bodyHtml: `<p style="margin:0 0 12px;">${expertName} vous attend le <strong>${when}</strong>.</p><p style="margin:0;">Lieu : ${location || (parsed.format === "visio" ? "Visio" : "à confirmer")}.</p>`,
      }),
    });
    emailed = mailed.success;
    emailError = mailed.success ? null : mailed.error ?? "L'e-mail n'a pas pu partir.";
  }
  refresh();
  return { ok: true, emailed, emailError };
}

export async function saveAgendaSettings(input: z.infer<typeof settingsSchema>) {
  const parsed = settingsSchema.parse(input);
  const session = await getSession();
  if (!session?.id) return { ok: false, error: "Connexion requise" };
  if (isJadeDemoEmail(session.email)) {
    await mutateJade((current) => ({ ...current, format: parsed.format ?? current.format, noticeHours: parsed.noticeHours ?? current.noticeHours }));
    return { ok: true };
  }
  const supabase = await getServerClient();
  if (!supabase) return { ok: false, error: "Service indisponible" };
  const current = await supabase.from("experts").select("references").eq("id", session.id).maybeSingle();
  const meta = parseRegistrationMeta(current.data?.references);
  const references = mergeRegistrationMeta(current.data?.references, {
    agenda_format: parsed.format ?? meta?.agenda_format ?? null,
    notice_hours: parsed.noticeHours ?? meta?.notice_hours ?? null,
  });
  const { error } = await supabase.from("experts").update({ references }).eq("id", session.id);
  if (error) return { ok: false, error: error.message };
  const admin = getServiceRoleClient();
  if (admin && parsed.noticeHours != null) {
    await admin.from("care_profiles").update({ cancellation_hours: parsed.noticeHours, updated_at: new Date().toISOString() }).eq("expert_id", session.id);
  }
  refresh();
  return { ok: true };
}

export async function saveExpertDocument(input: z.infer<typeof documentSchema>) {
  const parsed = documentSchema.parse(input);
  const session = await getSession();
  if (!session?.id) return { ok: false, error: "Connexion requise" };
  const document: ExpertDocumentMeta = {
    id: crypto.randomUUID(),
    name: parsed.name,
    category: parsed.folder === "cv" ? "cv" : parsed.folder === "attestation" ? "certificates" : parsed.folder === "contrat" ? "admin" : "portfolio",
    url: parsed.url,
    mime_type: parsed.mime ?? null,
    size: parsed.size ?? null,
    uploaded_at: new Date().toISOString(),
    status: "deposited",
    folder: parsed.folder,
  };
  if (isJadeDemoEmail(session.email)) {
    await mutateJade((current) => ({
      ...current,
      extraDocuments: [
        ...(current.extraDocuments ?? []),
        { id: document.id, name: document.name, folder: parsed.folder, status: "deposited", uploadedAt: document.uploaded_at, expiresAt: null, pages: null, url: document.url },
      ],
    }));
    return { ok: true };
  }
  const supabase = await getServerClient();
  if (!supabase) return { ok: false, error: "Service indisponible" };
  const current = await supabase.from("experts").select("references").eq("id", session.id).maybeSingle();
  const meta = parseRegistrationMeta(current.data?.references);
  const references = mergeRegistrationMeta(current.data?.references, { documents: [...(meta?.documents ?? []), document] });
  const { error } = await supabase.from("experts").update({ references }).eq("id", session.id);
  if (error) return { ok: false, error: error.message };
  await supabase.from("expert_documents").insert({
    id: document.id,
    expert_id: session.id,
    name: parsed.name,
    folder: parsed.folder,
    status: "deposited",
    url: parsed.url,
  });
  refresh();
  return { ok: true };
}

export async function signExpertDocument(id: string) {
  const documentId = z.string().min(1).parse(id);
  const session = await getSession();
  if (!session?.id) return { ok: false, error: "Connexion requise" };
  if (isJadeDemoEmail(session.email)) {
    await mutateJade((current) => ({ ...current, signedDocs: [...new Set([...(current.signedDocs ?? []), documentId])] }));
    return { ok: true };
  }
  const supabase = await getServerClient();
  if (!supabase) return { ok: false, error: "Service indisponible" };
  const current = await supabase.from("experts").select("references").eq("id", session.id).maybeSingle();
  const meta = parseRegistrationMeta(current.data?.references);
  const documents = (meta?.documents ?? []).map((document) => (document.id === documentId ? { ...document, status: "signed" as const } : document));
  const references = mergeRegistrationMeta(current.data?.references, { documents });
  const { error } = await supabase.from("experts").update({ references }).eq("id", session.id);
  if (error) return { ok: false, error: error.message };
  await supabase.from("expert_documents").update({ status: "signed" }).eq("id", documentId).eq("expert_id", session.id);
  refresh();
  return { ok: true };
}

export async function getCareListingSettings(): Promise<CareListingSettings | null> {
  const session = await getSession();
  const db = getServiceRoleClient();
  if (!session?.id || !db) return null;
  const [{ data: expert }, { data }] = await Promise.all([
    db.from("experts").select("is_care_expert").eq("id", session.id).maybeSingle(),
    db
      .from("care_profiles")
      .select("published, slug, tagline, approach, city, address, publics, domains, cancellation_hours, payment_methods, is_care")
      .eq("expert_id", session.id)
      .maybeSingle(),
  ]);
  if (!expert?.is_care_expert && !data) {
    const { data: membership } = await db
      .from("expert_memberships")
      .select("id")
      .eq("expert_id", session.id)
      .eq("pole", "care")
      .eq("status", "active")
      .maybeSingle();
    if (!membership) return null;
  }
  if (!data) {
    return {
      published: false,
      slug: "",
      tagline: "",
      approach: "",
      city: "",
      address: "",
      publics: [],
      careDomains: [],
      cancellationHours: 24,
      paymentMethods: ["on_site"],
    };
  }
  return {
    published: data.published === true,
    slug: String(data.slug ?? ""),
    tagline: String(data.tagline ?? ""),
    approach: String(data.approach ?? ""),
    city: String(data.city ?? ""),
    address: String(data.address ?? ""),
    publics: Array.isArray(data.publics) ? data.publics.map(String) : [],
    careDomains: Array.isArray(data.domains) ? data.domains.map(String) : [],
    cancellationHours: Number(data.cancellation_hours) || 24,
    paymentMethods: Array.isArray(data.payment_methods) ? data.payment_methods.map(String) : ["on_site"],
  };
}

export async function syncCareProfileFromExpertAccount(listing?: Partial<CareListingSettings>) {
  const session = await getSession();
  const db = getServiceRoleClient();
  if (!session?.id || !db) return { ok: false as const };
  const slug = await ensureCareProfile(db, session.id);
  const { data: expert } = await db
    .from("experts")
    .select("first_name, last_name, headline, bio, bio_long, avatar_url, photo_url, formats_supported, regions, specialties")
    .eq("id", session.id)
    .maybeSingle();
  const { data: current } = await db
    .from("care_profiles")
    .select("published, slug, tagline, approach, city, address, publics, domains, cancellation_hours, payment_methods")
    .eq("expert_id", session.id)
    .maybeSingle();
  const display = [expert?.first_name, expert?.last_name].filter(Boolean).join(" ").trim() || "Praticien";
  const formats = Array.isArray(expert?.formats_supported) ? expert.formats_supported.map(String) : [];
  const regions = Array.isArray(expert?.regions) ? expert.regions.map(String) : [];
  const specialties = Array.isArray(expert?.specialties) ? expert.specialties.map(String) : [];
  const domains = (listing?.careDomains ?? (current?.domains as string[] | undefined) ?? []).filter(Boolean);
  const patch = {
    is_care: true,
    published: listing?.published ?? current?.published === true,
    display_name: display,
    title: String(expert?.headline ?? "").trim(),
    headline: String(expert?.headline ?? "").trim(),
    bio: String(expert?.bio ?? expert?.bio_long ?? "").trim(),
    tagline: listing?.tagline ?? String(current?.tagline ?? ""),
    approach: listing?.approach ?? String(current?.approach ?? expert?.bio_long ?? ""),
    avatar_url: String(expert?.avatar_url ?? expert?.photo_url ?? "").trim() || null,
    city: (listing?.city ?? String(current?.city ?? regions[0] ?? "")).trim() || null,
    address: (listing?.address ?? String(current?.address ?? "")).trim() || null,
    offers_cabinet: formats.some((item) => /cabinet|presentiel|sur site/i.test(item)),
    offers_visio: formats.some((item) => /visio|distanciel|en ligne/i.test(item)) || formats.length === 0,
    domains,
    publics: listing?.publics ?? (Array.isArray(current?.publics) ? current.publics.map(String) : []),
    payment_methods: listing?.paymentMethods ?? (Array.isArray(current?.payment_methods) ? current.payment_methods.map(String) : ["on_site"]),
    cancellation_hours: listing?.cancellationHours ?? (Number(current?.cancellation_hours) || 24),
    updated_at: new Date().toISOString(),
  };
  if (!patch.domains.length) {
    patch.domains = specialties.filter((item) => CARE_DOMAIN_IDS.includes(item as (typeof CARE_DOMAIN_IDS)[number]));
  }
  await db.from("care_profiles").update(patch).eq("expert_id", session.id);
  revalidateCarePublicProfile(String(current?.slug ?? slug));
  return { ok: true as const, slug: String(current?.slug ?? slug) };
}

export async function startCertification() {
  const session = await getSession();
  if (!session?.id || isJadeDemoEmail(session.email)) return { ok: true };
  const supabase = await getServerClient();
  if (!supabase) return { ok: false, error: "Service indisponible" };
  const { error } = await supabase.from("experts").update({ certification_status: "training", wants_certification: true }).eq("id", session.id);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}
