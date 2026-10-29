import { buildCareEmail } from "@/lib/expert/care-email";
import { careTestTitle } from "@/lib/expert/care-result-view";
import { summarizeCareTest } from "@/lib/expert/care-test-summary";
import { careAbsoluteUrl } from "@/lib/care/host";
import { asDocumentKind, parseDocumentScores } from "@/lib/care/patient-document-model";
import { formatPersonName } from "@/lib/care/person-name";
import { sendEmail } from "@/lib/email/resend-client";
import type { SupabaseClient } from "@supabase/supabase-js";

const DOCUMENT_KINDS = new Set(["report", "test_result", "invoice", "other"]);
const STEP_STATUSES = new Set(["done", "current", "todo"]);
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const FILE_TYPES = new Set(["application/pdf", "image/png", "image/jpeg"]);

type Gate = { expertId: string; db: SupabaseClient };

export async function loadExpertClientContext(gate: Gate, clientId: string) {
  const { data: client } = await gate.db
    .from("expert_care_clients")
    .select("id, first_name, last_name, email")
    .eq("id", clientId)
    .eq("expert_id", gate.expertId)
    .maybeSingle();
  if (!client?.email) return null;
  const email = String(client.email).trim();
  const { data: profiles } = await gate.db
    .from("profiles")
    .select("id, email, first_name")
    .ilike("email", email.replace(/[%_]/g, ""))
    .limit(1);
  const profile = profiles?.[0] ?? null;
  const accountId = profile?.id ? String(profile.id) : null;
  const { data: relatives } = accountId
    ? await gate.db.from("care_relatives").select("id, first_name, last_name, relation").eq("account_id", accountId).order("created_at")
    : { data: [] };
  return {
    clientId: String(client.id),
    clientName: [formatPersonName(String(client.first_name ?? "")), formatPersonName(String(client.last_name ?? ""))].filter(Boolean).join(" "),
    email,
    accountId,
    firstName: formatPersonName(String(profile?.first_name || client.first_name || "")),
    relatives: (relatives ?? []).map((row) => ({
      id: String(row.id),
      name: [formatPersonName(String(row.first_name ?? "")), formatPersonName(String(row.last_name ?? ""))].filter(Boolean).join(" "),
      relation: String(row.relation),
    })),
  };
}

async function ownedSubject(gate: Gate, accountId: string, subjectRelativeId: string | null) {
  if (!subjectRelativeId) return null;
  const { data } = await gate.db.from("care_relatives").select("id").eq("id", subjectRelativeId).eq("account_id", accountId).maybeSingle();
  return data ? subjectRelativeId : undefined;
}

function safeFileName(name: string) {
  const cleaned = name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
  return cleaned.slice(0, 80) || "document";
}

export async function readExpertPatientSpace(gate: Gate, clientId: string) {
  const context = await loadExpertClientContext(gate, clientId);
  if (!context) return null;
  if (!context.accountId) return { context, documents: [], journey: null, results: [], invoices: [] };
  const [{ data: documents }, { data: journeys }, { data: responses }, { data: invoices }] = await Promise.all([
    gate.db
      .from("care_documents")
      .select("id, kind, title, shared_at, subject_relative_id, created_at")
      .eq("patient_account_id", context.accountId)
      .eq("practitioner_id", gate.expertId)
      .order("created_at", { ascending: false }),
    gate.db
      .from("care_journeys")
      .select("id, title, subject_relative_id")
      .eq("patient_account_id", context.accountId)
      .eq("practitioner_id", gate.expertId)
      .order("created_at", { ascending: false }),
    gate.db
      .from("expert_care_responses")
      .select("id, test_slug, submitted_at, answers")
      .eq("expert_id", gate.expertId)
      .eq("client_id", clientId)
      .order("submitted_at", { ascending: false }),
    gate.db
      .from("expert_care_invoices")
      .select("id, number, amount_cents, paid_at, patient_account_id, created_at")
      .eq("expert_id", gate.expertId)
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
  ]);
  const journey = journeys?.[0] ?? null;
  let steps: Array<{ title: string; status: string; date: string | null }> = [];
  let tasks: Array<{ label: string; hint: string | null }> = [];
  let note = "";
  let resource: { title: string; kind: string; durationMin: number | null; url: string } | null = null;
  if (journey) {
    const [{ data: stepRows }, { data: taskRows }, { data: noteRows }, { data: resourceRows }] = await Promise.all([
      gate.db.from("care_journey_steps").select("title, position, status, step_date").eq("journey_id", journey.id).order("position"),
      gate.db.from("care_tasks").select("label, hint, position").eq("journey_id", journey.id).order("position"),
      gate.db.from("care_notes_to_patient").select("message").eq("journey_id", journey.id).order("created_at", { ascending: false }).limit(1),
      gate.db.from("care_recommended_resources").select("title, kind, duration_min, url").eq("journey_id", journey.id).order("created_at", { ascending: false }).limit(1),
    ]);
    steps = (stepRows ?? []).map((row) => ({ title: String(row.title), status: String(row.status), date: row.step_date ? String(row.step_date) : null }));
    tasks = (taskRows ?? []).map((row) => ({ label: String(row.label), hint: row.hint ? String(row.hint) : null }));
    note = noteRows?.[0]?.message ? String(noteRows[0].message) : "";
    if (resourceRows?.[0]) {
      resource = {
        title: String(resourceRows[0].title),
        kind: String(resourceRows[0].kind),
        durationMin: resourceRows[0].duration_min == null ? null : Number(resourceRows[0].duration_min),
        url: String(resourceRows[0].url),
      };
    }
  }
  return {
    context,
    documents: (documents ?? []).map((row) => ({
      id: String(row.id),
      kind: asDocumentKind(row.kind),
      title: String(row.title),
      sharedAt: row.shared_at ? String(row.shared_at) : null,
      subjectRelativeId: row.subject_relative_id ? String(row.subject_relative_id) : null,
    })),
    journey: journey
      ? { id: String(journey.id), title: String(journey.title), subjectRelativeId: journey.subject_relative_id ? String(journey.subject_relative_id) : null, steps, tasks, note, resource }
      : null,
    results: (responses ?? []).map((row) => ({
      id: String(row.id),
      title: careTestTitle(String(row.test_slug)),
      submittedAt: String(row.submitted_at),
    })),
    invoices: (invoices ?? []).map((row) => ({
      id: String(row.id),
      number: row.number ? String(row.number) : null,
      amountCents: Number(row.amount_cents) || 0,
      paidAt: row.paid_at ? String(row.paid_at) : null,
      linked: row.patient_account_id === context.accountId,
    })),
  };
}

async function notifyNewDocument(email: string, firstName: string) {
  const html = buildCareEmail({
    greeting: firstName ? `Bonjour ${firstName},` : "Bonjour,",
    title: "Un nouveau document est disponible",
    bodyHtml: "<p>Un nouveau document est disponible dans votre espace Byound Care.</p>",
    ctaLabel: "Ouvrir mon espace",
    ctaUrl: careAbsoluteUrl("/dashboard/patient/documents"),
    footer: "Byound Care — ce message ne contient pas de diagnostic.",
  });
  return sendEmail({
    to: email,
    subject: "Un nouveau document est disponible dans votre espace Byound Care",
    html,
    skipBcc: true,
  });
}

export async function storeExpertDocument(gate: Gate, input: { clientId: string; kind: string; title: string; subjectRelativeId: string | null; file: File }) {
  const context = await loadExpertClientContext(gate, input.clientId);
  if (!context?.accountId) return { ok: false as const, message: "Cette personne n'a pas encore d'espace Byound Care." };
  const title = input.title.replace(/\s+/g, " ").trim();
  if (!title || title.length > 160) return { ok: false as const, message: "Indiquez un titre." };
  if (!DOCUMENT_KINDS.has(input.kind) || input.kind === "test_result") return { ok: false as const, message: "Choisissez un type de document." };
  const subject = await ownedSubject(gate, context.accountId, input.subjectRelativeId);
  if (subject === undefined) return { ok: false as const, message: "Ce proche n'est pas rattaché à cet espace." };
  if (!FILE_TYPES.has(input.file.type) || input.file.size <= 0 || input.file.size > MAX_FILE_BYTES) {
    return { ok: false as const, message: "Le fichier doit être un PDF ou une image, de 8 Mo au plus." };
  }
  const { data: created, error } = await gate.db
    .from("care_documents")
    .insert({
      patient_account_id: context.accountId,
      subject_relative_id: subject,
      practitioner_id: gate.expertId,
      kind: input.kind,
      title,
    })
    .select("id")
    .single();
  if (error || !created) return { ok: false as const, message: "Le document n'a pas pu être enregistré." };
  const id = String(created.id);
  const path = `${gate.expertId}/${id}/${safeFileName(input.file.name)}`;
  const bytes = new Uint8Array(await input.file.arrayBuffer());
  const uploaded = await gate.db.storage.from("care-documents").upload(path, bytes, { contentType: input.file.type, upsert: false });
  if (uploaded.error) {
    await gate.db.from("care_documents").delete().eq("id", id).eq("practitioner_id", gate.expertId);
    return { ok: false as const, message: "Le fichier n'a pas pu être déposé." };
  }
  await gate.db.from("care_documents").update({ storage_path: path }).eq("id", id).eq("practitioner_id", gate.expertId);
  return { ok: true as const, id };
}

export async function shareExpertDocument(gate: Gate, documentId: string) {
  const { data: document } = await gate.db
    .from("care_documents")
    .select("id, patient_account_id, shared_at, practitioner_id")
    .eq("id", documentId)
    .eq("practitioner_id", gate.expertId)
    .maybeSingle();
  if (!document) return { ok: false as const, message: "Document introuvable." };
  if (document.shared_at) return { ok: true as const, already: true };
  const { data: profile } = await gate.db.from("profiles").select("email, first_name").eq("id", document.patient_account_id).maybeSingle();
  const { error } = await gate.db.from("care_documents").update({ shared_at: new Date().toISOString() }).eq("id", documentId).eq("practitioner_id", gate.expertId);
  if (error) return { ok: false as const, message: "Le partage n'a pas abouti." };
  const email = profile?.email ? String(profile.email) : "";
  const sent = email ? await notifyNewDocument(email, formatPersonName(String(profile?.first_name ?? ""))) : { success: false };
  return { ok: true as const, already: false, emailSent: sent.success };
}

export async function saveExpertJourney(gate: Gate, input: {
  clientId: string;
  subjectRelativeId: string | null;
  title: string;
  steps: Array<{ title: string; status: string; date: string | null }>;
  tasks: Array<{ label: string; hint: string | null }>;
  note: string;
  resource: { title: string; kind: string; durationMin: number | null; url: string } | null;
}) {
  const context = await loadExpertClientContext(gate, input.clientId);
  if (!context?.accountId) return { ok: false as const, message: "Cette personne n'a pas encore d'espace Byound Care." };
  const subject = await ownedSubject(gate, context.accountId, input.subjectRelativeId);
  if (subject === undefined) return { ok: false as const, message: "Ce proche n'est pas rattaché à cet espace." };
  const title = input.title.replace(/\s+/g, " ").trim();
  if (!title || title.length > 140) return { ok: false as const, message: "Donnez un nom à l'accompagnement." };
  const steps = input.steps.map((step) => ({
    title: step.title.replace(/\s+/g, " ").trim(),
    status: STEP_STATUSES.has(step.status) ? step.status : "todo",
    date: step.date && /^\d{4}-\d{2}-\d{2}$/.test(step.date) ? step.date : null,
  })).filter((step) => step.title).slice(0, 12);
  if (!steps.length) return { ok: false as const, message: "Ajoutez au moins une étape." };
  if (!steps.some((step) => step.status === "current")) steps[0] = { ...steps[0], status: steps.some((step) => step.status === "done") ? steps[0].status : "current" };
  const tasks = input.tasks.map((task) => ({
    label: task.label.replace(/\s+/g, " ").trim(),
    hint: task.hint?.replace(/\s+/g, " ").trim() || null,
  })).filter((task) => task.label).slice(0, 12);
  const note = input.note.trim().slice(0, 500);
  const resource = input.resource?.title.trim() && input.resource.url.trim().startsWith("https://")
    ? {
        title: input.resource.title.replace(/\s+/g, " ").trim().slice(0, 140),
        kind: input.resource.kind.replace(/\s+/g, " ").trim().slice(0, 40) || "Lecture",
        durationMin: input.resource.durationMin && input.resource.durationMin > 0 ? Math.round(input.resource.durationMin) : null,
        url: input.resource.url.trim(),
      }
    : null;

  const journeyQuery = gate.db
    .from("care_journeys")
    .select("id")
    .eq("patient_account_id", context.accountId)
    .eq("practitioner_id", gate.expertId);
  const { data: existing } = await (subject
    ? journeyQuery.eq("subject_relative_id", subject)
    : journeyQuery.is("subject_relative_id", null)
  ).order("created_at", { ascending: false }).limit(1).maybeSingle();
  let journeyId = existing?.id ? String(existing.id) : "";
  if (journeyId) {
    await gate.db.from("care_journeys").update({ title }).eq("id", journeyId).eq("practitioner_id", gate.expertId);
  } else {
    const inserted = await gate.db
      .from("care_journeys")
      .insert({ patient_account_id: context.accountId, subject_relative_id: subject, practitioner_id: gate.expertId, title })
      .select("id")
      .single();
    if (inserted.error || !inserted.data) return { ok: false as const, message: "L'accompagnement n'a pas pu être enregistré." };
    journeyId = String(inserted.data.id);
  }
  const previousTasks = await gate.db.from("care_tasks").select("label, done_at").eq("journey_id", journeyId);
  const doneByLabel = new Map((previousTasks.data ?? []).map((row) => [String(row.label), row.done_at ? String(row.done_at) : null]));
  await gate.db.from("care_journey_steps").delete().eq("journey_id", journeyId);
  await gate.db.from("care_tasks").delete().eq("journey_id", journeyId);
  await gate.db.from("care_journey_steps").insert(steps.map((step, position) => ({
    journey_id: journeyId,
    title: step.title,
    position,
    status: step.status,
    step_date: step.date,
  })));
  if (tasks.length) {
    await gate.db.from("care_tasks").insert(tasks.map((task, position) => ({
      journey_id: journeyId,
      label: task.label,
      hint: task.hint,
      position,
      done_at: doneByLabel.get(task.label) ?? null,
    })));
  }
  await gate.db.from("care_notes_to_patient").delete().eq("journey_id", journeyId);
  if (note) {
    await gate.db.from("care_notes_to_patient").insert({ journey_id: journeyId, practitioner_id: gate.expertId, message: note });
  }
  await gate.db.from("care_recommended_resources").delete().eq("journey_id", journeyId);
  if (resource) {
    await gate.db.from("care_recommended_resources").insert({
      journey_id: journeyId,
      practitioner_id: gate.expertId,
      title: resource.title,
      kind: resource.kind,
      duration_min: resource.durationMin,
      url: resource.url,
    });
  }
  return { ok: true as const };
}

export async function publishExpertResult(gate: Gate, input: { clientId: string; responseId: string; comment: string; subjectRelativeId: string | null }) {
  const context = await loadExpertClientContext(gate, input.clientId);
  if (!context?.accountId) return { ok: false as const, message: "Cette personne n'a pas encore d'espace Byound Care." };
  const comment = input.comment.replace(/\s+/g, " ").trim();
  if (comment.length < 2 || comment.length > 2000) return { ok: false as const, message: "Le commentaire pour le patient est requis." };
  const subject = await ownedSubject(gate, context.accountId, input.subjectRelativeId);
  if (subject === undefined) return { ok: false as const, message: "Ce proche n'est pas rattaché à cet espace." };
  const { data: response } = await gate.db
    .from("expert_care_responses")
    .select("id, test_slug, answers, submitted_at")
    .eq("id", input.responseId)
    .eq("expert_id", gate.expertId)
    .eq("client_id", input.clientId)
    .maybeSingle();
  if (!response) return { ok: false as const, message: "Résultat introuvable." };
  const summary = summarizeCareTest(String(response.test_slug), (response.answers ?? null) as Record<string, unknown> | null);
  const scores = summary.categories.length
    ? summary.categories.map((item) => ({ label: item.label, value: item.percent, max: 100 }))
    : summary.overallPercent == null
      ? []
      : [{ label: summary.title, value: summary.overallPercent, max: 100 }];
  const title = summary.title || careTestTitle(String(response.test_slug));
  const { data: existing } = await gate.db
    .from("care_documents")
    .select("id, shared_at")
    .eq("patient_account_id", context.accountId)
    .eq("practitioner_id", gate.expertId)
    .eq("kind", "test_result")
    .eq("title", title)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const now = new Date().toISOString();
  let documentId = existing?.id ? String(existing.id) : "";
  let wasShared = Boolean(existing?.shared_at);
  if (!documentId) {
    const inserted = await gate.db
      .from("care_documents")
      .insert({
        patient_account_id: context.accountId,
        subject_relative_id: subject,
        practitioner_id: gate.expertId,
        kind: "test_result",
        title,
        shared_at: now,
      })
      .select("id")
      .single();
    if (inserted.error || !inserted.data) return { ok: false as const, message: "Le résultat n'a pas pu être publié." };
    documentId = String(inserted.data.id);
    wasShared = false;
  } else if (!wasShared) {
    await gate.db.from("care_documents").update({ shared_at: now, subject_relative_id: subject }).eq("id", documentId).eq("practitioner_id", gate.expertId);
  }
  const payload = {
    document_id: documentId,
    patient_account_id: context.accountId,
    subject_relative_id: subject,
    practitioner_id: gate.expertId,
    scores,
    practitioner_comment: comment,
    published_at: now,
  };
  const { data: current } = await gate.db.from("care_test_results").select("id").eq("document_id", documentId).maybeSingle();
  const saved = current?.id
    ? await gate.db.from("care_test_results").update(payload).eq("id", current.id).eq("practitioner_id", gate.expertId)
    : await gate.db.from("care_test_results").insert(payload);
  if (saved.error) return { ok: false as const, message: "Le commentaire n'a pas pu être publié." };
  if (!wasShared) await notifyNewDocument(context.email, context.firstName);
  return { ok: true as const, scores: parseDocumentScores(scores).length };
}

export async function linkInvoiceForAttestation(gate: Gate, invoiceId: string, clientId: string, subjectRelativeId: string | null) {
  const context = await loadExpertClientContext(gate, clientId);
  if (!context?.accountId) return { ok: false as const, message: "Cette personne n'a pas encore d'espace Byound Care." };
  const subject = await ownedSubject(gate, context.accountId, subjectRelativeId);
  if (subject === undefined) return { ok: false as const, message: "Ce proche n'est pas rattaché à cet espace." };
  const { data } = await gate.db
    .from("expert_care_invoices")
    .update({ patient_account_id: context.accountId, subject_relative_id: subject })
    .eq("id", invoiceId)
    .eq("expert_id", gate.expertId)
    .eq("client_id", clientId)
    .select("id");
  if (!data?.length) return { ok: false as const, message: "Facture introuvable." };
  return { ok: true as const };
}
