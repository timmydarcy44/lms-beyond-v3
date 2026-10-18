import { NextResponse } from "next/server";
import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { buildJadeSalarieHome } from "@/lib/demo/jade-salarie-home";
import { loadSalarieHome } from "@/lib/salarie/load-employee-home";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (isJadeDemoEmail(user.email)) return NextResponse.json(buildJadeSalarieHome());
  const home = await loadSalarieHome(user.id, user.email ?? null);
  return NextResponse.json(home);
}
