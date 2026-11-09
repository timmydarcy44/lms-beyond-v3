import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const slotId = String(body?.slot_id ?? "").trim();
  const physicalCount = Math.round(Number(body?.physical_count));
  const trainerSignatureSvg =
    body?.trainer_signature_svg != null ? String(body.trainer_signature_svg) : null;
  const notes = body?.notes != null ? String(body.notes) : null;
  const seenProfileIds = Array.isArray(body?.person_seen_profile_ids)
    ? body.person_seen_profile_ids.map(String)
    : [];
  const invalidate = Array.isArray(body?.invalidate)
    ? (body.invalidate as Array<{ profile_id: string; motif: string }>)
    : [];

  if (!slotId || !Number.isFinite(physicalCount) || physicalCount < 0) {
    return NextResponse.json({ error: "slot_id et physical_count requis" }, { status: 400 });
  }

  let trainerUserId: string | null = null;
  try {
    const userClient = await getServerClient();
    const { data: auth } = userClient ? await userClient.auth.getUser() : { data: { user: null } };
    trainerUserId = auth.user?.id ?? null;
  } catch {
    /* ignore */
  }
  if (!trainerUserId) {
    return NextResponse.json({ error: "Formateur non authentifié" }, { status: 401 });
  }

  for (const item of invalidate) {
    const motif = String(item.motif ?? "").trim();
    if (!motif) {
      return NextResponse.json({ error: "Motif obligatoire pour invalider une signature" }, { status: 400 });
    }
    await service
      .from("attendance_signatures")
      .update({ status: "invalidee", status_motif: motif })
      .eq("slot_id", slotId)
      .eq("profile_id", item.profile_id);
  }

  if (seenProfileIds.length) {
    await service
      .from("attendance_signatures")
      .update({ person_seen: true })
      .eq("slot_id", slotId)
      .in("profile_id", seenProfileIds);
  }

  const { data: signatures } = await service
    .from("attendance_signatures")
    .select("id, status")
    .eq("slot_id", slotId);

  const validCount = (signatures ?? []).filter((s) => s.status === "ok" || s.status === "a_verifier").length;

  if (physicalCount !== validCount) {
    return NextResponse.json(
      {
        error: `Comptage bloqué : ${physicalCount} personne(s) vues ≠ ${validCount} émargement(s) valides. Invalidez ou ajoutez manuellement.`,
        code: "count_mismatch",
        physical_count: physicalCount,
        valid_signature_count: validCount,
      },
      { status: 409 },
    );
  }

  const { data: closure, error } = await service
    .from("attendance_closures")
    .upsert(
      {
        slot_id: slotId,
        trainer_user_id: trainerUserId,
        physical_count: physicalCount,
        valid_signature_count: validCount,
        trainer_signature_svg: trainerSignatureSvg,
        notes,
        closed_at: new Date().toISOString(),
      },
      { onConflict: "slot_id" },
    )
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await service
    .from("attendance_slot_launches")
    .update({ revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("slot_id", slotId)
    .is("revoked_at", null);

  // Lot 4b — relance des absents (participants éligibles sans signature valide)
  try {
    const { loadSlotContext } = await import("@/lib/formation-attendance/slot-context");
    const { scheduleAbsentRelances } = await import("@/lib/formation-documents/schedule");
    const ctx = await loadSlotContext(service, slotId);
    if (ctx) {
      const { data: sigs } = await service
        .from("attendance_signatures")
        .select("profile_id, status")
        .eq("slot_id", slotId);
      const present = new Set(
        (sigs ?? [])
          .filter((s) => s.status === "ok" || s.status === "a_verifier")
          .map((s) => String(s.profile_id)),
      );
      const byDossier = new Map<string, Array<{ profileId: string; email: string; name: string }>>();
      for (const p of ctx.participants) {
        if (!p.convention_ok || present.has(p.profile_id) || !p.email) continue;
        const list = byDossier.get(p.dossier_id) ?? [];
        list.push({ profileId: p.profile_id, email: p.email, name: p.name });
        byDossier.set(p.dossier_id, list);
      }
      for (const [dossierId, absents] of byDossier) {
        await scheduleAbsentRelances(service, {
          dossierId,
          slotId,
          absents: absents.map((a) => ({
            profileId: a.profileId,
            email: a.email,
            name: a.name,
          })),
        });
      }
    }
  } catch (error) {
    console.warn("[attendance/close] absent relances:", error);
  }

  // Archive feuille d’émargement PDF dans le coffre de chaque dossier lié
  try {
    const { archiveEmargementPdf } = await import(
      "@/lib/formation-documents/emargement-pdf"
    );
    await archiveEmargementPdf(service, {
      slotId,
      physicalCount,
      closedAt: closure.closed_at ? String(closure.closed_at) : null,
      actorUserId: trainerUserId,
    });
  } catch (error) {
    console.warn("[attendance/close] emargement pdf:", error);
  }

  return NextResponse.json({ closure, complete: true });
}
