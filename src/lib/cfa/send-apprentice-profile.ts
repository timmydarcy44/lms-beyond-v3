import type { SupabaseClient } from "@supabase/supabase-js";
import { getCfaSpecializationLabel } from "@/lib/cfa-applications";
import { newProfileToken } from "@/lib/cfa/profile-share";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { sendEmail } from "@/lib/email/resend-client";
import { publicAppUrl } from "@/lib/env";

type Person = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  specialization?: string | null;
  alternance_status?: string | null;
  motivation_text?: string | null;
  share_with_companies?: boolean | null;
};

function availability(value?: string | null) {
  if (value === "company_found") return "a déjà une entreprise";
  if (value === "searching") return "recherche une entreprise";
  return "disponibilité à préciser";
}

export async function sendApprenticeProfile(
  db: SupabaseClient,
  input: { companyId: string; applicationId: string; needId?: string | null; jobOfferId?: string | null; actorId?: string | null; contactId?: string | null },
) {
  if (!input.needId && !input.jobOfferId) return { ok: false as const, error: "Choisissez un poste ou une offre." };
  const application = await db.from("cfa_applications").select("id, first_name, last_name, specialization, alternance_status, motivation_text, share_with_companies").eq("id", input.applicationId).maybeSingle();
  const person = application.data as Person | null;
  if (!person) return { ok: false as const, error: "Candidat introuvable." };
  if (!person.share_with_companies) return { ok: false as const, error: "Le candidat n'a pas donné son accord." };
  const already = await db
    .from("cfa_profile_sends")
    .select("id")
    .eq("company_id", input.companyId)
    .eq("application_id", input.applicationId)
    .eq(input.needId ? "need_id" : "job_offer_id", input.needId || input.jobOfferId || "")
    .limit(1);
  if ((already.data ?? []).length) return { ok: true as const, already: true as const };
  const contactsQuery = await db.from("cfa_company_contacts").select("id, first_name, email, roles").eq("company_id", input.companyId);
  const people = (contactsQuery.data ?? []) as { id: string; first_name?: string; email?: string | null; roles?: string[] | null }[];
  const chosen = people.find((item) => item.id === input.contactId) ?? people.find((item) => (item.roles ?? []).includes("main")) ?? people.find((item) => item.email);
  if (!chosen?.email) return { ok: false as const, error: "Aucun contact n'a d'e-mail." };
  const company = await db.from("cfa_companies").select("company_name").eq("id", input.companyId).maybeSingle();
  const companyName = String((company.data as { company_name?: string } | null)?.company_name ?? "votre entreprise");
  const token = newProfileToken();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const inserted = await db.from("cfa_profile_sends").insert({
    company_id: input.companyId,
    application_id: input.applicationId,
    need_id: input.needId ?? null,
    job_offer_id: input.jobOfferId ?? null,
    sent_by: input.actorId ?? null,
    sent_to_email: chosen.email,
    token,
    expires_at: expires,
  }).select("id, sent_at").single();
  if (inserted.error) return { ok: false as const, error: inserted.error.message };
  const href = `${publicAppUrl()}/ecole/profil/${token}`;
  const name = `${person.first_name || ""} ${person.last_name || ""}`.trim();
  const cursus = person.specialization ? getCfaSpecializationLabel(person.specialization) : "";
  const motivation = String(person.motivation_text ?? "").trim().slice(0, 400);
  const sent = await sendEmail({
    to: chosen.email,
    from: EDGE_COCKPIT_FROM,
    skipBcc: true,
    subject: `Présentation de ${name}`,
    html: `<p>Bonjour ${chosen.first_name || ""},</p><p>${name} prépare ${cursus || "un cursus Byound School"} et ${availability(person.alternance_status)}. Byound School vous adresse cette présentation pour ${companyName}. Aucune donnée administrative n'est jointe.</p>${motivation ? `<p>${motivation}</p>` : ""}<p>La fiche est valable 30 jours.</p><p><a href="${href}">Voir la présentation</a></p>`,
  });
  if (!sent.success) return { ok: false as const, error: "La présentation est enregistrée, mais l'e-mail n'a pas pu être envoyé." };
  return { ok: true as const, already: false as const, email: chosen.email, sentAt: (inserted.data as { sent_at?: string } | null)?.sent_at ?? null, name };
}
