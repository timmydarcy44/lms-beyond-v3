"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import SidebarExpert from "@/components/SidebarExpert";
import { useSupabase } from "@/components/providers/supabase-provider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Award,
  Building2,
  Check,
  Globe,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Users,
  Video,
} from "lucide-react";

type OpenBadge = { name: string; issuer: string };
type ExpertReference = { company: string; project: string };

type ExpertRow = {
  id: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  headline: string | null;
  bio: string | null;
  bio_long?: string | null;
  calendly_url?: string | null;
  avatar_url?: string | null;
  photo_url?: string | null;
  regions?: string[] | null;
  specialties: string[] | null;
  formats_supported: string[] | null;
  formats: string[] | null;
  certification_status?: string | null;
  is_certified_beyond?: boolean | null;
  open_badges?: unknown;
  references?: unknown;
  registration_step?: number | null;
};

const DEFAULT_REGIONS = ["Île-de-France", "Lyon", "France", "Europe", "International (visio)"] as const;
const DEFAULT_MODALITIES = ["Visio", "Présentiel", "Accompagnement 1:1", "Atelier Collectif"] as const;
const DEFAULT_THEMES = [
  "Gestion du stress",
  "Leadership",
  "Communication non-violente",
  "Feedback & posture managériale",
  "Cohésion d'équipe",
  "Conduite du changement",
] as const;

type SectionKey = "identity" | "logistics" | "themes" | "bio" | "proofs";

function normalizeModalitiesToDb(mods: string[]): string[] {
  // DB historique: Visio / Présentiel / Individuel / Collectif
  return mods.map((m) => {
    if (m === "Accompagnement 1:1") return "Individuel";
    if (m === "Atelier Collectif") return "Collectif";
    return m;
  });
}

function normalizeModalitiesFromDb(mods: string[]): string[] {
  return mods.map((m) => {
    if (m === "Individuel") return "Accompagnement 1:1";
    if (m === "Collectif") return "Atelier Collectif";
    return m;
  });
}

function safeBadges(v: unknown): OpenBadge[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => (typeof x === "object" && x ? x : null))
    .filter(Boolean)
    .map((x: any) => ({
      name: typeof x.name === "string" ? x.name : "",
      issuer: typeof x.issuer === "string" ? x.issuer : "",
    }))
    .filter((b) => b.name.trim() || b.issuer.trim());
}

function safeReferences(v: unknown): ExpertReference[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => (typeof x === "object" && x ? x : null))
    .filter(Boolean)
    .map((x: any) => ({
      company: typeof x.company === "string" ? x.company : "",
      project: typeof x.project === "string" ? x.project : "",
    }))
    .filter((r) => r.company.trim() || r.project.trim());
}

function completionStepFromFields(fields: {
  identity: boolean;
  logistics: boolean;
  themes: boolean;
  bio: boolean;
  proofs: boolean;
}): number {
  // 0–5 (aligné avec le cockpit)
  return [fields.identity, fields.logistics, fields.themes, fields.bio, fields.proofs].filter(Boolean).length;
}

export default function ExpertProfilePage() {
  const supabase = useSupabase();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState<string>("");
  const [expertId, setExpertId] = useState<string | null>(null);

  // Identity
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [headline, setHeadline] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Logistics
  const [regions, setRegions] = useState<string[]>([]);
  const [modalities, setModalities] = useState<string[]>([]);

  // Themes & bio
  const [themes, setThemes] = useState<string[]>([]);
  const [newTheme, setNewTheme] = useState("");
  const [bio, setBio] = useState("");
  const [bioLong, setBioLong] = useState("");

  // Proofs
  const [badges, setBadges] = useState<OpenBadge[]>([]);
  const [references, setReferences] = useState<ExpertReference[]>([]);

  const [editing, setEditing] = useState<Record<SectionKey, boolean>>({
    identity: false,
    logistics: false,
    themes: false,
    bio: false,
    proofs: false,
  });

  const [certFlags, setCertFlags] = useState<{ is_certified_beyond: boolean; certification_status: string | null }>({
    is_certified_beyond: false,
    certification_status: null,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        const user = userData.user;
        if (!user) throw new Error("not_authenticated");
        if (!cancelled) {
          setEmail(user.email ?? "");
          setExpertId(user.id);
        }

        const { data, error: selectErr } = await supabase
          .from("experts")
          .select(
            "id,email,first_name,last_name,headline,bio,bio_long,calendly_url,avatar_url,photo_url,regions,specialties,formats_supported,formats,certification_status,is_certified_beyond,open_badges,references,registration_step",
          )
          .eq("id", user.id)
          .maybeSingle();
        if (selectErr) throw selectErr;
        const row = (data ?? null) as ExpertRow | null;
        if (cancelled) return;

        setFirstName(String(row?.first_name ?? "").trim());
        setLastName(String(row?.last_name ?? "").trim());
        setHeadline(String(row?.headline ?? "").trim());
        setAvatarUrl(String((row as any)?.avatar_url ?? (row as any)?.photo_url ?? "").trim());
        setRegions((((row as any)?.regions ?? []) as string[]).filter(Boolean));
        const rawModalities = (((row as any)?.formats_supported ?? (row as any)?.formats) ?? []) as string[];
        setModalities(normalizeModalitiesFromDb(rawModalities.filter(Boolean)));
        setThemes((((row as any)?.specialties ?? []) as string[]).filter(Boolean));
        setBio(String(row?.bio ?? "").trim());
        setBioLong(String((row as any)?.bio_long ?? "").trim());
        setBadges(safeBadges((row as any)?.open_badges));
        setReferences(safeReferences((row as any)?.references));
        setCertFlags({
          is_certified_beyond: (row as any)?.is_certified_beyond === true,
          certification_status: typeof (row as any)?.certification_status === "string" ? (row as any).certification_status : null,
        });
      } catch {
        if (!cancelled) setError("Impossible de charger votre profil expert.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const name = useMemo(() => {
    const full = `${firstName} ${lastName}`.trim();
    return full || "Votre nom";
  }, [firstName, lastName]);

  const mainSpecialty = useMemo(() => (themes[0]?.trim() ? themes[0] : "Spécialité principale"), [themes]);

  const certified =
    certFlags.is_certified_beyond || String(certFlags.certification_status ?? "").toLowerCase() === "certified";

  const sectionCompletion = useMemo(() => {
    const identityOk = Boolean(firstName.trim() && lastName.trim() && headline.trim());
    const logisticsOk = Boolean(regions.length > 0 && modalities.length > 0);
    const themesOk = themes.length > 0;
    const bioOk = Boolean(bio.trim() || bioLong.trim());
    const proofsOk = Boolean(badges.length > 0 || references.length > 0);
    return { identityOk, logisticsOk, themesOk, bioOk, proofsOk };
  }, [firstName, lastName, headline, regions, modalities, themes, bio, bioLong, badges, references]);

  const registrationStep = useMemo(
    () =>
      completionStepFromFields({
        identity: sectionCompletion.identityOk,
        logistics: sectionCompletion.logisticsOk,
        themes: sectionCompletion.themesOk,
        bio: sectionCompletion.bioOk,
        proofs: sectionCompletion.proofsOk,
      }),
    [sectionCompletion],
  );

  const completionPct = Math.round((Math.max(0, Math.min(5, registrationStep)) / 5) * 100);
  const canSave = useMemo(() => !!expertId && !saving, [expertId, saving]);

  const toggleEdit = (key: SectionKey) => setEditing((s) => ({ ...s, [key]: !s[key] }));

  const handleAvatarUpload = async (file: File) => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/avatar", { method: "POST", body: fd });
      const payload = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !payload.url) throw new Error(payload.error || "upload_failed");
      setAvatarUrl(payload.url);
      toast.success("Photo mise à jour. Pensez à enregistrer.");
    } catch {
      toast.error("Impossible d'uploader la photo.");
    }
  };

  const handleSave = async () => {
    if (!expertId || saving) return;
    setSaving(true);
    try {
      const cleanBadges = badges
        .map((b) => ({ name: b.name.trim(), issuer: b.issuer.trim() }))
        .filter((b) => b.name || b.issuer);
      const cleanRefs = references
        .map((r) => ({ company: r.company.trim(), project: r.project.trim() }))
        .filter((r) => r.company || r.project);

      const payloadBase: Record<string, unknown> = {
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        headline: headline.trim() || null,
        bio: bio.trim() || null,
        bio_long: bioLong.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        regions,
        specialties: themes,
        formats_supported: normalizeModalitiesToDb(modalities),
        open_badges: cleanBadges,
        references: cleanRefs,
        registration_step: registrationStep,
      };

      const attempts: Record<string, unknown>[] = [
        payloadBase,
        { ...payloadBase, formats: payloadBase.formats_supported },
        (() => {
          const { open_badges, references, ...rest } = payloadBase as any;
          return rest;
        })(),
        { headline: headline.trim() || null, bio: bio.trim() || null, registration_step: registrationStep },
      ];

      let ok = false;
      let lastErr: any = null;
      for (const p of attempts) {
        // eslint-disable-next-line no-await-in-loop
        const { error: e } = await supabase.from("experts").update(p).eq("id", expertId);
        if (!e) {
          ok = true;
          lastErr = null;
          break;
        }
        lastErr = e;
      }
      if (!ok && lastErr) throw lastErr;

      toast.success("Profil mis à jour.");
      setEditing({ identity: false, logistics: false, themes: false, bio: false, proofs: false });
    } catch {
      toast.error("Impossible d'enregistrer les modifications.");
    } finally {
      setSaving(false);
    }
  };

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
            <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Mon profil</div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Fiche expert (édition)</h1>
            <p className="mt-2 text-sm text-slate-600">Même layout que la vue DRH, avec édition par section.</p>
          </header>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100/90">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-600 shadow-sm">
            Chargement de votre fiche…
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <span>Complétion du profil</span>
                <span className="text-emerald-700">{completionPct}%</span>
              </div>
              <div
                className="mt-2 h-2 overflow-hidden rounded-full border border-slate-200 bg-slate-100"
                role="progressbar"
                aria-valuenow={completionPct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400/90 transition-[width] duration-500"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-slate-500">
                La barre est recalculée en live. Elle impacte `registration_step` lors de “Enregistrer”.
              </div>
            </div>

            {/* Header identité (layout DRH) */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Identité</div>
                <button
                  type="button"
                  onClick={() => toggleEdit("identity")}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                  {editing.identity ? "Fermer" : "Modifier"}
                </button>
              </div>

              <div className="mt-5 grid gap-6 md:grid-cols-[160px_1fr] md:items-center">
                <div className="relative h-40 w-40 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt={name} fill sizes="160px" className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-black text-emerald-800">
                      {(firstName.trim()[0] ?? "E").toUpperCase()}
                      {(lastName.trim()[0] ?? "X").toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Fiche expert</div>
                  <h2 className="mt-2 text-3xl font-extrabold tracking-tight">{name}</h2>
                  <div className="mt-2 text-sm font-semibold text-emerald-700">{mainSpecialty}</div>
                  <p className="mt-3 text-sm text-slate-600">{headline || "Ajoutez une accroche claire et orientée résultats."}</p>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    {certified ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-800 shadow-sm">
                        <Award className="h-4 w-4 text-emerald-600" aria-hidden />
                        Certifié Beyond
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-extrabold text-rose-800 shadow-sm">
                        <Award className="h-4 w-4 text-rose-600" aria-hidden />
                        Certification non active
                      </span>
                    )}
                  </div>

                  {editing.identity && (
                    <div className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
                      <div>
                        <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Prénom</div>
                        <input
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-300"
                        />
                      </div>
                      <div>
                        <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Nom</div>
                        <input
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-300"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Headline</div>
                        <input
                          value={headline}
                          onChange={(e) => setHeadline(e.target.value)}
                          placeholder="Ex: Coach Senior & Formateur Soft Skills"
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-300"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Photo (URL)</div>
                        <input
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          placeholder="https://..."
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-300"
                        />
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="text-xs text-slate-500">Ou uploader une image (retourne une URL).</div>
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50">
                            <Plus className="h-4 w-4" aria-hidden />
                            Uploader
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) void handleAvatarUpload(f);
                                e.currentTarget.value = "";
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="flex flex-col gap-6">
                {/* Thématiques */}
                <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-sm font-extrabold">Thématiques & expertise</h2>
                    <button
                      type="button"
                      onClick={() => toggleEdit("themes")}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-xs font-bold text-white/80 transition hover:border-white/25 hover:bg-white/[0.08]"
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                      {editing.themes ? "Fermer" : "Modifier"}
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {themes.length ? (
                      themes.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-semibold text-white/80"
                        >
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-white/55">Ajoutez vos thématiques principales.</span>
                    )}
                  </div>

                  {editing.themes && (
                    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                      <div className="text-xs font-black uppercase tracking-[0.18em] text-white/55">Ajouter / supprimer des tags</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {DEFAULT_THEMES.map((t) => {
                          const active = themes.includes(t);
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setThemes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))}
                              className={cn(
                                "rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] transition",
                                active
                                  ? "border-indigo-400/25 bg-indigo-400/10 text-indigo-100/90"
                                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
                              )}
                            >
                              {t}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          value={newTheme}
                          onChange={(e) => setNewTheme(e.target.value)}
                          placeholder="Ajouter un tag custom…"
                          className="w-full flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-emerald-400/25"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const v = newTheme.trim();
                            if (!v) return;
                            setThemes((prev) => (prev.includes(v) ? prev : [...prev, v]));
                            setNewTheme("");
                          }}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm font-extrabold text-emerald-100 transition hover:bg-emerald-500/15"
                        >
                          <Plus className="h-4 w-4" aria-hidden />
                          Ajouter
                        </button>
                      </div>
                      {themes.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {themes.map((t) => (
                            <button
                              key={`rm-${t}`}
                              type="button"
                              onClick={() => setThemes((prev) => prev.filter((x) => x !== t))}
                              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-xs font-semibold text-white/70 hover:bg-white/[0.05]"
                              title="Supprimer"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-white/40" aria-hidden />
                              {t}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs font-black uppercase tracking-[0.18em] text-white/55">Présentation</div>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white/75">
                          {bioLong?.trim() ? bioLong : bio?.trim() ? bio : "Ajoutez une présentation détaillée."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleEdit("bio")}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-xs font-bold text-white/80 transition hover:border-white/25 hover:bg-white/[0.08]"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                        {editing.bio ? "Fermer" : "Modifier"}
                      </button>
                    </div>
                    {editing.bio && (
                      <div className="mt-4 grid gap-4">
                        <div>
                          <div className="text-xs font-black uppercase tracking-[0.18em] text-white/55">Bio (courte)</div>
                          <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={5}
                            className="mt-2 w-full resize-none rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-emerald-400/25"
                          />
                        </div>
                        <div>
                          <div className="text-xs font-black uppercase tracking-[0.18em] text-white/55">Bio (détaillée)</div>
                          <textarea
                            value={bioLong}
                            onChange={(e) => setBioLong(e.target.value)}
                            rows={9}
                            className="mt-2 w-full resize-none rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-emerald-400/25"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* Preuves */}
                <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-sm font-extrabold">Réassurance & preuves</h2>
                    <button
                      type="button"
                      onClick={() => toggleEdit("proofs")}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-xs font-bold text-white/80 transition hover:border-white/25 hover:bg-white/[0.08]"
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                      {editing.proofs ? "Fermer" : "Modifier"}
                    </button>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                      <div className="flex items-center gap-2 text-sm font-extrabold">
                        <Award className="h-4 w-4 text-emerald-300" aria-hidden />
                        Open Badges
                      </div>
                      {badges.length ? (
                        <ul className="mt-4 space-y-3">
                          {badges.map((b, idx) => (
                            <li key={`${b.issuer}-${b.name}-${idx}`} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                              <div className="text-sm font-bold text-white/90">{b.name || "Badge"}</div>
                              <div className="mt-1 text-xs text-white/50">Émetteur : {b.issuer || "—"}</div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-4 text-sm text-white/55">
                          Aucun badge pour le moment, cet expert est en cours de labellisation.
                        </p>
                      )}
                      {editing.proofs && (
                        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs font-black uppercase tracking-[0.18em] text-white/55">Édition badges</div>
                            <button
                              type="button"
                              onClick={() => setBadges((prev) => [...prev, { name: "", issuer: "Beyond" }])}
                              className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100 transition hover:bg-emerald-500/15"
                            >
                              <Plus className="h-4 w-4" aria-hidden />
                              Ajouter
                            </button>
                          </div>
                          <div className="mt-3 space-y-3">
                            {badges.map((b, idx) => (
                              <div key={`badge-edit-${idx}`} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
                                <input
                                  value={b.name}
                                  onChange={(e) => setBadges((prev) => prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))}
                                  placeholder="Nom du badge"
                                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-emerald-400/25"
                                />
                                <input
                                  value={b.issuer}
                                  onChange={(e) => setBadges((prev) => prev.map((x, i) => (i === idx ? { ...x, issuer: e.target.value } : x)))}
                                  placeholder="Émetteur"
                                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-emerald-400/25"
                                />
                                <button
                                  type="button"
                                  onClick={() => setBadges((prev) => prev.filter((_, i) => i !== idx))}
                                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-white/70 transition hover:bg-white/[0.07]"
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-4 w-4" aria-hidden />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                      <div className="flex items-center gap-2 text-sm font-extrabold">
                        <Building2 className="h-4 w-4 text-indigo-300" aria-hidden />
                        Références
                      </div>
                      {references.length ? (
                        <ul className="mt-4 space-y-3">
                          {references.map((r, idx) => (
                            <li key={`${r.company}-${r.project}-${idx}`} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                              <div className="text-sm font-bold text-white/90">{r.company || "Entreprise"}</div>
                              <div className="mt-1 text-xs text-white/55">{r.project || "Projet"}</div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-4 text-sm text-white/55">Aucune référence renseignée pour le moment.</p>
                      )}
                      {editing.proofs && (
                        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs font-black uppercase tracking-[0.18em] text-white/55">Édition références</div>
                            <button
                              type="button"
                              onClick={() => setReferences((prev) => [...prev, { company: "", project: "" }])}
                              className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100 transition hover:bg-emerald-500/15"
                            >
                              <Plus className="h-4 w-4" aria-hidden />
                              Ajouter
                            </button>
                          </div>
                          <div className="mt-3 space-y-3">
                            {references.map((r, idx) => (
                              <div key={`ref-edit-${idx}`} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
                                <input
                                  value={r.company}
                                  onChange={(e) =>
                                    setReferences((prev) => prev.map((x, i) => (i === idx ? { ...x, company: e.target.value } : x)))
                                  }
                                  placeholder="Entreprise"
                                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-emerald-400/25"
                                />
                                <input
                                  value={r.project}
                                  onChange={(e) =>
                                    setReferences((prev) => prev.map((x, i) => (i === idx ? { ...x, project: e.target.value } : x)))
                                  }
                                  placeholder="Projet marquant"
                                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-emerald-400/25"
                                />
                                <button
                                  type="button"
                                  onClick={() => setReferences((prev) => prev.filter((_, i) => i !== idx))}
                                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-white/70 transition hover:bg-white/[0.07]"
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-4 w-4" aria-hidden />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              </div>

              <div className="flex flex-col gap-6">
                {/* Logistique */}
                <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-sm font-extrabold">Zone & préférences</h2>
                    <button
                      type="button"
                      onClick={() => toggleEdit("logistics")}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-xs font-bold text-white/80 transition hover:border-white/25 hover:bg-white/[0.08]"
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                      {editing.logistics ? "Fermer" : "Modifier"}
                    </button>
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-white/55">
                      <MapPin className="h-4 w-4" aria-hidden />
                      Zone d’intervention
                    </div>
                    <div className="mt-2 text-sm font-semibold text-white/80">{regions.length ? regions.join(", ") : "—"}</div>
                    {editing.logistics && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {DEFAULT_REGIONS.map((r) => {
                          const active = regions.includes(r);
                          return (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setRegions((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]))}
                              className={cn(
                                "rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] transition",
                                active
                                  ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100/90"
                                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
                              )}
                            >
                              {r}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-white/55">
                      <Globe className="h-4 w-4" aria-hidden />
                      Modalités
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {modalities.length ? (
                        modalities.map((m) => {
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
                              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-100/90"
                            >
                              {icon}
                              {m}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-sm text-white/55">—</span>
                      )}
                    </div>
                    {editing.logistics && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {DEFAULT_MODALITIES.map((m) => {
                          const active = modalities.includes(m);
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setModalities((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]))}
                              className={cn(
                                "rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] transition",
                                active
                                  ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100/90"
                                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
                              )}
                            >
                              {m}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>

                {/* Save */}
                <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
                  <h2 className="text-sm font-extrabold">Enregistrer</h2>
                  <p className="mt-1 text-xs text-white/45">Met à jour `experts` via `handleSave`.</p>
                  <div className="mt-4 grid gap-3">
                    <button
                      type="button"
                      disabled={!canSave}
                      onClick={handleSave}
                      className={cn(
                        "rounded-2xl border px-4 py-3 text-left text-sm font-extrabold transition",
                        canSave
                          ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100 hover:border-emerald-400/50 hover:bg-emerald-500/25"
                          : "border-white/10 bg-white/[0.04] text-white/40",
                      )}
                    >
                      {saving ? "Enregistrement…" : "Enregistrer les modifications"}
                      <div className="mt-1 text-xs font-semibold text-emerald-100/70">
                        Complétion actuelle : {completionPct}% (step {registrationStep}/5)
                      </div>
                    </button>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs text-white/55">
                      Email (lecture seule) : <span className="font-semibold text-white/75">{email || "—"}</span>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </>
        )}
        </div>
      </main>
    </div>
  );
}

