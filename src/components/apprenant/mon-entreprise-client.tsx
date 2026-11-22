"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Building2, CalendarDays, Loader2, Mail, MapPin, UserRound } from "lucide-react";

const C = {
  card: "#0F1428",
  border: "#1C2443",
  secondary: "#9AA3BD",
  tertiary: "#6C7593",
  violet: "#6E5BFF",
  blue: "#8DB8FF",
  green: "#6BE39B",
  turquoise: "#5EDCC3",
};

type Payload = {
  assigned: boolean;
  company: null | {
    id: string;
    name: string;
    city: string | null;
    address: string | null;
    siret: string | null;
  };
  tutor: null | {
    id: string | null;
    name: string | null;
    email: string | null;
    jobTitle: string | null;
  };
};

export function MonEntrepriseClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/dashboard/apprenant/entreprise", { credentials: "include" })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Chargement impossible");
        if (!cancelled) setData(j as Payload);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-[#9AA3BD]">
        <Loader2 className="h-5 w-5 animate-spin" /> Chargement…
      </div>
    );
  }

  if (error) {
    return <p className="px-1 text-sm text-[#FF8A9B]">{error}</p>;
  }

  if (!data?.assigned || !data.company) {
    return (
      <div className="mx-auto max-w-3xl pb-16 pt-1 text-[#F2F4FA]">
        <h1 className="text-[34px] font-extrabold tracking-tight sm:text-[40px]">Mon entreprise</h1>
        <p className="mt-3 text-sm" style={{ color: C.secondary }}>
          Aucune entreprise d’accueil n’est encore rattachée à ton parcours. Dès que le CFA te
          place, elle apparaîtra ici.
        </p>
        <Link
          href="/dashboard/apprenant/planning"
          className="mt-8 inline-flex items-center gap-2 text-sm font-semibold"
          style={{ color: C.blue }}
        >
          <CalendarDays className="h-4 w-4" /> Voir mon planning →
        </Link>
      </div>
    );
  }

  const { company, tutor } = data;
  const place = [company.address, company.city].filter(Boolean).join(", ");

  return (
    <div className="mx-auto max-w-3xl space-y-10 pb-16 pt-1 text-[#F2F4FA]">
      <header>
        <p className="text-sm font-medium" style={{ color: C.turquoise }}>
          Entreprise d’accueil
        </p>
        <h1 className="mt-2 text-[34px] font-extrabold tracking-tight sm:text-[40px]">
          {company.name}
        </h1>
        {place ? (
          <p className="mt-3 flex items-start gap-2 text-sm" style={{ color: C.secondary }}>
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: C.tertiary }} />
            {place}
          </p>
        ) : null}
        {company.siret ? (
          <p className="mt-2 text-xs" style={{ color: C.tertiary }}>
            SIRET {company.siret}
          </p>
        ) : null}
      </header>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <UserRound className="h-4 w-4" style={{ color: C.blue }} />
          <h2 className="text-lg font-extrabold">Ton tuteur</h2>
        </div>
        {tutor?.name ? (
          <div>
            <p className="text-xl font-bold">{tutor.name}</p>
            {tutor.jobTitle ? (
              <p className="mt-1 text-sm" style={{ color: C.secondary }}>
                {tutor.jobTitle}
              </p>
            ) : null}
            {tutor.email ? (
              <a
                href={`mailto:${tutor.email}`}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-[#0A0F1E]"
              >
                <Mail className="h-4 w-4" /> Lui écrire
              </a>
            ) : (
              <p className="mt-3 text-sm" style={{ color: C.tertiary }}>
                Son e-mail n’est pas encore disponible.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm" style={{ color: C.secondary }}>
            Ton maître d’apprentissage n’est pas encore rattaché. Le CFA le fera bientôt — tu
            pourras lui écrire depuis cette page.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4" style={{ color: C.violet }} />
          <h2 className="text-lg font-extrabold">Pendant ton alternance</h2>
        </div>
        <p className="max-w-xl text-sm leading-relaxed" style={{ color: C.secondary }}>
          Suis ton rythme école / entreprise et les prochaines semaines dans ton planning.
        </p>
        <Link
          href="/dashboard/apprenant/planning"
          className="inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition hover:border-[#6E5BFF]"
          style={{ borderColor: C.border, color: C.blue }}
        >
          <CalendarDays className="h-4 w-4" /> Voir mon planning
        </Link>
      </section>
    </div>
  );
}
