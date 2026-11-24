import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  learnerSituationLabel,
  resolveLearnerSituation,
} from "@/lib/apprenant/learner-situation";
import { resolveEffectiveApprenantUserId } from "@/lib/control/learner-preview";
import { getServiceRoleClient, getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Situation calculée (candidate | learner | apprentice | employee) — lecture seule. */
export async function GET() {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const db = getServiceRoleClient() ?? (await getServerClient());
  if (!db) return NextResponse.json({ error: "NO_DB_CLIENT" }, { status: 500 });

  const { userId } = await resolveEffectiveApprenantUserId(session.id);
  const details = await resolveLearnerSituation(db, userId);
  return NextResponse.json({
    ...details,
    label: learnerSituationLabel(details.situation),
  });
}
