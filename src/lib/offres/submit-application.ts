import type { SupabaseClient } from "@supabase/supabase-js";
import type { CfaTestKind } from "@/lib/cfa/assessment-shares";
import { resolveOfferCursus } from "@/lib/cfa/profile-share";
import { sendEmail } from "@/lib/email/resend-client";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { testsComplete } from "@/lib/offres/application-home";

export async function submitOfferApplication(
  db: SupabaseClient,
  input: { userId: string; applicationId: string; share: Partial<Record<CfaTestKind, boolean>> },
) {
  const application = await db
    .from("applications")
    .select("id, job_id, status, phone, city, cv_path, pitch")
    .eq("id", input.applicationId)
    .eq("talent_id", input.userId)
    .maybeSingle();
  const row = application.data as { id: string; job_id: string; status?: string | null; phone?: string | null; city?: string | null; cv_path?: string | null } | null;
  if (!row || row.status === "submitted") return { ok: false as const, status: 404, error: "Candidature introuvable." };
  if (row.status !== "draft") return { ok: false as const, status: 400, error: "Cette candidature ne peut plus être envoyée." };

  const profile = await db.from("profiles").select("first_name, last_name, email, phone, city, cv_url").eq("id", input.userId).maybeSingle();
  const person = (profile.data ?? {}) as Record<string, string | null>;
  const phone = String(row.phone || person.phone || "");
  const city = String(row.city || person.city || "");
  const cv = String(row.cv_path || person.cv_url || "");
  if (phone.replace(/\D/g, "").length < 8 || city.trim().length < 2 || !cv) {
    return { ok: false as const, status: 400, error: "Complétez votre profil avant d'envoyer la candidature." };
  }
  const tests = await testsComplete(db, input.userId);
  if (!tests.soft || !tests.disc || !tests.idmc) {
    return { ok: false as const, status: 400, error: "Les 3 tests doivent être terminés." };
  }

  const offer = await db.from("job_offers").select("id, title, city, school_id, status, public_status, diploma_prepared").eq("id", row.job_id).maybeSingle();
  const job = offer.data as { id: string; title?: string | null; city?: string | null; school_id?: string | null; status?: string | null; public_status?: string | null; diploma_prepared?: string | null } | null;
  if (!job || job.status !== "active" || job.public_status === "blocked") {
    return { ok: false as const, status: 400, error: "Cette offre n'est plus disponible." };
  }

  const now = new Date().toISOString();
  const saved = await db.from("applications").update({
    status: "submitted",
    stage: "new",
    submitted_at: now,
    share_soft: input.share.soft !== false,
    share_disc: input.share.disc !== false,
    share_idmc: input.share.idmc === true,
  }).eq("id", row.id).eq("status", "draft");
  if (saved.error) return { ok: false as const, status: 400, error: saved.error.message.includes("20261026220000") ? saved.error.message : "Collez la migration 20261026220000 pour envoyer la candidature." };

  if (job.school_id) {
    await grantOrganizationShares(db, input.userId, job.school_id, {
      soft: input.share.soft !== false && tests.soft,
      disc: input.share.disc !== false && tests.disc,
      idmc: input.share.idmc === true && tests.idmc,
    });
    await notifyCompany(db, job.school_id, String(job.title || "une offre"));
  }

  const cursus = await resolveOfferCursus(db, String(job.diploma_prepared ?? ""));
  if (cursus) await ensureSchoolApplication(db, { userId: input.userId, person, phone, cv, cursus, offerId: job.id });

  const email = String(person.email ?? "");
  if (email) {
    await sendEmail({
      to: email,
      from: EDGE_COCKPIT_FROM,
      subject: "Candidature envoyée",
      html: `<p>Bonjour ${escapeHtml(person.first_name || "")},</p><p>Votre candidature pour ${escapeHtml(job.title || "l'offre")} est envoyée. Vous aurez une réponse sous 10 jours, par e-mail et dans votre espace.</p>`,
      skipBcc: true,
    });
  }
  return { ok: true as const };
}

async function grantOrganizationShares(
  db: SupabaseClient,
  userId: string,
  organizationId: string,
  requested: Partial<Record<CfaTestKind, boolean>>,
) {
  const now = new Date().toISOString();
  for (const type of ["soft", "disc", "idmc"] as const) {
    if (!requested[type]) continue;
    const write = await db.from("assessment_shares").upsert(
      {
        user_id: userId,
        assessment_type: type,
        recipient_type: "organization",
        recipient_id: organizationId,
        shared: true,
        shared_at: now,
        revoked_at: null,
      },
      { onConflict: "user_id,assessment_type,recipient_type,recipient_id" },
    );
    if (write.error) console.warn("[offre-share]", write.error.message);
  }
}

async function notifyCompany(db: SupabaseClient, organizationId: string, title: string) {
  const members = await db.from("org_memberships").select("user_id").eq("org_id", organizationId).limit(8);
  const rows = (members.data ?? []).map((member) => ({
    user_id: (member as { user_id: string }).user_id,
    type: "info",
    title: "Nouvelle candidature",
    message: `Une candidature est arrivée pour ${title}, avec les tests que le candidat a choisis de partager.`,
    read: false,
  }));
  if (rows.length) await db.from("notifications").insert(rows);
}

async function ensureSchoolApplication(
  db: SupabaseClient,
  input: { userId: string; person: Record<string, string | null>; phone: string; cv: string; cursus: string; offerId: string },
) {
  const email = String(input.person.email ?? "").toLowerCase();
  const existing = email
    ? await db.from("cfa_applications").select("id").ilike("email", email).neq("status", "rejected").limit(1).maybeSingle()
    : { data: null };
  if (existing.data) {
    const linked = await db.from("cfa_applications").update({ profile_id: input.userId, job_offer_id: input.offerId, origin: "existing_account" }).eq("id", (existing.data as { id: string }).id);
    if (linked.error) {
      await db.from("cfa_applications").update({ profile_id: input.userId, origin: "existing_account" }).eq("id", (existing.data as { id: string }).id);
    }
    return;
  }
  const payload = {
    status: "challenge",
    first_name: input.person.first_name || "Candidat",
    last_name: input.person.last_name || "Byound",
    email,
    phone: input.phone,
    specialization: input.cursus,
    profile_id: input.userId,
    origin: "existing_account",
    cv_path: input.cv,
    job_offer_id: input.offerId,
  };
  const created = await db.from("cfa_applications").insert(payload);
  if (created.error) {
    const { job_offer_id: _ignored, ...withoutOffer } = payload;
    await db.from("cfa_applications").insert(withoutOffer);
  }
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
