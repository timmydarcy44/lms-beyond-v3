import { cache } from "react";
import { cookies } from "next/headers";

import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { getSession } from "@/lib/auth/session";
import { isEdgeCertified } from "@/lib/expert/expert-certification";
import { parseRegistrationMeta, type ExpertDocumentMeta } from "@/lib/expert/expert-registration-meta";
import { buildJadeDocuments, buildJadeMissions, buildJadeReviews, buildJadeSlots } from "@/lib/expert/jade-expert-space";
import {
  cleanClient,
  DEFAULT_VISIBILITY,
  missionTitleFromLabel,
  PROFILE_SECTIONS,
  type ExpertDocumentItem,
  type ExpertMission,
  type ExpertReview,
  type RevenueLine,
  type ExpertSlot,
  type MissionBilling,
  type MissionStatus,
  type ProfileSectionId,
  type ProfileVisibility,
  asNoticeHours,
  slotClientIdFromRule,
  slotClientNameFromRule,
  slotKindFromRule,
  type NoticeHours,
  type SlotFormat,
} from "@/lib/expert/space-model";
import { loadCareAgendaSlots } from "@/lib/care/expert-agenda";
import { loadExpertPoleState } from "@/lib/expert/poles";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

const COOKIE = "jade_expert_overrides";

export type JadeOverrides = {
  missionStatus?: Partial<Record<string, MissionStatus>>;
  missionBilling?: Partial<Record<string, MissionBilling>>;
  signedDocs?: string[];
  extraSlots?: ExpertSlot[];
  extraDocuments?: ExpertDocumentItem[];
  format?: SlotFormat;
  noticeHours?: NoticeHours;
};

export type ExpertProfileModel = {
  id: string;
  name: string;
  firstName: string;
  headline: string;
  regions: string[];
  specialties: string[];
  formats: string[];
  bio: string;
  photoUrl: string | null;
  dailyRate: number | null;
  certified: boolean;
  visibility: ProfileVisibility;
  reviews: ExpertReview[];
  missionsDone: number;
  sections: Array<{ id: ProfileSectionId; label: string; filled: boolean; missing: string; values: string[] }>;
  legalName?: string | null;
  siret?: string | null;
  vatLiable?: boolean | null;
};

export type ExpertCertificationModel = {
  certified: boolean;
  name: string;
  specialty: string;
  badgeId: string;
  expiresYear: number | null;
  steps: Array<{ id: string; label: string; detail: string; at: string | null; done: boolean }>;
  publicPath: string;
};

export type ExpertSpaceData = {
  demo: boolean;
  profile: ExpertProfileModel;
  missions: ExpertMission[];
  slots: ExpertSlot[];
  documents: ExpertDocumentItem[];
  certification: ExpertCertificationModel;
  format: SlotFormat;
  noticeHours: NoticeHours;
};

export async function readJadeOverrides(): Promise<JadeOverrides> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return {};
  try {
    return JSON.parse(raw) as JadeOverrides;
  } catch {
    return {};
  }
}

export async function writeJadeOverrides(next: JadeOverrides) {
  const store = await cookies();
  store.set(COOKIE, JSON.stringify(next), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
}

function applyOverrides(data: ExpertSpaceData, overrides: JadeOverrides): ExpertSpaceData {
  const missions = data.missions
    .map((mission) => ({
      ...mission,
      status: overrides.missionStatus?.[mission.id] ?? mission.status,
      billing: overrides.missionBilling?.[mission.id] ?? mission.billing,
    }))
    .filter((mission) => mission.status !== "annulee");
  const documents = [...data.documents, ...(overrides.extraDocuments ?? [])].map((document) =>
    overrides.signedDocs?.includes(document.id) ? { ...document, status: "signed" as const } : document,
  );
  const cancelled = new Set(
    Object.entries(overrides.missionStatus ?? {})
      .filter(([, status]) => status === "annulee")
      .map(([id]) => id),
  );
  return {
    ...data,
    missions,
    slots: [...data.slots, ...(overrides.extraSlots ?? [])].filter((slot) => !slot.missionId || !cancelled.has(slot.missionId)),
    documents,
    format: overrides.format ?? data.format,
    noticeHours: overrides.noticeHours ?? data.noticeHours,
    profile: {
      ...data.profile,
      missionsDone: missions.filter((mission) => mission.status === "terminee").length,
    },
  };
}

function jadeSpace(now: Date): ExpertSpaceData {
  const missions = buildJadeMissions(now);
  const reviews = buildJadeReviews(now);
  const regions = ["Normandie", "Île-de-France"];
  const specialties = ["Prospection", "Closing", "CRM"];
  const formats = ["Présentiel", "Visio"];
  const sections = profileSections({
    headline: "Experte commerciale",
    specialties,
    regions,
    formats,
    dailyRate: null,
    photoUrl: null,
    bio: "Accompagne les équipes sur la prospection et le closing.",
  });
  return {
    demo: true,
    format: "visio",
    noticeHours: 168,
    missions,
    slots: buildJadeSlots(now),
    documents: buildJadeDocuments(now),
    profile: {
      id: "jade-demo",
      name: "Jade Martin",
      firstName: "Jade",
      headline: "Experte commerciale",
      regions,
      specialties,
      formats,
      bio: "Accompagne les équipes sur la prospection et le closing.",
      photoUrl: null,
      dailyRate: null,
      certified: true,
      visibility: DEFAULT_VISIBILITY,
      reviews,
      missionsDone: missions.filter((mission) => mission.status === "terminee").length,
      sections,
    },
    certification: {
      certified: true,
      name: "Jade Martin",
      specialty: "Experte commerciale",
      badgeId: "BC-7F3A91C2",
      expiresYear: now.getFullYear() + 1,
      publicPath: "/experts/jade-demo",
      steps: [
        { id: "dossier", label: "Dossier validé", detail: "CV, spécialités et références", at: "12 mars 2026", done: true },
        { id: "entretien", label: "Entretien de validation", detail: "Avec l'équipe pédagogique Byound", at: "2 avril 2026", done: true },
        { id: "badge", label: "Badge publié", detail: "Profil expert et badge vérifiable", at: "18 avril 2026", done: true },
        { id: "renouvellement", label: "Renouvellement", detail: "Missions réalisées et avis clients sur la période", at: String(now.getFullYear() + 1), done: false },
      ],
    },
  };
}

function profileSections(input: {
  headline: string;
  specialties: string[];
  regions: string[];
  formats: string[];
  dailyRate: number | null;
  photoUrl: string | null;
  bio: string;
}) {
  const values: Record<ProfileSectionId, string[]> = {
    titre: input.headline ? [input.headline] : [],
    specialites: input.specialties,
    regions: input.regions,
    formats: input.formats,
    tarif: input.dailyRate ? [`${input.dailyRate} €`] : [],
    photo: input.photoUrl ? ["Photo ajoutée"] : [],
    bio: input.bio ? ["Renseignée"] : [],
  };
  return PROFILE_SECTIONS.map((section) => ({
    ...section,
    filled: values[section.id].length > 0,
    values: values[section.id],
  }));
}

function tableMissing(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  return /does not exist|could not find the table|schema cache/i.test(error.message ?? "");
}

function asFormat(value: unknown): SlotFormat {
  return value === "presentiel" ? "presentiel" : "visio";
}

function mapDocument(doc: ExpertDocumentMeta): ExpertDocumentItem {
  const folder =
    doc.folder ??
    (doc.category === "cv" ? "cv" : doc.category === "certificates" || doc.category === "diplomas" ? "attestation" : doc.category === "admin" ? "contrat" : "autre");
  return {
    id: doc.id,
    name: doc.name,
    folder,
    status: doc.status ?? "deposited",
    uploadedAt: doc.uploaded_at,
    expiresAt: doc.expires_at ?? null,
    pages: doc.pages ?? null,
    url: doc.url,
  };
}

function mapMission(row: Record<string, unknown>, expertFirstName: string): ExpertMission {
  const metadata = (row.metadata && typeof row.metadata === "object" ? row.metadata : {}) as Record<string, unknown>;
  const statusRaw = String(row.status ?? "");
  const status: MissionStatus =
    statusRaw === "expert_notified" || statusRaw === "pending_hr_validation"
      ? "nouvelle"
      : statusRaw === "accepted"
        ? "acceptee"
        : statusRaw === "scheduled"
          ? "planifiee"
          : statusRaw === "completed"
            ? "terminee"
            : statusRaw === "cancelled"
              ? "annulee"
              : "acceptee";
  const starts = typeof row.scheduled_at === "string" ? row.scheduled_at : typeof row.created_at === "string" ? row.created_at : new Date().toISOString();
  const duration = Number(metadata.duration_minutes) || 60;
  const ends = new Date(new Date(starts).getTime() + duration * 60 * 1000).toISOString();
  const amountCents = Number(metadata.amount_cents) || Math.round(Number(metadata.amount || metadata.price || 0) * 100) || 0;
  const paidAt = typeof metadata.paid_at === "string" ? metadata.paid_at : null;
  const billing: MissionBilling =
    metadata.billing === "paid" || metadata.billing === "to_invoice" || metadata.billing === "upcoming" || metadata.billing === "none"
      ? metadata.billing
      : paidAt
        ? "paid"
        : status === "terminee"
          ? "to_invoice"
          : status === "acceptee" || status === "planifiee"
            ? "upcoming"
            : "none";
  const format = asFormat(metadata.format);
  const label = typeof row.target_label === "string" ? row.target_label : "Mission";
  return {
    id: String(row.id),
    title: typeof metadata.title === "string" && metadata.title.trim() ? metadata.title.trim() : missionTitleFromLabel(label, expertFirstName),
    client: cleanClient(metadata.client) || cleanClient(metadata.company) || cleanClient(metadata.organization) || "Client",
    startsAt: starts,
    endsAt: ends,
    format,
    location: typeof metadata.location === "string" && metadata.location.trim() ? metadata.location : format === "visio" ? "Visio" : "Sur site",
    durationLabel: duration >= 60 && duration % 60 === 0 ? `${duration / 60} h` : `${duration} min`,
    amountCents,
    status,
    billing,
    paidAt,
    visioUrl: typeof metadata.visio_url === "string" ? metadata.visio_url : null,
  };
}

function emptySpace(id: string, name: string): ExpertSpaceData {
  return {
    demo: false,
    format: "visio",
    noticeHours: 168,
    missions: [],
    slots: [],
    documents: [],
    profile: {
      id,
      name,
      firstName: name.split(" ")[0] ?? "",
      headline: "",
      regions: [],
      specialties: [],
      formats: [],
      bio: "",
      photoUrl: null,
      dailyRate: null,
      certified: false,
      visibility: DEFAULT_VISIBILITY,
      reviews: [],
      missionsDone: 0,
      sections: profileSections({ headline: "", specialties: [], regions: [], formats: [], dailyRate: null, photoUrl: null, bio: "" }),
      legalName: null,
      siret: null,
      vatLiable: null,
    },
    certification: {
      certified: false,
      name,
      specialty: "Experte",
      badgeId: `BC-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`,
      expiresYear: null,
      publicPath: `/experts/${id}`,
      steps: [
        { id: "dossier", label: "Dossier validé", detail: "CV, spécialités et références", at: null, done: false },
        { id: "entretien", label: "Entretien de validation", detail: "Avec l'équipe pédagogique Byound", at: null, done: false },
        { id: "badge", label: "Badge publié", detail: "Profil expert et badge vérifiable", at: null, done: false },
        { id: "renouvellement", label: "Renouvellement", detail: "Missions réalisées et avis clients sur la période", at: null, done: false },
      ],
    },
  };
}

export const loadExpertSpace = cache(async (): Promise<ExpertSpaceData> => {
  const session = await getSession();
  const now = new Date();
  if (session?.email && isJadeDemoEmail(session.email)) {
    return applyOverrides(jadeSpace(now), await readJadeOverrides());
  }
  const supabase = await getServerClient();
  if (!supabase || !session?.id) return emptySpace(session?.id ?? "expert", session?.fullName ?? "Expert");
  const base = await supabase
    .from("experts")
    .select("id,first_name,last_name,headline,bio,avatar_url,photo_url,specialties,formats_supported,regions,references,review_status,is_active,certification_status,is_certified_beyond,created_at,linkedin_url")
    .eq("id", session.id)
    .maybeSingle();
  const expert = (base.data ?? {}) as Record<string, unknown>;
  const meta = parseRegistrationMeta(expert.references);
  const firstName = String(expert.first_name ?? "").trim();
  const lastName = String(expert.last_name ?? "").trim();
  const name = [firstName, lastName].filter(Boolean).join(" ") || "Expert";
  const dailyRate = typeof meta?.daily_rate === "number" ? meta.daily_rate : null;
  const photoUrl = String(expert.photo_url || expert.avatar_url || meta?.photo_url || "").trim() || null;
  const regions = Array.isArray(expert.regions) ? (expert.regions as string[]) : meta?.geographic_zones ?? [];
  const specialties = Array.isArray(expert.specialties) ? (expert.specialties as string[]) : [];
  const formats = Array.isArray(expert.formats_supported) ? (expert.formats_supported as string[]) : [];
  const headline = String(expert.headline ?? "").trim();
  const bio = String(expert.bio ?? meta?.bio_long ?? "").trim();
  const visibility = { ...DEFAULT_VISIBILITY, ...(meta?.visibility ?? {}) };
  const certified = isEdgeCertified({
    certification_status: expert.certification_status as string | null,
    is_certified_beyond: expert.is_certified_beyond === true,
  });

  const poleState = await loadExpertPoleState();
  void poleState;
  let requests = await supabase
    .from("action_requests")
    .select("id,action_type,target_label,status,created_at,scheduled_at,metadata")
    .eq("expert_id", session.id)
    .order("scheduled_at", { ascending: true });
  if (requests.error && /pole|column|schema cache/i.test(requests.error.message ?? "")) {
    requests = await supabase
      .from("action_requests")
      .select("id,action_type,target_label,status,created_at,scheduled_at,metadata")
      .eq("expert_id", session.id)
      .order("scheduled_at", { ascending: true });
  }
  const missions = (requests.error ? [] : (requests.data ?? [])).map((row) => mapMission(row as Record<string, unknown>, firstName)).filter((mission) => mission.status !== "annulee");

  let slotQuery = await supabase.from("expert_slots").select("id,starts_at,ends_at,format,location,mission_id,recurrence_rule").eq("expert_id", session.id);
  if (slotQuery.error && /recurrence_rule|column/i.test(slotQuery.error.message ?? "")) {
    slotQuery = await supabase.from("expert_slots").select("id,starts_at,ends_at,format,location,mission_id").eq("expert_id", session.id);
  }
  const missionIds = new Set(missions.map((mission) => mission.id));
  const admin = getServiceRoleClient();
  const careClients = await (admin ?? supabase).from("expert_care_clients").select("id,first_name,last_name,email").eq("expert_id", session.id);
  const careById = new Map(
    ((careClients.error ? [] : careClients.data) ?? []).map((row) => [
      String(row.id),
      [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || String(row.email ?? "Patient"),
    ]),
  );
  const legacySlots: ExpertSlot[] = tableMissing(slotQuery.error)
    ? []
    : ((slotQuery.data ?? []) as Array<Record<string, unknown>>)
        .filter((slot) => !slot.mission_id || missionIds.has(String(slot.mission_id)))
        .map((slot) => {
        const mission = missions.find((item) => item.id === slot.mission_id);
        const clientId = slotClientIdFromRule(slot.recurrence_rule);
        const storedName = slotClientNameFromRule(slot.recurrence_rule);
        return {
          id: String(slot.id),
          startsAt: String(slot.starts_at),
          endsAt: String(slot.ends_at),
          format: asFormat(slot.format),
          kind: slotKindFromRule(slot.recurrence_rule),
          location: String(slot.location ?? ""),
          missionId: slot.mission_id ? String(slot.mission_id) : null,
          title: mission?.title ?? null,
          client: mission?.client ?? (clientId ? careById.get(clientId) ?? null : null) ?? storedName,
          clientId,
        };
      });
  const careSlots = await loadCareAgendaSlots(session.id);
  const slots: ExpertSlot[] = [
    ...careSlots,
    ...legacySlots.filter((slot) => slot.kind === "formation" || Boolean(slot.missionId)),
  ];

  const reviewQuery = await supabase.from("expert_reviews").select("id,client_name,rating,body,mission_label,created_at").eq("expert_id", session.id).order("created_at", { ascending: false }).limit(3);
  const reviews: ExpertReview[] = tableMissing(reviewQuery.error)
    ? []
    : ((reviewQuery.data ?? []) as Array<Record<string, unknown>>).map((review) => ({
        id: String(review.id),
        client: String(review.client_name ?? "Client"),
        rating: Number(review.rating) || 0,
        body: String(review.body ?? ""),
        mission: String(review.mission_label ?? "Mission"),
        at: String(review.created_at ?? now.toISOString()),
      }));

  const documents = (meta?.documents ?? []).map(mapDocument);
  const created = expert.created_at ? new Date(String(expert.created_at)) : null;
  const steps = [
    { id: "dossier", label: "Dossier validé", detail: "CV, spécialités et références", at: created ? created.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : null, done: expert.review_status === "approved" },
    { id: "entretien", label: "Entretien de validation", detail: "Avec l'équipe pédagogique Byound", at: null, done: certified },
    { id: "badge", label: "Badge publié", detail: "Profil expert et badge vérifiable", at: certified && created ? created.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : null, done: certified },
    { id: "renouvellement", label: "Renouvellement", detail: "Missions réalisées et avis clients sur la période", at: certified ? String(now.getFullYear() + 1) : null, done: false },
  ];
  const notice = asNoticeHours(meta?.notice_hours, 168);
  const format = asFormat(meta?.agenda_format);
  return {
    demo: false,
    format,
    noticeHours: notice,
    missions,
    slots,
    documents,
    profile: {
      id: session.id,
      name,
      firstName,
      headline,
      regions,
      specialties,
      formats,
      bio,
      photoUrl,
      dailyRate,
      certified,
      visibility,
      reviews,
      missionsDone: missions.filter((mission) => mission.status === "terminee").length,
      sections: profileSections({ headline, specialties, regions, formats, dailyRate, photoUrl, bio }),
      legalName: meta?.legal_name ?? null,
      siret: meta?.siret ?? null,
      vatLiable: meta?.vat_liable ?? null,
    },
    certification: {
      certified,
      name,
      specialty: headline || "Experte",
      badgeId: `BC-${session.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`,
      expiresYear: certified ? now.getFullYear() + 1 : null,
      publicPath: `/experts/${session.id}`,
      steps,
    },
  };
});

export async function loadExpertRevenueExtras(): Promise<RevenueLine[]> {
  const session = await getSession();
  const space = await loadExpertSpace();
  const db = getServiceRoleClient();
  const extras: RevenueLine[] = [];
  const missionIds = new Set(space.missions.map((mission) => mission.id));
  const rateCents = typeof space.profile.dailyRate === "number" ? Math.round(space.profile.dailyRate * 100) : 0;
  const now = Date.now();
  for (const slot of space.slots) {
    if (slot.kind === "indisponible") continue;
    if (slot.missionId && missionIds.has(slot.missionId)) continue;
    if (!slot.client && !slot.missionId) continue;
    const done = new Date(slot.endsAt).getTime() <= now;
    extras.push({
      id: `slot-${slot.id}`,
      title: slot.title || "Rendez-vous",
      client: slot.client || "Client",
      at: slot.startsAt,
      amountCents: rateCents,
      bucket: "upcoming",
      pill: done ? "to_invoice" : "upcoming",
      detail: `${slot.client || "Client"} · ${new Date(slot.startsAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`,
    });
  }
  if (session?.id && db) {
    const { data, error } = await db
      .from("expert_care_invoices")
      .select("id,amount_cents,designation,status,sent_at,created_at,client_id")
      .eq("expert_id", session.id);
    if (!error) {
      for (const row of data ?? []) {
        const sent = Boolean(row.sent_at) || row.status === "sent";
        extras.push({
          id: `invoice-${row.id}`,
          title: String(row.designation ?? "Facture"),
          client: "Client Care",
          at: String(row.sent_at ?? row.created_at ?? new Date().toISOString()),
          amountCents: Number(row.amount_cents) || 0,
          bucket: sent ? "paid" : "upcoming",
          pill: sent ? "paid" : "to_invoice",
          detail: sent ? "Facture envoyée" : "Facture à envoyer",
        });
      }
    }
  }
  return extras;
}

export async function loadExpertNavCounts() {
  try {
    const space = await loadExpertSpace();
    return {
      missions: space.missions.filter((mission) => mission.status === "nouvelle").length,
      documents: space.documents.filter((document) => document.status === "to_sign").length,
    };
  } catch {
    return { missions: 0, documents: 0 };
  }
}

export function serviceClient() {
  return getServiceRoleClient();
}
