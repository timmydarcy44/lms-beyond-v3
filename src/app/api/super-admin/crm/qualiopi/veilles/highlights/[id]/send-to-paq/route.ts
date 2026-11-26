import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import {
  mergeVeilleHighlightNote,
  parseVeillePlanDraft,
  splitVeilleHighlightNote,
  type VeillePlanDraftItem,
} from "@/lib/qualiopi/veille-shared";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type BodyItem = {
  id?: string;
  title?: string;
  owner_name?: string | null;
  due_at?: string | null;
  selected?: boolean;
};

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
  const incoming = Array.isArray(body.items) ? body.items : planDraft?.items ?? [];
  const selected: VeillePlanDraftItem[] = incoming
    .filter((item) => item && item.selected !== false)
    .map((item, index) => ({
      id: String(item.id || `a${index + 1}`),
      title: String(item.title ?? "").trim(),
      owner_name: item.owner_name ? String(item.owner_name).trim() : null,
      due_at: item.due_at ? String(item.due_at).slice(0, 10) : null,
      selected: true,
    }))
    .filter((item) => item.title);

  if (!selected.length) {
    return NextResponse.json({ error: "Cochez au moins une action retenue" }, { status: 400 });
  }

  const causeBase = `Veille · ${String(highlight.title ?? "Information surlignée")}`.slice(0, 240);
  const created: unknown[] = [];
  for (const item of selected) {
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

  const decisionNote = String(body.decisionNote ?? preface).trim();
  const remainingDraft = planDraft
    ? {
        ...planDraft,
        items: (planDraft.items ?? []).map((item) => ({
          ...item,
          selected: selected.some((s) => s.id === item.id),
        })),
      }
    : parseVeillePlanDraft(JSON.stringify({ version: 1, items: selected }));

  const note = mergeVeilleHighlightNote(
    decisionNote ? `${decisionNote}\n\n[Envoyé au PAQ — ${created.length} action(s)]` : `[Envoyé au PAQ — ${created.length} action(s)]`,
    remainingDraft,
  );

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
  return NextResponse.json({ ok: true, actions: created, highlight: updated });
}
