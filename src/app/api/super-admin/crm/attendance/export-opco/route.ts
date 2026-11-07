import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { loadSlotContext } from "@/lib/formation-attendance/slot-context";

/** Export CSV feuille d'émargement format OPCO (une ligne / participant, colonnes demi-journées). */
export async function GET(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const sessionId = req.nextUrl.searchParams.get("session_id")?.trim() || "";
  if (!sessionId) return NextResponse.json({ error: "session_id requis" }, { status: 400 });

  const { data: slots } = await service
    .from("formation_slots")
    .select("id, slot_date, day_part")
    .eq("session_id", sessionId)
    .order("slot_date", { ascending: true });

  if (!slots?.length) {
    return NextResponse.json({ error: "Aucun créneau" }, { status: 404 });
  }

  const firstCtx = await loadSlotContext(service, String(slots[0].id));
  if (!firstCtx) return NextResponse.json({ error: "Contexte introuvable" }, { status: 404 });

  const slotIds = slots.map((s) => String(s.id));
  const { data: signatures } = await service
    .from("attendance_signatures")
    .select("slot_id, profile_id, server_timestamp, identification_method, validation_mode, status")
    .in("slot_id", slotIds)
    .neq("status", "invalidee");

  const { data: closures } = await service
    .from("attendance_closures")
    .select("slot_id, physical_count, closed_at")
    .in("slot_id", slotIds);

  const headers = [
    "Nom",
    "Email",
    "Entreprise",
    ...slots.map((s) => `${s.slot_date}_${s.day_part}`),
    "Heures suivies (approx)",
  ];

  const dossierByParticipant = new Map(
    firstCtx.participants.map((p) => [p.profile_id, p.dossier_id]),
  );
  const orgByDossier = new Map(firstCtx.dossiers.map((d) => [d.id, d.organization_name]));

  // Recharger participants tous dossiers de la session
  const allParticipants = firstCtx.participants;

  const lines = [headers.join(";")];
  for (const p of allParticipants) {
    const cells = [
      csv(p.name),
      csv(p.email),
      csv(orgByDossier.get(dossierByParticipant.get(p.profile_id) ?? "") ?? ""),
    ];
    let halfDays = 0;
    for (const slot of slots) {
      const sig = (signatures ?? []).find(
        (s) => String(s.slot_id) === String(slot.id) && String(s.profile_id) === p.profile_id,
      );
      if (sig) {
        halfDays += 1;
        const label =
          sig.validation_mode === "signature"
            ? `signé ${sig.server_timestamp}`
            : `confirmé électroniquement ${sig.server_timestamp} (${sig.identification_method})`;
        cells.push(csv(label));
      } else {
        cells.push("");
      }
    }
    cells.push(String(halfDays * 3.5));
    lines.push(cells.join(";"));
  }

  lines.push("");
  lines.push(
    csv(
      `Clôtures formateur: ${(closures ?? [])
        .map((c) => `${c.slot_id}:${c.physical_count}@${c.closed_at}`)
        .join(" | ")}`,
    ),
  );

  const csvBody = lines.join("\n");
  return new NextResponse(csvBody, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="emargement-opco-${sessionId.slice(0, 8)}.csv"`,
    },
  });
}

function csv(value: string): string {
  const v = String(value ?? "");
  if (/[;"\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
