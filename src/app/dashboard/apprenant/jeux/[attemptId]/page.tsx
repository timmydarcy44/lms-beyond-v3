import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase/server";
import { UUID_RE } from "@/lib/serious-games/shared";
import { AttemptReview, type ReviewAnswer, type ReviewAttempt } from "@/components/serious-games/AttemptReview";

export default async function MyAttemptPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  if (!UUID_RE.test(attemptId)) notFound();
  const supabase = await getServerClient();
  if (!supabase) redirect("/login");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: attempt } = await supabase.from("serious_game_attempts").select("*").eq("id", attemptId).eq("user_id", user.id).maybeSingle();
  if (!attempt) notFound();
  const [{ data: answers }, { data: game }] = await Promise.all([
    supabase.from("serious_game_answers").select("*").eq("attempt_id", attemptId).order("step_index"),
    supabase.from("serious_games").select("title").eq("slug", attempt.game_id).order("version", { ascending: false }).limit(1).maybeSingle(),
  ]);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
      <nav className="text-sm"><Link href="/dashboard/apprenant/jeux" className="text-muted-foreground underline">Mes jeux</Link></nav>
      <h1 className="text-3xl font-extrabold tracking-tight">{game?.title ?? attempt.game_id}</h1>
      <AttemptReview attempt={attempt as ReviewAttempt} answers={(answers ?? []) as ReviewAnswer[]} />
    </main>
  );
}
