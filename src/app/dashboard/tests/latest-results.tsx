"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Trophy } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTestSessions } from "@/hooks/use-test-sessions";

export default function LatestTestResults() {
  const history = useTestSessions((state) => state.history);

  if (!history.length) {
    return (
      <Card className="border-white/10 bg-white/5 text-white">
        <CardContent className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-white/80">Vos résultats de tests seront visibles ici</p>
            <p className="text-xs text-white/50">Lancez un test pour commencer à suivre votre progression et partager vos scores.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/20 bg-transparent px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/60">
            <Trophy className="h-4 w-4" /> Aucun test complété pour l&apos;instant
          </div>
        </CardContent>
      </Card>
    );
  }

  const topResults = history.slice(0, 4);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {topResults.map((result) => {
        const completionLabel = formatDistanceToNow(result.completedAt, { addSuffix: true, locale: fr });
        const answeredCount = Object.values(result.answers).filter((value) => {
          if (Array.isArray(value)) return value.length > 0;
          if (typeof value === "number") return !Number.isNaN(value);
          if (typeof value === "string") return value.trim().length > 0;
          return Boolean(value);
        }).length;

        return (
          <Link
            key={`${result.slug}-${result.completedAt.toISOString()}`}
            href={`/dashboard/tests/${result.slug}`}
            className="group"
          >
            <Card className="h-full border-white/10 bg-gradient-to-br from-[#1A1A1A] via-[#121212] to-[#050505] transition duration-300 group-hover:border-white/30 group-hover:shadow-[0_20px_60px_-20px_rgba(221,36,118,0.5)]">
              <CardContent className="flex h-full flex-col justify-between gap-4 p-6 text-white">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-white/60">
                    <Trophy className="h-3.5 w-3.5" /> score {result.score}
                  </div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-white">
                    {result.title}
                  </h3>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">Terminé {completionLabel}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>Progression</span>
                    <span>
                      {answeredCount}/{result.totalQuestions}
                    </span>
                  </div>
                  <Progress value={(answeredCount / result.totalQuestions) * 100} className="h-2" />
                  <p className="text-xs text-white/40">Cliquez pour revoir ou relancer le test.</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

