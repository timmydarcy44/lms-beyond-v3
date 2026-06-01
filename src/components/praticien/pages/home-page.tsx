"use client";

import Link from "next/link";
import { AlertCircle, Calendar, CreditCard, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePraticien } from "@/components/praticien/praticien-context";
import { Card, KpiCard, PageWrap } from "@/components/praticien/praticien-ui";
import { ProfilBeyondModal } from "@/components/praticien/profil-beyond-modal";
import {
  collabFirstName,
  formatDateFr,
  formatTime,
  nextFridayLabel,
  startStripeOnboarding,
  todayIso,
  weekRange,
} from "@/lib/marketplace/praticien-utils";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export function PraticienHomePage() {
  const { praticien, stats, prochainesSessions, creneaux } = usePraticien();
  const [beyondSession, setBeyondSession] = useState<string | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const today = todayIso();
  const { from: weekFrom, to: weekTo } = weekRange();

  const todaySessions = useMemo(
    () => prochainesSessions.filter((s) => s.date_session === today),
    [prochainesSessions, today],
  );

  const weekSessions = useMemo(
    () =>
      prochainesSessions.filter((s) => s.date_session >= weekFrom && s.date_session <= weekTo),
    [prochainesSessions, weekFrom, weekTo],
  );

  const nextToday = todaySessions[0];
  const slotsThisWeek = creneaux.filter((c) => c.date >= weekFrom && c.date <= weekTo && c.disponible).length;
  const profileIncomplete =
    !praticien?.biographie?.trim() || !praticien?.titre?.trim() || !(praticien?.specialites?.length ?? 0);

  const handleStripe = async () => {
    setStripeLoading(true);
    try {
      await startStripeOnboarding();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur Stripe");
      setStripeLoading(false);
    }
  };

  return (
    <PageWrap title="Tableau de bord" subtitle="Vue d'ensemble de votre activité">
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Aujourd&apos;hui</h2>
        <Card className="mt-3">
          {nextToday ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-semibold">{formatTime(nextToday.heure_debut)}</p>
                <p className="text-slate-300">{collabFirstName(nextToday.profiles)}</p>
                {nextToday.consentement_donnees ? (
                  <span className="mt-2 inline-block rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-200">
                    Profil Beyond partagé
                  </span>
                ) : (
                  <span className="mt-2 inline-block rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-400">
                    Profil non partagé
                  </span>
                )}
              </div>
              {nextToday.consentement_donnees && (
                <Button type="button" size="sm" variant="outline" onClick={() => setBeyondSession(nextToday.id)}>
                  Voir profil Beyond
                </Button>
              )}
            </div>
          ) : (
            <p className="text-slate-400">Aucun rendez-vous aujourd&apos;hui</p>
          )}
        </Card>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <KpiCard label="Rendez-vous ce mois" value={stats?.sessionsMois ?? 0} />
        <KpiCard label="CA ce mois (net 85 %)" value={stats?.revenusMois ?? "0 €"} />
        <KpiCard label="Prochain reversement Stripe" value={nextFridayLabel()} />
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Cette semaine</h2>
        <ul className="mt-3 space-y-2">
          {weekSessions.map((s) => (
            <li key={s.id}>
              <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">
                    {formatDateFr(s.date_session)} · {formatTime(s.heure_debut)}
                  </p>
                  <p className="text-sm text-slate-400">
                    {collabFirstName(s.profiles)} · {s.duree_minutes ?? praticien?.duree_session ?? 60} min
                  </p>
                </div>
                {s.consentement_donnees && (
                  <Button type="button" size="sm" variant="outline" onClick={() => setBeyondSession(s.id)}>
                    Voir profil Beyond
                  </Button>
                )}
              </Card>
            </li>
          ))}
          {weekSessions.length === 0 && (
            <p className="text-sm text-slate-500">Aucun rendez-vous cette semaine.</p>
          )}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          <AlertCircle className="h-4 w-4" />
          Alertes
        </h2>
        <ul className="mt-3 space-y-2">
          {!praticien?.stripe_onboarding_complete && (
            <li>
              <Card className="flex flex-col gap-3 border-amber-500/30 bg-amber-500/10 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-amber-100">Stripe Connect non configuré — activez les paiements.</p>
                <Button type="button" size="sm" disabled={stripeLoading} onClick={() => void handleStripe()}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  {stripeLoading ? "Redirection…" : "Configurer"}
                </Button>
              </Card>
            </li>
          )}
          {slotsThisWeek === 0 && (
            <li>
              <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-300">Aucun créneau disponible cette semaine.</p>
                <Button type="button" size="sm" asChild>
                  <Link href="/dashboard/praticien/agenda">
                    <Calendar className="mr-2 h-4 w-4" />
                    Ajouter des disponibilités
                  </Link>
                </Button>
              </Card>
            </li>
          )}
          {profileIncomplete && (
            <li>
              <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-300">Votre profil public est incomplet.</p>
                <Button type="button" size="sm" asChild>
                  <Link href="/dashboard/praticien/profil">
                    <User className="mr-2 h-4 w-4" />
                    Compléter le profil
                  </Link>
                </Button>
              </Card>
            </li>
          )}
        </ul>
      </section>

      <ProfilBeyondModal sessionId={beyondSession} onClose={() => setBeyondSession(null)} />
    </PageWrap>
  );
}
