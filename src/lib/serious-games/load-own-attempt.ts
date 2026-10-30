import { notFound, redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase/server";
import { UUID_RE } from "@/lib/serious-games/shared";
import type { ReviewAnswer, ReviewAttempt } from "@/components/serious-games/AttemptReview";

export async function loadOwnSeriousGameAttempt(attemptId: string) {
  if (!UUID_RE.test(attemptId)) notFound();
  const supabase = await getServerClient();
  if (!supabase) redirect("/login");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: attempt } = await supabase
    .from("serious_game_attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!attempt) notFound();

  const [{ data: answers }, { data: game }] = await Promise.all([
    supabase.from("serious_game_answers").select("*").eq("attempt_id", attemptId).order("step_index"),
    supabase.from("serious_games").select("title").eq("slug", attempt.game_id).order("version", { ascending: false }).limit(1).maybeSingle(),
  ]);

  return {
    attempt: attempt as ReviewAttempt,
    answers: (answers ?? []) as ReviewAnswer[],
    title: game?.title ?? attempt.game_id,
  };
}
