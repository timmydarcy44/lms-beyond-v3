import { jsPDF } from "jspdf";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadSlotContext } from "@/lib/formation-attendance/slot-context";
import { newDocToken, uploadFormationPdf } from "@/lib/formation-documents/storage";

function dayPartLabel(dayPart: string): string {
  return dayPart === "apres_midi" || dayPart === "après-midi" ? "Après-midi" : "Matin";
}

/** Génère et archive la feuille d’émargement PDF pour un créneau clôturé. */
export async function archiveEmargementPdf(
  service: SupabaseClient,
  params: {
    slotId: string;
    physicalCount: number;
    closedAt?: string | null;
    actorUserId?: string | null;
  },
): Promise<{ ok: true; archived: number } | { ok: false; error: string }> {
  const ctx = await loadSlotContext(service, params.slotId);
  if (!ctx) return { ok: false, error: "Créneau introuvable" };

  const { data: signatures } = await service
    .from("attendance_signatures")
    .select("profile_id, status, arrived_at, source, identification_method, created_at")
    .eq("slot_id", params.slotId)
    .order("created_at", { ascending: true });

  const sigByProfile = new Map(
    (signatures ?? []).map((s) => [String(s.profile_id), s] as const),
  );

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 16;
  let y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Feuille d'emargement", margin, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const title = ctx.session.title || ctx.dossiers[0]?.course_title || "Formation";
  doc.text(title, margin, y);
  y += 6;
  doc.text(
    `${ctx.slot.slot_date} · ${dayPartLabel(ctx.slot.day_part)} · ${ctx.dossiers.map((d) => d.organization_name).join(" · ")}`,
    margin,
    y,
  );
  y += 6;
  if (ctx.session.location_label) {
    doc.text(`Lieu : ${ctx.session.location_label}`, margin, y);
    y += 6;
  }
  doc.text(
    `Cloture : ${params.closedAt ? new Date(params.closedAt).toLocaleString("fr-FR") : "—"} · Comptage physique : ${params.physicalCount}`,
    margin,
    y,
  );
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.text("Participants", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");

  for (const p of ctx.participants) {
    if (y > 275) {
      doc.addPage();
      y = 18;
    }
    const sig = sigByProfile.get(p.profile_id);
    const present =
      sig && (sig.status === "ok" || sig.status === "a_verifier") ? "Present" : "Absent";
    const when = sig?.arrived_at || sig?.created_at;
    const detail = sig
      ? `${present} · ${sig.source || "—"} · ${sig.identification_method || "—"} · ${
          when ? new Date(String(when)).toLocaleTimeString("fr-FR") : ""
        }`
      : "Absent";
    const line = `${p.name}${p.email ? ` <${p.email}>` : ""} — ${detail}`;
    const wrapped = doc.splitTextToSize(line, 178);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 5 + 2;
  }

  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(
    "Document archive pour le coffre Qualiopi — signatures numeriques / code salle Byound.",
    margin,
    y,
  );

  const buffer = Buffer.from(doc.output("arraybuffer"));
  const uploaded = await uploadFormationPdf(service, {
    dossierId: ctx.dossiers[0]?.id || "shared",
    kind: "emargement",
    buffer,
  });

  const now = new Date().toISOString();
  let archived = 0;

  for (const dossier of ctx.dossiers) {
    const title = `Emargement ${ctx.slot.slot_date} ${dayPartLabel(ctx.slot.day_part)}`;
    const { data: existing } = await service
      .from("formation_documents")
      .select("id")
      .eq("dossier_id", dossier.id)
      .eq("kind", "emargement")
      .eq("slot_id", params.slotId)
      .maybeSingle();

    const patch: Record<string, unknown> = {
      title,
      status: "signed",
      signed_at: params.closedAt || now,
      generated_at: now,
      updated_at: now,
      slot_id: params.slotId,
      meta: {
        physical_count: params.physicalCount,
        slot_date: ctx.slot.slot_date,
        day_part: ctx.slot.day_part,
        closed_at: params.closedAt || now,
      },
      file_url: uploaded?.fileUrl ?? null,
    };
    if (uploaded) {
      patch.storage_bucket = uploaded.bucket;
      patch.storage_path = uploaded.path;
    }

    if (existing?.id) {
      const { error } = await service.from("formation_documents").update(patch).eq("id", existing.id);
      if (!error) archived += 1;
    } else {
      const { error } = await service.from("formation_documents").insert({
        dossier_id: dossier.id,
        kind: "emargement",
        title,
        access_token: newDocToken(),
        ...patch,
      });
      if (!error) archived += 1;
    }

    await service.from("formation_events").insert({
      dossier_id: dossier.id,
      event_type: "emargement_archived",
      actor_user_id: params.actorUserId ?? null,
      payload: { slot_id: params.slotId, physical_count: params.physicalCount },
    });
  }

  return { ok: true, archived };
}
