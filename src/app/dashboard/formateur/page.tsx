"use client";

import { FormateurSidebar } from "@/components/formateur/formateur-sidebar";

const formations = [
  {
    id: "1",
    titre: "Management & Leadership",
    apprenants: 34,
    completion: 78,
    statut: "En cours",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "2",
    titre: "Vente & Négociation",
    apprenants: 28,
    completion: 65,
    statut: "En cours",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "3",
    titre: "Communication Pro",
    apprenants: 19,
    completion: 82,
    statut: "En cours",
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "4",
    titre: "Excel & Data",
    apprenants: 43,
    completion: 91,
    statut: "En cours",
    image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&w=900&q=80",
  },
];

const carousels = [
  {
    title: "Parcours recommandés",
    items: [
      {
        title: "Management Hybride",
        subtitle: "4 étapes · 12 semaines",
        image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80",
      },
      {
        title: "Onboarding Vendeur",
        subtitle: "Progression guidée",
        image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80",
      },
      {
        title: "Soft Skills Avancées",
        subtitle: "Évaluation continue",
        image: "https://images.unsplash.com/photo-1521790797524-b2497295b8a0?auto=format&fit=crop&w=900&q=80",
      },
    ],
  },
  {
    title: "Ressources à partager",
    items: [
      {
        title: "Plan de session",
        subtitle: "Template premium",
        image: "https://images.unsplash.com/photo-1512314889357-e157c22f938d?auto=format&fit=crop&w=900&q=80",
      },
      {
        title: "Playbook recrutement",
        subtitle: "Version 2026",
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
      },
      {
        title: "Checklist Qualité",
        subtitle: "Audit & conformité",
        image: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=900&q=80",
      },
    ],
  },
];

export default function FormateurDashboardPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <FormateurSidebar activeItem="Accueil" />

      <main className="min-h-screen ml-[236px]">
        <section className="relative min-h-[70vh] overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=2000&q=80"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/70 via-transparent to-transparent" />
          <div className="relative z-10 flex h-full flex-col justify-end gap-6 pb-16 pl-8 pr-12">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-white/80">
              ESPACE FORMATEUR
              <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold tracking-[0.3em] text-red-200">
                PREMIUM
              </span>
            </div>
            <h1 className="text-5xl font-black tracking-tight text-white max-w-3xl leading-tight">
              Pilotez vos formations,
              <br />
              suivez vos cohortes et boostez
              <br />
              l&apos;engagement de vos apprenants.
            </h1>
            <p className="text-lg text-white/70">Une expérience immersive, pensée pour l&apos;action.</p>
            <div className="flex flex-wrap items-center gap-3">
              <button className="rounded-full bg-[#0A84FF] px-5 py-2.5 text-sm font-semibold text-white">
                Inviter un apprenant
              </button>
              <button className="rounded-full bg-white/20 px-5 py-2.5 text-sm font-semibold text-white">
                Exporter le reporting
              </button>
              <button className="rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold text-white/80">
                Planifier une session
              </button>
            </div>
            <div className="absolute right-12 top-1/2 w-72 -translate-y-1/2 rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                Prochaines étapes
              </p>
              <div className="mt-4 space-y-3 text-sm text-white/80">
                <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                  <p className="font-medium text-white">Finaliser votre prochaine cohorte</p>
                  <p className="text-xs text-white/60">3 sections à confirmer</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                  <p className="font-medium text-white">Partager la masterclass engageante</p>
                  <p className="text-xs text-white/60">Embed recommandée pour vos mentors</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-12 px-12 py-12">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white/90">Formations en cours</h2>
              <button className="text-xs font-semibold text-white/60 hover:text-white">
                Voir tout
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
              {formations.map((formation) => (
                <div
                  key={formation.id}
                  className="min-w-[300px] h-[180px] overflow-hidden rounded-2xl bg-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition-transform duration-300 hover:scale-105"
                >
                  <img src={formation.image} alt="" className="h-[120px] w-full object-cover" />
                  <div className="p-3">
                    <div className="text-sm font-semibold text-white">{formation.titre}</div>
                    <div className="text-xs text-white/60 mt-1">
                      {formation.apprenants} apprenants · {formation.completion}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {carousels.map((carousel) => (
            <div key={carousel.title} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white/90">{carousel.title}</h2>
                <button className="text-xs font-semibold text-white/60 hover:text-white">
                  Voir tout
                </button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                {carousel.items.map((item) => (
                  <div
                    key={item.title}
                    className="relative min-w-[300px] h-[180px] overflow-hidden rounded-2xl bg-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition-transform duration-300 hover:scale-105"
                  >
                    <img src={item.image} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="relative z-10 p-4">
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="text-xs text-white/60">{item.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}


