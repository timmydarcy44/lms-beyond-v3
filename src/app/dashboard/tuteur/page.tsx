import Image from 'next/image';

import { DashboardShellWrapper } from '@/components/dashboard/dashboard-shell-wrapper';
import { TasksBanner } from '@/components/dashboard/tasks-banner';
import { KPIGrid, type KpiCard } from '@/components/admin/KPIGrid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getTutorDashboardData } from '@/lib/queries/tuteur';
import { getSession } from '@/lib/auth/session';

function missionStatusTone(status: string) {
  switch (status) {
    case 'done':
      return 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/40';
    case 'in_progress':
      return 'bg-sky-500/15 text-sky-200 border border-sky-500/40';
    case 'todo':
    default:
      return 'bg-white/10 text-white/70 border border-white/15';
  }
}

export default async function TutorDashboardPage() {
  const data = await getTutorDashboardData();
  const session = await getSession();

  const kpis: KpiCard[] = [
    {
      label: 'Apprenants suivis',
      value: data.kpis.learners,
      hint: 'Actifs ce mois-ci',
      trend: 'up',
    },
    {
      label: 'Missions en cours',
      value: data.kpis.activeMissions,
      hint: 'Sur l’ensemble du portefeuille',
      trend: data.kpis.activeMissions > 8 ? 'down' : 'up',
    },
    {
      label: 'Formulaires à remplir',
      value: data.kpis.pendingForms,
      hint: 'Suivi alternance',
      trend: null,
    },
    {
      label: 'Badges obtenus',
      value: data.kpis.badgesAwarded,
      hint: 'Depuis janvier',
      trend: 'up',
    },
  ];

  return (
    <DashboardShellWrapper
      title="Espace tuteur"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Tuteur' },
      ]}
      firstName={session?.fullName ?? null}
      email={session?.email ?? null}
    >
      <TasksBanner roleFilter="tutor" todoHref="/dashboard/tuteur/todo" />
      
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f172a]/80 via-[#111827]/75 to-[#020617]/90 px-7 py-10 shadow-[0_40px_120px_rgba(59,130,246,0.15)] lg:px-12 lg:py-16">
        <div className="pointer-events-none absolute -left-32 top-[-140px] h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.45),_transparent_60%)] blur-3xl" />
        <div className="pointer-events-none absolute right-[-120px] bottom-[-160px] h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,_rgba(236,72,153,0.35),_transparent_65%)] blur-3xl" />
        <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end">
          <div className="space-y-5">
            <Badge className="rounded-full border border-white/25 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/80">
              Suivi alternance
            </Badge>
            <h1 className="text-3xl font-semibold leading-tight text-white md:text-[36px]">
              Accompagnez vos alternants et validez leurs missions en un clin d’œil.
            </h1>
            <p className="text-sm text-white/70">
              Retrouvez les objectifs du référentiel, les résultats obtenus sur la plateforme et les formulaires de suivi à compléter pour assurer une montée en compétences continue.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_16px_50px_rgba(0,114,255,0.35)]">
                Consulter les formulaires
              </Button>
              <Button
                variant="ghost"
                className="rounded-full border border-white/25 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 hover:bg-white/10"
              >
                Télécharger le référentiel
              </Button>
            </div>
          </div>
          <Card className="border-white/15 bg-white/5 text-white">
            <CardHeader>
              <CardTitle className="text-base font-semibold uppercase tracking-[0.2em] text-white/70">
                À surveiller
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-white/70">
              <p>
                • {data.followups.filter((f) => f.status !== 'completed').length} formulaires de suivi attendus cette semaine.
              </p>
              <p>
                • {data.missions.filter((m) => m.status !== 'done').length} missions doivent être validées.
              </p>
              <p>• Pensez à planifier un point mensuel pour Maxime (mission en retard).</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <KPIGrid kpis={kpis} />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Mes alternants</h2>
          <Button variant="ghost" className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 hover:bg-white/10">
            Voir tous
          </Button>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data.learners.map((learner) => (
            <Card key={learner.id} className="border-white/10 bg-white/5 text-white">
              <CardContent className="flex flex-col gap-4 p-5">
                <div className="flex items-center gap-3">
                  <Image
                    src={learner.avatar}
                    alt={learner.name}
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-2xl object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">{learner.name}</p>
                    <p className="text-xs text-white/60">{learner.role} • {learner.company}</p>
                    <p className="text-xs text-white/50">Dernière activité : {learner.lastActivity}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>Progression</span>
                    <span>{learner.progression}%</span>
                  </div>
                  <Progress value={learner.progression} className="h-2" />
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-white/60">
                  <p className="font-semibold text-white/80">Prochaine mission</p>
                  <p>{learner.nextMission ?? 'À planifier'}</p>
                </div>
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>Dernier score</span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-white/80">
                    {learner.latestScore ?? '--'}
                    {learner.lastScoreLabel ? ` • ${learner.lastScoreLabel}` : ''}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Button className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-white">
                    Ouvrir le suivi
                  </Button>
                  <Button
                    variant="ghost"
                    className="rounded-full border border-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 hover:bg-white/10"
                  >
                    Planifier un échange
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="text-base font-semibold uppercase tracking-[0.25em] text-white/70">
              Missions tutorales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.missions.map((mission) => (
              <div
                key={mission.id}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/70"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-white font-semibold">{mission.title}</p>
                    <p className="text-xs text-white/50">{mission.learnerName} • {mission.domain}</p>
                  </div>
                  <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em]', missionStatusTone(mission.status))}>
                    {mission.status === 'todo' && 'À faire'}
                    {mission.status === 'in_progress' && 'En cours'}
                    {mission.status === 'done' && 'Validée'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-white/60">{mission.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/50">
                  <span>Échéance : {new Date(mission.dueDate).toLocaleDateString('fr-FR')}</span>
                  <Button
                    variant="ghost"
                    className="rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-white/70 hover:bg-white/10"
                  >
                    Ajouter un commentaire
                  </Button>
                  <Button
                    variant="ghost"
                    className="rounded-full border border-emerald-500/40 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-emerald-200 hover:bg-emerald-500/10"
                  >
                    Valider la mission
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="text-base font-semibold uppercase tracking-[0.25em] text-white/70">
              Formulaires de suivi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.followups.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-sm text-white/70"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">{item.formTitle}</p>
                    <p className="text-xs text-white/50">{item.learnerName}</p>
                  </div>
                  <Badge
                    className={cn(
                      'rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.3em]',
                      item.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-200'
                        : item.status === 'overdue'
                        ? 'bg-red-500/20 text-red-200'
                        : 'bg-white/10 text-white/70',
                    )}
                  >
                    {item.status === 'completed' ? 'Envoyé' : item.status === 'overdue' ? 'En retard' : 'À remplir'}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-white/60">
                  <span>À remettre avant le {new Date(item.dueDate).toLocaleDateString('fr-FR')}</span>
                  <Button
                    className="rounded-full bg-gradient-to-r from-[#FF512F] to-[#DD2476] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white"
                  >
                    Remplir maintenant
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </DashboardShellWrapper>
  );
}
