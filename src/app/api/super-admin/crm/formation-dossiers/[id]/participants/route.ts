import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { ensureLearnerProfileByEmail } from "@/lib/formation-dossier/ensure-learner";
import type { BpfLearnerStatus } from "@/lib/formation-dossier/constants";
import { BPF_LEARNER_STATUSES } from "@/lib/formation-dossier/constants";
import { syncParticipantHandicapProfile } from "@/lib/handicap/sync";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id } = await ctx.params;
  let rowsQuery = await service
    .from("formation_participants")
    .select("id, dossier_id, profile_id, job_title, bpf_learner_status, needs_specific_support, rqth, created_at")
    .eq("dossier_id", id)
    .order("created_at", { ascending: true });
  if (rowsQuery.error && /rqth|schema cache|column/i.test(rowsQuery.error.message)) {
    rowsQuery = await service
      .from("formation_participants")
      .select("id, dossier_id, profile_id, job_title, bpf_learner_status, needs_specific_support, created_at")
      .eq("dossier_id", id)
      .order("created_at", { ascending: true });
  }
  const { data: rows, error } = rowsQuery;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const profileIds = (rows ?? []).map((r) => String(r.profile_id));
  const { data: profiles } = profileIds.length
    ? await service
        .from("profiles")
        .select("id, full_name, first_name, last_name, email, reference_email, bpf_learner_status, needs_specific_support, attendance_method_pref")
        .in("id", profileIds)
    : { data: [] as Array<Record<string, unknown>> };

  const byId = new Map((profiles ?? []).map((p) => [String(p.id), p]));
  const participantIds = (rows ?? []).map((r) => String(r.id));

  const { data: attempts } = participantIds.length
    ? await service
        .from("formation_assessment_attempts")
        .select("participant_id, kind, status, score_pct, completed_at")
        .eq("dossier_id", id)
        .in("participant_id", participantIds)
    : { data: [] as Array<Record<string, unknown>> };

  const { data: dossier } = await service
    .from("formation_dossiers")
    .select("session_id")
    .eq("id", id)
    .maybeSingle();

  let planned = 0;
  const attendedByProfile = new Map<string, number>();
  if (dossier?.session_id) {
    const { data: slots } = await service
      .from("formation_slots")
      .select("id")
      .eq("session_id", dossier.session_id);
    planned = slots?.length ?? 0;
    if (planned && profileIds.length) {
      const { data: sigs } = await service
        .from("attendance_signatures")
        .select("profile_id, slot_id, status")
        .in(
          "slot_id",
          slots!.map((s) => String(s.id)),
        )
        .in("profile_id", profileIds)
        .in("status", ["ok", "a_verifier"]);
      const set = new Map<string, Set<string>>();
      for (const s of sigs ?? []) {
        const pid = String(s.profile_id);
        const cur = set.get(pid) ?? new Set();
        cur.add(String(s.slot_id));
        set.set(pid, cur);
      }
      for (const [pid, slotsSet] of set) attendedByProfile.set(pid, slotsSet.size);
    }
  }

  const attemptsByParticipant = new Map<string, Array<Record<string, unknown>>>();
  for (const a of attempts ?? []) {
    const pid = String(a.participant_id);
    const list = attemptsByParticipant.get(pid) ?? [];
    list.push(a);
    attemptsByParticipant.set(pid, list);
  }

  const participants = (rows ?? []).map((row) => {
    const profile = byId.get(String(row.profile_id));
    const name =
      String(profile?.full_name ?? "").trim() ||
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
      String(profile?.email ?? profile?.reference_email ?? "");
    const ass = attemptsByParticipant.get(String(row.id)) ?? [];
    const pick = (kind: string) => ass.find((a) => a.kind === kind);
    const pos = pick("positionnement");
    const chaud = pick("eval_chaud");
    const froid = pick("eval_froid");
    return {
      ...row,
      name,
      email: profile?.reference_email || profile?.email || null,
      attendance_method_pref: profile?.attendance_method_pref ?? null,
      attendance: {
        planned,
        attended: attendedByProfile.get(String(row.profile_id)) ?? 0,
      },
      assessments: {
        positionnement: pos
          ? {
              status: pos.status,
              score_pct: pos.score_pct != null ? Number(pos.score_pct) : null,
            }
          : null,
        eval_chaud: chaud
          ? {
              status: chaud.status,
              score_pct: chaud.score_pct != null ? Number(chaud.score_pct) : null,
            }
          : null,
        eval_froid: froid
          ? {
              status: froid.status,
              score_pct: froid.score_pct != null ? Number(froid.score_pct) : null,
            }
          : null,
      },
    };
  });

  return NextResponse.json({ participants });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id: dossierId } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;

  const { data: dossier } = await service
    .from("formation_dossiers")
    .select("id, organization_id")
    .eq("id", dossierId)
    .maybeSingle();
  if (!dossier) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

  const email = String(body?.email ?? "").trim().toLowerCase();
  const firstName = String(body?.first_name ?? "").trim();
  const lastName = String(body?.last_name ?? "").trim();
  const jobTitle = body?.job_title != null ? String(body.job_title) : null;
  const bpfRaw = String(body?.bpf_learner_status ?? "").trim();
  const bpfLearnerStatus = BPF_LEARNER_STATUSES.includes(bpfRaw as BpfLearnerStatus)
    ? (bpfRaw as BpfLearnerStatus)
    : null;
  const rqth = Boolean(body?.rqth);
  const needsSpecific = Boolean(body?.needs_specific_support) || rqth;

  try {
    const learner = await ensureLearnerProfileByEmail(service, {
      email,
      firstName,
      lastName,
      organizationId: String(dossier.organization_id),
      bpfLearnerStatus,
      needsSpecificSupport: needsSpecific,
      jobTitle,
    });

    const upsertRow: Record<string, unknown> = {
      dossier_id: dossierId,
      profile_id: learner.profileId,
      job_title: jobTitle,
      bpf_learner_status: bpfLearnerStatus,
      needs_specific_support: needsSpecific,
      rqth,
    };

    let { data: participant, error } = await service
      .from("formation_participants")
      .upsert(upsertRow, { onConflict: "dossier_id,profile_id" })
      .select("*")
      .single();

    if (error && /rqth|schema cache|column/i.test(error.message)) {
      delete upsertRow.rqth;
      ({ data: participant, error } = await service
        .from("formation_participants")
        .upsert(upsertRow, { onConflict: "dossier_id,profile_id" })
        .select("*")
        .single());
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    let actorUserId: string | null = null;
    try {
      const userClient = await getServerClient();
      const { data: auth } = userClient ? await userClient.auth.getUser() : { data: { user: null } };
      actorUserId = auth.user?.id ?? null;
    } catch {
      /* ignore */
    }

    await service.from("formation_events").insert({
      dossier_id: dossierId,
      event_type: "participant_added",
      actor_user_id: actorUserId,
      payload: { profile_id: learner.profileId, email, rqth },
    });

    if (participant) {
      const personName =
        [firstName, lastName].filter(Boolean).join(" ").trim() || email || "Participant";
      await syncParticipantHandicapProfile(
        service,
        {
          id: String(participant.id),
          dossier_id: dossierId,
          rqth: Boolean((participant as { rqth?: boolean }).rqth ?? rqth),
          needs_specific_support: needsSpecific,
        },
        {
          organizationId: String(dossier.organization_id),
          personName,
          personEmail: email,
          needsSummary: rqth ? "RQTH déclarée (participant formation)" : null,
        },
      );
    }

    return NextResponse.json({ participant, createdAuthUser: learner.createdAuthUser }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Ajout impossible" },
      { status: 400 },
    );
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id: dossierId } = await ctx.params;
  const participantId = req.nextUrl.searchParams.get("participant_id")?.trim();
  if (!participantId) {
    return NextResponse.json({ error: "participant_id requis" }, { status: 400 });
  }

  const { error } = await service
    .from("formation_participants")
    .delete()
    .eq("id", participantId)
    .eq("dossier_id", dossierId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
