import { NextRequest, NextResponse } from "next/server";

import { getServerClient } from "@/lib/supabase/server";
import { isMockBilling } from "@/lib/env/bns-billing-env";

const isSchemaCacheError = (message?: string | null, code?: string | null) => {
  const normalized = message?.toLowerCase() ?? "";
  return (
    code === "42P01" ||
    normalized.includes("schema cache") ||
    normalized.includes("could not find the table") ||
    normalized.includes("relation") ||
    normalized.includes("bns_subscriptions")
  );
};

// Requires migration 012_bns_subscriptions.sql to be applied in Supabase.
const schemaCacheHint =
  "Run Supabase migration 012_bns_subscriptions.sql then reload schema cache (pg_notify('pgrst','reload schema')).";

export async function POST(_request: NextRequest) {
  if (!isMockBilling()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = await getServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Configuration Supabase manquante" }, { status: 500 });
  }

  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const performUpsert = async () =>
    supabase.from("bns_subscriptions").upsert(
      {
        user_id: userId,
        status: "active",
        plan: "monthly_30",
        current_period_end: currentPeriodEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  let { error } = await performUpsert();

  if (error && isSchemaCacheError(error.message, error.code)) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const retry = await performUpsert();
    error = retry.error;
  }

  if (error && isSchemaCacheError(error.message, error.code)) {
    return NextResponse.json(
      { ok: false, error: "BNS_DB_MISSING_TABLE", hint: schemaCacheHint },
      { status: 500 },
    );
  }

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

