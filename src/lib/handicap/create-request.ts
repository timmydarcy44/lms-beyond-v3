import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/resend-client";
import { loadDisabilityReferentContact } from "@/lib/handicap/referent-contact";

export type DisabilityRequestSource = {
  scope: "business" | "school";
  employeeId?: string | null;
  cfaApplicationId?: string | null;
  personProfileId?: string | null;
  organizationId?: string | null;
  /** Texte libre — devient une accommodation « autre », jamais un diagnostic. */
  needsText?: string | null;
  personEmail?: string | null;
};

/**
 * Crée (ou réutilise) un disability_case en statut request + notifie.
 * E-mails non sensibles : confirmation + alerte référente sans détail médical.
 */
export async function ensureDisabilityAccommodationRequest(
  service: SupabaseClient,
  source: DisabilityRequestSource,
): Promise<{ caseId: string; created: boolean } | null> {
  const employeeId = source.employeeId || null;
  const cfaId = source.cfaApplicationId || null;
  const profileId = source.personProfileId || null;
  if (!employeeId && !cfaId && !profileId) return null;

  let existingQuery = service
    .from("disability_cases")
    .select("id, status")
    .neq("status", "closed")
    .limit(1);

  if (employeeId) existingQuery = existingQuery.eq("employee_id", employeeId);
  else if (cfaId) existingQuery = existingQuery.eq("cfa_application_id", cfaId);
  else if (profileId) existingQuery = existingQuery.eq("person_profile_id", profileId);

  const { data: existing } = await existingQuery.maybeSingle();

  let caseId: string;
  let created = false;

  if (existing?.id) {
    caseId = String(existing.id);
    if (existing.status !== "request") {
      // Ne force pas le retour en request si déjà en cours.
    }
  } else {
    const { data: inserted, error } = await service
      .from("disability_cases")
      .insert({
        scope: source.scope,
        status: "request",
        employee_id: employeeId,
        cfa_application_id: cfaId,
        person_profile_id: profileId,
        organization_id: source.organizationId || null,
      })
      .select("id")
      .maybeSingle();
    if (error || !inserted?.id) {
      console.error("[disability] create request", error?.message);
      return null;
    }
    caseId = String(inserted.id);
    created = true;
  }

  const needs = String(source.needsText ?? "").trim();
  if (needs) {
    const { data: dup } = await service
      .from("disability_accommodations")
      .select("id")
      .eq("case_id", caseId)
      .eq("category", "autre")
      .eq("label", "Demande d'aménagement")
      .limit(1)
      .maybeSingle();
    if (!dup?.id) {
      await service.from("disability_accommodations").insert({
        case_id: caseId,
        category: "autre",
        label: "Demande d'aménagement",
        details: needs.slice(0, 2000),
      });
    } else {
      await service
        .from("disability_accommodations")
        .update({ details: needs.slice(0, 2000) })
        .eq("id", dup.id);
    }
  }

  await notifyDisabilityRequest(service, {
    caseId,
    created,
    personEmail: source.personEmail,
  });

  return { caseId, created };
}

async function notifyDisabilityRequest(
  service: SupabaseClient,
  params: { caseId: string; created: boolean; personEmail?: string | null },
) {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://www.byound.fr";
  const referent = await loadDisabilityReferentContact(service);

  if (params.personEmail?.includes("@")) {
    await sendEmail({
      to: params.personEmail.trim().toLowerCase(),
      subject: "Votre demande a bien été transmise — Byound Handicap",
      html: `<p>Votre demande a bien été transmise à la référente handicap, qui vous contactera sous 72&nbsp;h.</p>
<p>Ce message ne contient aucune information personnelle sensible.</p>`,
      skipBcc: true,
    });
  }

  if (referent.email?.includes("@")) {
    await sendEmail({
      to: referent.email,
      subject: "Nouvelle demande dans votre espace Handicap",
      html: `<p>Vous avez une nouvelle demande d'aménagement dans votre espace.</p>
<p><a href="${appUrl}/handicap/demandes">Ouvrir les demandes</a></p>
<p>Ce message ne contient aucune information sensible.</p>`,
      skipBcc: true,
    });
  }
}
