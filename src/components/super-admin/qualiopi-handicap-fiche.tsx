"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Accessibility, ArrowLeft, ChevronRight, ExternalLink, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  QUALIOPI_CARD,
  QUALIOPI_CARD_INNER,
  QUALIOPI_KICKER,
  QUALIOPI_MUTED,
  QUALIOPI_PAGE_BG,
} from "@/components/super-admin/qualiopi/qualiopi-audit-styles";
import { handicapSourceHref, handicapSourceLabel } from "@/lib/handicap/labels";
import { cn } from "@/lib/utils";

type Profile = {
  id: string;
  scope: string;
  source_kind: string;
  source_id: string;
  organization_id: string | null;
  organization_name: string | null;
  person_name: string;
  person_email: string | null;
  rqth: boolean;
  needs_summary: string | null;
  specific_needs?: string | null;
  accompaniment_plan?: string | null;
  updated_at: string;
};

export function QualiopiHandicapFiche({ profileId }: { profileId: string }) {
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/super-admin/crm/qualiopi/handicap?id=${profileId}`);
        const json = (await res.json()) as {
          profile?: Profile;
          error?: string;
          locked?: boolean;
        };
        if (res.status === 403 || json.locked) {
          setLocked(true);
          return;
        }
        if (!res.ok) throw new Error(json.error || "Fiche indisponible");
        setProfile(json.profile ?? null);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erreur");
      } finally {
        setLoading(false);
      }
    })();
  }, [profileId]);

  if (locked) {
    return (
      <div className={cn(QUALIOPI_PAGE_BG, "px-6 py-10")}>
        <div className={cn(QUALIOPI_CARD, "mx-auto max-w-xl p-10 text-center")}>
          <Lock className="mx-auto h-10 w-10 text-white/40" />
          <h1 className="mt-4 text-2xl font-semibold">Accès restreint</h1>
          <p className={cn(QUALIOPI_MUTED, "mt-2 text-sm")}>Réservé à la référente handicap.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cn(QUALIOPI_PAGE_BG, "px-6 py-10")}>
        <p className={QUALIOPI_MUTED}>Chargement de la fiche…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={cn(QUALIOPI_PAGE_BG, "px-6 py-10")}>
        <p className={QUALIOPI_MUTED}>Profil introuvable.</p>
        <Link href="/super/crm/qualiopi/handicap" className="mt-4 inline-block text-[#6BE3C0]">
          ← Retour Handicap
        </Link>
      </div>
    );
  }

  const sourceHref = handicapSourceHref(
    profile.source_kind,
    profile.source_id,
    profile.organization_id,
  );
  const initials = profile.person_name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className={cn(QUALIOPI_PAGE_BG, "px-6 py-8")}>
      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          href={`/super/crm/qualiopi/handicap?scope=${profile.scope}`}
          className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Handicap · {profile.scope === "school" ? "School" : "Business"}
        </Link>

        <header className={cn(QUALIOPI_CARD, "p-6")}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#6BE3C0]/30 to-[#6C5CF5]/40 text-xl font-extrabold text-white">
                {initials || "?"}
              </div>
              <div className="min-w-0">
                <p className={QUALIOPI_KICKER}>Fiche Handicap</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">
                  {profile.person_name}
                </h1>
                <p className={cn(QUALIOPI_MUTED, "mt-1 text-sm")}>
                  {profile.person_email || "—"}
                  {" · "}
                  {handicapSourceLabel(profile.source_kind)}
                  {profile.organization_name ? ` · ${profile.organization_name}` : ""}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.rqth ? (
                    <span className="rounded-full bg-[#6BE3C0]/15 px-3 py-1 text-xs font-bold text-[#6BE3C0]">
                      RQTH
                    </span>
                  ) : null}
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white/70">
                    {profile.scope === "school" ? "Byound School" : "Byound Business"}
                  </span>
                </div>
              </div>
            </div>

            <Button asChild className="bg-[#6C5CF5] text-white hover:bg-[#5B4DE0]">
              <Link href={`/super/crm/qualiopi/handicap/${profile.id}/gestion`}>
                <Accessibility className="mr-2 h-4 w-4" />
                Gestion handicap
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <div className={cn(QUALIOPI_CARD, "p-5")}>
            <p className={QUALIOPI_KICKER}>Synthèse</p>
            <p className="mt-3 text-sm text-white/80">
              {profile.needs_summary || profile.specific_needs || "Aucun besoin renseigné pour le moment."}
            </p>
          </div>
          <div className={cn(QUALIOPI_CARD, "p-5")}>
            <p className={QUALIOPI_KICKER}>Plan d&apos;accompagnement</p>
            <p className="mt-3 text-sm text-white/80">
              {profile.accompaniment_plan?.trim()
                ? profile.accompaniment_plan
                : "À renseigner dans Gestion handicap."}
            </p>
          </div>
        </section>

        <section className={cn(QUALIOPI_CARD, "p-5")}>
          <p className={QUALIOPI_KICKER}>Liens</p>
          <ul className="mt-3 space-y-2">
            <li>
              <Link
                href={`/super/crm/qualiopi/handicap/${profile.id}/gestion`}
                className={cn(
                  QUALIOPI_CARD_INNER,
                  "flex items-center justify-between px-4 py-3 text-sm font-semibold text-white hover:bg-white/[0.06]",
                )}
              >
                Ouvrir la gestion handicap
                <ChevronRight className="h-4 w-4 text-white/50" />
              </Link>
            </li>
            {sourceHref ? (
              <li>
                <Link
                  href={sourceHref}
                  className={cn(
                    QUALIOPI_CARD_INNER,
                    "flex items-center justify-between px-4 py-3 text-sm font-semibold text-white hover:bg-white/[0.06]",
                  )}
                >
                  Voir la fiche source Super
                  <ExternalLink className="h-4 w-4 text-white/50" />
                </Link>
              </li>
            ) : null}
          </ul>
        </section>
      </div>
    </div>
  );
}
