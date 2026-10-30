import Link from "next/link";
import { AttemptReview } from "@/components/serious-games/AttemptReview";
import { loadOwnSeriousGameAttempt } from "@/lib/serious-games/load-own-attempt";

export default async function ExpertAttemptPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const { attempt, answers, title } = await loadOwnSeriousGameAttempt(attemptId);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 text-[#F4F5F7]">
      <nav className="text-sm">
        <Link href="/dashboard/expert/resultats" className="text-[#B5BAC6] underline">
          Mes résultats
        </Link>
      </nav>
      <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
      <AttemptReview attempt={attempt} answers={answers} />
    </main>
  );
}
