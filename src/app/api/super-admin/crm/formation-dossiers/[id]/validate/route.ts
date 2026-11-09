import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { sendFormationDocument } from "@/lib/formation-documents/send";
import { issueFormationInvoice } from "@/lib/formation-documents/invoice";
import { transitionFormationDossier } from "@/lib/formation-dossier/transition-server";

type Ctx = { params: Promise<{ id: string }> };

async function actorId(): Promise<string | null> {
  try {
    const userClient = await getServerClient();
    const { data: auth } = userClient ? await userClient.auth.getUser() : { data: { user: null } };
    return auth.user?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Validations humaines Lot 5 :
 * - action=devis → envoi devis + complete assignment + avance éventuelle
 * - action=formateur → assigne trainer_user_id
 * - action=facture → émet facture (verrou émargements)
 */
export async function POST(req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const action = String(body?.action ?? "").trim();
  const actorUserId = await actorId();
  const now = new Date().toISOString();

  if (action === "devis") {
    const sent = await sendFormationDocument(service, {
      dossierId: id,
      kind: "devis",
      actorUserId,
    });
    if (!sent.ok) {
      return NextResponse.json({ error: sent.error, code: sent.code }, { status: 400 });
    }
    await service
      .from("formation_assignments")
      .update({ completed_at: now, completed_by: actorUserId, updated_at: now })
      .eq("dossier_id", id)
      .eq("action_key", "devis");

    const { data: dossier } = await service
      .from("formation_dossiers")
      .select("status")
      .eq("id", id)
      .maybeSingle();
    if (dossier?.status === "qualification") {
      await transitionFormationDossier(service, {
        dossierId: id,
        toStatus: "devis",
        actorUserId,
      });
    }

    return NextResponse.json({ ok: true, action: "devis", sent_to: sent.sent_to });
  }

  if (action === "formateur") {
    const trainerUserId = String(body?.trainer_user_id ?? "").trim();
    if (!trainerUserId) {
      return NextResponse.json({ error: "trainer_user_id requis" }, { status: 400 });
    }
    const { data: staff } = await service
      .from("super_admins")
      .select("user_id")
      .eq("user_id", trainerUserId)
      .maybeSingle();
    if (!staff) {
      return NextResponse.json({ error: "Formateur non reconnu (staff Byound)" }, { status: 400 });
    }

    const { snapshotTrainerCvToDossier } = await import(
      "@/lib/formation-documents/trainer-cv"
    );
    const cvSnap = await snapshotTrainerCvToDossier(service, {
      dossierId: id,
      trainerUserId,
      actorUserId,
    });
    if (!cvSnap.ok) {
      return NextResponse.json(
        { error: cvSnap.error, code: cvSnap.code },
        { status: 400 },
      );
    }

    const { error } = await service
      .from("formation_dossiers")
      .update({
        trainer_user_id: trainerUserId,
        trainer_assigned_at: now,
        updated_at: now,
      })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    await service
      .from("formation_assignments")
      .update({
        assignee_user_id: trainerUserId,
        completed_at: now,
        completed_by: actorUserId,
        updated_at: now,
      })
      .eq("dossier_id", id)
      .eq("action_key", "formateur");

    await service.from("formation_events").insert({
      dossier_id: id,
      event_type: "trainer_assigned",
      actor_user_id: actorUserId,
      payload: { trainer_user_id: trainerUserId, cv_document_id: cvSnap.documentId },
    });

    // Si tous les positionnements sont faits, envoyer la synthèse au formateur
    try {
      const { resolveTrainerEmail, sendPositionnementSynthToTrainer } = await import(
        "@/lib/formation-assessments/synth"
      );
      const trainerEmail = await resolveTrainerEmail(service, id);
      if (trainerEmail) {
        const { data: parts } = await service
          .from("formation_participants")
          .select("id")
          .eq("dossier_id", id);
        const { data: done } = await service
          .from("formation_assessment_attempts")
          .select("participant_id")
          .eq("dossier_id", id)
          .eq("kind", "positionnement")
          .eq("status", "completed");
        const partIds = new Set((parts ?? []).map((p) => String(p.id)));
        const doneIds = new Set(
          (done ?? []).map((d) => String(d.participant_id || "")).filter(Boolean),
        );
        const allDone = partIds.size > 0 && [...partIds].every((pid) => doneIds.has(pid));
        if (allDone) {
          await sendPositionnementSynthToTrainer(service, {
            dossierId: id,
            toEmail: trainerEmail,
          });
        }
      }
    } catch (e) {
      console.warn("[validate/formateur] synth positionnement:", e);
    }

    return NextResponse.json({
      ok: true,
      action: "formateur",
      trainer_user_id: trainerUserId,
      cv_document_id: cvSnap.documentId,
    });
  }

  if (action === "facture") {
    const result = await issueFormationInvoice(service, {
      dossierId: id,
      actorUserId,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error, code: result.code }, { status: 400 });
    }
    return NextResponse.json({ ok: true, action: "facture", invoice: result });
  }

  return NextResponse.json({ error: "action invalide (devis|formateur|facture)" }, { status: 400 });
}
