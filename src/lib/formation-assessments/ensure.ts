import type { SupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import type { AssessmentKind } from "@/lib/formation-assessments/types";
import { appOrigin } from "@/lib/formation-documents/context";

function newToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function ensureAssessmentAttempt(
  service: SupabaseClient,
  params: {
    dossierId: string;
    kind: AssessmentKind;
    participantId?: string | null;
    profileId?: string | null;
  },
): Promise<{ id: string; access_token: string; status: string; score_pct: number | null }> {
  let query = service
    .from("formation_assessment_attempts")
    .select("id, access_token, status, score_pct")
    .eq("dossier_id", params.dossierId)
    .eq("kind", params.kind)
    .order("created_at", { ascending: false })
    .limit(1);

  if (params.participantId) query = query.eq("participant_id", params.participantId);
  else query = query.is("participant_id", null);

  const { data: existing } = await query.maybeSingle();
  if (existing) {
    return {
      id: String(existing.id),
      access_token: String(existing.access_token),
      status: String(existing.status),
      score_pct: existing.score_pct != null ? Number(existing.score_pct) : null,
    };
  }

  const token = newToken();
  const { data, error } = await service
    .from("formation_assessment_attempts")
    .insert({
      dossier_id: params.dossierId,
      kind: params.kind,
      participant_id: params.participantId ?? null,
      profile_id: params.profileId ?? null,
      access_token: token,
      status: "pending",
    })
    .select("id, access_token, status, score_pct")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Création tentative impossible");
  }

  return {
    id: String(data.id),
    access_token: String(data.access_token),
    status: String(data.status),
    score_pct: data.score_pct != null ? Number(data.score_pct) : null,
  };
}

export function assessmentUrl(accessToken: string): string {
  return `${appOrigin()}/q/${accessToken}`;
}
