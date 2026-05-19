"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { cn } from "@/lib/utils";
import {
  Award,
  BriefcaseBusiness,
  Building2,
  Check,
  Globe,
  MapPin,
  MessageSquareQuote,
  Star,
  Video,
  Users,
} from "lucide-react";

type Testimonial = {
  name: string;
  company: string;
  rating: number; // 1–5
  comment: string;
};

type SelectedExpert = {
  id: string;
  first_name: string;
  last_name: string;
  main_specialty: string;
  headline: string;
  photo_url: string | null;
  is_certified_beyond: boolean;
  zone: string;
  modalities: Array<"Visio" | "Présentiel" | "Accompagnement 1:1" | "Atelier Collectif">;
  themes: string[];
  bio: string;
  open_badges: Array<{ name: string; issuer: string }> | null;
  references: Array<{ company: string; project: string }> | null;
  testimonials: Testimonial[] | null;
};

const selectedExpert: SelectedExpert = {
  id: "mock-jean-expert",
  first_name: "Jean-Expert",
  last_name: "Beyond",
  main_specialty: "Soft Skills",
  headline: "Coach Senior & Formateur Soft Skills",
  photo_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=480&q=80",
  is_certified_beyond: true,
  zone: "Île-de-France, Lyon · International (visio)",
  modalities: ["Visio", "Présentiel", "Accompagnement 1:1", "Atelier Collectif"],
  themes: ["Gestion du stress", "Leadership", "Communication non-violente", "Feedback & posture managériale", "Cohésion d'équipe"],
  bio: `Expert passionné par les signaux faibles et la performance durable.\n\nJ’accompagne managers et équipes dans des contextes exigeants (croissance rapide, réorganisation, pression opérationnelle). Mon approche combine coaching, pédagogie active et outils concrets pour ancrer des comportements durables.`,
  open_badges: [
    { name: "Beyond Certified · Facilitation", issuer: "Beyond" },
    { name: "Beyond Certified · Coaching", issuer: "Beyond" },
  ],
  references: [
    { company: "Groupe Industrie +", project: "Programme leadership (12 managers) · 8 semaines" },
    { company: "ScaleUp RH", project: "Ateliers CNV & feedback · 3 sessions" },
    { company: "Collectif Santé", project: "Prévention stress & charge mentale · 2 mois" },
  ],
  testimonials: [
    { name: "Camille R.", company: "Groupe Industrie +", rating: 5, comment: "Structuré, concret, et surtout applicable dès le lendemain. Les managers ont vraiment progressé." },
    { name: "Nicolas D.", company: "ScaleUp RH", rating: 5, comment: "Très bonne énergie et une vraie maîtrise des situations sensibles. Atelier efficace et apaisant." },
    { name: "Sarah M.", company: "Collectif Santé", rating: 4, comment: "Excellente pédagogie. Les exercices sont simples et ont eu un impact immédiat sur l’équipe." },
  ],
};

function Stars({ rating }: { rating: number }) {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div className="flex items-center gap-0.5" aria-label={`${r} sur 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn("h-4 w-4", i < r ? "text-amber-300" : "text-white/15")}
          fill={i < r ? "currentColor" : "none"}
          aria-hidden
        />
      ))}
    </div>
  );
}

export default function EnterpriseExpertProfilePage() {
  const router = useRouter();
  const params = useParams();
  const expertId = typeof params.id === "string" ? params.id : selectedExpert.id;

  const name = useMemo(() => `${selectedExpert.first_name} ${selectedExpert.last_name}`.trim(), []);

  const chooseExpert = () => {
    toast.success("Expert sélectionné (mock).");
    router.push(`/dashboard/entreprise?action=expert_selected&expert_id=${encodeURIComponent(expertId)}`);
  };

  return (
    <div className="min-h-screen bg-[#05060a] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#05060a]" />
        <div className="absolute -bottom-64 -left-64 h-[760px] w-[760px] rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.18),rgba(99,102,241,0.10),rgba(2,6,23,0)_60%)] blur-3xl" />
        <div className="absolute -top-64 -right-64 h-[680px] w-[680px] rounded-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.14),rgba(2,6,23,0)_62%)] blur-3xl" />
      </div>

      <EnterpriseSidebar />

      <main className="relative min-h-screen bg-slate-50 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="mx-auto max-w-6xl px-6 py-10 pb-24 pl-[280px]">
        {/* 1) Header identité */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-6 md:grid-cols-[160px_1fr] md:items-center">
            <div className="relative h-40 w-40 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
              {selectedExpert.photo_url ? (
                <Image
                  src={selectedExpert.photo_url}
                  alt={name}
                  fill
                  sizes="160px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-black text-emerald-200/90">
                  {selectedExpert.first_name[0]}
                  {selectedExpert.last_name[0]}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Fiche expert</div>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{name}</h1>
              <div className="mt-2 text-sm font-semibold text-emerald-700">{selectedExpert.main_specialty}</div>
              <p className="mt-3 text-sm text-slate-600">{selectedExpert.headline}</p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                {selectedExpert.is_certified_beyond ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-800">
                    <Award className="h-4 w-4 text-emerald-600" aria-hidden />
                    Certifié Beyond
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-extrabold text-rose-800">
                    <Award className="h-4 w-4 text-rose-600" aria-hidden />
                    Non certifié
                  </span>
                )}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={chooseExpert}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-600 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  <Check className="h-4 w-4" aria-hidden />
                  Choisir cet expert pour ma mission
                </button>
                <button
                  type="button"
                  onClick={() => toast.info("Contact expert (mock).")}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                >
                  <MessageSquareQuote className="h-4 w-4 text-slate-500" aria-hidden />
                  Contacter l’expert
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Colonne principale */}
          <div className="flex flex-col gap-6">
            {/* 3) Coeur de métier */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-sm font-extrabold">Thématiques & expertise</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedExpert.themes.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Présentation</div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{selectedExpert.bio}</p>
              </div>
            </section>

            {/* 4) Réassurance & preuves */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-sm font-extrabold">Réassurance & preuves</h2>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {/* Open Badges */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-extrabold">
                    <Award className="h-4 w-4 text-emerald-600" aria-hidden />
                    Open Badges
                  </div>
                  {selectedExpert.open_badges && selectedExpert.open_badges.length > 0 ? (
                    <ul className="mt-4 space-y-3">
                      {selectedExpert.open_badges.map((b) => (
                        <li key={`${b.issuer}-${b.name}`} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                          <div className="text-sm font-bold text-slate-900">{b.name}</div>
                          <div className="mt-1 text-xs text-slate-500">Émetteur : {b.issuer}</div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 text-sm text-slate-600">
                      Aucun badge pour le moment, cet expert est en cours de labellisation.
                    </p>
                  )}
                </div>

                {/* Références */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-extrabold">
                    <BriefcaseBusiness className="h-4 w-4 text-indigo-600" aria-hidden />
                    Références
                  </div>
                  {selectedExpert.references && selectedExpert.references.length > 0 ? (
                    <ul className="mt-4 space-y-3">
                      {selectedExpert.references.map((r) => (
                        <li key={`${r.company}-${r.project}`} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                            <Building2 className="h-4 w-4 text-slate-400" aria-hidden />
                            {r.company}
                          </div>
                          <div className="mt-1 text-xs text-slate-600">{r.project}</div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 text-sm text-slate-600">Aucune référence renseignée pour le moment.</p>
                  )}
                </div>
              </div>

              {/* Avis */}
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-extrabold">
                    <MessageSquareQuote className="h-4 w-4 text-amber-600" aria-hidden />
                    Avis
                  </div>
                  <span className="text-xs font-semibold text-slate-500">Retours clients (mock)</span>
                </div>
                {selectedExpert.testimonials && selectedExpert.testimonials.length > 0 ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {selectedExpert.testimonials.map((t) => (
                      <div key={`${t.name}-${t.company}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-extrabold text-slate-900">{t.name}</div>
                            <div className="mt-0.5 text-xs text-slate-500">{t.company}</div>
                          </div>
                          <Stars rating={t.rating} />
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-slate-600">“{t.comment}”</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-600">Aucun avis pour le moment.</p>
                )}
              </div>
            </section>
          </div>

          {/* Colonne latérale */}
          <div className="flex flex-col gap-6">
            {/* 2) Logistique */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-sm font-extrabold">Zone & préférences</h2>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  <MapPin className="h-4 w-4" aria-hidden />
                  Zone d’intervention
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-700">{selectedExpert.zone}</div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  <Globe className="h-4 w-4" aria-hidden />
                  Modalités
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedExpert.modalities.map((m) => {
                    const icon =
                      m === "Visio" ? (
                        <Video className="h-3.5 w-3.5 text-emerald-200/80" aria-hidden />
                      ) : m === "Atelier Collectif" ? (
                        <Users className="h-3.5 w-3.5 text-emerald-200/80" aria-hidden />
                      ) : (
                        <Check className="h-3.5 w-3.5 text-emerald-200/80" aria-hidden />
                      );
                    return (
                      <span
                        key={m}
                        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800"
                      >
                        {icon}
                        {m}
                      </span>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-sm font-extrabold">Actions rapides</h2>
              <div className="mt-4 grid gap-3">
                <button
                  type="button"
                  onClick={chooseExpert}
                  className="rounded-2xl border border-emerald-200 bg-emerald-600 px-4 py-3 text-left text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  Choisir cet expert
                  <div className="mt-1 text-xs font-semibold text-emerald-100/90">Associer à une mission (mock)</div>
                </button>
                <button
                  type="button"
                  onClick={() => toast.info("Planifier un échange (mock).")}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                >
                  Proposer un rendez-vous
                  <div className="mt-1 text-xs text-slate-600">Suggérer un créneau</div>
                </button>
              </div>
            </section>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}

