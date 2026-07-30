"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, MapPin, Wallet } from "lucide-react";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";

type OfferDetail = {
  id: string;
  title: string | null;
  description: string | null;
  requirements: string | null;
  city: string | null;
  salary_range: string | null;
  contract_type: string | null;
  status: string | null;
  created_at?: string | null;
};

type ApplicationItem = {
  id: string;
  created_at?: string | null;
  match_score?: number | null;
  profiles?: Array<{
    id?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  }> | null;
};

function parseLines(text: string | null | undefined) {
  return String(text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function formatCompensation(offer: OfferDetail) {
  if (!offer.salary_range) return "Non précisée";
  const base = offer.salary_range.includes("€") ? offer.salary_range : `${offer.salary_range} €`;
  return (offer.contract_type || "").toLowerCase().includes("freelance") ? `${base} / jour` : `${base} / an`;
}

function formatDate(value?: string | null) {
  if (!value) return "Date inconnue";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Date inconnue";
  return parsed.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function candidateName(application: ApplicationItem) {
  const profile = application.profiles?.[0];
  const full = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
  return full || "Candidat";
}

export default function EntrepriseOfferDetailPage() {
  const params = useParams<{ id: string }>();
  const [offer, setOffer] = useState<OfferDetail | null>(null);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOffer = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/dashboard/entreprise/job-offers/${params.id}`, {
          credentials: "include",
        });
        const payload = (await response.json()) as {
          offer?: OfferDetail;
          applications?: ApplicationItem[];
          error?: string;
        };
        if (!response.ok || !payload.offer) {
          throw new Error(payload.error || "Impossible de charger l'offre");
        }
        setOffer(payload.offer);
        setApplications(Array.isArray(payload.applications) ? payload.applications : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger l'offre");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      void loadOffer();
    }
  }, [params.id]);

  const missionLines = useMemo(() => parseLines(offer?.description), [offer?.description]);
  const requirementLines = useMemo(() => parseLines(offer?.requirements), [offer?.requirements]);

  return (
    <div className="flex min-h-screen bg-[#fcfcfd] text-gray-900">
      <EnterpriseSidebar />
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:pl-[280px]">
        <div className="mx-auto max-w-6xl space-y-6">
          <Link
            href="/dashboard/entreprise/offres"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à mes offres
          </Link>

          {loading ? (
            <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">Chargement de l&apos;offre...</p>
            </div>
          ) : error ? (
            <div className="rounded-[28px] border border-red-100 bg-red-50 p-6 shadow-sm">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ) : !offer ? (
            <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">Offre introuvable.</p>
            </div>
          ) : (
            <>
              <section className="rounded-[32px] border border-gray-100 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
                        {offer.title || "Offre sans titre"}
                      </h1>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          offer.status === "closed"
                            ? "border border-amber-200 bg-amber-50 text-amber-700"
                            : "border border-emerald-200 bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {offer.status === "closed" ? "Clôturée" : "Active"}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                      <span className="inline-flex items-center gap-2">
                        <BriefcaseBusiness className="h-4 w-4" />
                        {offer.contract_type || "Contrat non précisé"}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {offer.city || "Ville non précisée"}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        {formatCompensation(offer)}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-[24px] bg-violet-50 px-5 py-4 text-center">
                    <p className="text-xs uppercase tracking-[0.18em] text-violet-500">Candidatures</p>
                    <p className="mt-1 text-3xl font-semibold text-violet-700">{applications.length}</p>
                  </div>
                </div>
              </section>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-6">
                  <section className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900">Description du poste</h2>
                    {missionLines.length > 0 ? (
                      <div className="mt-4 space-y-3 text-sm leading-6 text-gray-600">
                        {missionLines.map((line) => (
                          <p key={line}>{line}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-gray-500">Aucune description renseignée.</p>
                    )}
                  </section>

                  <section className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900">Profil recherché</h2>
                    {requirementLines.length > 0 ? (
                      <ul className="mt-4 space-y-3 text-sm leading-6 text-gray-600">
                        {requirementLines.map((line) => (
                          <li key={line} className="rounded-2xl bg-slate-50 px-4 py-3">
                            {line}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-4 text-sm text-gray-500">Aucun profil recherché renseigné.</p>
                    )}
                  </section>
                </div>

                <aside className="space-y-6">
                  <section className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Résumé
                    </h2>
                    <div className="mt-4 space-y-4 text-sm text-gray-600">
                      <div className="flex items-center justify-between gap-3">
                        <span>Type de contrat</span>
                        <span className="font-medium text-gray-900">{offer.contract_type || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Ville</span>
                        <span className="font-medium text-gray-900">{offer.city || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Rémunération</span>
                        <span className="font-medium text-gray-900">{formatCompensation(offer)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Publication</span>
                        <span className="font-medium text-gray-900">{formatDate(offer.created_at)}</span>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Candidatures
                    </h2>
                    {applications.length === 0 ? (
                      <p className="mt-4 text-sm text-gray-500">
                        Aucune candidature pour le moment sur cette offre.
                      </p>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {applications.map((application) => (
                          <div key={application.id} className="rounded-2xl border border-gray-100 bg-slate-50 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-medium text-gray-900">{candidateName(application)}</p>
                                <p className="mt-1 text-xs text-gray-500">{formatDate(application.created_at)}</p>
                              </div>
                              <span className="rounded-full border border-violet-200 bg-white px-2.5 py-1 text-xs font-semibold text-violet-700">
                                {application.match_score ?? "—"}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </aside>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
