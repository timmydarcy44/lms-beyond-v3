"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Banknote, CheckCircle2, MapPin } from "lucide-react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { DashboardShell } from "@/components/beyond-connect/dashboard-shell";

type OfferDetail = {
  id: string;
  title?: string | null;
  description?: string | null;
  requirements?: string | null;
  city?: string | null;
  salary_range?: string | null;
  contract_type?: string | null;
  company_id?: string | null;
  status?: string | null;
};

type ApplicationItem = {
  id: string;
  created_at?: string | null;
  match_score?: number | null;
  profiles?: {
    id?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    soft_skills_scores?: {
      dimensions?: Record<string, { score10?: number; average?: number }>;
    } | null;
  }[] | null;
};

export default function OfferDetailPage() {
  const params = useParams<{ id: string }>();
  const [offer, setOffer] = useState<OfferDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<ApplicationItem | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    requirements: "",
    city: "",
    salary_range: "",
  });
  const supabase = useSupabase();
  const missionItems = useMemo(() => parseBulletList(offer?.description), [offer?.description]);
  const profileItems = useMemo(() => parseBulletList(offer?.requirements), [offer?.requirements]);
  const sameContent =
    offer?.description &&
    offer?.requirements &&
    offer.description.trim().toLowerCase() === offer.requirements.trim().toLowerCase();
  const isOwner = !!userId && !!offer?.company_id && offer.company_id === userId;
  const isEnterprise = userRole === "entreprise";
  const isTalent = ["apprenant", "talent", "student"].includes(userRole || "");

  const loadOffer = async () => {
    setLoading(true);
    try {
      const offerId = params?.id;
      if (!offerId) {
        setOffer(null);
        return;
      }
      if (!supabase) {
        setOffer(null);
        return;
      }
      const { data, error } = await supabase
        .from("job_offers")
        .select("*")
        .eq("id", offerId)
        .single();
      if (error) {
        setOffer(null);
        return;
      }
      setOffer(data || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await loadOffer();
    };
    load();
  }, [params, supabase]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        if (!supabase) return;
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user?.id) return;
        setUserId(data.user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();
        setUserRole(profile?.role || null);
      } catch {
        setUserRole(null);
      }
    };
    loadUser();
  }, [supabase]);

  useEffect(() => {
    const loadApplications = async () => {
      setApplicationsLoading(true);
      try {
        const offerId = params?.id;
        if (!offerId || !supabase) {
          setApplications([]);
          return;
        }
        const { data, error } = await supabase
          .from("beyond_connect_applications")
          .select(
            `
            id,
            created_at,
            match_score,
            profiles(
              id,
              first_name,
              last_name,
              soft_skills_scores
            )
          `
          )
          .eq("job_offer_id", offerId)
          .order("match_score", { ascending: false });
        if (error) {
          setApplications([]);
          return;
        }
        setApplications(data || []);
      } finally {
        setApplicationsLoading(false);
      }
    };
    loadApplications();
  }, [params, supabase]);

  return (
    <DashboardShell breadcrumbs={["Dashboard", "Offres", offer?.title || "Détail"]}>
      <div className="space-y-8">
        <Link href="/dashboard/entreprise/offres" className="text-sm text-black/60 underline">
          Retour aux offres
        </Link>

        {loading && <p className="text-sm text-black/60">Chargement...</p>}
        {!loading && !offer && <p className="text-sm text-black/60">Offre introuvable.</p>}
        {!loading && offer && (
          <>
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-4xl font-black tracking-tight text-black md:text-5xl">
                    {offer.title || "Offre sans titre"}
                  </h1>
                  <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-black/60">
                    Alternance
                  </span>
                </div>
                <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/60">
                  {applications.length} candidature{applications.length > 1 ? "s" : ""}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-black/60">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-black/60" />
                  <span>{offer.city || "Ville non précisée"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-black/60" />
                  <span>{formatCompensation(offer)}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-black">Missions</h2>
                  {missionItems.length > 0 ? (
                    <ul className="mt-4 space-y-2 text-sm text-black/80">
                      {missionItems.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 text-black" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : offer.description ? (
                    <p className="mt-4 whitespace-pre-line text-sm text-black/80">{offer.description}</p>
                  ) : (
                    <p className="mt-4 text-sm text-black/60">Les missions seront précisées lors de l'entretien.</p>
                  )}
                </section>

                {!sameContent && (
                  <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-black">Profil recherché</h2>
                    {profileItems.length > 0 ? (
                      <ul className="mt-4 space-y-2 text-sm text-black/80">
                        {profileItems.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-black" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : offer.requirements ? (
                      <p className="mt-4 whitespace-pre-line text-sm text-black/80">{offer.requirements}</p>
                    ) : (
                      <p className="mt-4 text-sm text-black/60">Le profil détaillé sera précisé lors de l'entretien.</p>
                    )}
                  </section>
                )}
              </div>

              <aside className="space-y-4">
                <div className="sticky top-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
                  {isOwner && isEnterprise ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditForm({
                          title: offer.title || "",
                          description: offer.description || "",
                          requirements: offer.requirements || "",
                          city: offer.city || "",
                          salary_range: offer.salary_range || "",
                        });
                        setIsEditOpen(true);
                      }}
                      className="w-full rounded-full border border-slate-300 px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:shadow-sm"
                    >
                      Modifier l&apos;offre
                    </button>
                  ) : null}
                  {isTalent ? (
                    <button
                      type="button"
                      className="w-full rounded-full bg-black px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:scale-[1.01]"
                    >
                      Postuler
                    </button>
                  ) : null}
                  {isOwner && isEnterprise ? (
                    <button
                      type="button"
                      disabled={isClosing}
                      onClick={async () => {
                        if (!supabase || !offer?.id) return;
                        const confirmed = window.confirm(
                          "Confirmez-vous la clôture de cette offre ?"
                        );
                        if (!confirmed) return;
                        setIsClosing(true);
                        const { error } = await supabase
                          .from("job_offers")
                          .update({ status: "closed" })
                          .eq("id", offer.id);
                        if (!error) {
                          setOffer((prev) => (prev ? { ...prev, status: "closed" } : prev));
                        }
                        setIsClosing(false);
                      }}
                      className="mt-3 w-full rounded-full border border-red-200 px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-red-600 transition hover:bg-red-50"
                    >
                      {isClosing ? "Clôture..." : "Clôturer l'offre"}
                    </button>
                  ) : null}
                  <div className="mt-6 space-y-3 text-sm text-black/70">
                    <div className="flex items-center justify-between">
                      <span>Type de contrat</span>
                      <span className="font-semibold text-black">Alternance</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Ville</span>
                      <span className="font-semibold text-black">{offer.city || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{isFreelanceContract(offer) ? "TJM" : "Salaire"}</span>
                      <span className="font-semibold text-black">{formatCompensation(offer, true)}</span>
                    </div>
                  </div>
                </div>
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-black/60">
                    Candidats ayant postulé
                  </h3>
                  {applicationsLoading ? (
                    <p className="mt-4 text-sm text-black/60">Chargement des candidatures...</p>
                  ) : applications.length === 0 ? (
                    <div className="mt-4 space-y-3">
                      {offer?.title?.toLowerCase().includes("commercial b2b") ? (
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-black">
                                LB
                              </div>
                              <div>
                                <p className="font-semibold text-black">Lucas Bernard</p>
                                <p className="text-xs text-black/50">08 Fév. 2026</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-semibold text-black/60">94%</span>
                              <div className="mt-1 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                Nouveau
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCandidate(null);
                              setIsProfileOpen(true);
                            }}
                            className="mt-3 inline-flex items-center text-xs font-semibold text-black underline"
                          >
                            Voir le profil
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-black/60">
                          Aucune candidature pour le moment. Votre offre est active et visible par les talents matching.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {applications.map((application) => (
                        <div
                          key={application.id}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-black">
                                {`${application.profiles?.[0]?.first_name || "Candidat"} ${
                                  application.profiles?.[0]?.last_name || ""
                                }`}
                              </p>
                              <p className="text-xs text-black/50">
                                {formatDate(application.created_at)}
                              </p>
                            </div>
                            <span className="text-xs font-semibold text-black/60">
                              {application.match_score ?? "—"}%
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCandidate(application);
                              setIsProfileOpen(true);
                            }}
                            className="mt-3 inline-flex items-center text-xs font-semibold text-black underline"
                          >
                            Voir le profil
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </aside>
            </div>
          </>
        )}
      </div>
      {isEditOpen && offer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-black">Modifier l&apos;offre</h3>
                <p className="mt-1 text-sm text-black/60">Mettez à jour les informations clés de l&apos;annonce.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="text-sm text-black/60 hover:text-black"
              >
                Fermer
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="space-y-2 text-sm">
                <span className="text-black/70">Titre</span>
                <input
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  value={editForm.title}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, title: event.target.value }))}
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-black/70">Ville</span>
                <input
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  value={editForm.city}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, city: event.target.value }))}
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-black/70">
                  {isFreelanceContract(offer) ? "TJM souhaité" : "Salaire"}
                </span>
                <input
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  value={editForm.salary_range}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, salary_range: event.target.value }))}
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-black/70">Missions</span>
                <textarea
                  className="min-h-[140px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  value={editForm.description}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, description: event.target.value }))}
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-black/70">Profil recherché</span>
                <textarea
                  className="min-h-[140px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  value={editForm.requirements}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, requirements: event.target.value }))}
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="rounded-full border border-slate-200 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/70"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isSavingEdit}
                onClick={async () => {
                  if (!supabase || !offer?.id) return;
                  setIsSavingEdit(true);
                  const { data, error } = await supabase
                    .from("job_offers")
                    .update({
                      title: editForm.title,
                      description: editForm.description,
                      requirements: editForm.requirements,
                      city: editForm.city,
                      salary_range: editForm.salary_range,
                    })
                    .eq("id", offer.id)
                    .select()
                    .single();
                  if (!error && data) {
                    setOffer(data);
                    setIsEditOpen(false);
                  }
                  setIsSavingEdit(false);
                  await loadOffer();
                }}
                className="rounded-full bg-black px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
              >
                {isSavingEdit ? "Enregistrement..." : "Enregistrer les modifications"}
              </button>
            </div>
          </div>
        </div>
      )}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                {(() => {
                  const candidate = getCandidateViewData(selectedCandidate);
                  return (
                    <>
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-black">
                        {candidate.initials}
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-black">{candidate.name}</p>
                        <p className="text-sm text-black/50">Score de matching: {candidate.score}%</p>
                      </div>
                    </>
                  );
                })()}
              </div>
              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                className="text-sm text-black/60 hover:text-black"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-6">
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-black/60">Soft skills</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {getCandidateViewData(selectedCandidate).skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-black/70"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-black/60">Experience</h3>
                <p className="mt-3 text-sm text-black/70">
                  {getCandidateViewData(selectedCandidate).summary}
                </p>
              </section>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded-full bg-black px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
                >
                  Contacter
                </button>
                <button
                  type="button"
                  className="rounded-full border border-red-200 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-600"
                >
                  Refuser la candidature
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function parseBulletList(text: string | null | undefined) {
  if (!text) return [];
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line.startsWith("-") || line.startsWith("•"))
    .map((line) => line.replace(/^[-•]\s*/, ""));
}

function formatDate(value?: string | null) {
  if (!value) return "Date inconnue";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Date inconnue";
  return parsed.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getCandidateViewData(candidate: ApplicationItem | null) {
  const profile = candidate?.profiles?.[0] ?? null;
  if (!profile) {
    return {
      name: "Lucas Bernard",
      initials: "LB",
      score: 94,
      skills: ["Rigueur", "Communication", "Esprit d'équipe"],
      summary:
        "Alternant en developpement commercial, 2 ans d'experience en prospection B2B et gestion de portefeuille clients. Formation BTS NDRC en cours.",
    };
  }
  const name = `${profile.first_name || "Candidat"} ${profile.last_name || ""}`.trim();
  const initials = `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase() || "C";
  const score = candidate?.match_score ?? 0;
  const skills = extractTopSkills(profile.soft_skills_scores);
  return {
    name: name || "Candidat",
    initials,
    score,
    skills: skills.length ? skills : ["Rigueur", "Communication", "Esprit d'équipe"],
    summary: "Profil en cours d'analyse. Le parcours detaille sera affiche lorsqu'il sera complete.",
  };
}

function extractTopSkills(
  scores?: { dimensions?: Record<string, { score10?: number; average?: number }> } | null
) {
  if (!scores?.dimensions) return [];
  const entries = Object.entries(scores.dimensions).map(([key, value]) => {
    const raw = value?.score10 ?? value?.average ?? 0;
    const normalized = raw <= 1 ? raw * 100 : raw <= 10 ? raw * 10 : raw;
    return { key, score: normalized };
  });
  return entries
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((entry) => entry.key);
}

function isFreelanceContract(offer: OfferDetail | null | undefined) {
  const contract = (offer?.contract_type || "").toLowerCase();
  return contract.includes("freelance");
}

function formatCompensation(offer: OfferDetail, compact?: boolean) {
  if (!offer.salary_range) {
    return compact ? "—" : "Salaire non précisé";
  }
  const base = offer.salary_range.includes("€") ? offer.salary_range : `${offer.salary_range} €`;
  if (isFreelanceContract(offer)) {
    return `${base} / jour`;
  }
  return `${base} / an`;
}
