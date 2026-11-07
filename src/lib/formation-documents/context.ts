import type { SupabaseClient } from "@supabase/supabase-js";

export type OfIdentity = {
  legal_name: string;
  nda: string | null;
  siret: string | null;
  siren: string | null;
  vat_intra: string | null;
  address_line: string | null;
  address_city: string | null;
  address_zip: string | null;
  address_country: string | null;
};

export type CourseProgramSection = {
  title: string;
  description?: string;
  chapters: Array<{
    title: string;
    subchapters: Array<{ title: string }>;
  }>;
};

export type CourseDocInfo = {
  id: string;
  title: string;
  short_description: string | null;
  duration: string | null;
  level: string | null;
  objectives: string[];
  skills: string[];
  prerequisites: string | null;
  audience: string[];
  program_structure: CourseProgramSection[];
};

export type DossierDocContext = {
  dossier: {
    id: string;
    organization_id: string;
    training_course_id: string | null;
    course_title: string | null;
    amount_ht_cents: number | null;
    amount_tva_cents: number | null;
    amount_ttc_cents: number | null;
    contact_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    modality_intra_inter: string | null;
    modality_presence: string | null;
    funding_type: string | null;
    session_id: string | null;
    status: string;
  };
  organization: {
    id: string;
    name: string;
    siret: string | null;
    siren: string | null;
  };
  of: OfIdentity;
  course: CourseDocInfo | null;
  slots: Array<{
    slot_date: string;
    day_part: string;
    starts_at: string | null;
    ends_at: string | null;
    location_label: string | null;
  }>;
  participants: Array<{
    id: string;
    profile_id: string;
    name: string;
    email: string | null;
    job_title: string | null;
  }>;
  session: {
    id: string;
    title: string | null;
    location_label: string | null;
  } | null;
};

const DEFAULT_OF: OfIdentity = {
  legal_name: "Byound",
  nda: null,
  siret: null,
  siren: null,
  vat_intra: null,
  address_line: null,
  address_city: null,
  address_zip: null,
  address_country: "FR",
};

export async function loadDossierDocContext(
  service: SupabaseClient,
  dossierId: string,
): Promise<DossierDocContext | null> {
  const { data: dossier } = await service
    .from("formation_dossiers")
    .select(
      "id, organization_id, training_course_id, course_title, amount_ht_cents, amount_tva_cents, amount_ttc_cents, contact_name, contact_email, contact_phone, modality_intra_inter, modality_presence, funding_type, session_id, status",
    )
    .eq("id", dossierId)
    .maybeSingle();
  if (!dossier) return null;

  const [{ data: org }, { data: ofRow }, { data: partRows }] = await Promise.all([
    service
      .from("organizations")
      .select("id, name, siret, siren")
      .eq("id", dossier.organization_id)
      .maybeSingle(),
    service.from("of_settings").select("*").limit(1).maybeSingle(),
    service
      .from("formation_participants")
      .select("id, profile_id, job_title")
      .eq("dossier_id", dossierId)
      .order("created_at", { ascending: true }),
  ]);

  if (!org) return null;

  const profileIds = (partRows ?? []).map((p) => String(p.profile_id));
  const { data: profiles } = profileIds.length
    ? await service
        .from("profiles")
        .select("id, full_name, first_name, last_name, email, reference_email")
        .in("id", profileIds)
    : { data: [] as Array<Record<string, unknown>> };
  const profileById = new Map((profiles ?? []).map((p) => [String(p.id), p]));

  let session: DossierDocContext["session"] = null;
  let slots: DossierDocContext["slots"] = [];

  if (dossier.session_id) {
    const { data: sess } = await service
      .from("formation_sessions")
      .select("id, title, location_label")
      .eq("id", dossier.session_id)
      .maybeSingle();
    session = sess
      ? {
          id: String(sess.id),
          title: sess.title ? String(sess.title) : null,
          location_label: sess.location_label ? String(sess.location_label) : null,
        }
      : null;

    const { data: slotRows } = await service
      .from("formation_slots")
      .select("slot_date, day_part, starts_at, ends_at")
      .eq("session_id", dossier.session_id)
      .order("slot_date", { ascending: true });

    slots = (slotRows ?? []).map((s) => ({
      slot_date: String(s.slot_date),
      day_part: String(s.day_part),
      starts_at: s.starts_at ? String(s.starts_at) : null,
      ends_at: s.ends_at ? String(s.ends_at) : null,
      location_label: session?.location_label ?? null,
    }));
  }

  const of: OfIdentity = {
    legal_name: String(ofRow?.legal_name || DEFAULT_OF.legal_name),
    nda: ofRow?.nda ? String(ofRow.nda) : null,
    siret: ofRow?.siret ? String(ofRow.siret) : null,
    siren: ofRow?.siren ? String(ofRow.siren) : null,
    vat_intra: ofRow?.vat_intra ? String(ofRow.vat_intra) : null,
    address_line: ofRow?.address_line ? String(ofRow.address_line) : null,
    address_city: ofRow?.address_city ? String(ofRow.address_city) : null,
    address_zip: ofRow?.address_zip ? String(ofRow.address_zip) : null,
    address_country: ofRow?.address_country ? String(ofRow.address_country) : "FR",
  };

  function mapCourseRow(tc: Record<string, unknown>): CourseDocInfo {
    const structureRaw = Array.isArray(tc.program_structure) ? tc.program_structure : [];
    const program_structure: CourseProgramSection[] = structureRaw
      .map((section) => {
        if (!section || typeof section !== "object") return null;
        const s = section as {
          title?: string;
          description?: string;
          chapters?: unknown[];
        };
        const title = String(s.title ?? "").trim();
        if (!title) return null;
        const chapters = Array.isArray(s.chapters)
          ? s.chapters
              .map((chapter) => {
                if (!chapter || typeof chapter !== "object") return null;
                const c = chapter as { title?: string; subchapters?: unknown[] };
                const chapterTitle = String(c.title ?? "").trim();
                if (!chapterTitle) return null;
                const subchapters = Array.isArray(c.subchapters)
                  ? c.subchapters
                      .map((sub) => {
                        if (typeof sub === "string") return { title: sub.trim() };
                        if (sub && typeof sub === "object" && "title" in sub) {
                          return { title: String((sub as { title: string }).title).trim() };
                        }
                        return null;
                      })
                      .filter((x): x is { title: string } => Boolean(x?.title))
                  : [];
                return { title: chapterTitle, subchapters };
              })
              .filter(Boolean)
          : [];
        return {
          title,
          description: s.description ? String(s.description) : undefined,
          chapters: chapters as CourseProgramSection["chapters"],
        };
      })
      .filter(Boolean) as CourseProgramSection[];

    return {
      id: String(tc.id),
      title: String(tc.title || ""),
      short_description: tc.short_description ? String(tc.short_description) : null,
      duration: tc.duration ? String(tc.duration) : null,
      level: tc.level ? String(tc.level) : null,
      objectives: Array.isArray(tc.objectives)
        ? tc.objectives.map((o) => String(o)).filter(Boolean)
        : [],
      skills: Array.isArray(tc.skills) ? tc.skills.map((o) => String(o)).filter(Boolean) : [],
      prerequisites: tc.prerequisites ? String(tc.prerequisites) : null,
      audience: Array.isArray(tc.audience)
        ? tc.audience.map((o) => String(o)).filter(Boolean)
        : [],
      program_structure,
    };
  }

  let course: CourseDocInfo | null = null;
  const trainingCourseId = dossier.training_course_id
    ? String(dossier.training_course_id)
    : null;
  const courseSelect =
    "id, title, short_description, duration, level, objectives, skills, prerequisites, audience, program_structure";
  if (trainingCourseId) {
    const { data: tc } = await service
      .from("training_courses")
      .select(courseSelect)
      .eq("id", trainingCourseId)
      .maybeSingle();
    if (tc) course = mapCourseRow(tc as Record<string, unknown>);
  }
  if (!course && dossier.course_title) {
    const { data: tc } = await service
      .from("training_courses")
      .select(courseSelect)
      .ilike("title", String(dossier.course_title))
      .limit(1)
      .maybeSingle();
    if (tc) course = mapCourseRow(tc as Record<string, unknown>);
  }

  return {
    dossier: {
      id: String(dossier.id),
      organization_id: String(dossier.organization_id),
      training_course_id: trainingCourseId,
      course_title: dossier.course_title ? String(dossier.course_title) : null,
      amount_ht_cents: dossier.amount_ht_cents != null ? Number(dossier.amount_ht_cents) : null,
      amount_tva_cents: dossier.amount_tva_cents != null ? Number(dossier.amount_tva_cents) : null,
      amount_ttc_cents: dossier.amount_ttc_cents != null ? Number(dossier.amount_ttc_cents) : null,
      contact_name: dossier.contact_name ? String(dossier.contact_name) : null,
      contact_email: dossier.contact_email ? String(dossier.contact_email) : null,
      contact_phone: dossier.contact_phone ? String(dossier.contact_phone) : null,
      modality_intra_inter: dossier.modality_intra_inter
        ? String(dossier.modality_intra_inter)
        : null,
      modality_presence: dossier.modality_presence ? String(dossier.modality_presence) : null,
      funding_type: dossier.funding_type ? String(dossier.funding_type) : null,
      session_id: dossier.session_id ? String(dossier.session_id) : null,
      status: String(dossier.status),
    },
    organization: {
      id: String(org.id),
      name: String(org.name),
      siret: org.siret ? String(org.siret) : null,
      siren: org.siren ? String(org.siren) : null,
    },
    of,
    course,
    slots,
    participants: (partRows ?? []).map((p) => {
      const profile = profileById.get(String(p.profile_id));
      const name =
        String(profile?.full_name ?? "").trim() ||
        [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
        String(profile?.reference_email ?? profile?.email ?? "Participant");
      const emailRaw = profile?.reference_email || profile?.email || null;
      return {
        id: String(p.id),
        profile_id: String(p.profile_id),
        name,
        email: emailRaw ? String(emailRaw).toLowerCase() : null,
        job_title: p.job_title ? String(p.job_title) : null,
      };
    }),
    session,
  };
}

export function eurosFromCents(cents: number | null | undefined): string {
  if (cents == null || Number.isNaN(Number(cents))) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(cents) / 100);
}

export function formatFrDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function appOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "https://www.byound.fr";
  return raw.replace(/\/$/, "");
}
