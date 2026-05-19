"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import SidebarExpert from "@/components/SidebarExpert";
import { useSupabase } from "@/components/providers/supabase-provider";
import {
  Award,
  CalendarDays,
  ClipboardList,
  FileText,
  Receipt,
  Sparkles,
  User2,
} from "lucide-react";

const PROFILE_STEPS_MAX = 5;

type ExpertRow = {
  first_name: string | null;
  last_name: string | null;
  headline: string | null;
  bio: string | null;
  photo_url: string | null;
  avatar_url: string | null;
  is_certified_beyond: boolean | null;
  registration_step: number | null;
};

type ProfileRow = {
  full_name: string | null;
  avatar_url: string | null;
};

/** Données expert mockées (pas d’appel `experts` tant que Supabase réseau est instable). */
const expertData: ExpertRow = {
  first_name: "Jean-Expert",
  last_name: "Beyond",
  headline: "Coach Senior & Formateur Soft Skills",
  avatar_url: null,
  photo_url: null,
  registration_step: 4,
  is_certified_beyond: true,
  bio: "Expert passionné par les signaux faibles et la performance durable.",
};

function completionPercent(step: number | null | undefined): number {
  const s = typeof step === "number" && !Number.isNaN(step) ? step : 0;
  const clamped = Math.max(0, Math.min(PROFILE_STEPS_MAX, s));
  return Math.round((clamped / PROFILE_STEPS_MAX) * 100);
}

function displayName(expert: ExpertRow | null, profile: ProfileRow | null): string {
  const fn = expert?.first_name?.trim() ?? "";
  const ln = expert?.last_name?.trim() ?? "";
  const joined = [fn, ln].filter(Boolean).join(" ").trim();
  if (joined) return joined;
  const full = profile?.full_name?.trim();
  if (full) return full;
  return "Expert Beyond";
}

function avatarSrc(expert: ExpertRow | null, profile: ProfileRow | null): string | null {
  const u = expert?.avatar_url?.trim() || expert?.photo_url?.trim() || profile?.avatar_url?.trim() || null;
  return u || null;
}

export default function ExpertDashboardPage() {
  const supabase = useSupabase();
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  const expert = expertData;

  useEffect(() => {
    console.log("Mode Mock activé pour le Dashboard Expert");
    let cancelled = false;
    async function loadProfileOptional() {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (cancelled || userError || !userData.user) return;
        const userId = userData.user.id;
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name,avatar_url")
          .eq("id", userId)
          .maybeSingle();
        if (cancelled || error) return;
        if (data) setProfile(data as ProfileRow);
      } catch {
        /* Supabase indisponible (ex. Failed to fetch) : le cockpit reste sur expertData. */
      }
    }
    loadProfileOptional();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const name = useMemo(() => displayName(expert, profile), [expert, profile]);
  const photo = useMemo(() => avatarSrc(expert, profile), [expert, profile]);
  const headline = expert.headline?.trim() || "Ajoutez une accroche qui vous distingue.";
  const bioText = expert.bio?.trim() || "";
  const progress = completionPercent(expert.registration_step ?? undefined);
  const isCertified = expert.is_certified_beyond === true;

  const initials = useMemo(() => {
    const parts = name.split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? "E";
    const b = parts[1]?.[0] ?? "";
    return (a + b).toUpperCase();
  }, [name]);

  return (
    <div className="min-h-screen bg-[#05060a] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#05060a]" />
        <div className="absolute -bottom-64 -left-64 h-[760px] w-[760px] rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.20),rgba(99,102,241,0.10),rgba(2,6,23,0)_60%)] blur-3xl" />
        <div className="absolute -top-64 -right-64 h-[680px] w-[680px] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.14),rgba(2,6,23,0)_62%)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),rgba(255,255,255,0))]" />
      </div>

      <SidebarExpert />
      <main className="relative min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-6xl px-6 py-10 pb-24 pl-[280px]">
          <header className="mb-8">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Espace Expert</div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Tableau de Bord Expert</h1>
            <p className="mt-2 text-sm text-slate-600">Cockpit missions, certification et présentation.</p>
          </header>

        <div className="flex flex-col gap-6">
            {/* A. Header profil */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50">
                  {photo ? (
                    <Image
                      src={photo}
                      alt={name}
                      fill
                      className="object-cover"
                      sizes="96px"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-black text-emerald-800">
                      {initials}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{name}</h2>
                  <p className="mt-1 text-sm font-medium text-emerald-700">{headline}</p>
                  <div className="mt-5">
                    <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <span>Complétion du profil</span>
                      <span className="text-emerald-700">{progress}%</span>
                    </div>
                    <div
                      className="mt-2 h-2 overflow-hidden rounded-full border border-slate-200 bg-slate-100"
                      role="progressbar"
                      aria-valuenow={progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400/90 transition-[width] duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Basé sur l&apos;étape d&apos;inscription (0–{PROFILE_STEPS_MAX}). Complétez votre profil pour
                      augmenter votre visibilité.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* B. Certification */}
            <section
              className={`relative overflow-hidden rounded-3xl border p-6 shadow-sm sm:p-8 ${
                isCertified
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-rose-200 bg-rose-50"
              }`}
            >
              <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-200/30 blur-3xl" />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${
                      isCertified ? "border-emerald-200 bg-white" : "border-slate-200 bg-white"
                    }`}
                  >
                    <Award className={`h-7 w-7 ${isCertified ? "text-emerald-600" : "text-slate-500"}`} aria-hidden />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Certification Beyond</div>
                    <h3 className="mt-1 text-lg font-extrabold text-slate-900">Votre statut certifiant</h3>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {isCertified ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-bold text-emerald-800 shadow-sm">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]" />
                          Certifié Beyond
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-bold text-rose-800 shadow-sm">
                          <span className="h-2 w-2 rounded-full bg-rose-500" />
                          Certification non active
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {!isCertified && (
                  <Link
                    href="/dashboard/expert/certification"
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-600 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    <Sparkles className="h-4 w-4" aria-hidden />
                    Passer la certification
                  </Link>
                )}
                {isCertified && (
                  <Link
                    href="/dashboard/expert/certification"
                    className="text-sm font-semibold text-emerald-700 underline-offset-4 hover:text-emerald-800 hover:underline"
                  >
                    Voir le détail
                  </Link>
                )}
              </div>
            </section>

            {/* C. Agenda & missions */}
            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                  <ClipboardList className="h-5 w-5 text-emerald-600" aria-hidden />
                  Prochaines missions / formations
                </div>
                <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                  <CalendarDays className="h-10 w-10 text-slate-300" aria-hidden />
                  <p className="mt-3 text-sm font-semibold text-slate-700">Aucune mission prévue</p>
                  <p className="mt-1 max-w-xs text-xs text-slate-500">
                    Vos sessions et formations apparaîtront ici dès qu&apos;elles seront planifiées.
                  </p>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                  <CalendarDays className="h-5 w-5 text-indigo-600" aria-hidden />
                  Prochains rendez-vous
                </div>
                <p className="mt-1 text-xs text-slate-500">Coaching & consulting</p>
                <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                  <CalendarDays className="h-10 w-10 text-slate-300" aria-hidden />
                  <p className="mt-3 text-sm font-semibold text-slate-700">Aucun rendez-vous à venir</p>
                  <p className="mt-1 max-w-xs text-xs text-slate-500">
                    Les créneaux réservés via votre agenda Beyond s&apos;afficheront ici.
                  </p>
                </div>
              </div>
            </section>

            {/* D. Gestion activité */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h3 className="text-sm font-extrabold text-slate-900">Gestion d&apos;activité</h3>
              <p className="mt-1 text-xs text-slate-500">Accès rapides administratifs</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <Link
                  href="/dashboard/expert/activite/attestations"
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
                >
                  <FileText className="h-8 w-8 text-emerald-600" aria-hidden />
                  <div className="mt-3 text-sm font-extrabold text-slate-900">Attestations d&apos;heures</div>
                  <div className="mt-1 text-xs text-slate-600">Justificatifs et suivi du temps</div>
                </Link>
                <Link
                  href="/dashboard/expert/activite/supports"
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50"
                >
                  <ClipboardList className="h-8 w-8 text-indigo-600" aria-hidden />
                  <div className="mt-3 text-sm font-extrabold text-slate-900">Supports de formation</div>
                  <div className="mt-1 text-xs text-slate-600">Ressources et documents</div>
                </Link>
                <Link
                  href="/dashboard/expert/activite/facturation"
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-violet-200 hover:bg-violet-50"
                >
                  <Receipt className="h-8 w-8 text-violet-600" aria-hidden />
                  <div className="mt-3 text-sm font-extrabold text-slate-900">Facturation</div>
                  <div className="mt-1 text-xs text-slate-600">Factures et paiements</div>
                </Link>
              </div>
            </section>

            {/* E. Ma présentation */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Ma présentation</h3>
                  <p className="mt-1 text-xs text-slate-500">Texte visible par les entreprises partenaires</p>
                </div>
                <Link
                  href="/dashboard/expert/profile"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-800 shadow-sm transition hover:bg-slate-50"
                >
                  <User2 className="h-4 w-4 text-slate-500" aria-hidden />
                  Modifier mon profil
                </Link>
              </div>
              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                {bioText ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{bioText}</p>
                ) : (
                  <p className="text-sm italic text-slate-500">
                    Vous n&apos;avez pas encore rédigé votre bio. Ajoutez quelques lignes sur votre parcours et votre
                    approche pour rassurer les clients.
                  </p>
                )}
              </div>
            </section>

            {/* Liens utiles (raccourci missions) */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/expert/interventions"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                <ClipboardList className="h-4 w-4 text-emerald-600" aria-hidden />
                Mes missions
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
