"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { TalentDashboardShell } from "@/components/beyond-connect/talent-dashboard-shell";

type Application = {
  id: string;
  job_id: string;
  status: string | null;
  created_at: string;
};

type JobOffer = {
  id: string;
  title?: string | null;
  city?: string | null;
  contract_type?: string | null;
  salary_range?: string | null;
};

export default function TalentMatchesPage() {
  const supabase = useSupabase();
  const [applications, setApplications] = useState<Application[]>([]);
  const [offersById, setOffersById] = useState<Record<string, JobOffer>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadApplications = async () => {
      if (!supabase) return;
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) return;
      const { data: apps } = await supabase
        .from("applications")
        .select("id, job_id, status, created_at")
        .eq("talent_id", userData.user.id)
        .order("created_at", { ascending: false });
      setApplications(apps || []);
      const jobIds = (apps || []).map((item) => item.job_id);
      if (jobIds.length) {
        const { data: offers } = await supabase
          .from("job_offers")
          .select("id, title, city, contract_type, salary_range")
          .in("id", jobIds);
        const map: Record<string, JobOffer> = {};
        (offers || []).forEach((offer) => {
          map[offer.id] = offer;
        });
        setOffersById(map);
      }
      setLoading(false);
    };
    loadApplications();
  }, [supabase]);

  return (
    <TalentDashboardShell>
      <div className="space-y-6 bg-slate-50 px-6 py-10">
        <h1 className="text-2xl font-semibold text-black">Mes candidatures</h1>
        {loading ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-500 shadow-sm">
            Chargement...
          </div>
        ) : applications.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-8 text-sm text-gray-500 shadow-sm">
            Aucune candidature pour le moment. Postulez depuis l'onglet Offres.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {applications.map((application) => {
              const offer = offersById[application.job_id];
              return (
                <div
                  key={application.id}
                  className="rounded-2xl border border-gray-50 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{offer?.title || "Offre sans titre"}</h2>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                      {application.status || "pending"}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-black/60">
                      {offer?.contract_type || "Contrat"}
                    </span>
                    <span className="text-sm text-black/50">{offer?.city || "Ville non precisee"}</span>
                  </div>
                  <p className="mt-2 text-sm text-black/60">{offer?.salary_range || "Remuneration non precisee"}</p>
                  <p className="mt-4 text-xs text-black/40">
                    Candidature envoyee le {new Date(application.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </TalentDashboardShell>
  );
}
