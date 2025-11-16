import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getTutorDashboardData } from '@/lib/queries/tuteur';

const followupStatusTone: Record<string, string> = {
  completed: 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40',
  overdue: 'bg-red-500/20 text-red-200 border border-red-500/40',
  pending: 'bg-white/10 text-white/70 border border-white/15',
};

export default async function TutorFormsPage() {
  const data = await getTutorDashboardData();

  return (
    <DashboardShell
      title="Formulaires tuteur"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Tuteur', href: '/dashboard/tuteur' },
        { label: 'Formulaires' },
      ]}
    >
      <section className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-8 py-6 text-white">
          <h1 className="text-2xl font-semibold">Suivi alternance</h1>
          <p className="mt-3 text-sm text-white/70">
            Retrouvez l’ensemble des questionnaires à compléter pour documenter la progression de vos alternants. Les formulaires complétés sont archivés et accessibles à votre formateur.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/20">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 text-sm uppercase tracking-[0.25em] text-white/60">
            <span>Formulaire</span>
            <span className="hidden md:block">Alternant</span>
            <span className="hidden md:block">Date limite</span>
            <span>Statut</span>
          </div>
          <div className="divide-y divide-white/5">
            {data.followups.map((item) => {
              const dueDate = format(new Date(item.dueDate), "dd MMM yyyy", { locale: fr });
              return (
                <Link
                  key={item.id}
                  href={`/dashboard/tuteur/formulaires/${item.id}`}
                  className="flex flex-col gap-4 px-6 py-5 text-white transition hover:bg-white/5 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{item.formTitle}</p>
                    <p className="mt-1 text-xs text-white/60 md:hidden">{item.learnerName}</p>
                  </div>
                  <p className="hidden text-xs text-white/60 md:block">{item.learnerName}</p>
                  <p className="hidden text-xs text-white/60 md:block">{dueDate}</p>
                  <div className="flex items-center gap-3">
                    <Badge className={cn('rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.3em]', followupStatusTone[item.status] ?? followupStatusTone.pending)}>
                      {item.status === 'completed' ? 'Envoyé' : item.status === 'overdue' ? 'En retard' : 'À remplir'}
                    </Badge>
                    <Button
                      variant="ghost"
                      className="hidden rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-white/70 hover:bg-white/10 md:inline-flex"
                    >
                      Ouvrir
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    className="mt-1 inline-flex rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-white/70 hover:bg-white/10 md:hidden"
                  >
                    Voir le formulaire
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
