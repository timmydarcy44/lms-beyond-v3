"use client";

import { BadgeCheck, MapPin, Clock, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getPrimaryDomain,
  getSecondaryDomains,
  getSpecialtyLabel,
  type ExpertSpecialtiesProfile,
} from "@/lib/expert/specialties-referential";

type IdentityPreview = {
  firstName: string;
  lastName: string;
  headline: string;
  photoUrl: string;
};

type Props = {
  identity: IdentityPreview;
  profile: ExpertSpecialtiesProfile;
  wantsCertification?: boolean;
  className?: string;
};

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <p className="mt-5 text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">{title}</p>
      <div className="mt-2">{children}</div>
    </>
  );
}

export function ExpertProfilePreview({ identity, profile, wantsCertification, className }: Props) {
  const fullName = `${identity.firstName} ${identity.lastName}`.trim() || "Votre nom";
  const primaryDomain = getPrimaryDomain(profile);
  const secondaryDomains = getSecondaryDomains(profile);

  const hasContent =
    profile.domainIds.length > 0 ||
    profile.specialtyKeys.length > 0 ||
    profile.formats.length > 0 ||
    profile.audiences.length > 0 ||
    profile.geographicZones.length > 0 ||
    profile.languages.length > 0 ||
    profile.availabilities.length > 0;

  return (
    <div className={cn("sticky top-8", className)}>
      <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/40">Aperçu en direct</p>
      <p className="mt-1 text-xs text-white/35">Votre fiche publique EDGE</p>

      <div className="mt-5 overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="h-20 bg-gradient-to-r from-[#635BFF]/20 via-[#635BFF]/5 to-transparent" />

        <div className="relative px-6 pb-6">
          <div className="-mt-10 flex items-end gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-[#05060a] bg-white/10 shadow-lg">
              {identity.photoUrl.trim() ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={identity.photoUrl.trim()} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-white/30">
                  {fullName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 pb-1">
              <h3 className="truncate text-lg font-semibold text-white">{fullName}</h3>
              <p className="mt-0.5 line-clamp-2 text-sm text-white/55">
                {identity.headline.trim() || primaryDomain?.label || "Votre headline professionnelle"}
              </p>
            </div>
          </div>

          {wantsCertification ? (
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-[#635BFF]/30 bg-[#635BFF]/10 px-3 py-1.5 text-[11px] font-medium text-[#a8a3ff]">
              <BadgeCheck className="h-3.5 w-3.5" />
              Certification EDGE en cours
            </div>
          ) : (
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/40">
              Réseau EDGE
            </div>
          )}

          {primaryDomain ? (
            <PreviewSection title="Domaine principal">
              <p className="text-sm font-medium text-[#635BFF]">{primaryDomain.label}</p>
            </PreviewSection>
          ) : null}

          {secondaryDomains.length > 0 ? (
            <PreviewSection title="Autres domaines">
              <div className="flex flex-wrap gap-1.5">
                {secondaryDomains.map((d) => (
                  <span
                    key={d.id}
                    className="rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] text-white/70"
                  >
                    {d.label}
                  </span>
                ))}
              </div>
            </PreviewSection>
          ) : null}

          {profile.specialtyKeys.length > 0 ? (
            <PreviewSection title="Spécialités">
              <div className="flex flex-wrap gap-1.5">
                {profile.specialtyKeys.map((key) => (
                  <span
                    key={key}
                    className="rounded-lg border border-[#635BFF]/25 bg-[#635BFF]/10 px-2.5 py-1 text-[11px] font-medium text-white/85"
                  >
                    {getSpecialtyLabel(key)}
                  </span>
                ))}
              </div>
            </PreviewSection>
          ) : null}

          {profile.formats.length > 0 ? (
            <PreviewSection title="Formats">
              <div className="flex flex-wrap gap-1.5">
                {profile.formats.map((f) => (
                  <span
                    key={f}
                    className="rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] text-white/65"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </PreviewSection>
          ) : null}

          {profile.audiences.length > 0 ? (
            <PreviewSection title="Public">
              <div className="flex flex-wrap gap-1.5">
                {profile.audiences.map((a) => (
                  <span
                    key={a}
                    className="rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] text-white/65"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </PreviewSection>
          ) : null}

          {(profile.geographicZones.length > 0 ||
            profile.languages.length > 0 ||
            profile.availabilities.length > 0 ||
            profile.yearsExperience) && (
            <div className="mt-5 space-y-2 border-t border-white/[0.06] pt-4">
              {profile.geographicZones.length > 0 ? (
                <div className="flex items-start gap-2 text-xs text-white/50">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/30" />
                  <span>{profile.geographicZones.join(" · ")}</span>
                </div>
              ) : null}
              {profile.languages.length > 0 ? (
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <Globe className="h-3.5 w-3.5 shrink-0 text-white/30" />
                  {profile.languages.join(" · ")}
                </div>
              ) : null}
              {profile.availabilities.length > 0 ? (
                <div className="flex items-start gap-2 text-xs text-white/50">
                  <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/30" />
                  <span>{profile.availabilities.join(" · ")}</span>
                </div>
              ) : null}
              {profile.yearsExperience ? (
                <p className="text-xs text-white/40">{profile.yearsExperience} d&apos;expérience</p>
              ) : null}
            </div>
          )}

          {!hasContent ? (
            <p className="mt-6 text-center text-sm text-white/30">
              Construisez votre profil — l&apos;aperçu se met à jour en temps réel.
            </p>
          ) : null}
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-white/35">
        Chaque profil est validé par EDGE avant publication dans le réseau.
      </p>
    </div>
  );
}
