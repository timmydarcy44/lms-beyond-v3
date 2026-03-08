"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";

const profiles = [
  {
    id: "A-27",
    prenom: "Anaïs",
    nom_initial: "D.",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
    score: 92,
    tags: ["Stabilité émotionnelle élevée", "Adaptabilité forte", "Risque d'attrition faible"],
    disc: { D: 5, I: 7, S: 9, C: 6 },
    softSkills: [
      { label: "Communication", value: 84 },
      { label: "Résilience", value: 88 },
      { label: "Leadership", value: 76 },
    ],
  },
  {
    id: "B-11",
    prenom: "Lucas",
    nom_initial: "B.",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
    score: 88,
    tags: ["Leadership émergent", "Énergie commerciale", "Progression rapide"],
    disc: { D: 8, I: 9, S: 4, C: 5 },
    softSkills: [
      { label: "Leadership", value: 89 },
      { label: "Adaptabilité", value: 82 },
      { label: "Collaboration", value: 74 },
    ],
  },
  {
    id: "C-05",
    prenom: "Emma",
    nom_initial: "P.",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=800&q=80",
    score: 85,
    tags: ["Esprit analytique", "Rigueur process", "Communication précise"],
    disc: { D: 4, I: 5, S: 7, C: 9 },
    softSkills: [
      { label: "Rigueur", value: 90 },
      { label: "Collaboration", value: 78 },
      { label: "Communication", value: 73 },
    ],
  },
];

const discColors: Record<string, string> = {
  D: "bg-rose-500",
  I: "bg-amber-400",
  S: "bg-emerald-400",
  C: "bg-sky-500",
};

const scoreBadge = (score: number) =>
  score > 85 ? "bg-emerald-400/20 text-emerald-200" : "bg-orange-400/20 text-orange-200";

export default function TalentRadarPage() {
  const [selectedProfile, setSelectedProfile] = useState<(typeof profiles)[number] | null>(null);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <EnterpriseSidebar />
      <main className="min-h-screen px-8 py-10 pl-[260px]">
        <div className="space-y-8">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-[28px] font-extrabold tracking-[-0.5px]">Talent Radar</h1>
              <p className="mt-1 text-[13px] text-white/60">
                Profils compatibles avec vos offres
              </p>
            </div>
            <Link
              href="/dashboard/entreprise/offres"
              className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black"
            >
              + Déposer une offre
            </Link>
          </header>

          <section className="rounded-[28px] border border-blue-500/20 bg-gradient-to-r from-[#1d4ed8]/40 via-[#7c3aed]/30 to-[#0ea5e9]/30 p-6 shadow-[0_20px_60px_rgba(30,64,175,0.35)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">
                  Accédez aux profils qualifiés Beyond
                </p>
                <p className="mt-2 text-xs text-white/70">
                  Contactez-nous pour activer le matching complet
                </p>
              </div>
              <Link
                href="mailto:contact@beyond.fr"
                className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black"
              >
                Nous contacter
              </Link>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/5 shadow-[0_12px_30px_rgba(0,0,0,0.4)]"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center blur-md"
                  style={{ backgroundImage: `url('${profile.photo}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-black/70" />
                <div className="relative z-10 flex h-full flex-col gap-4 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-lg font-semibold text-white">
                        {profile.prenom} {profile.nom_initial}
                      </p>
                      <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${scoreBadge(profile.score)}`}>
                          {profile.score}%
                        </span>
                        Matching
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80">
                      PREMIUM
                      <Lock className="h-3 w-3" />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {profile.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] text-white/80"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {profile.softSkills.map((skill) => (
                      <span
                        key={skill.label}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/80"
                      >
                        {skill.label}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedProfile(profile)}
                    className="mt-auto inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-white/20"
                  >
                    Voir le profil complet
                  </button>
                </div>
              </div>
            ))}
          </section>
        </div>
      </main>

      {selectedProfile ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-[24px] border border-white/10 bg-[#0b0b0b] text-white shadow-[0_30px_120px_rgba(0,0,0,0.6)]">
            <div
              className="absolute inset-0 bg-cover bg-center blur-md"
              style={{ backgroundImage: `url('${selectedProfile.photo}')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/50 to-black/80" />
            <div className="relative z-10 space-y-6 p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-2xl font-semibold">
                    {selectedProfile.prenom} {selectedProfile.nom_initial}
                  </p>
                  <p className="mt-2 text-sm text-white/70">Profil premium anonymisé</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProfile(null)}
                  className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70 hover:bg-white/10"
                >
                  Fermer
                </button>
              </div>

              <div className="space-y-2 text-[11px] text-white/60">
                {(["D", "I", "S", "C"] as const).map((key) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-3 text-[10px] font-semibold text-white/70">{key}</span>
                    <div className="h-2 flex-1 rounded-full bg-white/10">
                      <div
                        className={`h-2 rounded-full ${discColors[key]}`}
                        style={{ width: `${selectedProfile.disc[key] * 10}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-[10px] text-white/50">
                      {selectedProfile.disc[key]}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-white/80">Soft skills clés</p>
                {selectedProfile.softSkills.map((skill) => (
                  <div key={skill.label}>
                    <div className="flex items-center justify-between text-xs text-white/70">
                      <span>{skill.label}</span>
                      <span>{skill.value}%</span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                      <div
                        className="h-2 rounded-full bg-white/60"
                        style={{ width: `${skill.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="mailto:contact@beyond.fr"
                className="inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black"
              >
                Recruter ce profil
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
