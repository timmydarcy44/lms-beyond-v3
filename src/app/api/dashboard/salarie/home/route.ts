import { NextResponse } from "next/server";
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
  const home = await loadSalarieHome(user.id, user.email ?? null);
  return NextResponse.json(home);
}
