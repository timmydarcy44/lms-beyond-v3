import type { SupabaseClient } from "@supabase/supabase-js";

export const ENGAGEMENT_ALERT_KINDS = [
  "lms_inactive",
  "absence",
  "positionnement_manquant",
] as const;
export type EngagementAlertKind = (typeof ENGAGEMENT_ALERT_KINDS)[number];

export const ENGAGEMENT_ALERT_STATUSES = [
  "open",
  "in_progress",
  "resolved",
  "dismissed",
] as const;
export type EngagementAlertStatus = (typeof ENGAGEMENT_ALERT_STATUSES)[number];

export const ENGAGEMENT_ACTION_CHANNELS = [
  "email",
  "telephone",
  "visio",
  "presentiel",
  "lms",
  "autre",
] as const;
export type EngagementActionChannel = (typeof ENGAGEMENT_ACTION_CHANNELS)[number];

export const ENGAGEMENT_ACTION_RESULTS = [
  "en_attente",
  "contacte",
  "repondu",
  "sans_reponse",
  "abandon_constate",
  "resolu",
  "autre",
] as const;
export type EngagementActionResult = (typeof ENGAGEMENT_ACTION_RESULTS)[number];

export const ENGAGEMENT_ALERT_LABELS: Record<EngagementAlertKind, string> = {
  lms_inactive: "Inactivité LMS",
  absence: "Absence à une séance",
  positionnement_manquant: "Positionnement non réalisé",
};

export type EngagementAlertRow = {
  id: string;
  dossier_id: string;
  participant_id: string | null;
  kind: EngagementAlertKind;
  status: EngagementAlertStatus;
  detected_at: string;
  detail: string | null;
  meta: Record<string, unknown>;
  resolved_at: string | null;
  learner_name?: string | null;
  actions?: EngagementActionRow[];
};

export type EngagementActionRow = {
  id: string;
  alert_id: string;
  actor_user_id: string | null;
  action_at: string;
  channel: EngagementActionChannel;
  result: EngagementActionResult;
  notes: string | null;
};

const OF_SETTINGS_ID = "00000000-0000-4000-8000-000000000001";

async function loadInactiveDays(service: SupabaseClient): Promise<number> {
  const { data } = await service
    .from("of_settings")
    .select("lms_inactive_alert_days")
    .eq("id", OF_SETTINGS_ID)
    .maybeSingle();
  const n = Number(data?.lms_inactive_alert_days ?? 7);
  return Number.isFinite(n) && n >= 1 ? Math.min(90, Math.floor(n)) : 7;
}

function daysSince(iso: string | null | undefined, now = Date.now()): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return Math.floor((now - t) / (24 * 60 * 60 * 1000));
}

type Detected = {
  participant_id: string;
  kind: EngagementAlertKind;
  detail: string;
  meta?: Record<string, unknown>;
};

/** Détecte les alertes engagement pour un dossier (sans écrire). */
export async function detectEngagementAlerts(
  service: SupabaseClient,
  dossierId: string,
): Promise<{ alerts: Detected[]; inactive_days: number }> {
  const inactiveDays = await loadInactiveDays(service);
  const detected: Detected[] = [];

  const { data: dossier } = await service
    .from("formation_dossiers")
    .select("id, status, session_id, training_course_id")
    .eq("id", dossierId)
    .maybeSingle();
  if (!dossier) return { alerts: [], inactive_days: inactiveDays };

  const status = String(dossier.status);
  if (!["mise_en_place", "session", "fin"].includes(status)) {
    return { alerts: [], inactive_days: inactiveDays };
  }

  const { data: parts } = await service
    .from("formation_participants")
    .select("id, profile_id")
    .eq("dossier_id", dossierId);
  if (!parts?.length) return { alerts: [], inactive_days: inactiveDays };

  // Sorties = pas d'alerte engagement
  const partIds = parts.map((p) => String(p.id));
  const { data: exits } = await service
    .from("formation_participant_exits")
    .select("participant_id")
    .in("participant_id", partIds);
  const exited = new Set((exits ?? []).map((e) => String(e.participant_id)));

  const activeParts = parts.filter((p) => !exited.has(String(p.id)));
  if (!activeParts.length) return { alerts: [], inactive_days: inactiveDays };

  // Positionnement manquant
  const { data: attempts } = await service
    .from("formation_assessment_attempts")
    .select("participant_id, status")
    .eq("dossier_id", dossierId)
    .eq("kind", "positionnement");
  const donePos = new Set(
    (attempts ?? [])
      .filter((a) => a.status === "completed")
      .map((a) => String(a.participant_id)),
  );
  for (const p of activeParts) {
    if (!donePos.has(String(p.id))) {
      detected.push({
        participant_id: String(p.id),
        kind: "positionnement_manquant",
        detail: "Test de positionnement non réalisé",
      });
    }
  }

  // Absences (créneaux clôturés sans signature ok)
  if (dossier.session_id) {
    const { data: slots } = await service
      .from("formation_slots")
      .select("id, slot_date")
      .eq("session_id", dossier.session_id);
    const slotIds = (slots ?? []).map((s) => String(s.id));
    if (slotIds.length) {
      const { data: closures } = await service
        .from("attendance_closures")
        .select("slot_id")
        .in("slot_id", slotIds);
      const closedIds = (closures ?? []).map((c) => String(c.slot_id));
      if (closedIds.length) {
        const profileIds = activeParts.map((p) => String(p.profile_id));
        const { data: sigs } = await service
          .from("attendance_signatures")
          .select("profile_id, slot_id, status")
          .in("slot_id", closedIds)
          .in("profile_id", profileIds)
          .in("status", ["ok", "a_verifier"]);
        const present = new Set(
          (sigs ?? []).map((s) => `${s.profile_id}:${s.slot_id}`),
        );
        const slotById = new Map(
          (slots ?? []).map((s) => [String(s.id), String(s.slot_date)] as const),
        );
        for (const p of activeParts) {
          const missing: string[] = [];
          for (const sid of closedIds) {
            if (!present.has(`${p.profile_id}:${sid}`)) {
              missing.push(slotById.get(sid) || sid.slice(0, 8));
            }
          }
          if (missing.length) {
            detected.push({
              participant_id: String(p.id),
              kind: "absence",
              detail: `Absence constatée sur ${missing.length} créneau(x) : ${missing.slice(0, 3).join(", ")}`,
              meta: { missing_slots: missing },
            });
          }
        }
      }
    }
  }

  // Inactivité LMS
  let lmsCourseId: string | null = null;
  if (dossier.training_course_id) {
    const { data: tc } = await service
      .from("training_courses")
      .select("lms_course_id, pedagogical_modality")
      .eq("id", dossier.training_course_id)
      .maybeSingle();
    lmsCourseId = tc?.lms_course_id ? String(tc.lms_course_id) : null;
    const ped = String(tc?.pedagogical_modality ?? "").toLowerCase();
    const hasDist =
      Boolean(lmsCourseId) ||
      ped.includes("distan") ||
      ped.includes("elearning") ||
      ped === "mixte";
    if (hasDist && lmsCourseId) {
      const now = Date.now();
      for (const p of activeParts) {
        const profileId = String(p.profile_id);
        const { data: progress } = await service
          .from("course_progress")
          .select("last_accessed_at, progress_percent")
          .eq("user_id", profileId)
          .eq("course_id", lmsCourseId)
          .maybeSingle();
        const { data: lastSession } = await service
          .from("learning_sessions")
          .select("started_at")
          .eq("user_id", profileId)
          .eq("content_id", lmsCourseId)
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        const lastIso =
          progress?.last_accessed_at ||
          lastSession?.started_at ||
          null;
        const days = daysSince(lastIso ? String(lastIso) : null, now);
        const neverConnected = !lastIso;
        if (neverConnected || (days != null && days >= inactiveDays)) {
          detected.push({
            participant_id: String(p.id),
            kind: "lms_inactive",
            detail: neverConnected
              ? `Aucune connexion LMS détectée (seuil ${inactiveDays} j)`
              : `Inactif depuis ${days} jour(s) (seuil ${inactiveDays} j)`,
            meta: {
              last_accessed_at: lastIso,
              inactive_days: days,
              threshold: inactiveDays,
              progress_percent: progress?.progress_percent ?? null,
            },
          });
        }
      }
    }
  }

  return { alerts: detected, inactive_days: inactiveDays };
}

/** Synchronise les alertes détectées en base (ouvre / résout). */
export async function syncEngagementAlerts(
  service: SupabaseClient,
  dossierId: string,
): Promise<{ opened: number; resolved: number; alerts: EngagementAlertRow[] }> {
  const { alerts: detected } = await detectEngagementAlerts(service, dossierId);
  const keyOf = (d: Detected) => `${d.participant_id}:${d.kind}`;
  const detectedKeys = new Set(detected.map(keyOf));

  const { data: existing } = await service
    .from("formation_engagement_alerts")
    .select("id, participant_id, kind, status")
    .eq("dossier_id", dossierId)
    .in("status", ["open", "in_progress"]);

  let opened = 0;
  let resolved = 0;
  const now = new Date().toISOString();

  for (const row of existing ?? []) {
    const k = `${row.participant_id}:${row.kind}`;
    if (!detectedKeys.has(k)) {
      await service
        .from("formation_engagement_alerts")
        .update({ status: "resolved", resolved_at: now, updated_at: now })
        .eq("id", row.id);
      resolved += 1;
    }
  }

  const openKeys = new Set(
    (existing ?? [])
      .filter((r) => r.status === "open" || r.status === "in_progress")
      .map((r) => `${r.participant_id}:${r.kind}`),
  );

  for (const d of detected) {
    if (openKeys.has(keyOf(d))) continue;
    const { error } = await service.from("formation_engagement_alerts").insert({
      dossier_id: dossierId,
      participant_id: d.participant_id,
      kind: d.kind,
      status: "open",
      detail: d.detail,
      meta: d.meta ?? {},
      detected_at: now,
    });
    if (!error) opened += 1;
  }

  const alerts = await listEngagementAlerts(service, dossierId);
  return { opened, resolved, alerts };
}

export async function listEngagementAlerts(
  service: SupabaseClient,
  dossierId: string,
): Promise<EngagementAlertRow[]> {
  const { data: rows, error } = await service
    .from("formation_engagement_alerts")
    .select("id, dossier_id, participant_id, kind, status, detected_at, detail, meta, resolved_at")
    .eq("dossier_id", dossierId)
    .order("detected_at", { ascending: false });
  if (error || !rows?.length) {
    if (error && /formation_engagement_alerts|schema cache|does not exist/i.test(error.message)) {
      return [];
    }
    return [];
  }

  const partIds = [...new Set(rows.map((r) => r.participant_id).filter(Boolean).map(String))];
  const { data: parts } = partIds.length
    ? await service
        .from("formation_participants")
        .select("id, profile_id")
        .in("id", partIds)
    : { data: [] as Array<{ id: string; profile_id: string }> };
  const profileIds = (parts ?? []).map((p) => String(p.profile_id));
  const { data: profiles } = profileIds.length
    ? await service
        .from("profiles")
        .select("id, full_name, first_name, last_name, email")
        .in("id", profileIds)
    : { data: [] as Array<Record<string, unknown>> };
  const profileById = new Map((profiles ?? []).map((p) => [String(p.id), p]));
  const partToProfile = new Map(
    (parts ?? []).map((p) => [String(p.id), String(p.profile_id)] as const),
  );

  const alertIds = rows.map((r) => String(r.id));
  const { data: actions } = await service
    .from("formation_engagement_actions")
    .select("id, alert_id, actor_user_id, action_at, channel, result, notes")
    .in("alert_id", alertIds)
    .order("action_at", { ascending: false });

  const actionsByAlert = new Map<string, EngagementActionRow[]>();
  for (const a of actions ?? []) {
    const list = actionsByAlert.get(String(a.alert_id)) ?? [];
    list.push({
      id: String(a.id),
      alert_id: String(a.alert_id),
      actor_user_id: a.actor_user_id ? String(a.actor_user_id) : null,
      action_at: String(a.action_at),
      channel: a.channel as EngagementActionChannel,
      result: a.result as EngagementActionResult,
      notes: a.notes ? String(a.notes) : null,
    });
    actionsByAlert.set(String(a.alert_id), list);
  }

  return rows.map((r) => {
    const pid = r.participant_id ? String(r.participant_id) : null;
    const profileId = pid ? partToProfile.get(pid) : null;
    const profile = profileId ? profileById.get(profileId) : null;
    const name = profile
      ? String(profile.full_name ?? "").trim() ||
        [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
        String(profile.email ?? "")
      : null;
    return {
      id: String(r.id),
      dossier_id: String(r.dossier_id),
      participant_id: pid,
      kind: r.kind as EngagementAlertKind,
      status: r.status as EngagementAlertStatus,
      detected_at: String(r.detected_at),
      detail: r.detail ? String(r.detail) : null,
      meta: (r.meta as Record<string, unknown>) ?? {},
      resolved_at: r.resolved_at ? String(r.resolved_at) : null,
      learner_name: name,
      actions: actionsByAlert.get(String(r.id)) ?? [],
    };
  });
}

export async function addEngagementAction(
  service: SupabaseClient,
  params: {
    alertId: string;
    actorUserId?: string | null;
    channel: EngagementActionChannel;
    result: EngagementActionResult;
    notes?: string | null;
  },
): Promise<{ ok: true; action: EngagementActionRow } | { ok: false; error: string }> {
  const { data: alert } = await service
    .from("formation_engagement_alerts")
    .select("id, status")
    .eq("id", params.alertId)
    .maybeSingle();
  if (!alert) return { ok: false, error: "Alerte introuvable" };

  const now = new Date().toISOString();
  const { data: inserted, error } = await service
    .from("formation_engagement_actions")
    .insert({
      alert_id: params.alertId,
      actor_user_id: params.actorUserId ?? null,
      action_at: now,
      channel: params.channel,
      result: params.result,
      notes: params.notes?.trim() || null,
    })
    .select("id, alert_id, actor_user_id, action_at, channel, result, notes")
    .maybeSingle();
  if (error || !inserted) return { ok: false, error: error?.message || "Insertion impossible" };

  const nextStatus: EngagementAlertStatus =
    params.result === "resolu" || params.result === "abandon_constate"
      ? "resolved"
      : "in_progress";
  await service
    .from("formation_engagement_alerts")
    .update({
      status: nextStatus,
      resolved_at: nextStatus === "resolved" ? now : null,
      updated_at: now,
    })
    .eq("id", params.alertId);

  return {
    ok: true,
    action: {
      id: String(inserted.id),
      alert_id: String(inserted.alert_id),
      actor_user_id: inserted.actor_user_id ? String(inserted.actor_user_id) : null,
      action_at: String(inserted.action_at),
      channel: inserted.channel as EngagementActionChannel,
      result: inserted.result as EngagementActionResult,
      notes: inserted.notes ? String(inserted.notes) : null,
    },
  };
}
