import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { RECLAMATION_SOURCE_LABELS, deriveReclamationSource } from "@/lib/qualiopi/reclamation-sources";
import { RECLAMATION_STEP_LABELS, resolveReclamationStep } from "@/lib/qualiopi/reclamation-status";
import { RECLAMATION_THEME_LABELS, type ReclamationTheme } from "@/lib/qualiopi/reclamation-themes";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Export registre texte/PDF-friendly (sans is_test). */
export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  let { data, error } = await supabase
    .from("crm_qualiopi_reclamations")
    .select("*")
    .or("is_test.is.null,is_test.eq.false")
    .order("received_at", { ascending: false })
    .limit(500);

  if (error && /is_test/i.test(error.message)) {
    ({ data, error } = await supabase
      .from("crm_qualiopi_reclamations")
      .select("*")
      .order("received_at", { ascending: false })
      .limit(500));
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const lines = [
    "Registre des réclamations — Byound",
    `Export du ${new Date().toLocaleString("fr-FR")}`,
    "Hors comptes de test · Hors signalements sensibles",
    "",
    ...(data ?? []).map((r) => {
      const step = resolveReclamationStep(r);
      const theme =
        RECLAMATION_THEME_LABELS[(r.theme as ReclamationTheme) ?? "autre"] ?? "Autre";
      const source = RECLAMATION_SOURCE_LABELS[deriveReclamationSource(r)];
      return [
        `• ${RECLAMATION_STEP_LABELS[step]} | ${theme}`,
        `  Objet : ${r.subject}`,
        `  Demandeur : ${r.requester_name || "—"} (${r.requester_company || "—"})`,
        `  Reçue : ${r.received_at || "—"} · Accusé : ${r.ack_at || "—"} · Réponse : ${r.answered_at || "—"} · Clôture : ${r.closed_at || "—"}`,
        `  Via ${source}`,
        r.response ? `  Réponse : ${String(r.response).replace(/\s+/g, " ").slice(0, 280)}` : "  Réponse : —",
        r.action_id ? `  Action PAQ : ${r.action_id}` : "  Action PAQ : —",
        "",
      ].join("\n");
    }),
  ];

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="registre-reclamations-${stamp}.txt"`,
      "Cache-Control": "no-store",
    },
  });
}
