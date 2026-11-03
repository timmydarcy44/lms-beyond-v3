import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await getServerClient();
  const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const userId = auth?.user?.id;
  if (!userId || !supabase) return NextResponse.json({ played: false }, { status: 401 });

  const blockId = new URL(request.url).searchParams.get("blockId")?.trim();
  if (!blockId) return NextResponse.json({ played: false });

  const { data, error } = await supabase
    .from("serious_game_attempts")
    .select("score, steps_count, status")
    .eq("user_id", userId)
    .eq("block_id", blockId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ played: false });

  const score = typeof data.score === "number" ? data.score : null;
  const steps = typeof data.steps_count === "number" && data.steps_count > 0 ? data.steps_count : 0;
  const situationsOk = score === null || steps === 0 ? 0 : Math.round((score / 100) * steps);

  return NextResponse.json({
    played: true,
    situationsOk,
    situations: steps,
  });
}
