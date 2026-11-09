import type { SupabaseClient } from "@supabase/supabase-js";
import {
  BYOUND_POSTAL_ADDRESS,
  formatByoundPostalAddress,
  formatPostalAddress,
} from "@/lib/formation-documents/postal-address";

export { formatByoundPostalAddress, formatPostalAddress };

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
    opco_name: string | null;
    session_id: string | null;
    status: string;
  };
  organization: {
    id: string;
    name: string;
    siret: string | null;
    siren: string | null;
    client_code: string | null;
    address_line: string | null;
    address_zip: string | null;
    address_city: string | null;
    address_country: string | null;
    opco_name: string | null;
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

/** Identité OF réelle (corps PDF AcroForm) — utilisée si of_settings est vide / placeholder. */
const DEFAULT_OF: OfIdentity = {
  legal_name: "SAS Byound Business",
  nda: null,
  siret: "13070905800015",
  siren: "130709058",
  vat_intra: "FR30130709058",
  address_line: BYOUND_POSTAL_ADDRESS.address_line,
  address_city: BYOUND_POSTAL_ADDRESS.address_city,
  address_zip: BYOUND_POSTAL_ADDRESS.address_zip,
  address_country: BYOUND_POSTAL_ADDRESS.address_country,
};

function digitsOnly(value: string | null | undefined): string {
  return String(value || "").replace(/\D/g, "");
}

/** SIRET démo / incomplet → on retombe sur l’identité Byound. */
function isUnusableSiret(value: string | null | undefined): boolean {
  const d = digitsOnly(value);
  if (d.length !== 14) return true;
  if (d.startsWith("901234567")) return true;
  if (/^(\d)\1{13}$/.test(d)) return true;
  return false;
}

export function formatOfPostalAddress(of: OfIdentity = DEFAULT_OF): string {
  return formatPostalAddress(of) || formatByoundPostalAddress();
}

function resolveOfIdentity(ofRow: Record<string, unknown> | null | undefined): OfIdentity {
  const rawName = ofRow?.legal_name ? String(ofRow.legal_name).trim() : "";
  const legal_name =
    !rawName || rawName === "Byound" ? DEFAULT_OF.legal_name : rawName;
  const siret = !isUnusableSiret(ofRow?.siret as string | null)
    ? digitsOnly(String(ofRow?.siret))
    : DEFAULT_OF.siret;
  const siren =
    ofRow?.siren && digitsOnly(String(ofRow.siren)).length === 9
      ? digitsOnly(String(ofRow.siren))
      : siret?.slice(0, 9) || DEFAULT_OF.siren;
  const vat_intra = ofRow?.vat_intra
    ? String(ofRow.vat_intra).trim()
    : DEFAULT_OF.vat_intra;
  return {
    legal_name,
    nda: ofRow?.nda ? String(ofRow.nda) : null,
    siret,
    siren,
    vat_intra: vat_intra || DEFAULT_OF.vat_intra,
    address_line: ofRow?.address_line
      ? String(ofRow.address_line)
      : DEFAULT_OF.address_line,
    address_city: ofRow?.address_city
      ? String(ofRow.address_city)
      : DEFAULT_OF.address_city,
    address_zip: ofRow?.address_zip ? String(ofRow.address_zip) : DEFAULT_OF.address_zip,
    address_country: ofRow?.address_country
      ? String(ofRow.address_country)
      : DEFAULT_OF.address_country,
  };
}

export async function loadDossierDocContext(
  service: SupabaseClient,
  dossierId: string,
): Promise<DossierDocContext | null> {
  let dossierQuery = await service
    .from("formation_dossiers")
    .select(
      "id, organization_id, training_course_id, course_title, amount_ht_cents, amount_tva_cents, amount_ttc_cents, contact_name, contact_email, contact_phone, modality_intra_inter, modality_presence, funding_type, opco_name, session_id, status, notes",
    )
    .eq("id", dossierId)
    .maybeSingle();
  if (dossierQuery.error && /opco_name/i.test(dossierQuery.error.message)) {
    dossierQuery = await service
      .from("formation_dossiers")
      .select(
        "id, organization_id, training_course_id, course_title, amount_ht_cents, amount_tva_cents, amount_ttc_cents, contact_name, contact_email, contact_phone, modality_intra_inter, modality_presence, funding_type, session_id, status, notes",
      )
      .eq("id", dossierId)
      .maybeSingle();
  }
  const dossier = dossierQuery.data as (Record<string, unknown> & {
    id: string;
    organization_id: string;
    session_id?: string | null;
    contact_name?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    course_title?: string | null;
    training_course_id?: string | null;
    amount_ht_cents?: number | null;
    amount_tva_cents?: number | null;
    amount_ttc_cents?: number | null;
    modality_intra_inter?: string | null;
    modality_presence?: string | null;
    funding_type?: string | null;
    opco_name?: string | null;
    status?: string;
    notes?: string | null;
  }) | null;
  if (!dossier) return null;

  let orgQuery = await service
    .from("organizations")
    .select(
      "id, name, siret, siren, client_code, address_line, address_zip, address_city, address_country, opco_name",
    )
    .eq("id", dossier.organization_id)
    .maybeSingle();
  if (
    orgQuery.error &&
    (orgQuery.error.code === "42703" ||
      orgQuery.error.message.includes("address_") ||
      orgQuery.error.message.includes("client_code") ||
      /opco_/i.test(orgQuery.error.message))
  ) {
    orgQuery = await service
      .from("organizations")
      .select("id, name, siret, siren, address_line, address_zip, address_city, address_country")
      .eq("id", dossier.organization_id)
      .maybeSingle();
    if (
      orgQuery.error &&
      (orgQuery.error.code === "42703" || orgQuery.error.message.includes("address_"))
    ) {
      orgQuery = await service
        .from("organizations")
        .select("id, name, siret, siren")
        .eq("id", dossier.organization_id)
        .maybeSingle();
    }
  }

  const [{ data: ofRow }, { data: partRows }] = await Promise.all([
    service.from("of_settings").select("*").limit(1).maybeSingle(),
    service
      .from("formation_participants")
      .select("id, profile_id, job_title")
      .eq("dossier_id", dossierId)
      .order("created_at", { ascending: true }),
  ]);

  const orgRow = (orgQuery.data ?? null) as Record<string, unknown> | null;
  if (!orgRow) return null;

  // Assure une réf. client pour le devis si absente
  if (!orgRow.client_code) {
    try {
      const { generateClientCode } = await import("@/lib/organizations/client-code");
      const code = generateClientCode();
      const upd = await service
        .from("organizations")
        .update({ client_code: code })
        .eq("id", String(orgRow.id))
        .is("client_code", null)
        .select("client_code")
        .maybeSingle();
      if (upd.data?.client_code) orgRow.client_code = upd.data.client_code;
      else orgRow.client_code = code;
    } catch {
      /* colonne absente ou course */
    }
  }

  // Backfill SIRET depuis les notes de demande si l'org ne l'a pas encore
  const orgSiretDigits = String(orgRow.siret ?? "").replace(/\D/g, "");
  if (orgSiretDigits.length !== 14) {
    const fromNotes = String((dossier as { notes?: string | null }).notes ?? "").match(
      /SIRET\s*[:：]?\s*([0-9\s]{14,20})/i,
    );
    const noteSiret = fromNotes?.[1]?.replace(/\D/g, "") ?? "";
    if (noteSiret.length === 14) {
      orgRow.siret = noteSiret;
      void service
        .from("organizations")
        .update({ siret: noteSiret })
        .eq("id", String(orgRow.id))
        .is("siret", null)
        .then(({ error }) => {
          if (error) console.warn("[doc-context] backfill siret:", error.message);
        });
    }
  }

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

  const of = resolveOfIdentity((ofRow ?? null) as Record<string, unknown> | null);

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

  // Fallback contact = gestionnaire du compte (Mon compte) si le dossier n'en a pas
  let contactName = dossier.contact_name ? String(dossier.contact_name) : null;
  let contactEmail = dossier.contact_email ? String(dossier.contact_email) : null;
  let contactPhone = dossier.contact_phone ? String(dossier.contact_phone) : null;
  if (!contactName || !contactEmail) {
    const { data: manager } = await service
      .from("profiles")
      .select("first_name, last_name, full_name, email, phone")
      .eq("company_id", dossier.organization_id)
      .in("role", ["entreprise", "admin", "admin_hr"])
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (manager) {
      const name =
        String(manager.full_name ?? "").trim() ||
        [manager.first_name, manager.last_name].filter(Boolean).join(" ").trim();
      if (!contactName && name) contactName = name;
      if (!contactEmail && manager.email) contactEmail = String(manager.email);
      if (!contactPhone && (manager as { phone?: string | null }).phone) {
        contactPhone = String((manager as { phone?: string | null }).phone);
      }
    }
  }

  const notesText = String(dossier.notes ?? "");
  const opcoFromNotes = notesText.match(/OPCO\s*[:—–-]\s*(.+)$/im)?.[1]?.trim() || null;
  const opcoName =
    String(dossier.opco_name ?? "").trim() ||
    String(orgRow.opco_name ?? "").trim() ||
    opcoFromNotes ||
    null;

  // Résolution OPCO à la volée pour un devis OPCO sans nom figé
  const fundingType = dossier.funding_type ? String(dossier.funding_type) : null;
  let resolvedOpco = opcoName;
  if (
    !resolvedOpco &&
    fundingType &&
    (fundingType === "opco" || fundingType.includes("opco")) &&
    String(orgRow.siret ?? "").replace(/\D/g, "").length === 14
  ) {
    try {
      const { resolveAndStoreOrganizationOpco } = await import(
        "@/lib/entreprise/resolve-organization-opco"
      );
      const found = await resolveAndStoreOrganizationOpco(
        service,
        String(orgRow.id),
        String(orgRow.siret),
        { force: true },
      );
      resolvedOpco = found.opco_name;
      if (resolvedOpco) {
        void service
          .from("formation_dossiers")
          .update({ opco_name: resolvedOpco })
          .eq("id", dossier.id)
          .then(({ error }) => {
            if (error && !/opco_name/i.test(error.message)) {
              console.warn("[doc-context] persist opco:", error.message);
            }
          });
      }
    } catch (err) {
      console.warn("[doc-context] opco lookup:", err instanceof Error ? err.message : err);
    }
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
      contact_name: contactName,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      modality_intra_inter: dossier.modality_intra_inter
        ? String(dossier.modality_intra_inter)
        : null,
      modality_presence: dossier.modality_presence ? String(dossier.modality_presence) : null,
      funding_type: fundingType,
      opco_name: resolvedOpco,
      session_id: dossier.session_id ? String(dossier.session_id) : null,
      status: String(dossier.status),
    },
    organization: {
      id: String(orgRow.id),
      name: String(orgRow.name),
      siret: orgRow.siret
        ? String(orgRow.siret).replace(/\D/g, "") || null
        : null,
      siren: orgRow.siren
        ? String(orgRow.siren).replace(/\D/g, "") || null
        : orgRow.siret
          ? String(orgRow.siret).replace(/\D/g, "").slice(0, 9) || null
          : null,
      client_code: orgRow.client_code ? String(orgRow.client_code) : null,
      address_line: orgRow.address_line ? String(orgRow.address_line) : null,
      address_zip: orgRow.address_zip ? String(orgRow.address_zip) : null,
      address_city: orgRow.address_city ? String(orgRow.address_city) : null,
      address_country: orgRow.address_country ? String(orgRow.address_country) : "FR",
      opco_name: resolvedOpco || (orgRow.opco_name ? String(orgRow.opco_name) : null),
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
