import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { QUALIOPI_CORE_DOCS } from "@/lib/crm/qualiopi-shared";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Checklist session pilote — état live pour boucler ind. runtime. */
export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data: docs } = await supabase
    .from("crm_qualiopi_documents")
    .select("kind, file_url, session_id")
    .is("session_id", null);

  const vault = QUALIOPI_CORE_DOCS.map((d) => ({
    kind: d.kind,
    title: d.title,
    uploaded: Boolean(docs?.some((row) => row.kind === d.kind && row.file_url)),
  }));

  const { data: sessions } = await supabase
    .from("crm_qualiopi_sessions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  const sessionIds = (sessions ?? []).map((s) => s.id as string);
  const { data: attendees } = sessionIds.length
    ? await supabase.from("crm_qualiopi_attendees").select("*").in("session_id", sessionIds)
    : { data: [] as Record<string, unknown>[] };

  const enriched = (sessions ?? []).map((s) => {
    const list = (attendees ?? []).filter((a) => a.session_id === s.id);
    const signed = list.filter((a) => a.signed_at).length;
    const satisfied = list.filter((a) => a.satisfaction_at || a.satisfaction_score != null).length;
    return {
      id: s.id as string,
      course_name: String(s.course_name ?? ""),
      status: String(s.status ?? ""),
      scheduled_at: s.scheduled_at as string | null,
      convention_sent_at: s.convention_sent_at as string | null,
      reglement_sent_at: s.reglement_sent_at as string | null,
      livret_sent_at: s.livret_sent_at as string | null,
      attendees: list.length,
      signed,
      satisfied,
      packSent: Boolean(s.convention_sent_at && s.reglement_sent_at && s.livret_sent_at),
      fullySigned: list.length > 0 && signed === list.length,
      fullySatisfied: list.length > 0 && satisfied === list.length,
    };
  });

  const best =
    enriched.find((s) => s.fullySatisfied) ||
    enriched.find((s) => s.fullySigned) ||
    enriched.find((s) => s.packSent) ||
    enriched[0] ||
    null;

  const { count: highlightDone } = await supabase
    .from("crm_qualiopi_veille_highlights")
    .select("id", { count: "exact", head: true })
    .eq("status", "done");

  const { count: actionsDone } = await supabase
    .from("crm_qualiopi_actions")
    .select("id", { count: "exact", head: true })
    .eq("status", "done");

  const steps = [
    {
      id: "vault",
      label: "Coffre 3/3 PDF modèles",
      done: vault.every((v) => v.uploaded),
      href: "/super/crm/qualiopi",
    },
    {
      id: "schedule",
      label: "Session programmée",
      done: Boolean(best?.scheduled_at),
      href: "/super/crm/formations",
    },
    {
      id: "pack",
      label: "Pack info envoyé (convention + RI + livret)",
      done: Boolean(best?.packSent),
      href: "/super/crm/formations",
    },
    {
      id: "start",
      label: "Session démarrée",
      done: Boolean(best && (best.status === "in_progress" || best.status === "done")),
      href: "/super/crm/formations",
    },
    {
      id: "sign",
      label: "Émargement complet",
      done: Boolean(best?.fullySigned),
      href: "/super/crm/formations",
    },
    {
      id: "done",
      label: "Session clôturée",
      done: Boolean(best && best.status === "done"),
      href: "/super/crm/formations",
    },
    {
      id: "sat",
      label: "Satisfaction complète (≥ participants)",
      done: Boolean(best?.fullySatisfied),
      href: "/super/crm/formations",
    },
    {
      id: "veille",
      label: "≥1 highlight veille traité",
      done: (highlightDone ?? 0) >= 1,
      href: "/super/crm/qualiopi/veilles",
    },
    {
      id: "paq",
      label: "≥1 action PAQ clôturée",
      done: (actionsDone ?? 0) >= 1,
      href: "/super/crm/qualiopi/qualite",
    },
  ];

  return NextResponse.json({
    vault,
    bestSession: best,
    sessions: enriched,
    steps,
    progress: {
      done: steps.filter((s) => s.done).length,
      total: steps.length,
    },
  });
}
