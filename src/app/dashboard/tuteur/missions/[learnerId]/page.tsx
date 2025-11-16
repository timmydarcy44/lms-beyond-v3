import { notFound } from 'next/navigation';

import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getTutorDashboardData } from '@/lib/queries/tuteur';
import { Sparkles } from 'lucide-react';

const difficultyTone: Record<string, string> = {
  starter: 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/40',
  core: 'bg-sky-500/15 text-sky-200 border border-sky-500/40',
  expert: 'bg-purple-500/15 text-purple-200 border border-purple-500/40',
};

type TutorLearnerMissionsPageProps = {
  params: Promise<{ learnerId: string }>;
};

export default async function TutorLearnerMissionsPage({ params }: TutorLearnerMissionsPageProps) {
  const { learnerId } = await params;
  const data = await getTutorDashboardData();
  const learner = data.learners.find((item) => item.id === learnerId);

  if (!learner) {
    notFound();
  }

  const referential = data.referential;

  return (
    <DashboardShell
      title={`Missions — ${learner.name}`}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Tuteur', href: '/dashboard/tuteur' },
        { label: 'Missions', href: '/dashboard/tuteur/missions' },
        { label: learner.name },
      ]}
    >
      <div className="space-y-8">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardContent className="grid gap-6 p-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-white">{learner.role}</p>
              <p className="text-xs text-white/60">Entreprise : {learner.company}</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>Progression globale</span>
                  <span>{learner.progression}%</span>
                </div>
                <Progress value={learner.progression} className="h-2" />
              </div>
              <div className="space-y-1 text-xs text-white/60">
                <p className="font-semibold text-white/80">Dernier score</p>
                <p>
                  {learner.latestScore ?? '--'}
                  {learner.lastScoreLabel ? ` • ${learner.lastScoreLabel}` : ''}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-xs text-white/70">
              <p className="font-semibold text-white/80">Questionnaire entreprise</p>
              <p className="mt-1">Complétez le profil de votre organisation pour générer des missions adaptées à votre secteur.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button className="rounded-full bg-gradient-to-r from-[#FF512F] to-[#DD2476] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-white">
                  Compléter le profil entreprise
                </Button>
                <Button
                  variant="ghost"
                  className="rounded-full border border-white/20 px-4 py-1.5 text-[11px] uppercase tracking-[0.3em] text-white/70 hover:bg-white/10"
                >
                  Voir mes réponses
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-gradient-to-br from-[#0f172a]/85 via-[#111827]/80 to-[#020617]/90 text-white">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <Badge className="rounded-full border border-white/25 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/80">
                Référentiel alternant
              </Badge>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-semibold md:text-3xl">{referential.title}</CardTitle>
                <p className="text-sm text-white/70">{referential.description}</p>
                <div className="flex flex-wrap gap-3 text-xs text-white/60">
                  <span className="rounded-full border border-white/20 px-3 py-1 uppercase tracking-[0.25em]">
                    Domaine&nbsp;: {referential.domain}
                  </span>
                  <span className="rounded-full border border-white/20 px-3 py-1 uppercase tracking-[0.25em]">
                    Niveau&nbsp;: {referential.level}
                  </span>
                  {referential.organization ? (
                    <span className="rounded-full border border-white/20 px-3 py-1 uppercase tracking-[0.25em]">
                      Organisation&nbsp;: {referential.organization}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <Button className="w-full rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_16px_50px_rgba(0,114,255,0.35)]">
                Ajouter cette mission
              </Button>
              <Button
                variant="ghost"
                className="w-full rounded-full border border-white/25 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 hover:bg-white/10"
              >
                Générer avec Beyond AI
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-white/70">
            <div>
              <p className="font-semibold text-white/80">Compétences clés</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {referential.skillFocus.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1 uppercase tracking-[0.25em] text-white/70"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Suggestions de missions</h2>
            <Button
              variant="ghost"
              className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 hover:bg-white/10"
            >
              Générer avec Beyond AI
            </Button>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {referential.missionExamples.map((mission) => (
              <Card
                key={mission.id}
                className="flex h-full flex-col justify-between border-white/10 bg-white/5 text-white"
              >
                <CardContent className="space-y-4 p-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">{mission.title}</p>
                      <span
                        className={cn(
                          'rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em]',
                          difficultyTone[mission.difficulty] ?? difficultyTone.core,
                        )}
                      >
                        {mission.difficulty === 'starter' && 'Découverte'}
                        {mission.difficulty === 'core' && 'Essentiel'}
                        {mission.difficulty === 'expert' && 'Expert'}
                      </span>
                    </div>
                    <p className="text-xs text-white/60">{mission.objective}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-white/60">
                    <p className="font-semibold text-white/80">Livrable attendu</p>
                    <p>{mission.outcome}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-white/50">
                    <span>Timeline : {mission.suggestedTimeline}</span>
                    <Button
                      variant="ghost"
                      className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-white/70 hover:bg-white/10"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-[#DD2476]" /> Ajouter au plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}



