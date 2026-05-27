"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Lock } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  APPRENANT_CARD_BODY,
  APPRENANT_CARD_KICKER,
  APPRENANT_CARD_TITLE,
  APPRENANT_PAGE_KICKER,
  APPRENANT_PAGE_LEAD,
  APPRENANT_PAGE_SHELL,
  APPRENANT_PAGE_TITLE,
} from "@/lib/apprenant/connect-nav";

type JobOffer = {
  id: string;
  title?: string | null;
  city?: string | null;
  contract_type?: string | null;
  salary_range?: string | null;
  description?: string | null;
  company_name?: string | null;
  company_hidden_from_learner?: boolean | null;
};

export default function ApprenantMatchingPage() {
  const supabase = createSupabaseBrowserClient();
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [hasOrganisation, setHasOrganisation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user?.id) {
        setIsLoading(false);
        return;
      }

      const userId = userData.user.id;
      const userEmail = userData.user.email ?? "";

      try {
        let { data: profileData } = await supabase
          .from("profiles")
          .select("entreprise_id, school_id")
          .eq("id", userId)
          .maybeSingle();

        if (!profileData && userEmail) {
          const { data: legacyProfileData } = await supabase
            .from("profiles")
            .select("entreprise_id, school_id")
            .eq("email", userEmail)
            .maybeSingle();
          profileData = legacyProfileData ?? null;
        }

        setHasOrganisation(Boolean(profileData?.entreprise_id || profileData?.school_id));
      } catch {
        setHasOrganisation(false);
      }

      try {
        const { data: offersData } = await supabase
          .from("job_offers")
          .select(
            "id, title, city, contract_type, salary_range, description, company_name, company_hidden_from_learner"
          )
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(12);

        setOffers(offersData ?? []);
      } catch {
        setOffers([]);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [supabase]);

  return (
    <div className={APPRENANT_PAGE_SHELL}>
      <section className="space-y-2">
        <p className={APPRENANT_PAGE_KICKER}>Opportunités</p>
        <h1 className={APPRENANT_PAGE_TITLE}>Mes matchings</h1>
        <p className={APPRENANT_PAGE_LEAD}>
          Détail réservé aux profils reliés à un centre ou à un accès Beyond Connect étendu. Tu vois ici les
          offres disponibles en aperçu.
        </p>
      </section>

      {!hasOrganisation ? (
        <div className={`${APPRENANT_CARD_BODY} flex-row flex-wrap items-start gap-3 text-sm text-white/55`}>
          <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-edge-red" aria-hidden />
          <p>
            Associe ton compte à une organisation (école ou entreprise) depuis ton espace pour activer les
            volets avancés côté équipe formation.
          </p>
        </div>
      ) : null}

      <section className="relative">
        <div className="pointer-events-none select-none blur-[5px] opacity-70">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={`matching-skeleton-${index}`} className={`${APPRENANT_CARD_BODY} h-44 animate-pulse`} />
              ))}
            </div>
          ) : offers.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {offers.map((offer) => (
                <article key={offer.id} className={APPRENANT_CARD_BODY}>
                  <p className={APPRENANT_CARD_KICKER}>Offre</p>
                  <div className={APPRENANT_CARD_TITLE}>
                    {offer.title || "Offre en recrutement"}
                  </div>
                  {!offer.company_hidden_from_learner && offer.company_name?.trim() ? (
                    <div className="mt-1 text-xs font-medium text-sky-200/80">{offer.company_name.trim()}</div>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/45">
                    <span className="rounded-full border border-white/[0.12] px-2.5 py-1">
                      {offer.contract_type || "Contrat"}
                    </span>
                    <span>{offer.city || "Localisation"}</span>
                  </div>
                  <div className="mt-3 text-xs text-white/40">{offer.salary_range || "Salaire selon profil"}</div>
                  <p className="mt-4 line-clamp-3 text-sm text-white/55">
                    {offer.description || "Description non disponible."}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className={`${APPRENANT_CARD_BODY} text-center text-sm text-white/45`}>
              Aucune offre active pour le moment.
            </div>
          )}
        </div>

        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div
            className={`${APPRENANT_CARD_BODY} mx-auto w-full max-w-3xl text-center`}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-edge-red/25 bg-edge-red/10">
              <Lock className="h-6 w-6 text-edge-red" />
            </div>
            <h2 className={`${APPRENANT_CARD_TITLE} md:text-xl`}>Débloquez vos matchings complets</h2>
            <p className="mt-3 text-sm text-[#9aa8c9] md:text-base">
              En alternance via une école ? Demande à ton centre l’activation. Particulier ? La fonctionnalité
              sera bientôt disponible.
            </p>
            <div className="mt-6 flex flex-col gap-3 md:flex-row md:justify-center">
              <Link
                href="/dashboard/apprenant/entreprise"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-transparent px-5 py-2.5 text-sm font-semibold text-white transition hover:border-edge-red/40 hover:bg-edge-red/[0.06]"
              >
                Je passe par mon centre
              </Link>
              <span className="inline-flex items-center justify-center rounded-full border border-amber-500/35 bg-amber-500/10 px-5 py-2.5 text-sm font-semibold text-amber-100">
                Particuliers : bientôt disponible
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
