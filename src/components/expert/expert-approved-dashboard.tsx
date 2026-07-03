"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import {
  Award,
  CalendarDays,
  ClipboardList,
  FileText,
  Globe,
  Lock,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import SidebarExpert from "@/components/SidebarExpert";
import { useExpertAccess } from "@/components/expert/expert-access-provider";
import { edgeCertificationLabel, isEdgeCertified } from "@/lib/expert/expert-certification";
import { expertReviewStatusLabel } from "@/lib/expert/expert-access";
import { parseRegistrationMeta } from "@/lib/expert/expert-registration-meta";

const PROFILE_STEPS_MAX = 5;

function completionPercent(step: number | null | undefined): number {
  const s = typeof step === "number" && !Number.isNaN(step) ? step : 0;
  return Math.round((Math.max(0, Math.min(PROFILE_STEPS_MAX, s)) / PROFILE_STEPS_MAX) * 100);
}

function avatarSrc(expert: ReturnType<typeof useExpertAccess>["expert"]): string | null {
  const meta = parseRegistrationMeta(expert.references);
  return (
    expert.avatar_url?.trim() ||
    expert.photo_url?.trim() ||
    meta?.photo_url?.trim() ||
    null
  );
}

function displayName(expert: ReturnType<typeof useExpertAccess>["expert"]): string {
  const joined = [expert.first_name, expert.last_name].filter(Boolean).join(" ").trim();
  return joined || "Formateur EDGE";
}

export function ExpertApprovedDashboard() {
  const { expert } = useExpertAccess();
  const meta = useMemo(() => parseRegistrationMeta(expert.references), [expert.references]);

  const name = displayName(expert);
  const photo = avatarSrc(expert);
  const headline = expert.headline?.trim() || "Ajoutez une accroche qui vous distingue.";
  const bioText = expert.bio?.trim() || "";
  const progress = completionPercent(expert.registration_step);
  const certified = isEdgeCertified(expert);
  const certLabel = edgeCertificationLabel(expert);

  const initials = useMemo(() => {
    const parts = name.split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] ?? "E") + (parts[1]?.[0] ?? "")).toUpperCase();
  }, [name]);

  const domains = meta?.domains?.length ? meta.domains : expert.specialties ?? [];
  const formats = expert.formats_supported ?? [];
  const zones = meta?.geographic_zones?.length ? meta.geographic_zones : expert.regions ?? [];

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#050505]">
      <SidebarExpert />
      <main className="min-h-screen pl-[260px]">
        <div className="mx-auto max-w-6xl px-6 py-10 pb-24">
          <header className="mb-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#635BFF]">Espace formateur</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Tableau de bord</h1>
            <p className="mt-2 text-sm text-[#050505]/55">Votre cockpit missions, certification et présentation.</p>
          </header>

          <section className="rounded-[28px] border border-[#050505]/8 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-[#635BFF]/15 bg-[#635BFF]/5">
                {photo ? (
                  <Image src={photo} alt={name} fill className="object-cover" sizes="96px" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-[#635BFF]">
                    {initials}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[#635BFF]/20 bg-[#635BFF]/8 px-3 py-1 text-[11px] font-medium text-[#635BFF]">
                    {expertReviewStatusLabel(expert.review_status)}
                  </span>
                  <span className="rounded-full border border-[#050505]/10 bg-[#F7F7F5] px-3 py-1 text-[11px] font-medium text-[#050505]/55">
                    {certLabel}
                  </span>
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">{name}</h2>
                <p className="mt-1 text-sm font-medium text-[#635BFF]">{headline}</p>
                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-[#050505]/45">
                    <span>Complétion du profil</span>
                    <span className="text-[#635BFF]">{progress}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#050505]/6">
                    <div
                      className="h-full rounded-full bg-[#635BFF] transition-[width] duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Domaines", value: domains.slice(0, 2).join(", ") || "—", icon: Sparkles },
              { label: "Formats", value: formats.slice(0, 2).join(", ") || "—", icon: Users },
              { label: "Zones", value: zones.slice(0, 2).join(", ") || "—", icon: MapPin },
              { label: "Langues", value: meta?.languages?.slice(0, 2).join(", ") || "—", icon: Globe },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-[#050505]/8 bg-white p-4 shadow-sm">
                <Icon className="h-4 w-4 text-[#635BFF]" aria-hidden />
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-[#050505]/40">{label}</p>
                <p className="mt-1 text-sm font-medium text-[#050505]">{value}</p>
              </div>
            ))}
          </div>

          <section className="mt-6 rounded-[28px] border border-[#635BFF]/15 bg-[linear-gradient(135deg,rgba(99,91,255,0.08),rgba(255,255,255,0.9))] p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#635BFF]/20 bg-white">
                  <Award className="h-6 w-6 text-[#635BFF]" aria-hidden />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#050505]/45">
                    EDGE Certified
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">Devenir EDGE Certified</h3>
                  <p className="mt-2 max-w-xl text-sm text-[#050505]/55">
                    Un parcours qualité pour aligner vos interventions avec la méthode EDGE et accéder aux missions
                    prioritaires.
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/expert/certification"
                className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-[#635BFF] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7B74FF]"
              >
                {certified ? "Voir mon parcours" : "Découvrir le parcours"}
              </Link>
            </div>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[28px] border border-[#050505]/8 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ClipboardList className="h-5 w-5 text-[#635BFF]" aria-hidden />
                Prochaines missions
              </div>
              <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-[#050505]/10 bg-[#F7F7F5] px-6 py-12 text-center">
                <CalendarDays className="h-10 w-10 text-[#050505]/20" aria-hidden />
                <p className="mt-3 text-sm font-medium">Aucune mission prévue</p>
                <p className="mt-1 text-xs text-[#050505]/45">Vos sessions apparaîtront ici dès qu&apos;elles seront planifiées.</p>
              </div>
            </div>
            <div className="rounded-[28px] border border-[#050505]/8 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="h-5 w-5 text-[#635BFF]" aria-hidden />
                Ma présentation
              </div>
              <div className="mt-4 rounded-2xl border border-[#050505]/8 bg-[#F7F7F5] p-4">
                {bioText ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#050505]/65">{bioText}</p>
                ) : (
                  <p className="text-sm italic text-[#050505]/45">
                    Complétez votre bio pour renforcer votre crédibilité auprès des entreprises.
                  </p>
                )}
              </div>
              <Link
                href="/dashboard/expert/profile"
                className="mt-4 inline-flex text-sm font-medium text-[#635BFF] hover:underline"
              >
                Modifier mon profil →
              </Link>
            </div>
          </section>

          <section className="mt-6 rounded-[28px] border border-[#050505]/8 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold">Accès rapides</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                { href: "/dashboard/expert/interventions", label: "Missions", icon: ClipboardList },
                { href: "/dashboard/expert/documents", label: "Documents", icon: FileText },
                { href: "/dashboard/expert/settings", label: "Paramètres", icon: Lock },
              ].map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 rounded-2xl border border-[#050505]/8 bg-[#F7F7F5] px-4 py-3 text-sm font-medium transition hover:border-[#635BFF]/25 hover:bg-[#635BFF]/5"
                >
                  <Icon className="h-4 w-4 text-[#635BFF]" aria-hidden />
                  {label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
