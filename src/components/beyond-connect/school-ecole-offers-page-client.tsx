"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SchoolEcoleOfferCreateModal } from "@/components/beyond-connect/school-ecole-offer-create-modal";

export type EcoleJobRow = {
  id: string;
  title: string | null;
  city: string | null;
  salary: string | null;
  description: string | null;
  status: string | null;
  contract_type: string | null;
  created_at: string | null;
};

type Props = {
  schoolId: string | null;
  initialOffers: EcoleJobRow[];
};

function OffersInner({ schoolId, initialOffers }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setModalOpen(true);
      const path = window.location.pathname;
      const sp = new URLSearchParams(searchParams.toString());
      sp.delete("create");
      const q = sp.toString();
      window.history.replaceState({}, "", q ? `${path}?${q}` : path);
    }
  }, [searchParams]);

  const defaultCompany = searchParams.get("company") ? decodeURIComponent(searchParams.get("company")!) : "";

  return (
    <>
      <header className="flex flex-col gap-4 rounded-2xl border border-[#E5E5EA] bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Offres</h1>
          <p className="mt-2 text-sm text-[#86868B]">
            Offres de votre établissement. Même formulaire que les autres entrées « créer une offre » (import texte /
            PDF + IA optionnelle, entreprise, soft skills).
          </p>
        </div>
        <button
          type="button"
          disabled={!schoolId}
          onClick={() => setModalOpen(true)}
          className="shrink-0 rounded-full bg-[#1D1D1F] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          Ajouter une offre
        </button>
      </header>

      {!schoolId ? (
        <p className="rounded-2xl border border-[#E5E5EA] bg-white p-6 text-sm text-[#86868B]">
          Aucun établissement associé à votre compte : les offres ne peuvent pas être listées.
        </p>
      ) : initialOffers.length === 0 ? (
        <p className="rounded-2xl border border-[#E5E5EA] bg-white p-6 text-sm text-[#86868B]">
          Aucune offre enregistrée pour le moment. Utilisez « Ajouter une offre ».
        </p>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {initialOffers.map((offer) => (
            <Link
              key={offer.id}
              href={`/dashboard/ecole/offres/${offer.id}`}
              className="rounded-2xl border border-[#E5E5EA] bg-white p-5 text-left shadow-sm transition hover:border-[#007AFF]/40 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-base font-semibold text-[#1D1D1F]">{offer.title?.trim() || "Offre"}</p>
                  <p className="mt-1 text-xs text-[#86868B]">{offer.city?.trim() || "—"}</p>
                </div>
                {offer.status ? (
                  <span className="shrink-0 rounded-full bg-[#F5F5F7] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#86868B]">
                    {offer.status}
                  </span>
                ) : null}
              </div>
              {offer.description ? (
                <p className="mt-3 line-clamp-3 text-sm text-[#1D1D1F]/80">{offer.description}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#86868B]">
                {offer.contract_type ? (
                  <span className="rounded-full border border-[#E5E5EA] px-3 py-1">{offer.contract_type}</span>
                ) : null}
                {offer.salary ? (
                  <span className="rounded-full border border-[#E5E5EA] px-3 py-1">{offer.salary}</span>
                ) : null}
              </div>
              <p className="mt-4 text-xs font-semibold text-[#0071E3]">Voir la fiche →</p>
            </Link>
          ))}
        </section>
      )}

      <SchoolEcoleOfferCreateModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        schoolId={schoolId}
        defaultCompanyName={defaultCompany}
        onCreated={() => router.refresh()}
      />
    </>
  );
}

export function SchoolEcoleOffersPageClient(props: Props) {
  return (
    <Suspense fallback={<div className="text-sm text-[#86868B]">Chargement…</div>}>
      <OffersInner {...props} />
    </Suspense>
  );
}
