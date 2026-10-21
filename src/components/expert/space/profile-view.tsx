"use client";

import { useState } from "react";
import { CalendarDays, ChevronRight, Globe, Pencil, Share2, Star } from "lucide-react";
import { toast } from "sonner";

import {
  ExpertPageFrame,
  ExpertPageHeader,
  ExpertPrimaryButton,
  HeroCard,
  SegmentBar,
  StatusPill,
} from "@/components/expert/expert-ui";
import type { ExpertProfileModel } from "@/lib/expert/space-server";
import { formatEuros } from "@/lib/expert/space-model";

function stars(rating: number) {
  return "★★★★★".slice(0, Math.max(0, Math.min(5, Math.round(rating))));
}

export function ProfileView({ profile }: { profile: ExpertProfileModel }) {
  const [copied, setCopied] = useState(false);
  const filled = profile.sections.filter((section) => section.filled).length;
  const average = profile.reviews.length
    ? profile.reviews.reduce((sum, review) => sum + review.rating, 0) / profile.reviews.length
    : null;
  const publicUrl = `https://www.byound.fr/experts/${profile.id}`;
  const initials = profile.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <ExpertPageFrame>
      <ExpertPageHeader
        title="Mon profil"
        subtitle="Ce que voient les entreprises et l'école quand elles vous cherchent"
        action={<ExpertPrimaryButton href="/dashboard/expert/profile?edit=1">Modifier mon profil</ExpertPrimaryButton>}
      />
      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <HeroCard>
          <div className="flex items-center gap-4">
            {profile.photoUrl ? (
              <span className="h-[88px] w-[88px] rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${profile.photoUrl})` }} />
            ) : (
              <span className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-[#FF4B4B] text-2xl font-extrabold text-[#04140C]">
                {initials}
              </span>
            )}
            <div>
              <h2 className="text-[34px] font-extrabold leading-none tracking-[-0.04em]">{profile.name}</h2>
              <p className="mt-2 text-sm text-[#B5BAC6]">
                {[profile.headline, profile.regions.join(", ")].filter(Boolean).join(" · ") || "Titre et régions à renseigner"}
              </p>
              {profile.certified ? <span className="mt-3 inline-flex"><StatusPill tone="gold">★ Byound Certified</StatusPill></span> : null}
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              [average ? average.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "—", average ? `sur ${profile.reviews.length} avis` : "pas encore d'avis"],
              [String(profile.missionsDone), "missions réalisées"],
              [String(profile.regions.length), "régions couvertes"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-[20px] bg-[#1E2130] px-4 py-3">
                <p className="text-[28px] font-extrabold tracking-[-0.04em]">{value}</p>
                <p className="text-xs text-[#9096A3]">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-4">
            <Round href={`/experts/${profile.id}`} icon={Globe} label="Profil public" tone="green" />
            <Round href="/dashboard/expert/profile?edit=1" icon={Pencil} label="Modifier" />
            <Round
              icon={Share2}
              label={copied ? "Copié" : "Partager"}
              onClick={() => {
                const url = publicUrl;
                void navigator.clipboard.writeText(url).then(() => {
                  setCopied(true);
                  toast.success("Lien copié");
                });
              }}
            />
            <Round href="/dashboard/expert/agenda" icon={CalendarDays} label="Disponibilités" />
          </div>
          <span className="sr-only">{publicUrl}</span>
        </HeroCard>
        <div className="space-y-4">
          <section className="rounded-[28px] bg-[#12141A] p-5">
            <p className="text-sm font-extrabold">Profil complété</p>
            <p className="mt-2 text-[40px] font-extrabold leading-none tracking-[-0.04em]">
              {filled} <span className="text-[22px] text-[#9096A3]">/ {profile.sections.length}</span>
            </p>
            <p className="mt-1 text-sm text-[#9096A3]">sections</p>
            <div className="mt-4">
              <SegmentBar total={profile.sections.length} filled={filled} />
            </div>
          </section>
          {profile.sections.filter((section) => !section.filled).map((section) => (
            <a key={section.id} href="/dashboard/expert/profile?edit=1" className="block rounded-[24px] bg-[#3A1418] px-4 py-4 text-sm font-extrabold text-[#FFB4B8]">
              + {section.missing}
            </a>
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <section className="rounded-[28px] bg-[#12141A] p-5">
          <h2 className="mb-2 text-base font-extrabold">Informations du profil</h2>
          <ul className="divide-y divide-[#1E2130]">
            {profile.sections.filter((section) => section.id !== "bio").map((section) => (
              <li key={section.id}>
                <a href="/dashboard/expert/profile?edit=1" className="flex min-h-[64px] items-center gap-3 py-3">
                  <span className="w-[150px] shrink-0 text-sm text-[#9096A3]">{section.label}</span>
                  <span className="flex min-w-0 flex-1 flex-wrap gap-2">
                    {section.values.length ? (
                      section.values.map((value) => (
                        <span key={value} className="rounded-full bg-[#1E2130] px-3 py-1 text-sm font-semibold">{value}</span>
                      ))
                    ) : (
                      <span className="text-sm font-bold text-[#FFB4B8]">+ Renseigner</span>
                    )}
                  </span>
                  <StatusPill tone={profile.visibility[section.id] === "private" ? "grey" : "green"}>
                    {profile.visibility[section.id] === "private" ? "Privé" : "Public"}
                  </StatusPill>
                  <ChevronRight className="h-4 w-4 text-[#9096A3]" />
                </a>
              </li>
            ))}
          </ul>
          {profile.dailyRate ? <p className="sr-only">{formatEuros(profile.dailyRate * 100)}</p> : null}
        </section>
        {profile.reviews.length ? (
          <section className="rounded-[28px] bg-[#12141A] p-5">
            <header className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-extrabold">Derniers avis</h2>
              <span className="text-sm font-bold text-[#F2CF6B]">★ {average?.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} · {profile.reviews.length} avis</span>
            </header>
            <ul className="space-y-4">
              {profile.reviews.map((review) => (
                <li key={review.id}>
                  <p className="text-sm font-extrabold">{review.client}</p>
                  <p className="text-sm text-[#F2CF6B]">{stars(review.rating)}</p>
                  <p className="mt-1 text-sm text-[#DADDE4]">{review.body}</p>
                  <p className="mt-1 text-xs text-[#9096A3]">
                    {review.mission} · {new Date(review.at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </ExpertPageFrame>
  );
}

function Round({
  icon: Icon,
  label,
  href,
  onClick,
  tone = "dark",
}: {
  icon: typeof Star;
  label: string;
  href?: string;
  onClick?: () => void;
  tone?: "green" | "dark";
}) {
  const className = "flex w-[88px] flex-col items-center gap-2 text-xs font-semibold text-[#DADDE4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB4B8]";
  const circle = `flex h-14 w-14 items-center justify-center rounded-full ${tone === "green" ? "bg-[#FF4B4B] text-[#04140C]" : "bg-[#1E2130] text-[#F4F5F7]"}`;
  const inner = (
    <>
      <span className={circle}><Icon className="h-5 w-5" /></span>
      {label}
    </>
  );
  if (href) return <a href={href} className={className}>{inner}</a>;
  return <button type="button" onClick={onClick} className={className}>{inner}</button>;
}
