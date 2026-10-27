import { cache } from "react";
import { cookies } from "next/headers";

import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { getSession } from "@/lib/auth/session";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import {
  EXPERT_POLE_COOKIE,
  resolveActivePole,
  type ExpertMembership,
  type ExpertPole,
  type ExpertPoleState,
  type MembershipStatus,
} from "@/lib/expert/pole-model";

export {
  EXPERT_POLE_COOKIE,
  activePoles,
  resolveActivePole,
  type ExpertMembership,
  type ExpertPole,
  type ExpertPoleState,
  type MembershipStatus,
} from "@/lib/expert/pole-model";

const FALLBACK: ExpertPoleState = {
  ready: false,
  pole: "formation",
  memberships: [],
  managerPoles: [],
};

function missingRelation(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  return /does not exist|could not find the table|schema cache/i.test(error.message ?? "");
}

function asPole(value: unknown): ExpertPole | null {
  return value === "formation" || value === "care" ? value : null;
}

function asStatus(value: unknown): MembershipStatus | null {
  return value === "active" || value === "pending" || value === "suspended" ? value : null;
}

export const loadExpertPoleState = cache(async (): Promise<ExpertPoleState> => {
  const session = await getSession();
  if (!session?.id || isJadeDemoEmail(session.email)) return FALLBACK;
  const supabase = getServiceRoleClient() ?? (await getServerClient());
  if (!supabase) return FALLBACK;

  const [membershipsRes, managersRes, expertRes, jar] = await Promise.all([
    supabase.from("expert_memberships").select("pole,status").eq("expert_id", session.id),
    supabase.from("pole_managers").select("pole").eq("user_id", session.id),
    supabase.from("experts").select("is_care_expert").eq("id", session.id).maybeSingle(),
    cookies(),
  ]);

  const memberships: ExpertMembership[] = [];
  if (!missingRelation(membershipsRes.error)) {
    for (const row of membershipsRes.data ?? []) {
      const pole = asPole(row.pole);
      const status = asStatus(row.status);
      if (pole && status) memberships.push({ pole, status });
    }
  }

  const careFlag = Boolean((expertRes.data as { is_care_expert?: boolean | null } | null)?.is_care_expert);
  if (careFlag && !memberships.some((item) => item.pole === "care" && item.status === "active")) {
    memberships.push({ pole: "care", status: "active" });
    if (!missingRelation(membershipsRes.error)) {
      void supabase.from("expert_memberships").upsert(
        {
          expert_id: session.id,
          pole: "care",
          status: "active",
          joined_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "expert_id,pole" },
      );
    }
  }
  if (memberships.length === 0 && missingRelation(membershipsRes.error) && !careFlag) return FALLBACK;

  const managerPoles = missingRelation(managersRes.error)
    ? []
    : (managersRes.data ?? []).map((row) => asPole(row.pole)).filter((pole): pole is ExpertPole => Boolean(pole));
  const cookie = asPole(jar.get(EXPERT_POLE_COOKIE)?.value);
  return {
    ready: true,
    pole: resolveActivePole(memberships, cookie),
    memberships,
    managerPoles,
  };
});

export async function expertMustLeaveFormateur() {
  const state = await loadExpertPoleState();
  if (!state.ready || state.memberships.length === 0) return false;
  const formationActive = state.memberships.some((item) => item.pole === "formation" && item.status === "active");
  const hasCare = state.memberships.some((item) => item.pole === "care");
  return hasCare && !formationActive;
}
