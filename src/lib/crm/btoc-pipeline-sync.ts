import { getServiceRoleClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_BTOC_PIPELINE_STAGES } from "@/lib/crm/pipeline-shared";

const BTOC_ROLES = new Set(["btoc", "PARTICULIER", "particulier", "student"]);

type BtocStage = "inscription" | "badge_passe" | "paiement";

function splitName(fullName: string | null, email: string): { first: string; company: string } {
  const trimmed = (fullName ?? "").trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/);
    return { first: parts[0], company: trimmed };
  }
  const local = email.split("@")[0] ?? "Contact";
  return { first: local, company: local };
}

async function resolveStage(userId: string): Promise<{ stage: BtocStage; amountCents: number }> {
  const supabase = getServiceRoleClient();
  let amountCents = 0;
  let hasPayment = false;

  if (supabase) {
    const { data: access } = await supabase
      .from("catalog_access")
      .select("access_status, catalog_items ( price )")
      .eq("user_id", userId)
      .in("access_status", ["purchased", "manually_granted"]);

    for (const row of access ?? []) {
      const item = (row as { catalog_items?: { price?: number } | { price?: number }[] }).catalog_items;
      const price = Array.isArray(item) ? Number(item[0]?.price ?? 0) : Number(item?.price ?? 0);
      amountCents += Math.round(price * 100);
      hasPayment = true;
    }
  }

  if (hasPayment) return { stage: "paiement", amountCents };

  try {
    const [approvedAssessment, assertion] = await Promise.all([
      prisma.assessment.findFirst({
        where: { earnerId: userId, status: "APPROVED" },
        select: { id: true },
      }),
      prisma.assertion.findFirst({
        where: { earnerId: userId, revoked: false },
        select: { id: true },
      }),
    ]);
    if (approvedAssessment || assertion) {
      return { stage: "badge_passe", amountCents: 0 };
    }
  } catch {
    // Prisma indisponible — ignorer badge
  }

  return { stage: "inscription", amountCents: 0 };
}

export async function syncBtocPipelineDeals(): Promise<{ synced: number; errors: string[] }> {
  const supabase = getServiceRoleClient();
  if (!supabase) return { synced: 0, errors: ["Service indisponible"] };

  for (const stage of DEFAULT_BTOC_PIPELINE_STAGES) {
    await supabase.from("crm_pipeline_stages").upsert(
      {
        pipeline_type: "btoc",
        slug: stage.slug,
        label: stage.label,
        sort_order: stage.sort_order,
      },
      { onConflict: "pipeline_type,slug" },
    );
  }

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, role, created_at");

  if (error) return { synced: 0, errors: [error.message] };

  const btocProfiles = (profiles ?? []).filter((p) => BTOC_ROLES.has(String(p.role ?? "")));
  const errors: string[] = [];
  let synced = 0;

  for (const profile of btocProfiles) {
    const { stage, amountCents } = await resolveStage(profile.id);
    const { first, company } = splitName(profile.full_name, profile.email ?? "");

    const { data: existing } = await supabase
      .from("crm_pipeline_deals")
      .select("id, source")
      .eq("pipeline_type", "btoc")
      .eq("profile_id", profile.id)
      .maybeSingle();

    const row = {
      pipeline_type: "btoc",
      stage_slug: stage,
      profile_id: profile.id,
      company_name: company,
      contact_first_name: first,
      email: profile.email ?? null,
      phone: profile.phone ?? null,
      amount_cents: amountCents,
      source: "auto",
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      const patch =
        existing.source === "manual"
          ? {
              company_name: row.company_name,
              contact_first_name: row.contact_first_name,
              email: row.email,
              phone: row.phone,
              amount_cents: row.amount_cents,
              updated_at: row.updated_at,
            }
          : row;
      const { error: upErr } = await supabase.from("crm_pipeline_deals").update(patch).eq("id", existing.id);
      if (upErr) errors.push(upErr.message);
      else synced += 1;
    } else {
      const { error: insErr } = await supabase.from("crm_pipeline_deals").insert(row);
      if (insErr) errors.push(insErr.message);
      else synced += 1;
    }
  }

  return { synced, errors };
}
