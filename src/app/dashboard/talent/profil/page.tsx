"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Lock, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSupabase } from "@/components/providers/supabase-provider";
import { TalentDashboardShell } from "@/components/beyond-connect/talent-dashboard-shell";

const contractOptions = ["CDI", "CDD", "Freelance", "Alternance", "Stage"];

type TalentProfile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  linkedin_url: string;
  avatar_url: string;
  desired_title: string;
  city: string;
  contract_type: string;
  mobility_radius: number;
  tjm_min: string;
  salary_min: string;
  gratification_min: string;
  experiences: Array<{ role: string; company: string; start: string; end: string; missions: string }>;
  educations: Array<{ school: string; diploma: string; year: string }>;
  open_badges: string[];
};

const emptyProfile: TalentProfile = {
  id: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  linkedin_url: "",
  avatar_url: "",
  desired_title: "",
  city: "",
  contract_type: "",
  mobility_radius: 0,
  tjm_min: "",
  salary_min: "",
  gratification_min: "",
  experiences: [],
  educations: [],
  open_badges: [""],
};

export default function TalentProfilePage() {
  const supabase = useSupabase();
  const [profile, setProfile] = useState<TalentProfile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [linkedinConnected, setLinkedinConnected] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        if (!supabase) return;
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user?.id) return;
        const { data } = await supabase
          .from("talent_profiles")
          .select("id, first_name, last_name, phone, city, mobility_range, experiences, educations, open_badges")
          .eq("id", userData.user.id)
          .maybeSingle();
        const normalized = {
          ...emptyProfile,
          id: userData.user.id,
          ...(data || {}),
          email: userData.user.email || "",
          experiences: Array.isArray(data?.experiences) ? data.experiences : [],
          educations: Array.isArray(data?.educations) ? data.educations : [],
          open_badges: Array.isArray(data?.open_badges) ? data.open_badges : [""],
          mobility_radius: data?.mobility_range ?? 0,
        };
        setProfile(normalized);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [supabase]);

  const compensationLabel = useMemo(() => {
    if (profile.contract_type === "Stage") return "Gratification mensuelle souhaitee";
    if (profile.contract_type === "Alternance") return "Salaire mensuel souhaite";
    if (profile.contract_type === "CDI" || profile.contract_type === "CDD")
      return "Remuneration annuelle brute souhaitee";
    return "TJM souhaite";
  }, [profile.contract_type]);

  const handleUpload = async (file: File) => {
    if (!supabase || !profile.id) return;
    const path = `avatars/${profile.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Erreur lors de l'upload de la photo.");
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setProfile((prev) => ({ ...prev, avatar_url: data.publicUrl }));
  };

  const handleSave = async () => {
    if (!supabase) return;
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) {
      setSaving(false);
      return;
    }
    const payload = {
      id: userId,
      first_name: profile.first_name || "",
      last_name: profile.last_name || "",
      city: profile.city || "",
      phone: profile.phone || "",
    };
    console.table(payload);
    const { error } = await supabase.from("talent_profiles").upsert(payload);
    if (error) {
      alert(`Erreur Supabase : ${error.message}`);
      toast.error("Impossible de sauvegarder le profil.");
    } else {
      window.alert("Profil mis à jour !");
      toast.success("Modifications enregistrees.");
    }
    setSaving(false);
  };

  return (
    <TalentDashboardShell>
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">
                ✨ Devenez prioritaire ! Passez la certification Soft Skills Beyond AI (50€) pour booster votre profil.
              </h2>
              <p className="mt-2 text-sm text-black/70">Certification premium, paiement securise.</p>
            </div>
            <Link
              href="/dashboard/student/achievements"
              className="rounded-full bg-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white"
            >
              En savoir plus
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="h-28 w-28 overflow-hidden rounded-full bg-slate-100">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-black/50">Avatar</div>
                )}
              </div>
              <div>
                <p className="text-xl font-semibold text-black">
                  {profile.first_name || "Profil"} {profile.last_name}
                </p>
                <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-black/60">
                  <span>{profile.email || "Email non renseigne"}</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    Verifie
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/70"
            >
              Modifier la photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleUpload(file);
              }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Identite</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="text-black/70">Prenom</span>
              <input
                className="w-full rounded-xl border border-slate-100 px-4 py-3 text-sm focus:ring-2 focus:ring-black/10"
                value={profile.first_name}
                onChange={(event) => setProfile((prev) => ({ ...prev, first_name: event.target.value }))}
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-black/70">Nom</span>
              <input
                className="w-full rounded-xl border border-slate-100 px-4 py-3 text-sm focus:ring-2 focus:ring-black/10"
                value={profile.last_name}
                onChange={(event) => setProfile((prev) => ({ ...prev, last_name: event.target.value }))}
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-black/70">Telephone</span>
              <input
                className="w-full rounded-xl border border-slate-100 px-4 py-3 text-sm focus:ring-2 focus:ring-black/10"
                value={profile.phone}
                onChange={(event) => setProfile((prev) => ({ ...prev, phone: event.target.value }))}
              />
            </label>
            <label className="space-y-2 text-sm md:col-span-2">
              <span className="text-black/70">Email</span>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-black/40" />
                <input
                  className="w-full rounded-xl border border-slate-100 bg-gray-100 py-3 pl-10 pr-4 text-sm text-black/50"
                  value={profile.email}
                  readOnly
                />
              </div>
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Reseaux sociaux</h3>
          <button
            type="button"
            onClick={() => setLinkedinConnected(true)}
            className={`mt-4 inline-flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${
              linkedinConnected ? "border-emerald-200 text-emerald-700" : "border-slate-200 text-black/70"
            }`}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0A66C2] text-xs font-bold text-white">
              in
            </span>
            {linkedinConnected ? "Connecte ✅" : "Lier mon compte LinkedIn"}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Pro</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="text-black/70">Type de contrat</span>
              <select
                className="w-full rounded-xl border border-slate-100 px-4 py-3 text-sm"
                value={profile.contract_type}
                onChange={(event) => setProfile((prev) => ({ ...prev, contract_type: event.target.value }))}
              >
                <option value="">Selectionner</option>
                {contractOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-black/70">Ville</span>
              <input
                className="w-full rounded-xl border border-slate-100 px-4 py-3 text-sm"
                value={profile.city}
                onChange={(event) => setProfile((prev) => ({ ...prev, city: event.target.value }))}
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-black/70">Titre du poste</span>
              <input
                className="w-full rounded-xl border border-slate-100 px-4 py-3 text-sm"
                value={profile.desired_title}
                onChange={(event) => setProfile((prev) => ({ ...prev, desired_title: event.target.value }))}
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-black/70">Mobilite : {profile.mobility_radius} km</span>
              <input
                type="range"
                min={0}
                max={100}
                value={profile.mobility_radius}
                onChange={(event) =>
                  setProfile((prev) => ({ ...prev, mobility_radius: Number(event.target.value) }))
                }
                className="w-full"
              />
            </label>
            <label className="space-y-2 text-sm md:col-span-2">
              <span className="text-black/70">{compensationLabel}</span>
              <input
                className="w-full rounded-xl border border-slate-100 px-4 py-3 text-sm"
                value={
                  profile.contract_type === "Freelance"
                    ? profile.tjm_min
                    : profile.contract_type === "CDI" || profile.contract_type === "CDD"
                      ? profile.salary_min
                      : profile.gratification_min
                }
                onChange={(event) => {
                  const value = event.target.value;
                  setProfile((prev) => {
                    if (prev.contract_type === "Freelance") return { ...prev, tjm_min: value };
                    if (prev.contract_type === "CDI" || prev.contract_type === "CDD")
                      return { ...prev, salary_min: value };
                    return { ...prev, gratification_min: value };
                  });
                }}
              />
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Experiences Professionnelles</h3>
            <button
              type="button"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/60"
              onClick={() =>
                setProfile((prev) => ({
                  ...prev,
                  experiences: [
                    ...(prev.experiences || []),
                    { role: "", company: "", start: "", end: "", missions: "" },
                  ],
                }))
              }
            >
              <Plus className="h-3 w-3" />
              Ajouter une experience
            </button>
          </div>
          <div className="mt-4 space-y-4">
            {(profile.experiences || []).map((item, index) => (
              <div key={`exp-${index}`} className="rounded-xl bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-semibold text-black/60">
                      {item.company ? item.company[0]?.toUpperCase() : "E"}
                    </div>
                    <p className="text-sm font-semibold text-black/70">Experience {index + 1}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setProfile((prev) => ({
                        ...prev,
                        experiences: prev.experiences.filter((_, i) => i !== index),
                      }))
                    }
                    className="text-xs text-black/50 hover:text-black"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <input
                    className="w-full rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm"
                    placeholder="Poste"
                    value={item.role}
                    onChange={(event) =>
                      setProfile((prev) => ({
                        ...prev,
                        experiences: prev.experiences.map((entry, i) =>
                          i === index ? { ...entry, role: event.target.value } : entry
                        ),
                      }))
                    }
                  />
                  <input
                    className="w-full rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm"
                    placeholder="Entreprise"
                    value={item.company}
                    onChange={(event) =>
                      setProfile((prev) => ({
                        ...prev,
                        experiences: prev.experiences.map((entry, i) =>
                          i === index ? { ...entry, company: event.target.value } : entry
                        ),
                      }))
                    }
                  />
                  <input
                    className="w-full rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm"
                    placeholder="Debut"
                    value={item.start}
                    onChange={(event) =>
                      setProfile((prev) => ({
                        ...prev,
                        experiences: prev.experiences.map((entry, i) =>
                          i === index ? { ...entry, start: event.target.value } : entry
                        ),
                      }))
                    }
                  />
                  <input
                    className="w-full rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm"
                    placeholder="Fin"
                    value={item.end}
                    onChange={(event) =>
                      setProfile((prev) => ({
                        ...prev,
                        experiences: prev.experiences.map((entry, i) =>
                          i === index ? { ...entry, end: event.target.value } : entry
                        ),
                      }))
                    }
                  />
                  <textarea
                    className="md:col-span-2 min-h-[80px] w-full rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm"
                    placeholder="Missions principales"
                    value={item.missions}
                    onChange={(event) =>
                      setProfile((prev) => ({
                        ...prev,
                        experiences: prev.experiences.map((entry, i) =>
                          i === index ? { ...entry, missions: event.target.value } : entry
                        ),
                      }))
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Diplomes & Formations</h3>
            <button
              type="button"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/60"
              onClick={() =>
                setProfile((prev) => ({
                  ...prev,
                  educations: [...(prev.educations || []), { school: "", diploma: "", year: "" }],
                }))
              }
            >
              <Plus className="h-3 w-3" />
              Ajouter un diplome
            </button>
          </div>
          <div className="mt-4 space-y-4">
            {(profile.educations || []).map((item, index) => (
              <div key={`edu-${index}`} className="rounded-xl bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-semibold text-black/60">
                      {item.school ? item.school[0]?.toUpperCase() : "D"}
                    </div>
                    <p className="text-sm font-semibold text-black/70">Diplome {index + 1}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setProfile((prev) => ({
                        ...prev,
                        educations: prev.educations.filter((_, i) => i !== index),
                      }))
                    }
                    className="text-xs text-black/50 hover:text-black"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <input
                    className="w-full rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm"
                    placeholder="Etablissement"
                    value={item.school}
                    onChange={(event) =>
                      setProfile((prev) => ({
                        ...prev,
                        educations: prev.educations.map((entry, i) =>
                          i === index ? { ...entry, school: event.target.value } : entry
                        ),
                      }))
                    }
                  />
                  <input
                    className="w-full rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm"
                    placeholder="Diplome obtenu"
                    value={item.diploma}
                    onChange={(event) =>
                      setProfile((prev) => ({
                        ...prev,
                        educations: prev.educations.map((entry, i) =>
                          i === index ? { ...entry, diploma: event.target.value } : entry
                        ),
                      }))
                    }
                  />
                  <input
                    className="w-full rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm"
                    placeholder="Annee"
                    value={item.year}
                    onChange={(event) =>
                      setProfile((prev) => ({
                        ...prev,
                        educations: prev.educations.map((entry, i) =>
                          i === index ? { ...entry, year: event.target.value } : entry
                        ),
                      }))
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Open Badges</h3>
          <div className="mt-4 space-y-3">
            {(profile.open_badges || []).map((badge, index) => (
              <input
                key={`badge-${index}`}
                className="w-full rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm"
                placeholder="URL du badge"
                value={badge}
                onChange={(event) =>
                  setProfile((prev) => ({
                    ...prev,
                    open_badges: prev.open_badges.map((entry, i) =>
                      i === index ? event.target.value : entry
                    ),
                  }))
                }
              />
            ))}
            <button
              type="button"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/60"
              onClick={() =>
                setProfile((prev) => ({ ...prev, open_badges: [...(prev.open_badges || []), ""] }))
              }
            >
              <Plus className="h-3 w-3" />
              Ajouter un badge
            </button>
          </div>
        </div>

        <div className="fixed bottom-6 right-8 z-40">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-sm"
          >
            {saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </div>

        {loading && (
          <div className="rounded-xl bg-white p-4 text-xs text-black/50">
            Chargement des donnees...
          </div>
        )}
      </div>
    </TalentDashboardShell>
  );
}
