import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase/server";
import { UUID_RE } from "@/lib/serious-games/shared";
import { AttemptReview, type ReviewAnswer, type ReviewAttempt } from "@/components/serious-games/AttemptReview";

export default async function SchoolAttemptPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  if (!UUID_RE.test(attemptId)) notFound();
  const supabase = await getServerClient();
  if (!supabase) redirect("/login");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: staff } = await supabase.rpc("sg_is_staff");
  if (!staff) redirect("/dashboard/apprenant/jeux");

  const { data: attempt } = await supabase.from("serious_game_attempts").select("*").eq("id", attemptId).maybeSingle();
  if (!attempt) notFound();
  const [{ data: answers }, { data: name }, { data: others }] = await Promise.all([
    supabase.from("serious_game_answers").select("*").eq("attempt_id", attemptId).order("step_index"),
    supabase.rpc("sg_learner_label", { learner: attempt.user_id }),
    supabase.from("serious_game_attempts").select("id, score, status, started_at").eq("user_id", attempt.user_id).eq("game_id", attempt.game_id).order("started_at"),
  ]);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
      <nav className="text-sm"><Link href={`/dashboard/ecole/jeux?game=${encodeURIComponent(attempt.game_id)}`} className="text-muted-foreground underline">Résultats des jeux</Link></nav>
      {(others ?? []).length > 1 && (
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="text-muted-foreground">Toutes ses parties :</span>
          {(others ?? []).map((o: { id: string; score: number | null; status: string }, i: number) => (
            <Link key={o.id} href={`/dashboard/ecole/jeux/${o.id}`} className={`rounded-full px-3 py-1 ${o.id === attemptId ? "bg-foreground text-background" : "bg-muted"}`}>
              #{i + 1} · {o.status === "completed" ? o.score : "en cours"}
            </Link>
          ))}
        </div>
      )}
      <AttemptReview attempt={attempt as ReviewAttempt} answers={(answers ?? []) as ReviewAnswer[]} learnerName={name ?? undefined} />
    </main>
  );
}
