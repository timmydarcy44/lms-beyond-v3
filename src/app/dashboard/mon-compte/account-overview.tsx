"use client";

import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Crown, LineChart, NotebookPen, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTestSessions } from "@/hooks/use-test-sessions";

export default function AccountOverview() {
  const history = useTestSessions((state) => state.history);

  const lastResult = history[0];
  const averageScore = history.length
    ? Math.round(history.reduce((acc, item) => acc + (item.score ?? 0), 0) / history.length)
    : null;
  const totalSessions = history.length;
  const answeredQuestions = history.reduce((acc, item) => acc + Object.keys(item.answers).length, 0);

  return (
    <div className="space-y-12">
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-[0.3em] text-white/60">Tests complétés</CardTitle>
            <NotebookPen className="h-5 w-5 text-white/50" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{totalSessions}</div>
            <p className="text-xs text-white/50">Depuis votre arrivée</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-[0.3em] text-white/60">Score moyen</CardTitle>
            <LineChart className="h-5 w-5 text-white/50" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{averageScore ?? "—"}</div>
            <p className="text-xs text-white/50">Objectif : +5 pts sur 30 jours</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-[0.3em] text-white/60">Questions traitées</CardTitle>
            <Sparkles className="h-5 w-5 text-white/50" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{answeredQuestions}</div>
            <p className="text-xs text-white/50">Chaque réponse nourrit votre coaching</p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-white/10 bg-gradient-to-br from-[#141E30] via-[#1F1F1F] to-[#0B0B0B] text-white">
        <CardContent className="grid gap-8 p-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div className="space-y-4">
            <Badge className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-4 py-1 text-[10px] uppercase tracking-[0.35em] text-white">
              Trajectoire apprenant
            </Badge>
            <h2 className="text-2xl font-semibold">Vos résultats pilotent votre développement</h2>
            <p className="text-sm text-white/70">
              Chaque test alimente cette page et sera bientôt synchronisé avec Supabase pour informer vos formateurs, administrateurs et tuteurs. Objectif : mettre en lumière vos forces et définir les prochaines itérations.
            </p>
            <ul className="space-y-2 text-sm text-white/60">
              <li>• Visualisez vos derniers scores et tendances</li>
              <li>• Identifiez les badges obtenus et ceux à venir</li>
              <li>• Préparez vos prochaines sessions de coaching</li>
            </ul>
          </div>

          <div className="space-y-6">
            {lastResult ? (
              <div className="rounded-3xl border border-white/15 bg-white/5 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/50">Dernier test</p>
                    <h3 className="text-lg font-semibold text-white">{lastResult.title}</h3>
                  </div>
                  <Badge variant="secondary" className="rounded-full bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white/60">
                    Score {lastResult.score}
                  </Badge>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>Progression</span>
                    <span>
                      {Object.keys(lastResult.answers).length}/{lastResult.totalQuestions}
                    </span>
                  </div>
                  <Progress value={(Object.keys(lastResult.answers).length / lastResult.totalQuestions) * 100} className="h-2" />
                  <p className="text-xs text-white/50">Terminé {formatDistanceToNow(lastResult.completedAt, { addSuffix: true, locale: fr })}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-white/15 bg-transparent p-6 text-center text-sm text-white/60">
                Aucune donnée encore. Lancez un test pour compléter votre profil.
              </div>
            )}

            <div className="rounded-3xl border border-[#8E2DE2]/40 bg-[#8E2DE2]/10 p-6 text-white">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-white/70" />
                <p className="text-sm font-semibold">Badges à venir</p>
              </div>
              <p className="mt-2 text-xs text-white/60">
                Les badges Neuro Insights et Emotion Design seront attribués automatiquement dès votre prochaine synchro Supabase.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.3em] text-white/60">
                <Badge variant="outline" className="rounded-full border-white/30 text-white/70">
                  Neuro Insights
                </Badge>
                <Badge variant="outline" className="rounded-full border-white/30 text-white/70">
                  Emotion Design
                </Badge>
                <Badge variant="outline" className="rounded-full border-white/30 text-white/70">
                  Hybrid Learning
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase tracking-[0.3em] text-white/60">Historique complet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {history.length ? (
            history.map((item) => (
              <div
                key={`${item.slug}-${item.completedAt.toISOString()}`}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.35em] text-white/50">{item.slug}</p>
                    <p className="text-base font-semibold text-white">{item.title}</p>
                  </div>
                  <Badge variant="secondary" className="rounded-full bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white/60">
                    Score {item.score}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-white/50">
                  <span>Terminé {formatDistanceToNow(item.completedAt, { addSuffix: true, locale: fr })}</span>
                  <span>
                    Questions répondues : {Object.keys(item.answers).length}/{item.totalQuestions}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-white/60">Complétez votre premier test pour nourrir cette section.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}





