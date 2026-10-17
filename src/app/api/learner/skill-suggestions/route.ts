import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 500 });
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { label?: string } | null;
  const label = String(body?.label ?? "").trim();
  if (label.length < 2) return NextResponse.json({ error: "Libellé trop court" }, { status: 400 });

  const { error } = await supabase.from("skill_suggestions").insert({
    user_id: userData.user.id,
    label,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
