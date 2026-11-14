import { NextRequest, NextResponse } from "next/server";
import { writeDisabilityAccessLog } from "@/lib/handicap/access-log";
import { loadDisabilityCaseDetail } from "@/lib/handicap/case-data";
import { encryptDisabilityNotes } from "@/lib/handicap/notes-crypto";
import { resolveDisabilityCaseId } from "@/lib/handicap/resolve-case";
import { requireDisabilityStaff } from "@/lib/handicap/staff";
import { sendEmail } from "@/lib/email/resend-client";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const STATUSES = new Set(["request", "interview", "plan", "active", "review", "closed"]);
const ACC_CATEGORIES = new Set([
  "evaluations",
  "supports",
  "rythme",
  "locaux",
  "materiel",
  "autre",
]);
const ACTION_OWNERS = new Set(["referent", "trainer", "byound", "company", "partner"]);
const MEETING_MODES = new Set(["visio", "telephone", "presentiel"]);
const PARTNERS = new Set(["agefiph", "cap_emploi", "medecin_travail", "autre"]);

async function touchCase(service: NonNullable<ReturnType<typeof getServiceRoleClient>>, caseId: string) {
  await service
    .from("disability_cases")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", caseId);
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const gate = await requireDisabilityStaff();
  if (!gate.ok) return NextResponse.json({ error: "Non autorisé" }, { status: gate.status });

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id: rawId } = await ctx.params;
  const caseId = await resolveDisabilityCaseId(service, rawId);
  if (!caseId) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

  await writeDisabilityAccessLog(service, {
    caseId,
    actorId: gate.userId,
    action: "view_case",
  });

  const detail = await loadDisabilityCaseDetail(service, caseId);
  if (!detail) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

  return NextResponse.json({
    case: detail,
    isSuperAdmin: await isSuperAdmin(),
  });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const gate = await requireDisabilityStaff();
  if (!gate.ok) return NextResponse.json({ error: "Non autorisé" }, { status: gate.status });

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id: rawId } = await ctx.params;
  const caseId = await resolveDisabilityCaseId(service, rawId);
  if (!caseId) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Corps invalide" }, { status: 400 });

  const action = String(body.action ?? "").trim();

  if (action === "set_status") {
    const status = String(body.status ?? "").trim();
    if (!STATUSES.has(status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }
    const patch: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (status === "closed") patch.closed_at = new Date().toISOString();
    else patch.closed_at = null;
    const { error } = await service.from("disability_cases").update(patch).eq("id", caseId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  } else if (action === "set_consent") {
    const method = String(body.consent_method ?? "oral").trim() || "oral";
    const { error } = await service
      .from("disability_cases")
      .update({
        consent_given_at: new Date().toISOString(),
        consent_method: method,
        updated_at: new Date().toISOString(),
      })
      .eq("id", caseId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  } else if (action === "set_company_informed") {
    const informed = Boolean(body.company_informed);
    if (informed && !body.confirmed) {
      return NextResponse.json(
        { error: "Confirmation requise : la personne a donné son accord." },
        { status: 400 },
      );
    }
    const { error } = await service
      .from("disability_cases")
      .update({
        company_informed: informed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", caseId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  } else if (action === "add_accommodation") {
    const category = String(body.category ?? "").trim();
    const label = String(body.label ?? "").trim();
    const details = String(body.details ?? "").trim() || null;
    if (!ACC_CATEGORIES.has(category) || !label) {
      return NextResponse.json({ error: "Catégorie et libellé requis" }, { status: 400 });
    }
    const { error } = await service.from("disability_accommodations").insert({
      case_id: caseId,
      category,
      label,
      details,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await touchCase(service, caseId);
  } else if (action === "share_accommodations") {
    if (!body.confirmed) {
      return NextResponse.json({ error: "Confirmation requise avant envoi" }, { status: 400 });
    }
    const { data: accs } = await service
      .from("disability_accommodations")
      .select("id, label, details, category")
      .eq("case_id", caseId);
    const list = (accs ?? []).filter((a) => a.label);
    if (!list.length) {
      return NextResponse.json({ error: "Aucun aménagement à transmettre" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const { error: shareErr } = await service
      .from("disability_accommodations")
      .update({ shared_with_trainer_at: now })
      .eq("case_id", caseId)
      .is("shared_with_trainer_at", null);
    if (shareErr) return NextResponse.json({ error: shareErr.message }, { status: 400 });

    // E-mail non sensible : lien uniquement + liste d'aménagements (pas de motif / RQTH / docs).
    const trainerEmail = String(body.trainer_email ?? "").trim().toLowerCase();
    if (trainerEmail.includes("@")) {
      const items = list
        .map((a) => `<li>${escapeHtml(String(a.label))}</li>`)
        .join("");
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://www.byound.fr";
      await sendEmail({
        to: trainerEmail,
        subject: "Nouveaux aménagements pédagogiques — Byound Handicap",
        html: `<p>Des aménagements ont été partagés pour une session à venir.</p>
<ul>${items}</ul>
<p><a href="${appUrl}/dashboard/formateur">Ouvrir votre espace formateur</a></p>
<p>Ce message ne contient aucune information médicale.</p>`,
        skipBcc: true,
      });
    }

    await writeDisabilityAccessLog(service, {
      caseId,
      actorId: gate.userId,
      action: "share_trainer",
    });
    await touchCase(service, caseId);
  } else if (action === "add_action") {
    const label = String(body.label ?? "").trim();
    const owner = String(body.owner ?? "referent").trim();
    const dueDate = body.due_date ? String(body.due_date).slice(0, 10) : null;
    if (!label || !ACTION_OWNERS.has(owner)) {
      return NextResponse.json({ error: "Libellé et responsable requis" }, { status: 400 });
    }
    const { error } = await service.from("disability_actions").insert({
      case_id: caseId,
      label,
      owner,
      due_date: dueDate,
      status: "todo",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await touchCase(service, caseId);
  } else if (action === "toggle_action") {
    const actionId = String(body.action_id ?? "").trim();
    if (!actionId) return NextResponse.json({ error: "action_id requis" }, { status: 400 });
    const { data: row } = await service
      .from("disability_actions")
      .select("id, status")
      .eq("id", actionId)
      .eq("case_id", caseId)
      .maybeSingle();
    if (!row) return NextResponse.json({ error: "Action introuvable" }, { status: 404 });
    const done = row.status !== "done";
    const { error } = await service
      .from("disability_actions")
      .update({
        status: done ? "done" : "todo",
        done_at: done ? new Date().toISOString() : null,
      })
      .eq("id", actionId)
      .eq("case_id", caseId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await touchCase(service, caseId);
  } else if (action === "add_meeting") {
    const title = String(body.title ?? "Rendez-vous").trim() || "Rendez-vous";
    const scheduledAt = body.scheduled_at ? String(body.scheduled_at) : null;
    const modeRaw = body.mode ? String(body.mode).trim() : null;
    const mode = modeRaw && MEETING_MODES.has(modeRaw) ? modeRaw : null;
    const { error } = await service.from("disability_meetings").insert({
      case_id: caseId,
      title,
      scheduled_at: scheduledAt,
      mode,
      status: "open",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await touchCase(service, caseId);
  } else if (action === "save_meeting_notes") {
    const meetingId = String(body.meeting_id ?? "").trim();
    if (!meetingId) return NextResponse.json({ error: "meeting_id requis" }, { status: 400 });
    const { data: meeting } = await service
      .from("disability_meetings")
      .select("id, status")
      .eq("id", meetingId)
      .eq("case_id", caseId)
      .maybeSingle();
    if (!meeting) return NextResponse.json({ error: "RDV introuvable" }, { status: 404 });
    if (meeting.status === "closed") {
      return NextResponse.json({ error: "Rendez-vous clôturé" }, { status: 400 });
    }
    const notes = encryptDisabilityNotes(String(body.notes ?? ""));
    const { error } = await service
      .from("disability_meetings")
      .update({ notes_enc: notes || null, updated_at: new Date().toISOString() })
      .eq("id", meetingId)
      .eq("case_id", caseId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  } else if (action === "reschedule_meeting") {
    const meetingId = String(body.meeting_id ?? "").trim();
    if (!meetingId) return NextResponse.json({ error: "meeting_id requis" }, { status: 400 });
    const scheduledAt = body.scheduled_at ? String(body.scheduled_at) : null;
    if (!scheduledAt) {
      return NextResponse.json({ error: "scheduled_at requis" }, { status: 400 });
    }
    const { error } = await service
      .from("disability_meetings")
      .update({ scheduled_at: scheduledAt, updated_at: new Date().toISOString() })
      .eq("id", meetingId)
      .eq("case_id", caseId)
      .eq("status", "open");
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await touchCase(service, caseId);
  } else if (action === "close_meeting") {
    const meetingId = String(body.meeting_id ?? "").trim();
    if (!meetingId) return NextResponse.json({ error: "meeting_id requis" }, { status: 400 });
    const { error } = await service
      .from("disability_meetings")
      .update({
        status: "closed",
        closed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", meetingId)
      .eq("case_id", caseId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await touchCase(service, caseId);
  } else if (action === "add_partner") {
    const partner = String(body.partner ?? "").trim();
    const status = body.status != null ? String(body.status).trim() || null : null;
    const note = body.note != null ? String(body.note).trim() || null : null;
    if (!PARTNERS.has(partner)) {
      return NextResponse.json({ error: "Partenaire invalide" }, { status: 400 });
    }
    const { error } = await service.from("disability_partners").insert({
      case_id: caseId,
      partner,
      status,
      note,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await touchCase(service, caseId);
  } else if (action === "export_log") {
    await writeDisabilityAccessLog(service, {
      caseId,
      actorId: gate.userId,
      action: "export",
    });
  } else {
    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  }

  const detail = await loadDisabilityCaseDetail(service, caseId);
  return NextResponse.json({
    case: detail,
    isSuperAdmin: await isSuperAdmin(),
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
