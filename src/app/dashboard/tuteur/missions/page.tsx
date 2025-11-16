import Link from 'next/link';

import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getTutorDashboardData } from '@/lib/queries/tuteur';

export default async function TutorMissionsPage() {
  const data = await getTutorDashboardData();

  return (
    <DashboardShell
      title="Missions tuteur"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Tuteur', href: '/dashboard/tuteur' },
        { label: 'Missions' },
      ]}
    >
      <section className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-8 py-6 text-white">
          <h1 className="text-2xl font-semibold">Choisissez un alternant</h1>
          <p className="mt-3 text-sm text-white/70">
            Sélectionnez un alternant pour consulter son référentiel, personnaliser les missions à l’aide du questionnaire entreprise et suivre ses livrables.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data.learners.map((learner) => (
            <Link key={learner.id} href={`/dashboard/tuteur/missions/${learner.id}`}>
              <Card className="border-white/10 bg-white/5 text-white transition hover:border-white/20 hover:bg-white/10">
                <CardContent className="space-y-4 p-5">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">{learner.name}</p>
                    <p className="text-xs text-white/60">{learner.role} • {learner.company}</p>
                    <p className="text-xs text-white/50">Dernière activité : {learner.lastActivity}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <span>Progression</span>
                      <span>{learner.progression}%</span>
                    </div>
                    <Progress value={learner.progression} className="h-2" />
                  </div>
                  <div className="space-y-2 text-xs text-white/60">
                    <p className="font-semibold text-white/80">Prochaine mission</p>
                    <p>{learner.nextMission ?? 'À définir'}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>Dernier score</span>
                    <Badge className="rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-white/80">
                      {learner.latestScore ?? '--'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
