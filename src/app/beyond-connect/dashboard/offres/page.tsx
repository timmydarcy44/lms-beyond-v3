"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSupabase } from "@/components/providers/supabase-provider";
import { DashboardShell } from "@/components/beyond-connect/dashboard-shell";

type JobOffer = {
  id: string;
  title?: string | null;
  description?: string | null;
  city?: string | null;
  salary_range?: string | null;
  contract_type?: string | null;
};

export default function BeyondConnectOffersPage() {
  const supabase = useSupabase();
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (!supabase) return;
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user?.id) return;
        const { data, error } = await supabase
          .from("job_offers")
          .select("*")
          .eq("company_id", userData.user.id);
        if (error) return;
        setOffers(data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [supabase]);

  return (
    <DashboardShell breadcrumbs={["Dashboard", "Offres"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-black">Offres</h1>
          <p className="mt-2 text-sm text-black/60">Vos offres actives et sauvegardées.</p>
        </div>

        {loading && <p className="text-sm text-black/60">Chargement...</p>}
        {!loading && offers.length === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-black/60">
            Aucune offre disponible.
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {offers.map((offer) => (
            <Link
              key={offer.id}
              href={`/beyond-connect/dashboard/offres/${offer.id}`}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <h2 className="text-xl font-semibold">{offer.title || "Offre sans titre"}</h2>
                  <p className="mt-2 text-sm text-black/60">
                    {offer.city || "Ville non précisée"}{" "}
                    {offer.salary_range ? `· ${formatOfferCompensation(offer)}` : ""}
                  </p>
              <p className="mt-4 text-sm text-black/70 line-clamp-3">
                {offer.description || "Description non disponible."}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}

function formatOfferCompensation(offer: JobOffer) {
  if (!offer.salary_range) return "";
  const base = offer.salary_range.includes("€") ? offer.salary_range : `${offer.salary_range} €`;
  const contract = (offer.contract_type || "").toLowerCase();
  if (contract.includes("freelance")) {
    return `${base} / jour`;
  }
  return `${base} / an`;
}
