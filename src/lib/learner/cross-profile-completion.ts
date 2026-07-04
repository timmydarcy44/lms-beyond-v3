import type { SupabaseClient } from "@supabase/supabase-js";
import "server-only";

import { sendEmail } from "@/lib/email/resend-client";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { getParticulierProfilComportementalEmail } from "@/lib/emails/templates/particulier-profil-comportemental";
import { publicAppUrl } from "@/lib/env";
import {
  IDMC_AXIS_EMAIL_PHRASES,
  readIdmcAxisPercentages,
  resolveDiscArchetypeForEmail,
  resolveDominantIdmcAxis,
  resolveIdmcGlobalLevel,
  resolveTopSoftSkillsForEmail,
} from "@/lib/learner/cross-profile-rules";
import {
  parseStoredCrossProfileOpening,
  resolveCrossProfileOpeningParagraph,
} from "@/lib/learner/cross-profile-opening";
import { maybeRefreshProfileAnalysisIfStale } from "@/lib/learner/profile-analysis";
import {
  PROFIL_COMPORTEMENTAL_BADGE_NAME,
  resolveProfilComportementalBadgeId,
} from "@/lib/openbadges/diagnostic-commercial-badge";
import { buildOpenBadgeLinkedInShareUrl } from "@/lib/openbadges/linkedin-share";
import {
  getLearnerOpenBadgeAward,
  recordOpenBadgeAward,
} from "@/lib/openbadges/open-badge-earner-submissions";
import { getBadgeCriteriaUrl } from "@/lib/openbadges/urls";
import { getServiceRoleClient } from "@/lib/supabase/server";

export type CrossProfileCompletionRecord = {
  opening_paragraph: string;
  opening_generated_at: string;
  tests_signature: string;
  disc_archetype: string;
  idmc_axis: string;
  idmc_level: string;
  soft_skills_top: string[];
  badge_id: string;
  badge_awarded_at: string;
  email_sent_at: string | null;
  show_badge_animation: boolean;
  processed_at: string;
};

export type CrossProfileTriggerResult =
  | { status: "skipped"; reason: string }
  | { status: "completed"; badgeId: string; alreadyProcessed?: boolean }
  | { status: "error"; message: string };

function isParticulierProfile(profile: {
  role?: string | null;
  role_type?: string | null;
}): boolean {
  const role = String(profile.role ?? "").trim().toUpperCase();
  const roleType = String(profile.role_type ?? "").trim().toLowerCase();
  return role === "PARTICULIER" || roleType === "particulier";
}

function parseCrossProfileCompletion(raw: unknown): CrossProfileCompletionRecord | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  if (!row.processed_at || !row.badge_awarded_at) return null;
  return row as unknown as CrossProfileCompletionRecord;
}

async function loadTestRows(service: SupabaseClient, userId: string) {
  const [discRes, idmcRes, softRes] = await Promise.all([
    service.from("disc_resultats").select("scores").eq("profile_id", userId).maybeSingle(),
    service
      .from("idmc_resultats")
      .select("scores, level, global_score")
      .eq("profile_id", userId)
      .maybeSingle(),
    service.from("soft_skills_resultats").select("scores").eq("learner_id", userId).maybeSingle(),
  ]);

  return {
    disc: discRes.data,
    idmc: idmcRes.data,
    soft: softRes.data,
  };
}

function hasObjectiveDetails(raw: unknown): boolean {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
  return Object.values(raw as Record<string, unknown>).some((v) => String(v ?? "").trim().length > 0);
}

async function sendProfilComportementalEmail(params: {
  email: string;
  firstName: string;
  profilHref: string;
}): Promise<boolean> {
  const template = getParticulierProfilComportementalEmail({
    firstName: params.firstName,
    profilHref: params.profilHref,
  });

  const result = await sendEmail({
    to: params.email,
    subject: template.subject,
    html: template.html,
    from: EDGE_COCKPIT_FROM,
  });

  return result.success;
}

export async function maybeTriggerCrossProfileCompletion(
  userId: string,
): Promise<CrossProfileTriggerResult> {
  const uid = userId.trim();
  if (!uid) return { status: "skipped", reason: "missing_user_id" };

  const service = getServiceRoleClient();
  if (!service) return { status: "skipped", reason: "service_role_unavailable" };

  const { data: profile, error: profileError } = await service
    .from("profiles")
    .select("id, email, first_name, role, role_type, type_profil, objective_details, cross_profile_completion")
    .eq("id", uid)
    .maybeSingle();

  if (profileError || !profile) {
    return { status: "skipped", reason: "profile_not_found" };
  }

  if (!isParticulierProfile(profile)) {
    return { status: "skipped", reason: "not_particulier" };
  }

  const existingCompletion = parseCrossProfileCompletion(profile.cross_profile_completion);
  if (existingCompletion?.badge_awarded_at) {
    void maybeRefreshProfileAnalysisIfStale(service, uid).catch((err) => {
      console.warn("[cross-profile] profile analysis refresh:", err);
    });
    return {
      status: "completed",
      badgeId: existingCompletion.badge_id,
      alreadyProcessed: true,
    };
  }

  const tests = await loadTestRows(service, uid);
  if (!tests.disc?.scores || !tests.idmc?.scores || !tests.soft?.scores) {
    return { status: "skipped", reason: "tests_incomplete" };
  }

  if (!hasObjectiveDetails(profile.objective_details)) {
    return { status: "skipped", reason: "objective_details_missing" };
  }

  const badgeId = await resolveProfilComportementalBadgeId(service);
  if (!badgeId) {
    return { status: "error", message: "badge_not_found" };
  }

  const { data: badgeRow } = await service
    .from("open_badges")
    .select("id, name, image_url, evaluation_config")
    .eq("id", badgeId)
    .maybeSingle();

  if (!badgeRow) {
    return { status: "error", message: "badge_row_missing" };
  }

  const existingAward = getLearnerOpenBadgeAward(badgeRow.evaluation_config, uid);
  if (existingAward && existingCompletion) {
    return { status: "completed", badgeId, alreadyProcessed: true };
  }

  const discArchetype = resolveDiscArchetypeForEmail(tests.disc.scores);
  const axisPercentages = readIdmcAxisPercentages(tests.idmc.scores);
  if (!axisPercentages) {
    return { status: "skipped", reason: "idmc_axes_invalid" };
  }

  const dominantAxis = resolveDominantIdmcAxis(axisPercentages);
  const idmcLevel = resolveIdmcGlobalLevel(tests.idmc.scores, tests.idmc.level);
  const idmcStrengthPhrase = IDMC_AXIS_EMAIL_PHRASES[dominantAxis as keyof typeof IDMC_AXIS_EMAIL_PHRASES];
  const topSoftSkills = resolveTopSoftSkillsForEmail(tests.soft.scores, 2);
  if (topSoftSkills.length === 0) {
    return { status: "skipped", reason: "soft_skills_invalid" };
  }

  const rawCompletion = profile.cross_profile_completion as Record<string, unknown> | null;
  const cachedOpening =
    typeof rawCompletion?.opening_paragraph === "string" && rawCompletion.opening_paragraph.trim()
      ? {
          text: String(rawCompletion.opening_paragraph),
          generatedAt: String(rawCompletion.opening_generated_at ?? ""),
          testsSignature: String(rawCompletion.tests_signature ?? ""),
        }
      : parseStoredCrossProfileOpening(rawCompletion?.opening);

  let openingParagraph: string;
  let openingGeneratedAt: string;
  let testsSignature: string;

  try {
    const opening = await resolveCrossProfileOpeningParagraph(
      {
        discArchetype,
        idmcLevel,
        idmcStrengthPhrase,
        softSkillPhrases: topSoftSkills.map((s) => s.emailPhrase),
      },
      cachedOpening,
    );
    openingParagraph = opening.text;
    openingGeneratedAt = opening.generatedAt;
    testsSignature = opening.testsSignature;
  } catch (err) {
    console.error("[cross-profile] opening generation:", err);
    return {
      status: "error",
      message: err instanceof Error ? err.message : "opening_generation_failed",
    };
  }

  const shareUrl = getBadgeCriteriaUrl(badgeId);
  const badgeName = String(badgeRow.name ?? PROFIL_COMPORTEMENTAL_BADGE_NAME);
  const awardedAt = new Date().toISOString();
  const award = {
    awardedAt,
    shareUrl,
    linkedInShareUrl: buildOpenBadgeLinkedInShareUrl({
      shareUrl,
      badgeName,
      level: 1,
    }),
    badgeName,
    imageUrl: badgeRow.image_url ? String(badgeRow.image_url) : null,
  };

  if (!existingAward) {
    const stored = await recordOpenBadgeAward(badgeId, uid, award);
    if (!stored) {
      return { status: "error", message: "badge_award_failed" };
    }
  }

  const profilHref = `${publicAppUrl().replace(/\/$/, "")}/dashboard/apprenant/profil-comportemental`;
  const email = String(profile.email ?? "").trim();
  const firstName = String(profile.first_name ?? "").trim();

  let emailSentAt: string | null = existingCompletion?.email_sent_at ?? null;
  if (email && !emailSentAt) {
    const sent = await sendProfilComportementalEmail({
      email,
      firstName,
      profilHref,
    });
    if (sent) emailSentAt = new Date().toISOString();
  }

  const completion: CrossProfileCompletionRecord = {
    opening_paragraph: openingParagraph,
    opening_generated_at: openingGeneratedAt,
    tests_signature: testsSignature,
    disc_archetype: discArchetype,
    idmc_axis: dominantAxis,
    idmc_level: idmcLevel,
    soft_skills_top: topSoftSkills.map((s) => s.title),
    badge_id: badgeId,
    badge_awarded_at: existingAward?.awardedAt ?? awardedAt,
    email_sent_at: emailSentAt,
    show_badge_animation: true,
    processed_at: new Date().toISOString(),
  };

  const { error: updateError } = await service
    .from("profiles")
    .update({ cross_profile_completion: completion })
    .eq("id", uid);

  if (updateError) {
    console.error("[cross-profile] profile update:", updateError.message);
    return { status: "error", message: "profile_update_failed" };
  }

  void maybeRefreshProfileAnalysisIfStale(service, uid).catch((err) => {
    console.warn("[cross-profile] profile analysis refresh:", err);
  });

  return { status: "completed", badgeId };
}
