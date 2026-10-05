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

function Tag({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-medium",
        accent ? "bg-[#7C83FF]/20 text-white" : "bg-white/[0.06] text-white/65",
      )}
    >
      {children}
    </span>
  );
}

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <p className="text-[11px] font-medium text-white/40">{title}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

export function ExpertProfilePreview({ identity, profile, wantsCertification, className }: Props) {
  const fullName = `${identity.firstName} ${identity.lastName}`.trim() || "Votre nom";
  const primaryDomain = getPrimaryDomain(profile);
  const secondaryDomains = getSecondaryDomains(profile);
  const initial = (identity.firstName.trim() || fullName).charAt(0).toUpperCase();

  const hasDetails =
    profile.geographicZones.length > 0 || profile.languages.length > 0 || profile.availabilities.length > 0;

  return (
    <div className={cn("sticky top-8", className)}>
      <div className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0f1533]/80 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="relative h-24 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(120%_140%_at_0%_0%,#7C83FF_0%,#3b2a9a_45%,transparent_75%)] opacity-70" />
          <div className="absolute inset-0 bg-[radial-gradient(80%_120%_at_100%_0%,rgba(56,189,248,0.35),transparent_70%)]" />
          <p className="absolute right-4 top-4 rounded-full bg-black/25 px-2.5 py-1 text-[10px] font-medium text-white/80 backdrop-blur">
            Aperçu en direct
          </p>
        </div>

        <div className="relative px-6 pb-6">
          <div className="-mt-9 flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-full border-4 border-[#0f1533] bg-white text-2xl font-semibold text-[#070b1f]">
            {identity.photoUrl.trim() ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={identity.photoUrl.trim()} alt="" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <h3 className="mt-3 truncate text-lg font-semibold text-white">{fullName}</h3>
          <p className="mt-0.5 line-clamp-2 text-sm text-white/55">
            {identity.headline.trim() || primaryDomain?.label || "Votre titre professionnel"}
          </p>

          <div
            className={cn(
              "mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium",
              wantsCertification ? "bg-[#7C83FF]/20 text-[#C9CCFF]" : "bg-white/[0.06] text-white/50",
            )}
          >
            <BadgeCheck className="h-3.5 w-3.5" />
            {wantsCertification ? "Certification Byound en cours" : "Réseau Byound"}
          </div>

          {primaryDomain ? (
            <PreviewSection title="Domaines">
              <Tag accent>{primaryDomain.label}</Tag>
              {secondaryDomains.map((d) => (
                <Tag key={d.id}>{d.label}</Tag>
              ))}
            </PreviewSection>
          ) : null}

          {profile.specialtyKeys.length > 0 ? (
            <PreviewSection title="Spécialités">
              {profile.specialtyKeys.slice(0, 8).map((key) => (
                <Tag key={key}>{getSpecialtyLabel(key)}</Tag>
              ))}
              {profile.specialtyKeys.length > 8 ? <Tag>+{profile.specialtyKeys.length - 8}</Tag> : null}
            </PreviewSection>
          ) : null}

          {profile.formats.length > 0 ? (
            <PreviewSection title="Formats">
              {profile.formats.map((f) => (
                <Tag key={f}>{f}</Tag>
              ))}
            </PreviewSection>
          ) : null}

          {profile.audiences.length > 0 ? (
            <PreviewSection title="Public">
              {profile.audiences.map((a) => (
                <Tag key={a}>{a}</Tag>
              ))}
            </PreviewSection>
          ) : null}

          {hasDetails || profile.yearsExperience ? (
            <div className="mt-5 space-y-2 border-t border-white/[0.06] pt-4 text-xs text-white/50">
              {profile.geographicZones.length > 0 ? (
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/30" />
                  {profile.geographicZones.join(" · ")}
                </p>
              ) : null}
              {profile.languages.length > 0 ? (
                <p className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 shrink-0 text-white/30" />
                  {profile.languages.join(" · ")}
                </p>
              ) : null}
              {profile.availabilities.length > 0 ? (
                <p className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/30" />
                  {profile.availabilities.join(" · ")}
                </p>
              ) : null}
              {profile.yearsExperience ? <p>{profile.yearsExperience} d&apos;expérience</p> : null}
            </div>
          ) : null}
        </div>
      </div>

      <p className="mt-4 px-2 text-center text-xs leading-relaxed text-white/35">
        Chaque profil est validé par l&apos;équipe Byound avant publication.
      </p>
    </div>
  );
}
