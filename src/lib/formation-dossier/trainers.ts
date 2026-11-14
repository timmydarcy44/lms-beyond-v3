import type { SupabaseClient } from "@supabase/supabase-js";

/** Alerte « Référent pédagogique obligatoire » dès que count > 8. */
export const MULTI_TRAINER_REFERENT_THRESHOLD = 8;

export type DossierTrainerRole = "lead" | "co";

export type DossierTrainerRow = {
  user_id: string;
  role: DossierTrainerRole;
  is_pedagogical_referent: boolean;
  assigned_at: string;
  name: string;
};

export type TrainersSnapshot = {
  trainers: DossierTrainerRow[];
  count: number;
  needs_pedagogical_referent: boolean;
  has_pedagogical_referent: boolean;
  alert: string | null;
};

function displayName(p: {
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  id?: string;
}): string {
  return (
    String(p.full_name ?? "").trim() ||
    [p.first_name, p.last_name].filter(Boolean).join(" ").trim() ||
    String(p.email ?? p.id ?? "")
  );
}

export function pedagogicalReferentAlert(count: number, hasReferent: boolean): string | null {
  if (count <= MULTI_TRAINER_REFERENT_THRESHOLD) return null;
  if (hasReferent) return null;
  return "Référent pédagogique obligatoire";
}

export async function listDossierTrainers(
  service: SupabaseClient,
  dossierId: string,
): Promise<TrainersSnapshot> {
  const { data: rows } = await service
    .from("formation_dossier_trainers")
    .select("user_id, role, is_pedagogical_referent, assigned_at")
    .eq("dossier_id", dossierId)
    .order("assigned_at", { ascending: true });

  const list = (rows ?? []) as Array<{
    user_id: string;
    role: string;
    is_pedagogical_referent: boolean;
    assigned_at: string;
  }>;

  // Fallback legacy : trainer_user_id seul si table vide / migration pas encore appliquée
  if (!list.length) {
    const { data: dossier } = await service
      .from("formation_dossiers")
      .select("trainer_user_id, trainer_assigned_at")
      .eq("id", dossierId)
      .maybeSingle();
    if (dossier?.trainer_user_id) {
      const uid = String(dossier.trainer_user_id);
      const { data: profile } = await service
        .from("profiles")
        .select("id, full_name, first_name, last_name, email")
        .eq("id", uid)
        .maybeSingle();
      return {
        trainers: [
          {
            user_id: uid,
            role: "lead",
            is_pedagogical_referent: false,
            assigned_at: String(dossier.trainer_assigned_at ?? new Date().toISOString()),
            name: profile ? displayName(profile) : uid,
          },
        ],
        count: 1,
        needs_pedagogical_referent: false,
        has_pedagogical_referent: false,
        alert: null,
      };
    }
    return {
      trainers: [],
      count: 0,
      needs_pedagogical_referent: false,
      has_pedagogical_referent: false,
      alert: null,
    };
  }

  const ids = list.map((r) => String(r.user_id));
  const { data: profiles } = ids.length
    ? await service
        .from("profiles")
        .select("id, full_name, first_name, last_name, email")
        .in("id", ids)
    : { data: [] as Array<Record<string, unknown>> };
  const byId = new Map((profiles ?? []).map((p) => [String(p.id), p]));

  const trainers: DossierTrainerRow[] = list.map((r) => {
    const p = byId.get(String(r.user_id));
    return {
      user_id: String(r.user_id),
      role: r.role === "lead" ? "lead" : "co",
      is_pedagogical_referent: Boolean(r.is_pedagogical_referent),
      assigned_at: String(r.assigned_at),
      name: p ? displayName(p as Parameters<typeof displayName>[0]) : String(r.user_id),
    };
  });

  const count = trainers.length;
  const has_pedagogical_referent = trainers.some((t) => t.is_pedagogical_referent);
  const needs_pedagogical_referent = count > MULTI_TRAINER_REFERENT_THRESHOLD;
  return {
    trainers,
    count,
    needs_pedagogical_referent,
    has_pedagogical_referent,
    alert: pedagogicalReferentAlert(count, has_pedagogical_referent),
  };
}

/**
 * Upsert un intervenant. Si role=lead, rétrograde l’ancien lead et synchronise trainer_user_id.
 */
export async function upsertDossierTrainer(
  service: SupabaseClient,
  params: {
    dossierId: string;
    userId: string;
    role?: DossierTrainerRole;
    isPedagogicalReferent?: boolean;
    actorUserId?: string | null;
  },
): Promise<{ ok: true; snapshot: TrainersSnapshot } | { ok: false; error: string; code?: string }> {
  const role: DossierTrainerRole = params.role ?? "co";
  const now = new Date().toISOString();

  const { data: staff } = await service
    .from("super_admins")
    .select("user_id")
    .eq("user_id", params.userId)
    .maybeSingle();
  if (!staff) {
    return { ok: false, error: "Formateur non reconnu (staff Byound)", code: "not_staff" };
  }

  if (role === "lead") {
    await service
      .from("formation_dossier_trainers")
      .update({ role: "co" })
      .eq("dossier_id", params.dossierId)
      .eq("role", "lead")
      .neq("user_id", params.userId);
  }

  if (params.isPedagogicalReferent === true) {
    await service
      .from("formation_dossier_trainers")
      .update({ is_pedagogical_referent: false })
      .eq("dossier_id", params.dossierId)
      .eq("is_pedagogical_referent", true)
      .neq("user_id", params.userId);
  }

  const row: Record<string, unknown> = {
    dossier_id: params.dossierId,
    user_id: params.userId,
    role,
    assigned_at: now,
    assigned_by: params.actorUserId ?? null,
  };
  if (params.isPedagogicalReferent != null) {
    row.is_pedagogical_referent = params.isPedagogicalReferent;
  }

  const { error } = await service.from("formation_dossier_trainers").upsert(row, {
    onConflict: "dossier_id,user_id",
  });
  if (error) {
    // Table absente (migration pas appliquée) — fallback lead seul
    if (/formation_dossier_trainers|schema cache|does not exist/i.test(error.message)) {
      if (role === "lead") {
        await service
          .from("formation_dossiers")
          .update({
            trainer_user_id: params.userId,
            trainer_assigned_at: now,
            updated_at: now,
          })
          .eq("id", params.dossierId);
        const snapshot = await listDossierTrainers(service, params.dossierId);
        return { ok: true, snapshot };
      }
      return {
        ok: false,
        error: "Multi-intervenants indisponible (migration Lot 2 non appliquée)",
        code: "migration_missing",
      };
    }
    return { ok: false, error: error.message };
  }

  if (role === "lead") {
    await service
      .from("formation_dossiers")
      .update({
        trainer_user_id: params.userId,
        trainer_assigned_at: now,
        updated_at: now,
      })
      .eq("id", params.dossierId);
  }

  const snapshot = await listDossierTrainers(service, params.dossierId);
  return { ok: true, snapshot };
}

export async function removeDossierTrainer(
  service: SupabaseClient,
  params: { dossierId: string; userId: string },
): Promise<{ ok: true; snapshot: TrainersSnapshot } | { ok: false; error: string }> {
  const { data: existing } = await service
    .from("formation_dossier_trainers")
    .select("role")
    .eq("dossier_id", params.dossierId)
    .eq("user_id", params.userId)
    .maybeSingle();

  const { error } = await service
    .from("formation_dossier_trainers")
    .delete()
    .eq("dossier_id", params.dossierId)
    .eq("user_id", params.userId);
  if (error) return { ok: false, error: error.message };

  if (existing?.role === "lead") {
    const { data: nextLead } = await service
      .from("formation_dossier_trainers")
      .select("user_id")
      .eq("dossier_id", params.dossierId)
      .order("assigned_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    const now = new Date().toISOString();
    if (nextLead?.user_id) {
      await service
        .from("formation_dossier_trainers")
        .update({ role: "lead" })
        .eq("dossier_id", params.dossierId)
        .eq("user_id", nextLead.user_id);
      await service
        .from("formation_dossiers")
        .update({
          trainer_user_id: nextLead.user_id,
          trainer_assigned_at: now,
          updated_at: now,
        })
        .eq("id", params.dossierId);
    } else {
      await service
        .from("formation_dossiers")
        .update({
          trainer_user_id: null,
          trainer_assigned_at: null,
          updated_at: now,
        })
        .eq("id", params.dossierId);
    }
  }

  const snapshot = await listDossierTrainers(service, params.dossierId);
  return { ok: true, snapshot };
}

export async function setPedagogicalReferent(
  service: SupabaseClient,
  params: { dossierId: string; userId: string },
): Promise<{ ok: true; snapshot: TrainersSnapshot } | { ok: false; error: string }> {
  const { data: existing } = await service
    .from("formation_dossier_trainers")
    .select("user_id")
    .eq("dossier_id", params.dossierId)
    .eq("user_id", params.userId)
    .maybeSingle();
  if (!existing) {
    return { ok: false, error: "Intervenant absent du dossier — assignez-le d’abord" };
  }

  await service
    .from("formation_dossier_trainers")
    .update({ is_pedagogical_referent: false })
    .eq("dossier_id", params.dossierId)
    .eq("is_pedagogical_referent", true);

  const { error } = await service
    .from("formation_dossier_trainers")
    .update({ is_pedagogical_referent: true })
    .eq("dossier_id", params.dossierId)
    .eq("user_id", params.userId);
  if (error) return { ok: false, error: error.message };

  const snapshot = await listDossierTrainers(service, params.dossierId);
  return { ok: true, snapshot };
}
