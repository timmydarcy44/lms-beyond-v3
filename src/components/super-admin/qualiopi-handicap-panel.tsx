"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Accessibility, Lock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { QualiopiHandicapPartners } from "@/components/super-admin/qualiopi-handicap-partners";
import {
  QUALIOPI_CARD,
  QUALIOPI_CARD_INNER,
  QUALIOPI_KICKER,
  QUALIOPI_MUTED,
  QUALIOPI_PAGE_BG,
} from "@/components/super-admin/qualiopi/qualiopi-audit-styles";
import { HANDICAP_PARTNERS_META } from "@/lib/handicap/partners-directory";
import { handicapSourceLabel } from "@/lib/handicap/labels";
import { cn } from "@/lib/utils";

type MainTab = "business" | "school" | "annuaire";
type ScopeTab = "business" | "school";

type HandicapCard = {
  id: string;
  scope: ScopeTab;
  source_kind: string;
  source_id: string;
  person_name: string;
  person_email: string | null;
  organization_name: string | null;
  needs_summary: string | null;
  updated_at: string;
};

export function QualiopiHandicapPanel() {
  const router = useRouter();
  const [tab, setTab] = useState<MainTab>("business");
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<HandicapCard[]>([]);

  const loadList = useCallback(async (scope: ScopeTab) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/super-admin/crm/qualiopi/handicap?scope=${scope}`);
      const json = (await res.json()) as {
        locked?: boolean;
        profiles?: HandicapCard[];
        error?: string;
      };
      if (!res.ok) throw new Error(json.error || "Chargement impossible");
      setLocked(Boolean(json.locked));
      setProfiles(json.profiles ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "annuaire") {
      void (async () => {
        setLoading(true);
        try {
          const res = await fetch("/api/super-admin/crm/qualiopi/handicap?scope=business");
          const json = (await res.json()) as { locked?: boolean; error?: string };
          if (!res.ok) throw new Error(json.error || "Chargement impossible");
          setLocked(Boolean(json.locked));
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Erreur");
        } finally {
          setLoading(false);
        }
      })();
      return;
    }
    void loadList(tab);
  }, [tab, loadList]);

  const filteredEmpty = !loading && profiles.length === 0;
  const headerCount = useMemo(() => profiles.length, [profiles.length]);

  if (locked) {
    return (
      <div className={cn(QUALIOPI_PAGE_BG, "px-6 py-10")}>
        <div className={cn(QUALIOPI_CARD, "mx-auto max-w-xl p-10 text-center")}>
          <Lock className="mx-auto h-10 w-10 text-white/40" />
          <p className={cn(QUALIOPI_KICKER, "mt-4")}>Espace sécurisé</p>
          <h1 className="mt-2 text-2xl font-semibold">Handicap — accès restreint</h1>
          <p className={cn(QUALIOPI_MUTED, "mt-3 text-sm")}>
            Réservé à la référente handicap désignée dans les paramètres OF. Aucune donnée sensible
            n’est affichée ici.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(QUALIOPI_PAGE_BG, "px-6 py-8")}>
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className={QUALIOPI_KICKER}>Qualiopi · Confidentiel</p>
            <h1 className="mt-1 flex items-center gap-2 text-3xl font-semibold tracking-tight">
              <Accessibility className="h-8 w-8 text-[#6BE3C0]" />
              Handicap
            </h1>
            <p className={cn(QUALIOPI_MUTED, "mt-2 max-w-xl text-sm")}>
              Cartes RQTH — cliquez une carte pour ouvrir la fiche, puis Gestion handicap.
            </p>
          </div>
          <div className="flex gap-2">
            {tab !== "annuaire" ? (
              <Button
                type="button"
                variant="outline"
                className="border-white/15 bg-transparent text-white/80"
                onClick={() => void loadList(tab)}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualiser
              </Button>
            ) : null}
            {tab === "school" ? (
              <Button
                type="button"
                className="bg-[#6C5CF5] text-white hover:bg-[#5B4DE0]"
                onClick={async () => {
                  const res = await fetch("/api/super-admin/crm/qualiopi/handicap?backfill=1");
                  const json = (await res.json()) as { backfilled?: number; error?: string };
                  if (!res.ok) {
                    toast.error(json.error ?? "Backfill impossible");
                    return;
                  }
                  toast.success(`${json.backfilled ?? 0} profil(s) School synchronisé(s)`);
                  await loadList("school");
                }}
              >
                Sync CFA
              </Button>
            ) : null}
          </div>
        </header>

        <div className="flex flex-wrap gap-2">
          {(
            [
              ["business", "Byound Business"],
              ["school", "Byound School"],
              ["annuaire", "Annuaire partenaires"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                tab === id
                  ? "bg-[#6BE3C0] text-[#0b0e18]"
                  : "border border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06]",
              )}
            >
              {label}
              {tab === id && id !== "annuaire" ? ` · ${headerCount}` : ""}
              {tab === id && id === "annuaire"
                ? ` · MAJ ${HANDICAP_PARTNERS_META.lastUpdatedLabel}`
                : ""}
            </button>
          ))}
        </div>

        {tab === "annuaire" ? (
          loading ? (
            <p className={cn(QUALIOPI_MUTED, "text-sm")}>Chargement…</p>
          ) : (
            <QualiopiHandicapPartners />
          )
        ) : (
          <section className={cn(QUALIOPI_CARD, "p-5")}>
            {loading ? (
              <p className={cn(QUALIOPI_MUTED, "text-sm")}>Chargement…</p>
            ) : filteredEmpty ? (
              <p className={cn(QUALIOPI_MUTED, "text-sm")}>
                Aucune RQTH active sur {tab === "business" ? "Business" : "School"} pour le moment.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {profiles.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => router.push(`/super/crm/qualiopi/handicap/${p.id}`)}
                      className={cn(
                        QUALIOPI_CARD_INNER,
                        "w-full p-4 text-left transition hover:bg-white/[0.06]",
                      )}
                    >
                      <p className="font-semibold text-white">{p.person_name}</p>
                      <p className={cn(QUALIOPI_MUTED, "mt-1 text-xs")}>
                        {handicapSourceLabel(p.source_kind)}
                        {p.organization_name ? ` · ${p.organization_name}` : ""}
                      </p>
                      {p.needs_summary ? (
                        <p className="mt-2 line-clamp-2 text-sm text-white/75">{p.needs_summary}</p>
                      ) : null}
                      <p className="mt-3 text-xs font-semibold text-[#6BE3C0]">Ouvrir la fiche →</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className={cn(QUALIOPI_MUTED, "mt-4 text-xs")}>
              Sur chaque fiche : CTA « Gestion handicap » (RQTH, documents, besoins, plan, rendez-vous).
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
