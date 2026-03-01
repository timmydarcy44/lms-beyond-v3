import type { SupabaseClient } from "@supabase/supabase-js";

import { getServerClient } from "@/lib/supabase/server";

export type SubscriptionStatus = {
  isActive: boolean;
  status: "active" | "inactive" | "canceled" | null;
  plan: string | null;
  currentPeriodEnd: string | null;
};

export type SubscriptionLookup = {
  status: SubscriptionStatus;
  error?: { message: string; code?: string | null };
};

const emptyStatus: SubscriptionStatus = {
  isActive: false,
  status: null,
  plan: null,
  currentPeriodEnd: null,
};

export const getUserSubscriptionStatus = async (
  client?: SupabaseClient,
  userId?: string,
): Promise<SubscriptionLookup> => {
  const supabase = client ?? (await getServerClient());
  if (!supabase) {
    return { status: emptyStatus, error: { message: "Supabase non configuré" } };
  }

  let resolvedUserId = userId;
  if (!resolvedUserId) {
    const { data } = await supabase.auth.getUser();
    resolvedUserId = data.user?.id ?? undefined;
  }

  if (!resolvedUserId) {
    return { status: emptyStatus };
  }

  const { data, error } = await supabase
    .from("bns_subscriptions")
    .select("status, plan, current_period_end")
    .eq("user_id", resolvedUserId)
    .maybeSingle();

  if (error) {
    return { status: emptyStatus, error: { message: error.message, code: error.code } };
  }

  const status = (data?.status as SubscriptionStatus["status"]) ?? null;

  return {
    status: {
      isActive: status === "active",
      status,
      plan: data?.plan ?? null,
      currentPeriodEnd: data?.current_period_end ?? null,
    },
  };
};

