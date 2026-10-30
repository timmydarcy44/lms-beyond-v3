"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Award, Globe, MapPin, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { syncCareProfileFromExpertAccount } from "@/app/dashboard/expert/space-actions";
import type { CareListingSettings } from "@/lib/care/listing-settings";
import { CARE_PUBLICS, careCompleteness } from "@/lib/care/completeness";
import { CarePhotoField } from "@/components/expert/care-photo-field";
import { CARE_DOMAINS } from "@/lib/care/domains";
import { CARE_PAYMENT_LABELS } from "@/lib/care/profile-format";
import { useExpertAccess } from "@/components/expert/expert-access-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { edgeCertificationLabel, isEdgeCertified } from "@/lib/expert/expert-certification";
import { expertReviewStatusLabel } from "@/lib/expert/expert-access";
import {
  computeProfileCompletion,
  mergeRegistrationMeta,
  parseRegistrationMeta,
  stripRegistrationMeta,
} from "@/lib/expert/expert-registration-meta";
import { EXPERT_PROFILE_SELECT_TIERS, isMissingColumnError } from "@/lib/expert/expert-profile-select";
import {
  EXPERT_AUDIENCES,
  EXPERT_AVAILABILITY_OPTIONS,
  EXPERT_EXPERIENCE_OPTIONS,
  EXPERT_GEOGRAPHIC_ZONES,
  EXPERT_INTERVENTION_FORMATS,
  EXPERT_LANGUAGE_OPTIONS,
} from "@/lib/expert/specialties-referential";
import { cn } from "@/lib/utils";

type ExpertReference = { company: string; project: string };

function safeReferences(v: unknown): ExpertReference[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x) => typeof x === "object" && x && (x as { _type?: string })._type !== "edge_registration_meta")
    .map((x: any) => ({
      company: typeof x.company === "string" ? x.company : "",
      project: typeof x.project === "string" ? x.project : "",
    }))
    .filter((r) => r.company.trim() || r.project.trim());
}

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

export function ExpertProfileEditor({ careListing = null }: { careListing?: CareListingSettings | null }) {
  const { expert: ctxExpert } = useExpertAccess();
  const supabase = useSupabase();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [headline, setHeadline] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [bio, setBio] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [dailyRate, setDailyRate] = useState("");
  const [legalName, setLegalName] = useState("");
  const [siret, setSiret] = useState("");
  const [vatLiable, setVatLiable] = useState(false);

  const [domains, setDomains] = useState<string[]>([]);
  const [primaryDomain, setPrimaryDomain] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [formats, setFormats] = useState<string[]>([]);
  const [audiences, setAudiences] = useState<string[]>([]);

  const [geographicZones, setGeographicZones] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [availabilities, setAvailabilities] = useState<string[]>([]);
  const [yearsExperience, setYearsExperience] = useState("");

  const [references, setReferences] = useState<ExpertReference[]>([]);
  const [reviewStatus, setReviewStatus] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [wantsCertification, setWantsCertification] = useState(false);
  const [certificationStatus, setCertificationStatus] = useState<string | null>(null);

  const [carePublished, setCarePublished] = useState(Boolean(careListing?.published));
  const [careTagline, setCareTagline] = useState(careListing?.tagline ?? "");
  const [careApproach, setCareApproach] = useState(careListing?.approach ?? "");
  const [careCity, setCareCity] = useState(careListing?.city ?? "");
  const [careAddress, setCareAddress] = useState(careListing?.address ?? "");
  const [carePublics, setCarePublics] = useState<string[]>(careListing?.publics ?? []);
  const [careDomains, setCareDomains] = useState<string[]>(careListing?.careDomains ?? []);
  const [careNotice, setCareNotice] = useState(String(careListing?.cancellationHours ?? 24));
  const [carePayments, setCarePayments] = useState<string[]>(careListing?.paymentMethods?.length ? careListing.paymentMethods : ["on_site"]);
  const [bioLong, setBioLong] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydrated = useRef(false);
  const autosaveEnabled = useRef(false);

  const hydrateFromRow = useCallback((data: Record<string, unknown>, userEmail?: string) => {
    const meta = parseRegistrationMeta(data.references);
    setFirstName(String(data.first_name ?? ctxExpert.first_name ?? "").trim());
    setLastName(String(data.last_name ?? ctxExpert.last_name ?? "").trim());
    setEmail(String(data.email ?? userEmail ?? ctxExpert.email ?? "").trim());
    setHeadline(String(data.headline ?? ctxExpert.headline ?? "").trim());
    setAvatarUrl(
      String(data.avatar_url ?? data.photo_url ?? meta?.photo_url ?? ctxExpert.avatar_url ?? "").trim(),
    );
    setLinkedinUrl(String(data.linkedin_url ?? meta?.linkedin_url ?? ctxExpert.linkedin_url ?? "").trim());
    setBio(String(data.bio ?? ctxExpert.bio ?? "").trim());
    setBioLong(String(data.bio_long ?? meta?.bio_long ?? "").trim());
    setWebsiteUrl(String(data.website_url ?? meta?.website_url ?? "").trim());
    setDailyRate(
      data.daily_rate != null
        ? String(data.daily_rate)
        : meta?.daily_rate != null
          ? String(meta.daily_rate)
          : "",
    );
    setLegalName(meta?.legal_name ?? "");
    setSiret(meta?.siret ?? "");
    setVatLiable(meta?.vat_liable === true);
    setDomains(meta?.domains?.length ? meta.domains : ((data.specialties as string[]) ?? ctxExpert.specialties ?? []));
    setPrimaryDomain(meta?.primary_domain ?? meta?.domains?.[0] ?? "");
    setSpecialties((data.specialties as string[]) ?? ctxExpert.specialties ?? []);
    setFormats((data.formats_supported as string[]) ?? ctxExpert.formats_supported ?? []);
    setAudiences(meta?.audiences ?? []);
    setGeographicZones(
      meta?.geographic_zones?.length ? meta.geographic_zones : ((data.regions as string[]) ?? ctxExpert.regions ?? []),
    );
    setLanguages(meta?.languages ?? []);
    setAvailabilities(meta?.availabilities ?? []);
    setYearsExperience(meta?.years_experience ?? "");
    setReferences(safeReferences(data.references ?? ctxExpert.references));
    setReviewStatus(String(data.review_status ?? ctxExpert.review_status ?? "pending_review"));
    setIsActive(data.is_active === true || ctxExpert.is_active === true);
    setWantsCertification(data.wants_certification === true || ctxExpert.wants_certification === true);
    setCertificationStatus(String(data.certification_status ?? ctxExpert.certification_status ?? ""));
  }, [ctxExpert]);

  useEffect(() => {
    if (!hydrated.current) {
      hydrateFromRow(ctxExpert as Record<string, unknown>, undefined);
      hydrated.current = true;
      setLoading(false);
    }
  }, [ctxExpert, hydrateFromRow]);

  useEffect(() => {
    if (loading) return;
    if (window.location.hash !== "#tarif") return;
    document.getElementById("tarif")?.scrollIntoView({ block: "center" });
  }, [loading]);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id ?? ctxExpert.id;

        let row: Record<string, unknown> | null = null;
        for (const select of EXPERT_PROFILE_SELECT_TIERS) {
          const { data, error } = await supabase.from("experts").select(select).eq("id", userId).maybeSingle();
          if (!error && data) {
            row = data as Record<string, unknown>;
            break;
          }
          if (error && !isMissingColumnError(error)) break;
        }

        if (!cancelled && row) {
          hydrateFromRow(row, userData.user?.email);
        }
      } catch {
        /* Le contexte layout fournit déjà le profil — pas d'erreur affichée */
      } finally {
        if (!cancelled) {
          setLoading(false);
          autosaveEnabled.current = true;
        }
      }
    }
    refresh();
    return () => {
      cancelled = true;
    };
  }, [ctxExpert.id, supabase, hydrateFromRow]);

  const name = useMemo(() => `${firstName} ${lastName}`.trim() || "Votre nom", [firstName, lastName]);
  const careGauge = useMemo(
    () =>
      careCompleteness({
        avatar_url: avatarUrl,
        tagline: careTagline,
        bio,
        approach: careApproach || bioLong,
        domains: careDomains,
        city: careCity,
        offers_cabinet: formats.some((item) => /cabinet|presentiel|sur site/i.test(item)),
        offers_visio: formats.some((item) => /visio|distanciel|en ligne/i.test(item)),
        services: (careListing?.serviceNames ?? []).map((serviceName) => ({ name: serviceName, active: true, price_cents: 1 })),
      }),
    [avatarUrl, bio, bioLong, careApproach, careCity, careDomains, careListing?.serviceNames, careTagline, formats],
  );
  const completionPct = computeProfileCompletion({
    firstName,
    lastName,
    headline,
    bio,
    avatarUrl,
    specialties,
    formats,
    domains,
    zones: geographicZones,
    languages,
  });
  const certified = isEdgeCertified({
    certification_status: certificationStatus,
    is_certified_beyond: ctxExpert.is_certified_beyond,
  });

  const persistProfile = useCallback(async () => {
    setSaveState("saving");
    try {
      const metaPatch = {
        primary_domain: primaryDomain || domains[0] || null,
        secondary_domains: domains.filter((d) => d !== primaryDomain),
        domains,
        audiences,
        years_experience: yearsExperience || null,
        geographic_zones: geographicZones,
        languages,
        availabilities,
        photo_url: avatarUrl || null,
        linkedin_url: linkedinUrl || null,
        bio_long: bioLong.trim() || null,
        website_url: websiteUrl.trim() || null,
        daily_rate: dailyRate.trim() ? Number(dailyRate) : null,
        legal_name: legalName.trim() || null,
        siret: siret.replace(/\s+/g, "") || null,
        vat_liable: vatLiable,
      };

      const refsWithMeta = mergeRegistrationMeta(
        [...stripRegistrationMeta(references), ...references],
        metaPatch,
      );

      const stepFromCompletion = Math.round((completionPct / 100) * 5);

      const payload: Record<string, unknown> = {
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        headline: headline.trim() || null,
        bio: bio.trim() || null,
        bio_long: bioLong.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        photo_url: avatarUrl.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        website_url: websiteUrl.trim() || null,
        daily_rate: dailyRate.trim() ? Number(dailyRate) : null,
        specialties,
        formats_supported: formats,
        regions: geographicZones,
        references: refsWithMeta,
        registration_step: stepFromCompletion,
      };

      let { error } = await supabase.from("experts").update(payload).eq("id", ctxExpert.id);
      if (error && isMissingColumnError(error)) {
        const fallback = { ...payload };
        delete fallback.bio_long;
        delete fallback.website_url;
        delete fallback.daily_rate;
        ({ error } = await supabase.from("experts").update(fallback).eq("id", ctxExpert.id));
      }
      if (error) throw error;
      const synced = await syncCareProfileFromExpertAccount(
        careListing
          ? {
              published: carePublished,
              tagline: careTagline,
              approach: careApproach,
              city: careCity,
              address: careAddress,
              publics: carePublics,
              careDomains,
              cancellationHours: Number(careNotice) || 24,
              paymentMethods: carePayments,
            }
          : undefined,
      );
      if (synced && "ok" in synced && synced.ok === false && "error" in synced && synced.error) {
        throw new Error(synced.error);
      }
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch (err) {
      setSaveState("idle");
      const message =
        err && typeof err === "object" && "message" in err && String((err as { message?: string }).message).trim()
          ? String((err as { message: string }).message)
          : "Impossible d'enregistrer les modifications.";
      toast.error(message);
    }
  }, [
    audiences,
    avatarUrl,
    bio,
    bioLong,
    completionPct,
    ctxExpert.id,
    dailyRate,
    domains,
    firstName,
    formats,
    geographicZones,
    headline,
    languages,
    lastName,
    linkedinUrl,
    primaryDomain,
    references,
    specialties,
    supabase,
    websiteUrl,
    yearsExperience,
    availabilities,
    legalName,
    siret,
    vatLiable,
    careListing,
    carePublished,
    careTagline,
    careApproach,
    careCity,
    careAddress,
    carePublics,
    careDomains,
    careNotice,
    carePayments,
  ]);

  const scheduleAutosave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persistProfile();
    }, 1200);
  }, [persistProfile]);

  const handleSave = async () => {
    setSaving(true);
    await persistProfile();
    setSaving(false);
    toast.success("Profil mis à jour.");
  };

  const skipAutosave = useRef(true);
  useEffect(() => {
    if (loading || !autosaveEnabled.current) return;
    if (skipAutosave.current) {
      skipAutosave.current = false;
      return;
    }
    scheduleAutosave();
  }, [
    loading,
    firstName,
    lastName,
    headline,
    avatarUrl,
    linkedinUrl,
    websiteUrl,
    dailyRate,
    bio,
    bioLong,
    domains,
    primaryDomain,
    specialties,
    formats,
    audiences,
    geographicZones,
    languages,
    availabilities,
    yearsExperience,
    references,
    legalName,
    siret,
    vatLiable,
    carePublished,
    careTagline,
    careApproach,
    careCity,
    careAddress,
    carePublics,
    careDomains,
    careNotice,
    carePayments,
    scheduleAutosave,
  ]);

  const TagPicker = ({
    options,
    selected,
    onChange,
    labels,
  }: {
    options: readonly string[];
    selected: string[];
    onChange: (next: string[]) => void;
    labels?: Record<string, string>;
  }) => (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(toggleInList(selected, opt))}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition",
              active
                ? "border-[#635BFF]/30 bg-[#635BFF]/10 text-[#A9AEFF]"
                : "border-white/10 bg-white/[0.05] text-white/60 hover:border-[#635BFF]/20",
            )}
          >
            {labels?.[opt] ?? opt}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#070b1f] text-white">
      <main className="min-h-screen">
        <div className="mx-auto max-w-5xl px-6 py-10 pb-24">
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A9AEFF]">Mon profil</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">{name}</h1>
              <p className="mt-2 text-sm text-white/55">Retrouvez et complétez les informations de votre candidature.</p>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="inline-flex items-center justify-center rounded-2xl bg-[#635BFF] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8D93FF] disabled:opacity-60"
            >
              {saving || saveState === "saving"
                ? "Enregistrement…"
                : saveState === "saved"
                  ? "Enregistré"
                  : "Enregistrer"}
            </button>
          </header>

          {loading ? (
            <div className="rounded-[28px] border border-white/[0.07] bg-[#10173a]/70 p-10 text-center text-sm text-white/50">
              Chargement…
            </div>
          ) : (
            <div className="space-y-6">
              <section className="overflow-hidden rounded-[28px] border border-white/[0.07] bg-[#10173a]/70 shadow-sm">
                <div className="h-28 bg-[linear-gradient(135deg,rgba(99,91,255,0.18),rgba(5,5,5,0.04))]" />
                <div className="relative px-6 pb-6 sm:px-8">
                  <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-end gap-4">
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-[#635BFF]/10 shadow-md">
                        {avatarUrl ? (
                          <Image src={avatarUrl} alt={name} fill className="object-cover" sizes="96px" unoptimized />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-[#A9AEFF]">
                            {(firstName[0] ?? "E").toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="pb-1">
                        <h2 className="text-2xl font-semibold tracking-tight">{name}</h2>
                        <p className="mt-1 text-sm text-white/60">{headline || "Ajoutez votre accroche professionnelle"}</p>
                      </div>
                    </div>
                    <p className="text-xs text-white/40">Sauvegarde automatique activée</p>
                  </div>
                </div>
              </section>
              <section className="rounded-[28px] border border-white/[0.07] bg-[#10173a]/70 p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Statut</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-[#635BFF]/20 bg-[#635BFF]/8 px-3 py-1 text-xs font-medium text-[#A9AEFF]">
                    {expertReviewStatusLabel(reviewStatus)}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-white/55">
                    {isActive ? "Profil actif" : "Profil inactif"}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-white/55">
                    {edgeCertificationLabel({
                      wants_certification: wantsCertification,
                      certification_status: certificationStatus,
                      is_certified_beyond: certified,
                    })}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-white/45">
                    <span>Complétion du profil</span>
                    <span className="text-[#A9AEFF]">{completionPct}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[#050505]/6">
                    <div className="h-full rounded-full bg-[#635BFF]" style={{ width: `${completionPct}%` }} />
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-white/[0.07] bg-[#10173a]/70 p-6 shadow-sm sm:p-8">
                <h2 className="text-sm font-semibold">Identité</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2 flex items-center gap-4">
                    <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-[#635BFF]/15 bg-[#635BFF]/5">
                      {avatarUrl ? (
                        <Image src={avatarUrl} alt={name} fill className="object-cover" sizes="80px" unoptimized />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-[#A9AEFF]">
                          {(firstName[0] ?? "E").toUpperCase()}
                        </div>
                      )}
                    </div>
                    <input
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="URL de la photo"
                      className="flex-1 rounded-2xl border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#7C83FF]/70"
                    />
                  </div>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Prénom" className="rounded-2xl border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#7C83FF]/70" />
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nom" className="rounded-2xl border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#7C83FF]/70" />
                  <input value={email} readOnly className="sm:col-span-2 rounded-2xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 text-sm text-white/55" />
                  <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Headline" className="sm:col-span-2 rounded-2xl border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#7C83FF]/70" />
                  <input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="LinkedIn (URL)" className="sm:col-span-2 rounded-2xl border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#7C83FF]/70" />
                  <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="Site internet / portfolio" className="sm:col-span-2 rounded-2xl border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#7C83FF]/70" />
                </div>
              </section>

              <section id="facturation" className="rounded-[28px] border border-white/[0.07] bg-[#10173a]/70 p-6 shadow-sm sm:p-8">
                <h2 className="text-sm font-semibold">Société / auto-entreprise</h2>
                <p className="mt-1 text-xs text-white/45">
                  Ces mentions apparaissent sur vos factures Byound Care. Si vous n&apos;êtes pas assujetti à la TVA, la mention de l&apos;article 293 B du CGI est ajoutée automatiquement.
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <input
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    placeholder="Raison sociale ou nom de l'auto-entreprise"
                    className="sm:col-span-2 rounded-2xl border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#7C83FF]/70"
                  />
                  <input
                    value={siret}
                    onChange={(e) => setSiret(e.target.value)}
                    placeholder="Numéro SIRET"
                    inputMode="numeric"
                    className="rounded-2xl border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#7C83FF]/70"
                  />
                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm">
                    <input
                      type="checkbox"
                      checked={vatLiable}
                      onChange={(e) => setVatLiable(e.target.checked)}
                      className="h-4 w-4 accent-[#FF4B4B]"
                    />
                    Assujetti à la TVA
                  </label>
                </div>
                {!vatLiable ? (
                  <p className="mt-3 text-xs text-white/45">
                    Mention facture : TVA non applicable, article 293 B du CGI.
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-white/45">Mention facture : TVA applicable.</p>
                )}
              </section>

              <section id="tarif" className="rounded-[28px] border border-white/[0.07] bg-[#10173a]/70 p-6 shadow-sm sm:p-8">
                <h2 className="text-sm font-semibold">Tarif journalier</h2>
                <p className="mt-1 text-xs text-white/45">Montant en euros pour une journée. Il reste privé et n&apos;apparaît pas sur le profil public.</p>
                <label className="mt-5 block text-xs font-medium text-white/70">
                  Tarif journalier (€)
                  <input
                    value={dailyRate}
                    onChange={(e) => setDailyRate(e.target.value)}
                    inputMode="decimal"
                    placeholder="Ex. 650"
                    className="mt-2 w-full max-w-xs rounded-2xl border border-white/15 bg-[#1E2130] px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-[#FF4B4B]"
                  />
                </label>
              </section>

              <section className="rounded-[28px] border border-white/[0.07] bg-[#10173a]/70 p-6 shadow-sm sm:p-8">
                <h2 className="text-sm font-semibold">Spécialités</h2>
                <p className="mt-1 text-xs text-white/45">Domaines et spécialités issus de votre inscription.</p>
                <div className="mt-5 space-y-5">
                  <div>
                    <p className="text-xs font-medium text-white/45">Domaine principal</p>
                    <input
                      value={primaryDomain}
                      onChange={(e) => setPrimaryDomain(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#7C83FF]/70"
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium text-white/45">Domaines</p>
                    <TagPicker options={domains.length ? domains : ["—"]} selected={domains} onChange={setDomains} />
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium text-white/45">Spécialités</p>
                    <div className="flex flex-wrap gap-2">
                      {specialties.map((s) => (
                        <span key={s} className="rounded-full border border-[#635BFF]/15 bg-[#635BFF]/8 px-3 py-1 text-xs text-[#A9AEFF]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium text-white/45">Formats d&apos;intervention</p>
                    <TagPicker options={EXPERT_INTERVENTION_FORMATS} selected={formats} onChange={setFormats} />
                  </div>
                  <div>
                    <p className="mb-2 flex items-center gap-1 text-xs font-medium text-white/45">
                      <Users className="h-3.5 w-3.5" /> Publics accompagnés
                    </p>
                    <TagPicker options={EXPERT_AUDIENCES} selected={audiences} onChange={setAudiences} />
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-white/[0.07] bg-[#10173a]/70 p-6 shadow-sm sm:p-8">
                <h2 className="text-sm font-semibold">Zone & modalités</h2>
                <div className="mt-5 space-y-5">
                  <div>
                    <p className="mb-2 flex items-center gap-1 text-xs font-medium text-white/45">
                      <MapPin className="h-3.5 w-3.5" /> Zones géographiques
                    </p>
                    <TagPicker options={EXPERT_GEOGRAPHIC_ZONES} selected={geographicZones} onChange={setGeographicZones} />
                  </div>
                  <div>
                    <p className="mb-2 flex items-center gap-1 text-xs font-medium text-white/45">
                      <Globe className="h-3.5 w-3.5" /> Langues
                    </p>
                    <TagPicker options={EXPERT_LANGUAGE_OPTIONS} selected={languages} onChange={setLanguages} />
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium text-white/45">Disponibilités</p>
                    <TagPicker options={EXPERT_AVAILABILITY_OPTIONS} selected={availabilities} onChange={setAvailabilities} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white/45">Expérience</p>
                    <select
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm outline-none focus:border-[#7C83FF]/70"
                    >
                      <option value="">—</option>
                      {EXPERT_EXPERIENCE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              {careListing ? (
                <section id="byound-care" className="rounded-[28px] border border-white/[0.07] bg-[#10173a]/70 p-6 shadow-sm sm:p-8">
                  <h2 className="text-sm font-semibold">Byound Care</h2>
                  <p className="mt-1 text-xs text-white/45">
                    Score d&apos;optimisation {careGauge.percent} %. Ces points rendent la fiche plus facile à choisir. Aucun n&apos;empêche de la publier.
                  </p>
                  <ul className="mt-3 grid gap-1 text-xs text-white/70">
                    {careGauge.checks.map((item) => (
                      <li key={item.id}>{item.ok ? "✓" : "·"} {item.label}</li>
                    ))}
                  </ul>
                  <CarePhotoField expertId={ctxExpert.id} value={avatarUrl || null} onChange={setAvatarUrl} />
                  <label className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm">
                    Publier mon profil
                    <input
                      type="checkbox"
                      checked={carePublished}
                      onChange={(e) => setCarePublished(e.target.checked)}
                      className="h-4 w-4 accent-[#FF4B4B]"
                    />
                  </label>
                  {careListing.slug ? (
                    <p className="mt-2 text-xs text-white/45">
                      Fiche : /praticiens/{careListing.slug}
                    </p>
                  ) : null}
                  <div className="mt-5 grid gap-4">
                    <input
                      value={careTagline}
                      onChange={(e) => setCareTagline(e.target.value)}
                      placeholder="Accroche courte (une phrase)"
                      className="rounded-2xl border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#7C83FF]/70"
                    />
                    <textarea
                      value={careApproach}
                      onChange={(e) => setCareApproach(e.target.value)}
                      rows={4}
                      placeholder="Mon approche"
                      className="w-full resize-none rounded-2xl border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#7C83FF]/70"
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <input
                        value={careCity}
                        onChange={(e) => setCareCity(e.target.value)}
                        placeholder="Ville"
                        className="rounded-2xl border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#7C83FF]/70"
                      />
                      <input
                        value={careAddress}
                        onChange={(e) => setCareAddress(e.target.value)}
                        placeholder="Adresse du cabinet (optionnel)"
                        className="rounded-2xl border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#7C83FF]/70"
                      />
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-medium text-white/45">Domaines Care</p>
                      <TagPicker
                        options={CARE_DOMAINS.map((item) => item.id)}
                        selected={careDomains}
                        onChange={setCareDomains}
                        labels={Object.fromEntries(CARE_DOMAINS.map((item) => [item.id, item.label]))}
                      />
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-medium text-white/45">Publics Care</p>
                      <TagPicker options={[...CARE_PUBLICS]} selected={carePublics} onChange={setCarePublics} />
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-medium text-white/45">Paiement</p>
                      <TagPicker options={Object.keys(CARE_PAYMENT_LABELS)} selected={carePayments} onChange={setCarePayments} labels={CARE_PAYMENT_LABELS} />
                    </div>
                    <label className="text-xs font-medium text-white/45">
                      Annulation gratuite (heures)
                      <input
                        value={careNotice}
                        onChange={(e) => setCareNotice(e.target.value)}
                        inputMode="numeric"
                        className="mt-2 w-full max-w-xs rounded-2xl border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#7C83FF]/70"
                      />
                    </label>
                  </div>
                </section>
              ) : null}

              <section className="rounded-[28px] border border-white/[0.07] bg-[#10173a]/70 p-6 shadow-sm sm:p-8">
                <h2 className="text-sm font-semibold">Présentation</h2>
                <div className="mt-5 space-y-4">
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    placeholder="Bio courte"
                    className="w-full resize-none rounded-2xl border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#7C83FF]/70"
                  />
                  <textarea
                    value={bioLong}
                    onChange={(e) => setBioLong(e.target.value)}
                    rows={6}
                    placeholder="Approche pédagogique, expériences…"
                    className="w-full resize-none rounded-2xl border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#7C83FF]/70"
                  />
                  {references.map((ref, i) => (
                    <div key={i} className="grid gap-2 sm:grid-cols-2">
                      <input
                        value={ref.company}
                        onChange={(e) =>
                          setReferences((prev) => prev.map((r, j) => (j === i ? { ...r, company: e.target.value } : r)))
                        }
                        placeholder="Entreprise"
                        className="rounded-2xl border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#7C83FF]/70"
                      />
                      <input
                        value={ref.project}
                        onChange={(e) =>
                          setReferences((prev) => prev.map((r, j) => (j === i ? { ...r, project: e.target.value } : r)))
                        }
                        placeholder="Projet / mission"
                        className="rounded-2xl border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#7C83FF]/70"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setReferences((prev) => [...prev, { company: "", project: "" }])}
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#A9AEFF]"
                  >
                    <Plus className="h-4 w-4" /> Ajouter une référence
                  </button>
                  <Link
                    href="/dashboard/expert/documents"
                    className="mt-4 inline-flex text-sm font-medium text-[#A9AEFF] hover:underline"
                  >
                    Ajouter CV / justificatifs →
                  </Link>
                </div>
              </section>

              {wantsCertification ? (
                <section className="rounded-[28px] border border-[#635BFF]/15 bg-[#635BFF]/6 p-6">
                  <div className="flex items-start gap-3">
                    <Award className="h-5 w-5 text-[#A9AEFF]" aria-hidden />
                    <div>
                      <p className="text-sm font-semibold">Demande Byound Certified enregistrée</p>
                      <p className="mt-1 text-sm text-white/55">Votre dossier sera examiné après validation de votre profil.</p>
                    </div>
                  </div>
                </section>
              ) : null}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
