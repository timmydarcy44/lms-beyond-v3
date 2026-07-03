"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Award, Globe, MapPin, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import SidebarExpert from "@/components/SidebarExpert";
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

export function ExpertProfileEditor() {
  const { expert: ctxExpert, isApproved } = useExpertAccess();
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
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("idle");
      toast.error("Impossible d'enregistrer les modifications.");
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
    scheduleAutosave,
  ]);

  const TagPicker = ({
    options,
    selected,
    onChange,
  }: {
    options: readonly string[];
    selected: string[];
    onChange: (next: string[]) => void;
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
                ? "border-[#635BFF]/30 bg-[#635BFF]/10 text-[#635BFF]"
                : "border-[#050505]/10 bg-white text-[#050505]/60 hover:border-[#635BFF]/20",
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#050505]">
      <SidebarExpert restricted={!isApproved} />
      <main className="min-h-screen pl-[260px]">
        <div className="mx-auto max-w-5xl px-6 py-10 pb-24">
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#635BFF]">Mon profil</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">{name}</h1>
              <p className="mt-2 text-sm text-[#050505]/55">Retrouvez et complétez les informations de votre candidature.</p>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="inline-flex items-center justify-center rounded-2xl bg-[#635BFF] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7B74FF] disabled:opacity-60"
            >
              {saving || saveState === "saving"
                ? "Enregistrement…"
                : saveState === "saved"
                  ? "Enregistré"
                  : "Enregistrer"}
            </button>
          </header>

          {loading ? (
            <div className="rounded-[28px] border border-[#050505]/8 bg-white p-10 text-center text-sm text-[#050505]/50">
              Chargement…
            </div>
          ) : (
            <div className="space-y-6">
              <section className="overflow-hidden rounded-[28px] border border-[#050505]/8 bg-white shadow-sm">
                <div className="h-28 bg-[linear-gradient(135deg,rgba(99,91,255,0.18),rgba(5,5,5,0.04))]" />
                <div className="relative px-6 pb-6 sm:px-8">
                  <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-end gap-4">
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-[#635BFF]/10 shadow-md">
                        {avatarUrl ? (
                          <Image src={avatarUrl} alt={name} fill className="object-cover" sizes="96px" unoptimized />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-[#635BFF]">
                            {(firstName[0] ?? "E").toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="pb-1">
                        <h2 className="text-2xl font-semibold tracking-tight">{name}</h2>
                        <p className="mt-1 text-sm text-[#050505]/60">{headline || "Ajoutez votre accroche professionnelle"}</p>
                      </div>
                    </div>
                    <p className="text-xs text-[#050505]/40">Sauvegarde automatique activée</p>
                  </div>
                </div>
              </section>
              <section className="rounded-[28px] border border-[#050505]/8 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#050505]/40">Statut</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-[#635BFF]/20 bg-[#635BFF]/8 px-3 py-1 text-xs font-medium text-[#635BFF]">
                    {expertReviewStatusLabel(reviewStatus)}
                  </span>
                  <span className="rounded-full border border-[#050505]/10 bg-[#F7F7F5] px-3 py-1 text-xs font-medium text-[#050505]/55">
                    {isActive ? "Profil actif" : "Profil inactif"}
                  </span>
                  <span className="rounded-full border border-[#050505]/10 bg-[#F7F7F5] px-3 py-1 text-xs font-medium text-[#050505]/55">
                    {edgeCertificationLabel({
                      wants_certification: wantsCertification,
                      certification_status: certificationStatus,
                      is_certified_beyond: certified,
                    })}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-[#050505]/45">
                    <span>Complétion du profil</span>
                    <span className="text-[#635BFF]">{completionPct}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[#050505]/6">
                    <div className="h-full rounded-full bg-[#635BFF]" style={{ width: `${completionPct}%` }} />
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-[#050505]/8 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-sm font-semibold">Identité</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2 flex items-center gap-4">
                    <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-[#635BFF]/15 bg-[#635BFF]/5">
                      {avatarUrl ? (
                        <Image src={avatarUrl} alt={name} fill className="object-cover" sizes="80px" unoptimized />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-[#635BFF]">
                          {(firstName[0] ?? "E").toUpperCase()}
                        </div>
                      )}
                    </div>
                    <input
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="URL de la photo"
                      className="flex-1 rounded-2xl border border-[#050505]/10 px-4 py-3 text-sm outline-none focus:border-[#635BFF]/40"
                    />
                  </div>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Prénom" className="rounded-2xl border border-[#050505]/10 px-4 py-3 text-sm outline-none focus:border-[#635BFF]/40" />
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nom" className="rounded-2xl border border-[#050505]/10 px-4 py-3 text-sm outline-none focus:border-[#635BFF]/40" />
                  <input value={email} readOnly className="sm:col-span-2 rounded-2xl border border-[#050505]/8 bg-[#F7F7F5] px-4 py-3 text-sm text-[#050505]/55" />
                  <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Headline" className="sm:col-span-2 rounded-2xl border border-[#050505]/10 px-4 py-3 text-sm outline-none focus:border-[#635BFF]/40" />
                  <input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="LinkedIn (URL)" className="sm:col-span-2 rounded-2xl border border-[#050505]/10 px-4 py-3 text-sm outline-none focus:border-[#635BFF]/40" />
                  <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="Site internet / portfolio" className="rounded-2xl border border-[#050505]/10 px-4 py-3 text-sm outline-none focus:border-[#635BFF]/40" />
                  <input value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} placeholder="Tarif journalier (€)" className="rounded-2xl border border-[#050505]/10 px-4 py-3 text-sm outline-none focus:border-[#635BFF]/40" />
                </div>
              </section>

              <section className="rounded-[28px] border border-[#050505]/8 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-sm font-semibold">Spécialités</h2>
                <p className="mt-1 text-xs text-[#050505]/45">Domaines et spécialités issus de votre inscription.</p>
                <div className="mt-5 space-y-5">
                  <div>
                    <p className="text-xs font-medium text-[#050505]/45">Domaine principal</p>
                    <input
                      value={primaryDomain}
                      onChange={(e) => setPrimaryDomain(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-[#050505]/10 px-4 py-3 text-sm outline-none focus:border-[#635BFF]/40"
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium text-[#050505]/45">Domaines</p>
                    <TagPicker options={domains.length ? domains : ["—"]} selected={domains} onChange={setDomains} />
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium text-[#050505]/45">Spécialités</p>
                    <div className="flex flex-wrap gap-2">
                      {specialties.map((s) => (
                        <span key={s} className="rounded-full border border-[#635BFF]/15 bg-[#635BFF]/8 px-3 py-1 text-xs text-[#635BFF]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium text-[#050505]/45">Formats d&apos;intervention</p>
                    <TagPicker options={EXPERT_INTERVENTION_FORMATS} selected={formats} onChange={setFormats} />
                  </div>
                  <div>
                    <p className="mb-2 flex items-center gap-1 text-xs font-medium text-[#050505]/45">
                      <Users className="h-3.5 w-3.5" /> Publics accompagnés
                    </p>
                    <TagPicker options={EXPERT_AUDIENCES} selected={audiences} onChange={setAudiences} />
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-[#050505]/8 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-sm font-semibold">Zone & modalités</h2>
                <div className="mt-5 space-y-5">
                  <div>
                    <p className="mb-2 flex items-center gap-1 text-xs font-medium text-[#050505]/45">
                      <MapPin className="h-3.5 w-3.5" /> Zones géographiques
                    </p>
                    <TagPicker options={EXPERT_GEOGRAPHIC_ZONES} selected={geographicZones} onChange={setGeographicZones} />
                  </div>
                  <div>
                    <p className="mb-2 flex items-center gap-1 text-xs font-medium text-[#050505]/45">
                      <Globe className="h-3.5 w-3.5" /> Langues
                    </p>
                    <TagPicker options={EXPERT_LANGUAGE_OPTIONS} selected={languages} onChange={setLanguages} />
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium text-[#050505]/45">Disponibilités</p>
                    <TagPicker options={EXPERT_AVAILABILITY_OPTIONS} selected={availabilities} onChange={setAvailabilities} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#050505]/45">Expérience</p>
                    <select
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-[#050505]/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#635BFF]/40"
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

              <section className="rounded-[28px] border border-[#050505]/8 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-sm font-semibold">Présentation</h2>
                <div className="mt-5 space-y-4">
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    placeholder="Bio courte"
                    className="w-full resize-none rounded-2xl border border-[#050505]/10 px-4 py-3 text-sm outline-none focus:border-[#635BFF]/40"
                  />
                  <textarea
                    value={bioLong}
                    onChange={(e) => setBioLong(e.target.value)}
                    rows={6}
                    placeholder="Approche pédagogique, expériences…"
                    className="w-full resize-none rounded-2xl border border-[#050505]/10 px-4 py-3 text-sm outline-none focus:border-[#635BFF]/40"
                  />
                  {references.map((ref, i) => (
                    <div key={i} className="grid gap-2 sm:grid-cols-2">
                      <input
                        value={ref.company}
                        onChange={(e) =>
                          setReferences((prev) => prev.map((r, j) => (j === i ? { ...r, company: e.target.value } : r)))
                        }
                        placeholder="Entreprise"
                        className="rounded-2xl border border-[#050505]/10 px-4 py-3 text-sm outline-none focus:border-[#635BFF]/40"
                      />
                      <input
                        value={ref.project}
                        onChange={(e) =>
                          setReferences((prev) => prev.map((r, j) => (j === i ? { ...r, project: e.target.value } : r)))
                        }
                        placeholder="Projet / mission"
                        className="rounded-2xl border border-[#050505]/10 px-4 py-3 text-sm outline-none focus:border-[#635BFF]/40"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setReferences((prev) => [...prev, { company: "", project: "" }])}
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#635BFF]"
                  >
                    <Plus className="h-4 w-4" /> Ajouter une référence
                  </button>
                  <Link
                    href="/dashboard/expert/documents"
                    className="mt-4 inline-flex text-sm font-medium text-[#635BFF] hover:underline"
                  >
                    Ajouter CV / justificatifs →
                  </Link>
                </div>
              </section>

              {wantsCertification ? (
                <section className="rounded-[28px] border border-[#635BFF]/15 bg-[#635BFF]/6 p-6">
                  <div className="flex items-start gap-3">
                    <Award className="h-5 w-5 text-[#635BFF]" aria-hidden />
                    <div>
                      <p className="text-sm font-semibold">Demande EDGE Certified enregistrée</p>
                      <p className="mt-1 text-sm text-[#050505]/55">Votre dossier sera examiné après validation de votre profil.</p>
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
