import { after, NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isCfaCompanyStatus, CFA_COMPANY_STATUS_LABELS, type CfaCompanyStatus } from "@/lib/cfa-companies";
import { sendAccessCode } from "@/lib/cfa/access-code";
import { logCompanyEvent } from "@/lib/cfa/company-events";
import { isCursusId } from "@/lib/cfa/profile-share";
import { sendApprenticeProfile } from "@/lib/cfa/send-apprentice-profile";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { sendEmail } from "@/lib/email/resend-client";
import { publicAppUrl } from "@/lib/env";
import { isOpcoContractReady, refreshCompanyOpco, resolveOpcoForEnteredIdcc, shouldAutoLookupOpco } from "@/lib/cfa/company-opco";
import { zodMessage } from "@/lib/cfa/fiche-input";
import { linkCompanyByExactSiret } from "@/lib/cfa/link-company-organization";
import { cleanSiret, isValidSiret } from "@/lib/cfa/siret";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

const statusSchema = z.object({
  action: z.literal("status"),
  status: z.string().refine(isCfaCompanyStatus, "Statut invalide."),
});

const lostSchema = z.object({
  action: z.literal("mark_lost"),
  reason: z.string().trim().min(1, "Le motif est obligatoire."),
});

const linkSchema = z.object({
  action: z.literal("link_organization"),
  organizationId: z.string().uuid("Compte Byound invalide."),
});

const identitySchema = z.object({
  action: z.literal("identity"),
  fromRegistry: z.boolean().optional(),
  opcoTouched: z.boolean().optional(),
  siret: z.string().trim().default(""),
  company_name: z.string().trim().min(1, "Indiquez la raison sociale."),
  trade_name: z.string().trim().default(""),
  address_line: z.string().trim().default(""),
  postal_code: z.string().trim().default(""),
  city: z.string().trim().default(""),
  naf_code: z.string().trim().default(""),
  naf_label: z.string().trim().default(""),
  headcount_range: z.string().trim().default(""),
  idcc: z.string().trim().default(""),
  idcc_label: z.string().trim().default(""),
  structure_type: z.enum(["independent", "franchise", "group", "association", "public"]).nullable().optional(),
  opco: z.string().trim().default(""),
});

const refreshOpcoSchema = z.object({ action: z.literal("refresh_opco") });

const contactRoles = ["main", "signatory", "hr", "other"] as const;

const contactSchema = z.object({
  action: z.literal("save_contact"),
  contactId: z.string().uuid().optional(),
  firstName: z.string().trim().min(1, "Le prénom est requis.").max(80),
  lastName: z.string().trim().min(1, "Le nom est requis.").max(80),
  jobTitle: z.string().trim().max(120).default(""),
  email: z.string().trim().max(240).default(""),
  phone: z.string().trim().max(40).default(""),
  roles: z.array(z.enum(contactRoles)).min(1, "Choisissez au moins un rôle."),
});

const designateSchema = z.object({
  action: z.literal("designate_signatory"),
  contactId: z.string().uuid("Contact invalide."),
});

const needSchema = z.object({
  action: z.literal("save_need"),
  needId: z.string().uuid().optional(),
  title: z.string().trim().min(1, "L'intitulé du poste est requis.").max(160),
  cursusId: z.string().trim().default(""),
  quantity: z.number().int().min(1).max(30),
  startDate: z.string().trim().max(40).default(""),
  location: z.string().trim().max(120).default(""),
  softSkillIds: z.array(z.string()).max(5, "Cinq soft skills maximum."),
});

const aliasSchema = z.object({
  action: z.literal("set_cursus_alias"),
  alias: z.string().trim().min(1, "Le libellé de cursus est requis.").max(160),
  cursusId: z.string().trim().min(1, "Choisissez un cursus."),
});

const consentSchema = z.object({
  action: z.literal("request_consent"),
  applicationId: z.string().uuid(),
  needId: z.string().uuid().optional(),
  jobOfferId: z.string().uuid().optional(),
});

const createOfferSchema = z.object({
  action: z.literal("create_offer"),
});

const noteSchema = z.object({
  action: z.literal("add_note"),
  body: z.string().trim().min(1, "La note est vide.").max(2000),
});

const nextActionSchema = z.object({
  action: z.literal("set_next_action"),
  title: z.string().trim().min(1, "Indiquez l'action.").max(200),
  at: z.string().min(1, "Choisissez une date."),
});

const completeActionSchema = z.object({
  action: z.literal("complete_next_action"),
  activityId: z.string().uuid(),
});

const postponeActionSchema = z.object({
  action: z.literal("postpone_next_action"),
  activityId: z.string().uuid(),
  at: z.string().min(1, "Choisissez une date."),
});

const sendProfileSchema = z.object({
  action: z.literal("send_profile"),
  applicationId: z.string().uuid(),
  needId: z.string().uuid().optional(),
  jobOfferId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
});

const tutorSchema = z.object({
  action: z.literal("create_company_tutor"),
  firstName: z.string().trim().min(1, "Le prénom du tuteur est requis.").max(80),
  lastName: z.string().trim().min(1, "Le nom du tuteur est requis.").max(80),
  email: z.string().trim().toLowerCase().email("L'e-mail professionnel n'est pas valide.").max(240),
  jobTitle: z.string().trim().max(120).default(""),
});

const patchSchema = z.discriminatedUnion("action", [statusSchema, lostSchema, linkSchema, identitySchema, refreshOpcoSchema, contactSchema, designateSchema, tutorSchema, needSchema, aliasSchema, consentSchema, createOfferSchema, sendProfileSchema, noteSchema, nextActionSchema, completeActionSchema, postponeActionSchema]);

async function actorId() {
  const client = await getServerClient();
  const user = client ? await client.auth.getUser() : { data: { user: null } };
  return user.data.user?.id ?? null;
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const { id } = await context.params;

  const companyQuery = await db.from("cfa_companies").select("*").eq("id", id).maybeSingle();
  if (companyQuery.error) return NextResponse.json({ error: companyQuery.error.message }, { status: 400 });
  if (!companyQuery.data) return NextResponse.json({ error: "Entreprise introuvable" }, { status: 404 });
  const company = companyQuery.data as Record<string, unknown>;

  const organizationId = await linkCompanyByExactSiret(db, {
    id,
    siret: String(company.siret ?? ""),
    organization_id: String(company.organization_id ?? "") || null,
  }, await actorId());
  if (organizationId) company.organization_id = organizationId;

  const [contacts, needs, sends, tutors, placements, activities] = await Promise.all([
    db.from("cfa_company_contacts").select("id, first_name, last_name, job_title, email, phone, roles").eq("company_id", id),
    db.from("cfa_company_needs").select("id, title, cursus_id, quantity, start_date, location, soft_skill_ids, status").eq("company_id", id).order("created_at"),
    db.from("cfa_profile_sends").select("id, application_id, need_id, job_offer_id, sent_to_email, sent_at, opened_at, response").eq("company_id", id).order("sent_at", { ascending: false }),
    db.from("company_tutors").select("id, first_name, last_name, email, job_title, user_id, invited_at, last_code_sent_at, activated_at").eq("company_id", id).order("last_name"),
    db.from("apprentice_placements").select("id, apprentice_id, tutor_id, status").eq("company_id", id).in("status", ["pending", "active"]),
    db.from("cfa_company_activities").select("id, type, body, actor_id, next_action, next_action_at, done_at, created_at").eq("company_id", id).order("created_at", { ascending: false }).limit(80),
  ]);

  const migrationRequired = [contacts, needs, activities].some((result) => result.error && /schema cache|does not exist|42P01/i.test(result.error.message));
  const placementRows = (placements.data ?? []) as { id: string; apprentice_id: string; tutor_id: string | null; status: string }[];
  const apprenticeIds = placementRows.map((row) => row.apprentice_id);
  const applications = apprenticeIds.length
    ? await db.from("cfa_applications").select("id, first_name, last_name, specialization, status").in("id", apprenticeIds)
    : { data: [] };
  const applicationById = new Map(((applications.data ?? []) as { id: string; first_name?: string; last_name?: string; specialization?: string | null; status?: string }[]).map((row) => [row.id, row]));
  const apprentices = placementRows.map((row) => {
    const application = applicationById.get(row.apprentice_id);
    return {
      placementId: row.id,
      tutorId: row.tutor_id,
      placementStatus: row.status,
      applicationId: row.apprentice_id,
      firstName: application?.first_name ?? "",
      lastName: application?.last_name ?? "",
      specialization: application?.specialization ?? "",
      applicationStatus: application?.status ?? "",
    };
  });
  const inContract = ((applications.data ?? []) as { status?: string }[]).some((row) => row.status === "contract");
  const placed = ((placements.data ?? []) as { status?: string }[]).filter((row) => row.status === "active").length;

  let offerRows: Record<string, unknown>[] = [];
  if (company.organization_id) {
    const offers = await db
      .from("job_offers")
      .select("id, title, city, contract_type, contract_duration, start_label, diploma_prepared, created_at")
      .eq("school_id", company.organization_id)
      .eq("status", "active")
      .order("created_at", { ascending: false });
    offerRows = (offers.data ?? []) as Record<string, unknown>[];
    const offerIds = offerRows.map((row) => String(row.id));
    if (offerIds.length) {
      const candidatures = await db.from("applications").select("job_id").in("job_id", offerIds);
      const counts = new Map<string, number>();
      for (const row of (candidatures.data ?? []) as { job_id?: string }[]) {
        const jobId = String(row.job_id ?? "");
        if (jobId) counts.set(jobId, (counts.get(jobId) ?? 0) + 1);
      }
      offerRows = offerRows.map((row) => ({ ...row, applicationCount: counts.get(String(row.id)) ?? 0 }));
    }
  }
  const offerCount = offerRows.length;

  const name = String(company.company_name ?? "").trim().replace(/[%_]/g, "");
  const suggestions = !company.organization_id && name
    ? await db.from("organizations").select("id, name, siret").ilike("name", `%${name}%`).limit(5)
    : { data: [] };

  const contactRows = (contacts.data ?? []) as { roles?: string[] | null }[];
  const main = contactRows.find((row) => (row.roles ?? []).includes("main"));
  const signatory = contactRows.some((row) => (row.roles ?? []).includes("signatory"));
  const filled = [
    company.siret,
    company.company_name,
    company.trade_name,
    company.address_line || company.company_address,
    company.postal_code,
    company.city,
    company.naf_code,
    company.headcount_range,
  ].filter((value) => String(value ?? "").trim()).length;

  const activityRows = (activities.data ?? []) as { id: string; type: string; body: string | null; actor_id: string | null; next_action: string | null; next_action_at: string | null; done_at: string | null; created_at: string }[];
  const actorIds = [...new Set(activityRows.map((row) => row.actor_id).filter((value): value is string => Boolean(value)))];
  const actors = actorIds.length
    ? await db.from("profiles").select("id, first_name, last_name, full_name").in("id", actorIds)
    : { data: [] };
  const actorNames = new Map(((actors.data ?? []) as { id: string; first_name?: string | null; last_name?: string | null; full_name?: string | null }[]).map((row) => [row.id, `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || String(row.full_name ?? "").trim()]));
  const sendRows = (sends.data ?? []) as { sent_at?: string; opened_at?: string | null }[];
  const timeline = activityRows.map((row) => {
    const opened = row.type === "profile_sent"
      ? sendRows.find((item) => item.sent_at && Math.abs(new Date(item.sent_at).getTime() - new Date(row.created_at).getTime()) < 120000)?.opened_at ?? null
      : null;
    return {
      id: row.id,
      type: row.type,
      body: row.body,
      nextAction: row.next_action,
      nextActionAt: row.next_action_at,
      doneAt: row.done_at,
      createdAt: row.created_at,
      openedAt: opened,
      actorName: row.actor_id ? actorNames.get(row.actor_id) || "Équipe CFA" : "Équipe CFA",
    };
  });
  const next = activityRows.find((row) => !row.done_at && row.next_action_at);
  const opcoLookupPending = shouldAutoLookupOpco(company);
  if (opcoLookupPending) {
    const actor = await actorId();
    after(async () => {
      const service = getServiceRoleClient();
      if (!service) return;
      await refreshCompanyOpco(service, id, { force: false, actorId: actor });
    });
  }

  return NextResponse.json({
    company,
    migrationRequired,
    summary: {
      fields: `${filled} / 8 champs`,
      contacts: contactRows.length
        ? `${contactRows.length} contact${contactRows.length > 1 ? "s" : ""}${signatory ? "" : " · signataire manquant"}`
        : "Aucun contact",
      posts: `${(needs.data ?? []).length} poste${(needs.data ?? []).length > 1 ? "s" : ""} · ${offerCount} offre${offerCount > 1 ? "s" : ""} publiée${offerCount > 1 ? "s" : ""}`,
      tutors: `${(tutors.data ?? []).length} tuteur${(tutors.data ?? []).length > 1 ? "s" : ""} · ${placed} alternant${placed > 1 ? "s" : ""}`,
      follow: next?.next_action_at ? next.next_action_at : "",
      mainContact: main ? `${(main as { first_name?: string }).first_name ?? ""} ${(main as { last_name?: string }).last_name ?? ""}`.trim() : "",
      mainEmail: (main as { email?: string } | undefined)?.email ?? String(company.email ?? ""),
      wanted: Number(company.apprentices_wanted ?? 0),
      placed,
      offerCount,
      suggestRecruited: inContract && company.status !== "recruited" && company.status !== "not_recruited",
      opcoReady: isOpcoContractReady(company),
    },
    suggestions: company.organization_id ? [] : (suggestions.data ?? []),
    opcoLookupPending,
    contacts: contacts.data ?? [],
    tutors: tutors.data ?? [],
    apprentices,
    needs: needs.error ? [] : (needs.data ?? []),
    offers: offerRows,
    profileSends: sends.error ? [] : (sends.data ?? []),
    timeline,
    nextAction: next ? { id: next.id, title: next.next_action, at: next.next_action_at } : null,
  });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const { id } = await context.params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: zodMessage(parsed.error, "Requête invalide.") }, { status: 400 });

  const current = await db.from("cfa_companies").select("status, organization_id, opco, opco_source, idcc, company_name, city").eq("id", id).maybeSingle();
  if (!current.data) return NextResponse.json({ error: "Entreprise introuvable" }, { status: 404 });
  const previous = String((current.data as { status?: string }).status ?? "");
  const actor = await actorId();

  if (parsed.data.action === "refresh_opco") {
    const refreshed = await refreshCompanyOpco(db, id, { force: true, actorId: actor });
    if (!refreshed.ok) return NextResponse.json({ error: refreshed.error }, { status: 400 });
    const company = await db.from("cfa_companies").select("*").eq("id", id).maybeSingle();
    return NextResponse.json({ company: company.data, skipped: refreshed.skipped });
  }

  if (parsed.data.action === "identity") {
    const input = parsed.data;
    const siret = cleanSiret(input.siret);
    if (siret && !isValidSiret(siret)) {
      return NextResponse.json({ error: "Le SIRET doit contenir 14 chiffres valides." }, { status: 400 });
    }
    if (input.postal_code && !/^\d{5}$/.test(input.postal_code)) {
      return NextResponse.json({ error: "Le code postal doit contenir 5 chiffres." }, { status: 400 });
    }
    const previousRow = current.data as { opco?: string | null; opco_source?: string | null; idcc?: string | null };
    const previousOpco = String(previousRow.opco ?? "").trim();
    const nextOpco = input.opco.trim();
    const previousIdcc = String(previousRow.idcc ?? "").replace(/\D/g, "");
    const nextIdcc = input.idcc.replace(/\D/g, "");
    const manualWrite = Boolean(input.opcoTouched && nextOpco !== previousOpco);
    const sourceNow = String(previousRow.opco_source ?? "");
    let opcoLookup: "found" | "none" | null = null;
    let lookupNote = "";
    const enteredIdcc = !input.fromRegistry && Boolean(nextIdcc) && nextIdcc !== previousIdcc && !manualWrite && sourceNow !== "manual" && sourceNow !== "cfadock";
    const resolved = enteredIdcc ? await resolveOpcoForEnteredIdcc({ siret, idcc: nextIdcc }) : null;
    const update: Record<string, unknown> = {
      siret: siret || null,
      company_name: input.company_name,
      trade_name: input.trade_name || null,
      address_line: input.address_line || null,
      postal_code: input.postal_code || null,
      city: input.city || null,
      naf_code: input.naf_code || null,
      naf_label: input.naf_label || null,
      headcount_range: input.headcount_range || null,
      idcc: input.idcc || null,
      idcc_label: input.idcc_label || null,
      structure_type: input.structure_type ?? null,
      updated_at: new Date().toISOString(),
    };
    const composedAddress = [input.address_line, input.postal_code, input.city].filter(Boolean).join(" ");
    if (composedAddress) update.company_address = composedAddress;
    if (input.fromRegistry) update.registry_synced_at = new Date().toISOString();
    if (input.opcoTouched && nextOpco !== previousOpco) {
      update.opco = nextOpco || null;
      update.opco_source = nextOpco ? "manual" : null;
      update.opco_checked_at = new Date().toISOString();
    } else if (resolved?.searched && resolved.opco && resolved.source) {
      update.opco = resolved.opco;
      update.opco_source = resolved.source;
      update.opco_checked_at = new Date().toISOString();
      opcoLookup = "found";
      lookupNote = resolved.source === "idcc"
        ? `OPCO ${resolved.opco}, d'après la convention collective ${nextIdcc}.`
        : resolved.source === "cfadock"
          ? `OPCO ${resolved.opco}, source CFADock.`
          : `OPCO ${resolved.opco}, estimé d'après le code NAF.`;
    } else if (resolved?.searched && !resolved.opco) {
      opcoLookup = "none";
      lookupNote = `Recherche OPCO pour l'IDCC ${nextIdcc} : aucun résultat.`;
    }
    const saved = await db.from("cfa_companies").update(update).eq("id", id).select("*").single();
    if (saved.error) {
      if (/schema cache|column|opco_source/i.test(saved.error.message)) {
        return NextResponse.json({ error: "Collez le script 20261026160000_cfa_company_fiche.sql." }, { status: 400 });
      }
      return NextResponse.json({ error: saved.error.message }, { status: 400 });
    }
    await linkCompanyByExactSiret(db, {
      id,
      siret,
      organization_id: String((saved.data as { organization_id?: string | null }).organization_id ?? "") || null,
    }, actor);
    if (lookupNote) {
      await db.from("cfa_company_activities").insert({
        company_id: id,
        type: "opco_lookup",
        body: lookupNote,
        actor_id: actor,
      });
    }
    return NextResponse.json({ company: saved.data, opcoLookup });
  }

  if (parsed.data.action === "save_contact") {
    const input = parsed.data;
    if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      return NextResponse.json({ error: "L'e-mail n'est pas valide." }, { status: 400 });
    }
    const roles = [...new Set(input.roles)];
    for (const role of ["main", "signatory"] as const) {
      if (!roles.includes(role)) continue;
      const existing = await db.from("cfa_company_contacts").select("id").eq("company_id", id).contains("roles", [role]);
      const taken = ((existing.data ?? []) as { id: string }[]).some((row) => row.id !== input.contactId);
      if (taken) {
        return NextResponse.json({
          error: role === "main" ? "Un contact principal existe déjà." : "Un signataire existe déjà. Désignez-le à la place.",
        }, { status: 400 });
      }
    }
    const row = {
      company_id: id,
      first_name: input.firstName,
      last_name: input.lastName,
      job_title: input.jobTitle || null,
      email: input.email || null,
      phone: input.phone || null,
      roles,
    };
    const saved = input.contactId
      ? await db.from("cfa_company_contacts").update(row).eq("id", input.contactId).eq("company_id", id).select("id").single()
      : await db.from("cfa_company_contacts").insert(row).select("id").single();
    if (saved.error) {
      if (/schema cache|does not exist|42P01/i.test(saved.error.message)) {
        return NextResponse.json({ error: "Collez le script 20261026160000_cfa_company_fiche.sql." }, { status: 400 });
      }
      return NextResponse.json({ error: saved.error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.action === "designate_signatory") {
    const rows = await db.from("cfa_company_contacts").select("id, roles").eq("company_id", id);
    if (rows.error) {
      if (/schema cache|does not exist|42P01/i.test(rows.error.message)) {
        return NextResponse.json({ error: "Collez le script 20261026160000_cfa_company_fiche.sql." }, { status: 400 });
      }
      return NextResponse.json({ error: rows.error.message }, { status: 400 });
    }
    const list = (rows.data ?? []) as { id: string; roles: string[] | null }[];
    const target = list.find((row) => row.id === parsed.data.contactId);
    if (!target) return NextResponse.json({ error: "Contact introuvable." }, { status: 404 });
    for (const row of list) {
      if (row.id === target.id || !(row.roles ?? []).includes("signatory")) continue;
      const nextRoles = (row.roles ?? []).filter((role) => role !== "signatory");
      const cleared = await db.from("cfa_company_contacts").update({ roles: nextRoles.length ? nextRoles : ["other"] }).eq("id", row.id);
      if (cleared.error) return NextResponse.json({ error: cleared.error.message }, { status: 400 });
    }
    const nextRoles = [...new Set([...(target.roles ?? []), "signatory"])];
    const saved = await db.from("cfa_company_contacts").update({ roles: nextRoles }).eq("id", target.id);
    if (saved.error) return NextResponse.json({ error: saved.error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.action === "create_company_tutor") {
    const input = parsed.data;
    const created = await db.from("company_tutors").insert({
      company_id: id,
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      job_title: input.jobTitle || null,
    }).select("id").single();
    if (created.error || !created.data) {
      const duplicate = created.error?.code === "23505";
      return NextResponse.json({ error: duplicate ? "Ce tuteur existe déjà dans cette entreprise." : created.error?.message ?? "Création impossible" }, { status: 400 });
    }
    const sent = await sendAccessCode(db, {
      email: input.email,
      role: "tuteur",
      context: "tuteur_notice",
      firstName: input.firstName,
      lastName: input.lastName,
      learnerName: "",
      companyName: String((current.data as { company_name?: string }).company_name ?? ""),
    });
    if (!sent.ok) {
      return NextResponse.json({ error: `Le tuteur est créé, mais l'e-mail n'a pas pu être envoyé. ${sent.error}`, retryAfter: sent.retryAfter }, { status: sent.retryAfter ? 429 : 502 });
    }
    await db.from("company_tutors").update({
      invited_at: new Date().toISOString(),
      last_code_sent_at: new Date().toISOString(),
    }).eq("id", created.data.id);
    const logged = await logCompanyEvent(db, {
      companyId: id,
      actorId: actor,
      action: "tutor_created",
      body: `Tuteur ${input.firstName} ${input.lastName} ajouté, e-mail envoyé.`,
      newValue: created.data.id,
      activityType: "note",
    });
    if (logged && !logged.includes("20261026160000")) return NextResponse.json({ error: logged }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.action === "save_need") {
    const input = parsed.data;
    if (input.cursusId && !isCursusId(input.cursusId)) {
      return NextResponse.json({ error: "Cursus inconnu." }, { status: 400 });
    }
    const row = {
      company_id: id,
      title: input.title,
      cursus_id: input.cursusId || null,
      quantity: input.quantity,
      start_date: input.startDate || null,
      location: input.location || null,
      soft_skill_ids: [...new Set(input.softSkillIds)].slice(0, 5),
    };
    const saved = input.needId
      ? await db.from("cfa_company_needs").update(row).eq("id", input.needId).eq("company_id", id).select("id").single()
      : await db.from("cfa_company_needs").insert(row).select("id").single();
    if (saved.error) {
      if (/schema cache|does not exist|42P01/i.test(saved.error.message)) {
        return NextResponse.json({ error: "Collez le script 20261026160000_cfa_company_fiche.sql." }, { status: 400 });
      }
      return NextResponse.json({ error: saved.error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.action === "set_cursus_alias") {
    if (!isCursusId(parsed.data.cursusId)) return NextResponse.json({ error: "Cursus inconnu." }, { status: 400 });
    const saved = await db.from("cursus_aliases").upsert({
      alias: parsed.data.alias.trim().toLowerCase(),
      cursus_id: parsed.data.cursusId,
    });
    if (saved.error) return NextResponse.json({ error: saved.error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.action === "create_offer") {
    const organizationId = String((current.data as { organization_id?: string | null }).organization_id ?? "");
    if (!organizationId) return NextResponse.json({ error: "Reliez cette entreprise à un compte Byound Business pour créer l'offre." }, { status: 400 });
    const city = String((current.data as { city?: string | null }).city ?? "");
    const created = await db.from("job_offers").insert({
      school_id: organizationId,
      title: "Sans titre",
      description: "",
      status: "draft",
      contract_type: "Alternance",
      city,
      updated_at: new Date().toISOString(),
    }).select("id").single();
    if (created.error || !created.data) return NextResponse.json({ error: created.error?.message || "Création impossible" }, { status: 400 });
    return NextResponse.json({ ok: true, offerId: (created.data as { id: string }).id });
  }

  if (parsed.data.action === "request_consent") {
    const targetId = parsed.data.jobOfferId || parsed.data.needId;
    const kind = parsed.data.jobOfferId ? "offer" : "need";
    if (!targetId) return NextResponse.json({ error: "Choisissez un poste ou une offre." }, { status: 400 });
    const application = await db.from("cfa_applications").select("id, first_name, email, resume_token").eq("id", parsed.data.applicationId).maybeSingle();
    const person = application.data as { first_name?: string; email?: string; resume_token?: string } | null;
    if (!person?.email || !person.resume_token) return NextResponse.json({ error: "Candidat introuvable." }, { status: 404 });
    let offerTitle = "cette offre";
    if (kind === "need") {
      const need = await db.from("cfa_company_needs").select("title").eq("id", targetId).eq("company_id", id).maybeSingle();
      offerTitle = String((need.data as { title?: string } | null)?.title || offerTitle);
    } else {
      const offer = await db.from("job_offers").select("title").eq("id", targetId).maybeSingle();
      offerTitle = String((offer.data as { title?: string | null } | null)?.title || offerTitle);
    }
    const companyName = String((current.data as { company_name?: string }).company_name ?? "l'entreprise");
    const href = `${publicAppUrl()}/ecole/offres/${targetId}?accord=${encodeURIComponent(person.resume_token)}&company=${id}&kind=${kind}`;
    const sent = await sendEmail({
      to: person.email,
      from: EDGE_COCKPIT_FROM,
      skipBcc: true,
      subject: `${companyName} souhaite recevoir votre présentation`,
      html: `<p>Bonjour ${person.first_name || ""},</p><p>${companyName} propose « ${offerTitle} ». Byound School souhaite lui transmettre votre présentation : prénom, nom, cursus, disponibilité et motivation. Aucune donnée administrative n'est incluse.</p><p>Ouvrez l'offre, puis confirmez avec le bouton « Je donne mon accord ».</p><p><a href="${href}">Voir l'offre</a></p>`,
    });
    if (!sent.success) return NextResponse.json({ error: "L'e-mail n'a pas pu être envoyé." }, { status: 502 });
    await logCompanyEvent(db, {
      companyId: id,
      actorId: actor,
      action: "profile_consent_requested",
      body: `Demande d'accord envoyée à ${person.first_name || person.email}.`,
      newValue: parsed.data.applicationId,
      activityType: "note",
    });
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.action === "send_profile") {
    const input = parsed.data;
    const sent = await sendApprenticeProfile(db, {
      companyId: id,
      applicationId: input.applicationId,
      needId: input.needId,
      jobOfferId: input.jobOfferId,
      actorId: actor,
      contactId: input.contactId,
    });
    if (!sent.ok) return NextResponse.json({ error: sent.error }, { status: sent.error.includes("introuvable") ? 404 : 400 });
    if (!sent.already) {
      await logCompanyEvent(db, {
        companyId: id,
        actorId: actor,
        action: "profile_sent",
        body: `Présentation de ${sent.name || "l'alternant"} envoyée à ${sent.email}.`,
        activityType: "profile_sent",
      });
    }
    return NextResponse.json({ ok: true, sentAt: sent.already ? null : sent.sentAt, email: sent.already ? null : sent.email });
  }

  if (parsed.data.action === "add_note") {
    const saved = await db.from("cfa_company_activities").insert({
      company_id: id,
      type: "note",
      body: parsed.data.body,
      actor_id: actor,
    });
    if (saved.error) return NextResponse.json({ error: saved.error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.action === "set_next_action") {
    const at = new Date(parsed.data.at);
    if (Number.isNaN(at.getTime())) return NextResponse.json({ error: "Date invalide." }, { status: 400 });
    const open = await db.from("cfa_company_activities").select("id").eq("company_id", id).is("done_at", null).not("next_action_at", "is", null).limit(1).maybeSingle();
    const row = {
      next_action: parsed.data.title,
      next_action_at: at.toISOString(),
      body: parsed.data.title,
    };
    const saved = open.data
      ? await db.from("cfa_company_activities").update(row).eq("id", (open.data as { id: string }).id)
      : await db.from("cfa_company_activities").insert({ ...row, company_id: id, type: "note", actor_id: actor });
    if (saved.error) return NextResponse.json({ error: saved.error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.action === "complete_next_action") {
    const saved = await db.from("cfa_company_activities").update({ done_at: new Date().toISOString() }).eq("id", parsed.data.activityId).eq("company_id", id);
    if (saved.error) return NextResponse.json({ error: saved.error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.action === "postpone_next_action") {
    const at = new Date(parsed.data.at);
    if (Number.isNaN(at.getTime())) return NextResponse.json({ error: "Date invalide." }, { status: 400 });
    const saved = await db.from("cfa_company_activities").update({ next_action_at: at.toISOString() }).eq("id", parsed.data.activityId).eq("company_id", id);
    if (saved.error) return NextResponse.json({ error: saved.error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.action === "link_organization") {
    const org = await db.from("organizations").select("id, name").eq("id", parsed.data.organizationId).maybeSingle();
    if (!org.data) return NextResponse.json({ error: "Compte Byound introuvable." }, { status: 404 });
    const updated = await db.from("cfa_companies").update({ organization_id: parsed.data.organizationId, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
    if (updated.error) return NextResponse.json({ error: updated.error.message }, { status: 400 });
    const logged = await logCompanyEvent(db, {
      companyId: id,
      actorId: actor,
      action: "organization_link",
      body: `Rattachement confirmé au compte ${String((org.data as { name?: string }).name ?? "")}.`,
      oldValue: String((current.data as { organization_id?: string | null }).organization_id ?? ""),
      newValue: parsed.data.organizationId,
      activityType: "note",
    });
    if (logged && !logged.includes("20261026160000")) return NextResponse.json({ error: logged }, { status: 400 });
    return NextResponse.json({ company: updated.data });
  }

  const nextStatus = parsed.data.action === "mark_lost" ? "not_recruited" : parsed.data.status;
  if (nextStatus === "not_recruited" && parsed.data.action !== "mark_lost") {
    return NextResponse.json({ error: "Le motif est obligatoire pour marquer l'entreprise perdue." }, { status: 400 });
  }
  const update: Record<string, unknown> = { status: nextStatus, updated_at: new Date().toISOString() };
  if (parsed.data.action === "mark_lost") {
    update.lost_reason = parsed.data.reason;
    update.lost_at = new Date().toISOString();
  }
  const saved = await db.from("cfa_companies").update(update).eq("id", id).select("*").single();
  if (saved.error) return NextResponse.json({ error: saved.error.message }, { status: 400 });
  const logged = await logCompanyEvent(db, {
    companyId: id,
    actorId: actor,
    action: "company_status",
    body: parsed.data.action === "mark_lost"
      ? `Marquée perdue : ${parsed.data.reason}`
      : `Statut : ${CFA_COMPANY_STATUS_LABELS[nextStatus as CfaCompanyStatus]}.`,
    oldValue: previous,
    newValue: nextStatus,
  });
  if (logged && !logged.includes("20261026160000")) return NextResponse.json({ error: logged }, { status: 400 });
  return NextResponse.json({ company: saved.data });
}
