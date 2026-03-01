import { NextResponse } from "next/server";

import { getServerClient } from "@/lib/supabase/server";
import { getUserSubscriptionStatus } from "@/lib/bns/subscription";

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

export async function GET() {
  const supabase = await getServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Configuration Supabase manquante" },
      { status: 500 },
    );
  }

  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let lookup = await getUserSubscriptionStatus(supabase, userId);

  if (lookup.error && isSchemaCacheError(lookup.error.message, lookup.error.code)) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    lookup = await getUserSubscriptionStatus(supabase, userId);
  }

  if (lookup.error && isSchemaCacheError(lookup.error.message, lookup.error.code)) {
    return NextResponse.json(
      { ok: false, error: "BNS_DB_MISSING_TABLE", hint: schemaCacheHint },
      { status: 500 },
    );
  }

  if (lookup.error) {
    return NextResponse.json({ ok: false, error: lookup.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status: lookup.status });
}

