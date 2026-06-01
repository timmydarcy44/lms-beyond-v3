"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePraticien } from "@/components/praticien/praticien-context";
import { Card, PageWrap } from "@/components/praticien/praticien-ui";
import { ProfilBeyondModal } from "@/components/praticien/profil-beyond-modal";
import { collabFirstName, formatDateFr, formatTime, todayIso } from "@/lib/marketplace/praticien-utils";
import { formatEurosFromCents } from "@/lib/marketplace/commission";
import { cn } from "@/lib/utils";

export function PraticienRendezVousPage() {
  const { prochainesSessions, sessionsPassees, praticien } = usePraticien();
  const [tab, setTab] = useState<"avenir" | "passes">("avenir");
  const [beyondSession, setBeyondSession] = useState<string | null>(null);
  const today = todayIso();

  const upcoming = useMemo(
    () => [...prochainesSessions].sort((a, b) => `${a.date_session}${a.heure_debut}`.localeCompare(`${b.date_session}${b.heure_debut}`)),
    [prochainesSessions],
  );

  const past = useMemo(() => sessionsPassees, [sessionsPassees]);

  const list = tab === "avenir" ? upcoming : past;

  const markDone = () => {
    toast.info("La confirmation de fin de session sera disponible prochainement.");
  };

  return (
    <PageWrap title="Mes rendez-vous">
      <div className="mb-6 flex gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
        {(["avenir", "passes"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-medium transition",
              tab === t ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white",
            )}
          >
            {t === "avenir" ? "À venir" : "Passés"}
          </button>
        ))}
      </div>

      <ul className="space-y-3">
        {list.map((s) => {
          const isPast = s.date_session < today || tab === "passes";
          const net =
            "montantLabel" in s && s.montantLabel
              ? s.montantLabel
              : s.montant_praticien != null
                ? formatEurosFromCents(Number(s.montant_praticien))
                : "—";
          return (
            <li key={s.id}>
              <Card>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold">
                      {formatDateFr(s.date_session)} · {formatTime(s.heure_debut)}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {collabFirstName(s.profiles)} · {s.duree_minutes ?? praticien?.duree_session ?? 60} min
                    </p>
                    <p className="mt-1 text-sm">Net (85 %) : <span className="font-medium text-emerald-300">{net}</span></p>
                    <p className="mt-1 text-xs text-slate-500">
                      Statut : {s.status === "confirmee" ? "Confirmé" : s.status ?? (isPast ? "Terminé" : "Confirmé")}
                    </p>
                    {s.consentement_donnees && (
                      <span className="mt-2 inline-block rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-200">
                        Profil Beyond partagé
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {s.consentement_donnees && (
                      <Button type="button" size="sm" variant="outline" onClick={() => setBeyondSession(s.id)}>
                        Voir profil
                      </Button>
                    )}
                    {tab === "avenir" && (
                      <Button type="button" size="sm" variant="secondary" onClick={markDone}>
                        Marquer comme terminé
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
        {list.length === 0 && (
          <p className="text-center text-sm text-slate-500">
            {tab === "avenir" ? "Aucun rendez-vous à venir." : "Aucun rendez-vous passé."}
          </p>
        )}
      </ul>

      <ProfilBeyondModal sessionId={beyondSession} onClose={() => setBeyondSession(null)} />
    </PageWrap>
  );
}
