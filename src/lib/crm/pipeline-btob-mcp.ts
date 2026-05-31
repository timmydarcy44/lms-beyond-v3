import { getServiceRoleClient } from "@/lib/supabase/server";

export type PipelineBtobPriority = "haute" | "moyenne" | "standard";

export type McpPipelineBtobInput = {
  company_name: string;
  contact_name?: string | null;
  contact_first_name?: string | null;
  contact_role?: string | null;
  contact_email?: string | null;
  email?: string | null;
  phone?: string | null;
  contact_linkedin?: string | null;
  company_linkedin?: string | null;
  sector?: string | null;
  location?: string | null;
  employee_count?: string | null;
  priority?: PipelineBtobPriority | null;
  why_target?: string | null;
  training_needs?: string[] | null;
  approach_channel?: string | null;
  decision_maker_identified?: boolean | null;
  engagement_score?: number | null;
  next_action?: string | null;
  next_action_date?: string | null;
  last_contact_date?: string | null;
  estimated_budget?: string | null;
  estimated_users?: number | null;
  notes?: string | null;
  stage_slug?: string | null;
  source?: string | null;
};

const BTOB_PIPELINE = "btob";

function pickString(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s || null;
}

function pickPriority(value: unknown): PipelineBtobPriority {
  const v = String(value ?? "standard").trim() as PipelineBtobPriority;
  if (v === "haute" || v === "moyenne" || v === "standard") return v;
  return "standard";
}

function pickEngagement(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(3, Math.max(0, Math.round(n)));
}

export function mapMcpInputToDealRow(
  input: McpPipelineBtobInput,
  options?: { partial?: boolean },
): Record<string, unknown> {
  const partial = options?.partial ?? false;
  const row: Record<string, unknown> = {};

  const set = (key: string, value: unknown) => {
    if (partial && value === undefined) return;
    row[key] = value;
  };

  if (!partial || input.company_name !== undefined) {
    set("company_name", pickString(input.company_name) ?? "");
  }
  if (!partial || input.contact_first_name !== undefined || input.contact_name !== undefined) {
    const first =
      pickString(input.contact_first_name) ??
      pickString(input.contact_name)?.split(/\s+/)[0] ??
      "";
    set("contact_first_name", first);
  }
  if (!partial || input.contact_email !== undefined || input.email !== undefined) {
    set("email", pickString(input.contact_email ?? input.email));
  }
  if (!partial || input.phone !== undefined) set("phone", pickString(input.phone));
  if (!partial || input.contact_role !== undefined) set("contact_role", pickString(input.contact_role));
  if (!partial || input.contact_linkedin !== undefined) {
    set("contact_linkedin", pickString(input.contact_linkedin));
  }
  if (!partial || input.company_linkedin !== undefined) {
    set("company_linkedin", pickString(input.company_linkedin));
  }
  if (!partial || input.sector !== undefined) set("sector", pickString(input.sector));
  if (!partial || input.location !== undefined) set("location", pickString(input.location));
  if (!partial || input.employee_count !== undefined) {
    set("employee_count", pickString(input.employee_count));
  }
  if (!partial || input.priority !== undefined) set("priority", pickPriority(input.priority));
  if (!partial || input.why_target !== undefined) set("why_target", pickString(input.why_target));
  if (!partial || input.training_needs !== undefined) {
    const needs = Array.isArray(input.training_needs)
      ? input.training_needs.map((n) => String(n).trim()).filter(Boolean)
      : [];
    set("training_needs", needs);
  }
  if (!partial || input.approach_channel !== undefined) {
    set("approach_channel", pickString(input.approach_channel));
  }
  if (!partial || input.decision_maker_identified !== undefined) {
    set("decision_maker_identified", Boolean(input.decision_maker_identified));
  }
  if (!partial || input.engagement_score !== undefined) {
    set("engagement_score", pickEngagement(input.engagement_score));
  }
  if (!partial || input.next_action !== undefined) set("next_action", pickString(input.next_action));
  if (!partial || input.next_action_date !== undefined) {
    set("next_action_date", pickString(input.next_action_date));
  }
  if (!partial || input.last_contact_date !== undefined) {
    set("last_contact_date", pickString(input.last_contact_date));
  }
  if (!partial || input.estimated_budget !== undefined) {
    set("estimated_budget", pickString(input.estimated_budget));
  }
  if (!partial || input.estimated_users !== undefined) {
    const users = Number(input.estimated_users);
    set("estimated_users", Number.isFinite(users) ? Math.round(users) : null);
  }
  if (!partial || input.notes !== undefined) set("notes", pickString(input.notes));
  if (!partial || input.stage_slug !== undefined) {
    set("stage_slug", pickString(input.stage_slug) ?? "a_appeler");
  }
  if (!partial || input.source !== undefined) {
    set("source", pickString(input.source) ?? "claude");
  }

  return row;
}

export async function listPipelineBtobDeals(filters: {
  priority?: string | null;
  sector?: string | null;
  status?: string | null;
  limit?: number;
  next_action_before?: string | null;
}) {
  const supabase = getServiceRoleClient();
  if (!supabase) throw new Error("Supabase indisponible");

  let query = supabase
    .from("crm_pipeline_deals")
    .select("*")
    .eq("pipeline_type", BTOB_PIPELINE)
    .order("sort_order", { ascending: true })
    .limit(Math.min(200, Math.max(1, filters.limit ?? 50)));

  if (filters.priority) query = query.eq("priority", filters.priority);
  if (filters.sector) query = query.eq("sector", filters.sector);
  if (filters.status) query = query.eq("stage_slug", filters.status);
  if (filters.next_action_before) {
    query = query.lte("next_action_date", filters.next_action_before);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createPipelineBtobDeal(input: McpPipelineBtobInput) {
  const supabase = getServiceRoleClient();
  if (!supabase) throw new Error("Supabase indisponible");

  const company = pickString(input.company_name);
  if (!company) throw new Error("company_name est requis");

  const { data: maxOrder } = await supabase
    .from("crm_pipeline_deals")
    .select("sort_order")
    .eq("pipeline_type", BTOB_PIPELINE)
    .eq("stage_slug", pickString(input.stage_slug) ?? "a_appeler")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const row = {
    pipeline_type: BTOB_PIPELINE,
    ...mapMcpInputToDealRow({ ...input, source: input.source ?? "claude" }),
    sort_order: (maxOrder?.sort_order ?? 0) + 1,
  };

  const { data, error } = await supabase.from("crm_pipeline_deals").insert(row).select("*").single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updatePipelineBtobDeal(id: string, input: McpPipelineBtobInput) {
  const supabase = getServiceRoleClient();
  if (!supabase) throw new Error("Supabase indisponible");

  const patch = mapMcpInputToDealRow(input, { partial: true });
  if (Object.keys(patch).length === 0) throw new Error("Aucun champ à mettre à jour");

  const { data, error } = await supabase
    .from("crm_pipeline_deals")
    .update(patch)
    .eq("id", id)
    .eq("pipeline_type", BTOB_PIPELINE)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getPipelineBtobSummary() {
  const deals = await listPipelineBtobDeals({ limit: 500 });
  const today = new Date().toISOString().slice(0, 10);

  const by_priority: Record<string, number> = { haute: 0, moyenne: 0, standard: 0 };
  const by_status: Record<string, number> = {};
  const by_sector: Record<string, number> = {};
  let actions_overdue = 0;
  let actions_today = 0;
  let actions_this_week = 0;

  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().slice(0, 10);

  for (const deal of deals) {
    const p = String((deal as { priority?: string }).priority ?? "standard");
    by_priority[p] = (by_priority[p] ?? 0) + 1;
    const stage = String((deal as { stage_slug?: string }).stage_slug ?? "—");
    by_status[stage] = (by_status[stage] ?? 0) + 1;
    const sector = String((deal as { sector?: string }).sector ?? "non renseigné");
    by_sector[sector] = (by_sector[sector] ?? 0) + 1;
    const nextDate = String((deal as { next_action_date?: string }).next_action_date ?? "");
    if (nextDate) {
      if (nextDate < today) actions_overdue += 1;
      if (nextDate === today) actions_today += 1;
      if (nextDate >= today && nextDate <= weekEndStr) actions_this_week += 1;
    }
  }

  return {
    total: deals.length,
    by_priority,
    by_status,
    by_sector,
    actions_overdue,
    actions_today,
    actions_this_week,
  };
}
