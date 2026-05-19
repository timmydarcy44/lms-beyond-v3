import { NextResponse } from "next/server";

import { resolveSchoolIdForEcoleDashboard } from "@/lib/auth/school-access";
import { getSession } from "@/lib/auth/session";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Retourne le `school_id` CFA résolu (profil ou org_memberships staff). */
export async function GET() {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const supabase = await getServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "NO_DB_CLIENT" }, { status: 500 });
  }

  const schoolId = await resolveSchoolIdForEcoleDashboard(session.id, session.email, supabase);
  return NextResponse.json({ schoolId });
}
