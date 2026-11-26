import { NextResponse } from "next/server";
import { resolveEffectiveSalarieUserId } from "@/lib/control/learner-preview";
import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { buildJadeSalarieHome } from "@/lib/demo/jade-salarie-home";
import { loadSalarieHome } from "@/lib/salarie/load-employee-home";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (isJadeDemoEmail(user.email)) return NextResponse.json(buildJadeSalarieHome());

  const { userId, preview } = await resolveEffectiveSalarieUserId(user.id);
  let email = user.email ?? null;
  if (preview && userId !== user.id) {
    const db = getServiceRoleClient();
    if (db) {
      const { data: target } = await db
        .from("profiles")
        .select("email")
        .eq("id", userId)
        .maybeSingle();
      if (target?.email) email = String(target.email);
    }
  }

  const home = await loadSalarieHome(userId, email);

  // Preview accompagnement : pas de résultats individuels (Mes bilans exclus côté serveur).
  if (preview && !preview.expired) {
    return NextResponse.json({
      ...home,
      bilans: { completed: 0, expected: 3, disc: null, idmc: null, soft: null },
      analysis: null,
      mesBilans: null,
      preview: { active: true, targetName: preview.targetName, targetUserId: preview.targetUserId },
    });
  }

  return NextResponse.json({
    ...home,
    preview: null,
  });
}
