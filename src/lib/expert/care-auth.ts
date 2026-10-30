import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { loadExpertPoleState } from "@/lib/expert/poles";
import { getServiceRoleClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export function missingRelation(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  return /does not exist|could not find the table|schema cache/i.test(error.message ?? "");
}

export async function requireCareExpert(): Promise<
  | { ok: true; expertId: string; db: SupabaseClient }
  | { ok: false; response: NextResponse }
> {
  const session = await getSession();
  if (!session?.id) {
    return { ok: false, response: NextResponse.json({ error: "Connexion requise" }, { status: 401 }) };
  }
  const poles = await loadExpertPoleState();
  const allowed = poles.memberships.some((item) => item.pole === "care" && item.status === "active");
  if (!allowed) {
    return { ok: false, response: NextResponse.json({ error: "Réservé aux experts Byound Care" }, { status: 403 }) };
  }
  const db = getServiceRoleClient();
  if (!db) {
    return { ok: false, response: NextResponse.json({ error: "Service indisponible" }, { status: 500 }) };
  }
  return { ok: true, expertId: session.id, db };
}

export const CARE_SQL_HINT =
  "Tables Care absentes — collez supabase/migrations/20261027140000_expert_care_crm.sql dans le SQL Editor Supabase.";
