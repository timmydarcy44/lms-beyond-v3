import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { isOfStaffOwnerLabel, normalizeOwnerLabel } from "@/lib/qualiopi/of-staff";
import {
  VEILLE_AXES,
  mergeVeilleHighlightNote,
  parseVeillePlanDraft,
  splitVeilleHighlightNote,
  type VeillePlanDraftItem,
  type VeilleTheme,
} from "@/lib/qualiopi/veille-shared";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const NO_IMPACT_TITLE = "Aucun impact pour Byound — pas d'action";

type BodyItem = {
  id?: string;
  title?: string;
  owner_name?: string | null;
  due_at?: string | null;
  selected?: boolean;
};

function fmtFrDay(d = new Date()): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function veilleOriginLabel(theme: VeilleTheme | string | null | undefined): string {
  const axis = VEILLE_AXES.find((a) => a.theme === theme);
  if (axis) return `Veille ind. ${axis.indicatorId}`;
  return "Veille ind. 23/24/25";
}

function stripAutoPaqLines(preface: string): string {
  return preface
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      if (!t) return true;
      if (/^\[Envoyé au PAQ/i.test(t)) return false;
      if (/^Actions envoyées au PAQ le /i.test(t)) return false;
      return true;
    })
    .join("\n")
    .trim();
}

/** Envoie les actions retenues au PAQ (À faire) et marque le surlignage Traité. */
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id } = await context.params;
  const body = (await req.json().catch(() => ({}))) as {
    items?: BodyItem[];
    decisionNote?: string;
  };

  const { data: highlight, error } = await supabase
    .from("crm_qualiopi_veille_highlights")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!highlight) return NextResponse.json({ error: "Surlignage introuvable" }, { status: 404 });

  const { preface, planDraft } = splitVeilleHighlightNote(highlight.note);
  const decisionNote = stripAutoPaqLines(String(body.decisionNote ?? preface)).trim();
  if (!decisionNote) {
    return NextResponse.json(
      { error: "Note de retravail obligatoire avant envoi au PAQ / passage Traité" },
      { status: 400 },
    );
  }

  const incoming = Array.isArray(body.items) ? body.items : planDraft?.items ?? [];
  const selectedRaw: VeillePlanDraftItem[] = incoming
    .filter((item) => item && item.selected === true)
    .map((item, index) => ({
      id: String(item.id || `a${index + 1}`),
      title: String(item.title ?? "").trim(),
      owner_name: normalizeOwnerLabel(item.owner_name),
      due_at: item.due_at ? String(item.due_at).slice(0, 10) : null,
      selected: true,
    }))
    .filter((item) => item.title);

  if (!selectedRaw.length) {
    return NextResponse.json({ error: "Cochez au moins une action retenue" }, { status: 400 });
  }

  const noImpactOnly =
    selectedRaw.length === 1 &&
    selectedRaw[0]!.title.toLowerCase().includes("aucun impact");

  const actionable = noImpactOnly
    ? []
    : selectedRaw.filter((item) => !item.title.toLowerCase().includes("aucun impact"));

  for (const item of actionable) {
    if (!isOfStaffOwnerLabel(item.owner_name)) {
      return NextResponse.json(
        { error: `Responsable OF obligatoire pour « ${item.title} »` },
        { status: 400 },
      );
    }
    if (!item.due_at || !/^\d{4}-\d{2}-\d{2}$/.test(item.due_at)) {
      return NextResponse.json(
        { error: `Échéance obligatoire (JJ/MM/AAAA) pour « ${item.title} »` },
        { status: 400 },
      );
    }
  }

  const theme = (highlight.theme || "reglementaire") as VeilleTheme;
  const origin = veilleOriginLabel(theme);
  const causeBase = `${origin} · ${String(highlight.title ?? "Information surlignée")}`.slice(0, 240);
  const created: unknown[] = [];

  for (const item of actionable) {
    const { data, error: insertError } = await supabase
      .from("crm_qualiopi_actions")
      .insert({
        title: item.title.slice(0, 240),
        cause: causeBase,
        owner_name: item.owner_name,
        due_at: item.due_at,
        source: "veille",
        highlight_id: id,
        status: "todo",
      })
      .select("*")
      .single();
    if (insertError) {
      return NextResponse.json({ error: insertError.message, created }, { status: 400 });
    }
    created.push(data);
  }

  const labels = selectedRaw.map((item) => item.title).join(" · ");
  const stampLine = `Actions envoyées au PAQ le ${fmtFrDay()} : ${labels}`;
  const nextPreface = `${decisionNote}\n\n${stampLine}`;

  const remainingDraft = planDraft
    ? {
        ...planDraft,
        items: (planDraft.items ?? []).map((item) => ({
          ...item,
          selected: selectedRaw.some((s) => s.id === item.id),
        })),
      }
    : parseVeillePlanDraft(JSON.stringify({ version: 1, items: selectedRaw }));

  const note = mergeVeilleHighlightNote(nextPreface, remainingDraft);

  const { data: updated, error: updateError } = await supabase
    .from("crm_qualiopi_veille_highlights")
    .update({
      note,
      status: "done",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message, created }, { status: 400 });
  return NextResponse.json({
    ok: true,
    actions: created,
    highlight: updated,
    noImpactOnly,
    origin,
  });
}
