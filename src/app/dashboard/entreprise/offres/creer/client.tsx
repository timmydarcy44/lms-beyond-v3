"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSupabase } from "@/components/providers/supabase-provider";

const softSkillOptions = [
  "Gestion des émotions",
  "Communication",
  "Persévérance",
  "Organisation",
  "Empathie",
  "Résolution de problèmes",
  "Collaboration",
  "Créativité",
  "Leadership",
  "Confiance en soi",
];

type FlowMode = "choice" | "manual" | "ai";

const cultureTags = ["Bienveillant", "Challenge", "Autonomie", "Esprit d'équipe", "Exigence", "Ambition"];
const perkTags = ["Mutuelle 100%", "Pass Navigo", "Corbeille de fruits", "Télétravail flexible", "Prime", "Formation"];
const toneOptions = ["Institutionnel", "Décontracté", "Inspirant"];

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const extractSoftSkillsFromText = (text: string) => {
  if (!text) return [];
  const normalizedText = normalizeText(text);
  return softSkillOptions.filter((skill) => normalizedText.includes(normalizeText(skill)));
};

const parseAiSections = (text: string) => {
  if (!text) return { missions: "", requirements: "" };
  const lines = text.split("\n").map((line) => line.trim());
  let current: "missions" | "requirements" | null = null;
  const sections: Record<"missions" | "requirements", string[]> = { missions: [], requirements: [] };

  for (const line of lines) {
    if (!line) continue;
    const lower = line.toLowerCase();
    if (lower.startsWith("missions")) {
      current = "missions";
      const after = line.split(":").slice(1).join(":").trim();
      if (after) sections.missions.push(after);
      continue;
    }
    if (
      lower.startsWith("profil recherché") ||
      lower.startsWith("profil recherche") ||
      lower.startsWith("profil_recherche")
    ) {
      current = "requirements";
      const after = line.split(":").slice(1).join(":").trim();
      if (after) sections.requirements.push(after);
      continue;
    }
    if (/^[a-zà-ÿ\s]+:$/i.test(line) || /^[a-zà-ÿ\s]+:\s+/i.test(line)) {
      current = null;
    }
    if (current) sections[current].push(line);
  }

  return {
    missions: sections.missions.join("\n").trim(),
    requirements: sections.requirements.join("\n").trim(),
  };
};

export default function CreateOfferChoicePage() {
  const [flow, setFlow] = useState<FlowMode>("choice");
  const [step, setStep] = useState(1);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const router = useRouter();
  const [selectedCulture, setSelectedCulture] = useState<string[]>([]);
  const [selectedPerks, setSelectedPerks] = useState<string[]>([]);
  const [vision, setVision] = useState("");
  const [tone, setTone] = useState("Institutionnel");
  const supabase = useSupabase();
  const [requirementsError, setRequirementsError] = useState(false);

  const [form, setForm] = useState({
    title: "",
    city: "",
    contractType: "Apprentissage",
    remotePolicy: "Jamais",
    weekendWork: "Jamais",
    startDate: "",
    salaryMin: "",
    salaryMax: "",
    dailyRate: "",
    missionDuration: "",
    benefits: "",
    description: "",
    requirements: "",
    missionObjectives: "",
    missionScope: "",
    missionDeliverables: "",
  });

  const totalSteps = flow === "manual" ? 3 : flow === "ai" ? 2 : 0;
  const progress = useMemo(() => {
    if (flow === "choice") return 0;
    return (step / totalSteps) * 100;
  }, [flow, step, totalSteps]);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        if (!supabase) return;
        const { data: userData, error } = await supabase.auth.getUser();
        if (error || !userData?.user?.id) return;
        setCompanyId(userData.user.id);
      } catch (error) {
        console.error("[create-offer] load company error", error);
      }
    };
    loadCompany();
  }, [supabase]);

  const isFreelance = form.contractType === "Freelance / Mission";

  const handleGenerateFromPrompt = async () => {
    if (!prompt.trim()) {
      toast.error("Ajoutez un prompt pour générer l'offre.");
      return;
    }
    setIsGenerating(true);
    try {
      const mergedPrompt = [
        `Brief: ${prompt}`,
        "Format attendu: Titre:, Missions:, Profil_recherche:",
        "Missions: focus tâches, objectifs, quotidien. Profil_recherche: focus soft skills, expérience, savoir-être.",
        "Interdiction de dupliquer l'accroche ou les missions dans Profil_recherche.",
        "Ajoute à la fin de Profil_recherche une liste de 3 à 5 soft skills clés sous forme de puces.",
        isFreelance
          ? "Si le contrat est Freelance, ne génère pas de salaire annuel mais un TJM (Taux Journalier Moyen) estimé en euros."
          : "Si le contrat est salarié, propose une fourchette de salaire annuelle.",
        `Type de contrat: ${form.contractType}`,
        form.city ? `Ville: ${form.city}` : null,
        isFreelance
          ? form.dailyRate
            ? `TJM: ${form.dailyRate}`
            : null
          : form.salaryMin || form.salaryMax
            ? `Salaire: ${form.salaryMin || "?"} - ${form.salaryMax || "?"}`
            : null,
        form.missionDuration ? `Durée mission: ${form.missionDuration}` : null,
        form.missionObjectives ? `Objectifs: ${form.missionObjectives}` : null,
        form.missionScope ? `Périmètre: ${form.missionScope}` : null,
        form.missionDeliverables ? `Livrables: ${form.missionDeliverables}` : null,
        !isFreelance && selectedCulture.length ? `Ambiance: ${selectedCulture.join(", ")}` : null,
        !isFreelance && selectedPerks.length ? `Avantages: ${selectedPerks.join(", ")}` : null,
        !isFreelance && vision ? `Vision: ${vision}` : null,
        !isFreelance && form.remotePolicy ? `Télétravail: ${form.remotePolicy}` : null,
        !isFreelance && form.weekendWork ? `Travail le week-end: ${form.weekendWork}` : null,
        !isFreelance && tone ? `Ton: ${tone}` : null,
      ]
        .filter(Boolean)
        .join("\n");
      const response = await fetch("/api/beyond-connect/job-offers/generate-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: mergedPrompt,
          contract_type: form.contractType,
          city: form.city,
          salary_min: form.salaryMin,
          salary_max: form.salaryMax,
          daily_rate: form.dailyRate,
          mission_duration: form.missionDuration,
          culture_tags: selectedCulture,
          perks: isFreelance ? [] : selectedPerks,
          vision,
          remote_policy: isFreelance ? null : form.remotePolicy,
          weekend_work: isFreelance ? null : form.weekendWork,
          tone,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Erreur de génération");
      }
      const parsedSections = parseAiSections(data.description || "");
      const requirementText =
        data.requirements || parsedSections.requirements || data.description || form.requirements || "";
      const extractedSkills = extractSoftSkillsFromText(requirementText);
      setForm((prev) => ({
        ...prev,
        title: data.title || prev.title,
        city: data.city || prev.city,
        contractType: data.contract_type || prev.contractType,
        remotePolicy: data.remote_policy || prev.remotePolicy,
        weekendWork: data.weekend_work || prev.weekendWork,
        salaryMin: data.salary_min ? String(data.salary_min) : prev.salaryMin,
        salaryMax: data.salary_max ? String(data.salary_max) : prev.salaryMax,
        dailyRate: data.daily_rate ? String(data.daily_rate) : prev.dailyRate,
        missionDuration: data.mission_duration || prev.missionDuration,
        description: parsedSections.missions || data.description || prev.description,
        requirements: requirementText,
      }));
      const aiSkills = Array.isArray(data.soft_skills) ? data.soft_skills : [];
      setSelectedSkills(Array.from(new Set([...aiSkills, ...extractedSkills])));
      setStep(2);
    } catch (error) {
      console.error("[create-offer] prompt generate error", error);
      toast.error("Impossible de générer l'offre.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!form.title || !form.contractType || !form.requirements.trim()) {
      setRequirementsError(!form.requirements.trim());
      toast.error("Titre, type de contrat et profil recherché requis.");
      return;
    }
    setIsPublishing(true);
    try {
      if (!supabase) {
        toast.error("Supabase n'est pas configuré.");
        return;
      }
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user?.id) {
        alert("Session expirée");
        return;
      }
      const companyIdToUse = user.id;
      const insertData = {
        company_id: companyIdToUse,
        title: form.title,
        description: form.description,
        requirements: form.requirements,
        city: form.city,
        salary_range: isFreelance
          ? form.dailyRate
          : form.salaryMin || form.salaryMax
            ? `${form.salaryMin || "?"} - ${form.salaryMax || "?"}`
            : "",
        contract_type: form.contractType,
        status: "active",
        required_soft_skills: selectedSkills || [],
      };
      console.log("Tentative d'insertion avec :", insertData);
      const { error } = await supabase.from("job_offers").insert(insertData);
      if (error) {
        console.error("Erreur Supabase détaillée:", error.message, (error as any).details, (error as any).hint);
        throw new Error(error.message || "Erreur de publication");
      }
      toast.success("Offre publiée avec succès.");
      router.push("/beyond-connect/dashboard/offres");
    } catch (error) {
      console.error("[create-offer] publish error", error);
      toast.error("Impossible de publier l'offre.");
    } finally {
      setIsPublishing(false);
    }
  };

  const canContinue =
    (flow === "manual" && step === 1 && form.title && form.city && form.contractType) ||
    (flow === "manual" && step === 2) ||
    (flow === "ai" && step === 1 && prompt.trim().length > 0);

  const renderOfferCard = () => (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs tracking-tight text-[#050A18]/60">Carte offre</p>
      <h2 className="mt-3 text-2xl font-semibold">{form.title || "Titre du poste"}</h2>
      <p className="mt-2 text-sm text-[#050A18]/60">
        {form.city || "Ville"} · {form.contractType}
        {isFreelance
          ? form.dailyRate
            ? ` · TJM ${form.dailyRate}`
            : ""
          : ` · ${form.remotePolicy} · Week-end ${form.weekendWork}`}
        {isFreelance && form.missionDuration ? ` · ${form.missionDuration}` : ""}
      </p>
      {isFreelance && (
        <div className="mt-3 inline-flex items-center rounded-full border border-[#050A18] px-3 py-1 text-[11px] tracking-tight text-[#050A18]">
          Mission Freelance
        </div>
      )}
      <p className="mt-4 text-sm text-[#050A18]/70">
        {form.description || "Résumé du poste et des missions principales."}
      </p>
      {isFreelance && (
        <div className="mt-4 space-y-3 text-sm text-[#050A18]/70">
          {form.missionObjectives && (
            <div>
              <p className="text-xs font-semibold text-[#050A18]">Objectifs de la mission</p>
              <p className="mt-1">{form.missionObjectives}</p>
            </div>
          )}
          {form.missionScope && (
            <div>
              <p className="text-xs font-semibold text-[#050A18]">Périmètre &amp; brief</p>
              <p className="mt-1">{form.missionScope}</p>
            </div>
          )}
          {form.missionDeliverables && (
            <div>
              <p className="text-xs font-semibold text-[#050A18]">Livrables attendus</p>
              <p className="mt-1">{form.missionDeliverables}</p>
            </div>
          )}
        </div>
      )}
      {selectedCulture.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {selectedCulture.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] tracking-tight text-[#050A18]/70"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {selectedSkills.map((skill) => (
          <span
            key={skill}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] tracking-tight text-[#050A18]/70"
          >
            {skill}
          </span>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-2 text-xs text-[#050A18]/60">
        {[...new Set([...form.benefits.split(",").map((item) => item.trim()).filter(Boolean), ...selectedPerks])].map(
          (item) => (
            <span key={item} className="rounded-full border border-slate-200 px-3 py-1">
              {item}
            </span>
          )
        )}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-[#050A18]">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-3">
          <p className="text-xs tracking-tight text-[#050A18]/50">Dashboard entreprise</p>
          <h1
            className="text-3xl font-black uppercase tracking-tight text-[#050A18]"
            style={{ fontFamily: "Anton, 'Futura Condensed', 'Arial Narrow', sans-serif" }}
          >
            {flow === "choice" ? "CRÉER UNE OFFRE" : "CONSTRUISONS VOTRE FUTUR POSTE"}
          </h1>
          <p className="text-sm text-[#050A18]/60">Un workflow guidé, manuel ou piloté par l&apos;IA.</p>
        </header>

        {flow === "choice" && (
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-[clamp(2.6rem,6vw,4.5rem)] font-black uppercase leading-none tracking-[-0.04em] text-transparent bg-clip-text bg-gradient-to-r from-[#050A18] to-[#6D28D9]">
                CRÉER UNE OFFRE
              </h2>
              <p className="mt-4 max-w-xl text-sm text-[#050A18]/60">
                Choisissez votre mode de création : manuel ou boosté par Beyond AI.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => {
                  setFlow("manual");
                  setStep(1);
                }}
                className="group w-full max-w-sm text-left"
              >
                <span className="block rounded-3xl bg-gradient-to-r from-[#050A18] to-[#6D28D9] p-[2px]">
                  <span className="block rounded-[22px] bg-white px-6 py-4">
                    <span className="block text-[11px] tracking-tight text-[#050A18]/60">Option A</span>
                    <span className="mt-2 block text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#050A18] to-[#6D28D9]">
                      Créer manuellement
                    </span>
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFlow("ai");
                  setStep(1);
                }}
                className="group w-full max-w-sm text-left"
              >
                <span className="block rounded-3xl bg-gradient-to-r from-[#050A18] to-[#6D28D9] p-[2px]">
                  <span className="block rounded-[22px] bg-white px-6 py-4">
                    <span className="block text-[11px] tracking-tight text-[#050A18]/60">Option B</span>
                    <span className="mt-2 block text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#050A18] to-[#6D28D9]">
                      Générer avec Beyond AI
                    </span>
                  </span>
                </span>
              </button>
            </div>
          </div>
        )}

        {flow !== "choice" && (
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-[clamp(2.2rem,5vw,4rem)] font-black uppercase leading-none tracking-[-0.04em] text-transparent bg-clip-text bg-gradient-to-r from-[#050A18] to-[#6D28D9]">
                CONSTRUISONS VOTRE FUTUR POSTE
              </h2>
              <p className="mt-4 max-w-xl text-sm text-[#050A18]/60">
                Un workflow clair pour structurer l’offre, quel que soit votre mode de création.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between text-xs tracking-tight text-[#050A18]/50">
                <span>Étape {step} / {totalSteps}</span>
                <span>Workflow</span>
              </div>
              <div className="mt-4 h-2 w-full rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-[#050A18]" style={{ width: `${progress}%` }} />
              </div>

            {flow === "manual" && step === 1 && (
              <section className="mt-8 grid gap-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span className="text-[#050A18]/70">Titre du poste</span>
                    <input
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                      placeholder="Business Developer"
                      value={form.title}
                      onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-[#050A18]/70">Ville</span>
                    <input
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                      placeholder="Rouen"
                      value={form.city}
                      onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-[#050A18]/70">Type de contrat</span>
                    <select
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                      value={form.contractType}
                      onChange={(event) => setForm((prev) => ({ ...prev, contractType: event.target.value }))}
                    >
                      <option>Apprentissage</option>
                      <option>Stage</option>
                      <option>CDI</option>
                      <option>CDD</option>
                      <option>Freelance / Mission</option>
                    </select>
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-[#050A18]/70">Date de début</span>
                    <input
                      type="date"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                      value={form.startDate}
                      onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
                    />
                  </label>
                </div>
              </section>
            )}

            {flow === "manual" && step === 2 && (
              <section className="mt-8 grid gap-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {isFreelance ? (
                    <>
                      <label className="space-y-2 text-sm">
                        <span className="text-[#050A18]/70">TJM souhaité</span>
                        <input
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                          placeholder="400"
                          value={form.dailyRate}
                          onChange={(event) => setForm((prev) => ({ ...prev, dailyRate: event.target.value }))}
                        />
                      </label>
                      <label className="space-y-2 text-sm">
                        <span className="text-[#050A18]/70">Durée estimée de la mission</span>
                        <input
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                          placeholder="3 mois"
                          value={form.missionDuration}
                          onChange={(event) => setForm((prev) => ({ ...prev, missionDuration: event.target.value }))}
                        />
                      </label>
                    </>
                  ) : (
                    <>
                      <label className="space-y-2 text-sm">
                        <span className="text-[#050A18]/70">Fourchette de rémunération - Min</span>
                        <input
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                          placeholder="1200"
                          value={form.salaryMin}
                          onChange={(event) => setForm((prev) => ({ ...prev, salaryMin: event.target.value }))}
                        />
                      </label>
                      <label className="space-y-2 text-sm">
                        <span className="text-[#050A18]/70">Fourchette de rémunération - Max</span>
                        <input
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                          placeholder="1600"
                          value={form.salaryMax}
                          onChange={(event) => setForm((prev) => ({ ...prev, salaryMax: event.target.value }))}
                        />
                      </label>
                    </>
                  )}
                  {!isFreelance && (
                    <>
                      <label className="space-y-2 text-sm md:col-span-2">
                        <span className="text-[#050A18]/70">Avantages</span>
                        <input
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                          placeholder="Ticket resto, Mutuelle, Prime..."
                          value={form.benefits}
                          onChange={(event) => setForm((prev) => ({ ...prev, benefits: event.target.value }))}
                        />
                      </label>
                      <div className="space-y-2 text-sm md:col-span-2">
                        <span className="text-[#050A18]/70">Avantages &amp; Perks</span>
                        <div className="flex flex-wrap gap-2">
                          {perkTags.map((tag) => {
                            const active = selectedPerks.includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() =>
                                  setSelectedPerks((prev) =>
                                    active ? prev.filter((item) => item !== tag) : [...prev, tag]
                                  )
                                }
                                className={`rounded-full border px-3 py-1 text-[11px] tracking-tight ${
                                  active ? "border-[#050A18] bg-[#050A18] text-white" : "border-slate-200 text-[#050A18]/70"
                                }`}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                  {!isFreelance && (
                    <div className="space-y-2 text-sm md:col-span-2">
                      <span className="text-[#050A18]/70">Culture &amp; ambiance</span>
                      <div className="flex flex-wrap gap-2">
                        {cultureTags.map((tag) => {
                          const active = selectedCulture.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() =>
                                setSelectedCulture((prev) =>
                                  active ? prev.filter((item) => item !== tag) : [...prev, tag]
                                )
                              }
                              className={`rounded-full border px-3 py-1 text-[11px] tracking-tight ${
                                active
                                  ? "border-[#050A18] bg-[#050A18] text-white"
                                  : "border-slate-200 text-[#050A18]/70"
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {!isFreelance && (
                    <div className="grid gap-4 md:grid-cols-2 md:col-span-2">
                      <label className="space-y-2 text-sm">
                        <span className="text-[#050A18]/70">Télétravail</span>
                        <select
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                          value={form.remotePolicy}
                          onChange={(event) => setForm((prev) => ({ ...prev, remotePolicy: event.target.value }))}
                        >
                          <option>Jamais</option>
                          <option>Hybride</option>
                          <option>Full Remote</option>
                          <option>À négocier</option>
                        </select>
                      </label>
                      <label className="space-y-2 text-sm">
                        <span className="text-[#050A18]/70">Travail le week-end</span>
                        <select
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                          value={form.weekendWork}
                          onChange={(event) => setForm((prev) => ({ ...prev, weekendWork: event.target.value }))}
                        >
                          <option>Jamais</option>
                          <option>De temps en temps</option>
                          <option>Régulier</option>
                        </select>
                      </label>
                    </div>
                  )}
                  {!isFreelance && (
                    <>
                      <label className="space-y-2 text-sm md:col-span-2">
                        <span className="text-[#050A18]/70">Vision de l&apos;entreprise</span>
                        <textarea
                          className="min-h-[120px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                          placeholder="Notre impact, notre mission..."
                          value={vision}
                          onChange={(event) => setVision(event.target.value)}
                        />
                      </label>
                      <label className="space-y-2 text-sm">
                        <span className="text-[#050A18]/70">Ton de l&apos;annonce</span>
                        <select
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                          value={tone}
                          onChange={(event) => setTone(event.target.value)}
                        >
                          {toneOptions.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      </label>
                    </>
                  )}
                  {isFreelance ? (
                    <>
                      <label className="space-y-2 text-sm md:col-span-2">
                        <span className="text-[#050A18]/70">Objectifs de la mission</span>
                        <textarea
                          className="min-h-[120px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                          value={form.missionObjectives}
                          onChange={(event) => setForm((prev) => ({ ...prev, missionObjectives: event.target.value }))}
                        />
                      </label>
                      <label className="space-y-2 text-sm md:col-span-2">
                        <span className="text-[#050A18]/70">Périmètre &amp; brief</span>
                        <textarea
                          className="min-h-[120px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                          value={form.missionScope}
                          onChange={(event) => setForm((prev) => ({ ...prev, missionScope: event.target.value }))}
                        />
                      </label>
                      <label className="space-y-2 text-sm md:col-span-2">
                        <span className="text-[#050A18]/70">Livrables attendus</span>
                        <textarea
                          className="min-h-[120px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                          value={form.missionDeliverables}
                          onChange={(event) => setForm((prev) => ({ ...prev, missionDeliverables: event.target.value }))}
                        />
                      </label>
                    </>
                  ) : (
                    <>
                      <label className="space-y-2 text-sm md:col-span-2">
                        <span className="text-[#050A18]/70">Missions</span>
                        <textarea
                          className="min-h-[120px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                          placeholder="Résumé du poste et des missions..."
                          value={form.description}
                          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                          required
                        />
                      </label>
                      <label className="space-y-2 text-sm md:col-span-2">
                        <span className="text-[#050A18]/70">Profil recherché</span>
                        <textarea
                          className={`min-h-[120px] w-full rounded-xl border px-4 py-3 text-sm ${
                            requirementsError && !form.requirements.trim() ? "border-red-500" : "border-slate-200"
                          }`}
                          placeholder="Soft Skills, posture, attentes..."
                          value={form.requirements}
                          onChange={(event) => {
                            const value = event.target.value;
                            setForm((prev) => ({ ...prev, requirements: value }));
                            if (value.trim()) setRequirementsError(false);
                          }}
                          required
                        />
                        <span className="text-xs text-[#050A18]/50">
                          Ce champ est indispensable pour que nous puissions calculer vos scores de matching avec les talents.
                        </span>
                      </label>
                    </>
                  )}
                </div>
              </section>
            )}

            {flow === "manual" && step === 3 && (
              <section className="mt-8 space-y-6">
                <p className="text-sm text-[#050A18]/70">Sélectionnez les dimensions Beyond</p>
                <div className="flex flex-wrap gap-2">
                  {softSkillOptions.map((skill) => {
                    const active = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() =>
                          setSelectedSkills((prev) =>
                            active ? prev.filter((item) => item !== skill) : [...prev, skill]
                          )
                        }
                        className={`rounded-full border px-3 py-1 text-[11px] tracking-tight ${
                          active ? "border-[#050A18] bg-[#050A18] text-white" : "border-slate-200 text-[#050A18]/70"
                        }`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
                {renderOfferCard()}
                <button
                  type="button"
                  onClick={handlePublish}
                  className="w-fit rounded-sm bg-[#050A18] px-8 py-3 text-xs font-semibold tracking-tight text-white"
                  disabled={isPublishing || selectedSkills.length === 0}
                >
                  {isPublishing ? "Publication..." : "PUBLIER L'OFFRE"}
                </button>
              </section>
            )}

            {flow === "ai" && step === 1 && (
              <section className="mt-8 space-y-4">
                <label className="space-y-2 text-sm">
                  <span className="text-[#050A18]/70">
                    Décrivez votre recherche en quelques phrases (Poste, ville, salaire, ambiance...)
                  </span>
                  <textarea
                    className="min-h-[160px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder="Ex: Nous cherchons un Business Developer à Rouen, hybride, salaire 1200-1600..."
                  />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span className="text-[#050A18]/70">Ville (optionnel)</span>
                    <input
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                      value={form.city}
                      onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-[#050A18]/70">Type de contrat</span>
                    <select
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                      value={form.contractType}
                      onChange={(event) => setForm((prev) => ({ ...prev, contractType: event.target.value }))}
                    >
                      <option>Apprentissage</option>
                      <option>Stage</option>
                      <option>CDI</option>
                      <option>CDD</option>
                      <option>Freelance / Mission</option>
                    </select>
                  </label>
                  {isFreelance ? (
                    <label className="space-y-2 text-sm">
                      <span className="text-[#050A18]/70">TJM souhaité (optionnel)</span>
                      <input
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                        value={form.dailyRate}
                        onChange={(event) => setForm((prev) => ({ ...prev, dailyRate: event.target.value }))}
                      />
                    </label>
                  ) : (
                    <>
                      <label className="space-y-2 text-sm">
                        <span className="text-[#050A18]/70">Salaire min (optionnel)</span>
                        <input
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                          value={form.salaryMin}
                          onChange={(event) => setForm((prev) => ({ ...prev, salaryMin: event.target.value }))}
                        />
                      </label>
                      <label className="space-y-2 text-sm">
                        <span className="text-[#050A18]/70">Salaire max (optionnel)</span>
                        <input
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                          value={form.salaryMax}
                          onChange={(event) => setForm((prev) => ({ ...prev, salaryMax: event.target.value }))}
                        />
                      </label>
                    </>
                  )}
                  {!isFreelance && (
                    <label className="space-y-2 text-sm">
                      <span className="text-[#050A18]/70">Ton de l&apos;annonce</span>
                      <select
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                        value={tone}
                        onChange={(event) => setTone(event.target.value)}
                      >
                        {toneOptions.map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
                {!isFreelance && (
                  <div className="space-y-2 text-sm">
                    <span className="text-[#050A18]/70">Culture &amp; ambiance</span>
                    <div className="flex flex-wrap gap-2">
                      {cultureTags.map((tag) => {
                        const active = selectedCulture.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() =>
                              setSelectedCulture((prev) =>
                                active ? prev.filter((item) => item !== tag) : [...prev, tag]
                              )
                            }
                            className={`rounded-full border px-3 py-1 text-[11px] tracking-tight ${
                              active ? "border-[#050A18] bg-[#050A18] text-white" : "border-slate-200 text-[#050A18]/70"
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {!isFreelance && (
                  <div className="space-y-2 text-sm">
                    <span className="text-[#050A18]/70">Avantages &amp; perks</span>
                    <div className="flex flex-wrap gap-2">
                      {perkTags.map((tag) => {
                        const active = selectedPerks.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() =>
                              setSelectedPerks((prev) =>
                                active ? prev.filter((item) => item !== tag) : [...prev, tag]
                              )
                            }
                            className={`rounded-full border px-3 py-1 text-[11px] tracking-tight ${
                              active ? "border-[#050A18] bg-[#050A18] text-white" : "border-slate-200 text-[#050A18]/70"
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  {!isFreelance && (
                    <label className="space-y-2 text-sm">
                      <span className="text-[#050A18]/70">Télétravail</span>
                      <select
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                        value={form.remotePolicy}
                        onChange={(event) => setForm((prev) => ({ ...prev, remotePolicy: event.target.value }))}
                      >
                        <option>Jamais</option>
                        <option>Hybride</option>
                        <option>Full Remote</option>
                        <option>À négocier</option>
                      </select>
                    </label>
                  )}
                </div>
                {!isFreelance && (
                  <label className="space-y-2 text-sm">
                    <span className="text-[#050A18]/70">Vision de l&apos;entreprise</span>
                    <textarea
                      className="min-h-[120px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                      value={vision}
                      onChange={(event) => setVision(event.target.value)}
                      placeholder="Notre impact, notre mission..."
                    />
                  </label>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span className="text-[#050A18]/70">Ville (optionnel)</span>
                    <input
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                      value={form.city}
                      onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                    />
                  </label>
                  {isFreelance ? (
                    <label className="space-y-2 text-sm">
                      <span className="text-[#050A18]/70">TJM souhaité (optionnel)</span>
                      <input
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                        value={form.dailyRate}
                        onChange={(event) => setForm((prev) => ({ ...prev, dailyRate: event.target.value }))}
                      />
                    </label>
                  ) : (
                    <>
                      <label className="space-y-2 text-sm">
                        <span className="text-[#050A18]/70">Salaire min (optionnel)</span>
                        <input
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                          value={form.salaryMin}
                          onChange={(event) => setForm((prev) => ({ ...prev, salaryMin: event.target.value }))}
                        />
                      </label>
                      <label className="space-y-2 text-sm">
                        <span className="text-[#050A18]/70">Salaire max (optionnel)</span>
                        <input
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                          value={form.salaryMax}
                          onChange={(event) => setForm((prev) => ({ ...prev, salaryMax: event.target.value }))}
                        />
                      </label>
                    </>
                  )}
                  {!isFreelance && (
                    <label className="space-y-2 text-sm">
                      <span className="text-[#050A18]/70">Ton de l&apos;annonce</span>
                      <select
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                        value={tone}
                        onChange={(event) => setTone(event.target.value)}
                      >
                        {toneOptions.map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
                {isFreelance && (
                  <div className="space-y-4">
                    <label className="space-y-2 text-sm">
                      <span className="text-[#050A18]/70">Objectifs de la mission</span>
                      <textarea
                        className="min-h-[120px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                        value={form.missionObjectives}
                        onChange={(event) => setForm((prev) => ({ ...prev, missionObjectives: event.target.value }))}
                      />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span className="text-[#050A18]/70">Périmètre &amp; brief</span>
                      <textarea
                        className="min-h-[120px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                        value={form.missionScope}
                        onChange={(event) => setForm((prev) => ({ ...prev, missionScope: event.target.value }))}
                      />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span className="text-[#050A18]/70">Livrables attendus</span>
                      <textarea
                        className="min-h-[120px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                        value={form.missionDeliverables}
                        onChange={(event) => setForm((prev) => ({ ...prev, missionDeliverables: event.target.value }))}
                      />
                    </label>
                  </div>
                )}
                {!isFreelance && (
                  <div className="space-y-2 text-sm">
                    <span className="text-[#050A18]/70">Culture &amp; ambiance</span>
                    <div className="flex flex-wrap gap-2">
                      {cultureTags.map((tag) => {
                        const active = selectedCulture.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() =>
                              setSelectedCulture((prev) =>
                                active ? prev.filter((item) => item !== tag) : [...prev, tag]
                              )
                            }
                            className={`rounded-full border px-3 py-1 text-[11px] tracking-tight ${
                              active ? "border-[#050A18] bg-[#050A18] text-white" : "border-slate-200 text-[#050A18]/70"
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {!isFreelance && (
                  <div className="space-y-2 text-sm">
                    <span className="text-[#050A18]/70">Avantages &amp; perks</span>
                    <div className="flex flex-wrap gap-2">
                      {perkTags.map((tag) => {
                        const active = selectedPerks.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() =>
                              setSelectedPerks((prev) =>
                                active ? prev.filter((item) => item !== tag) : [...prev, tag]
                              )
                            }
                            className={`rounded-full border px-3 py-1 text-[11px] tracking-tight ${
                              active ? "border-[#050A18] bg-[#050A18] text-white" : "border-slate-200 text-[#050A18]/70"
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {!isFreelance && (
                  <label className="space-y-2 text-sm">
                    <span className="text-[#050A18]/70">Vision de l&apos;entreprise</span>
                    <textarea
                      className="min-h-[120px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                      value={vision}
                      onChange={(event) => setVision(event.target.value)}
                      placeholder="Notre impact, notre mission..."
                    />
                  </label>
                )}
                <button
                  type="button"
                  onClick={handleGenerateFromPrompt}
                  className="w-fit rounded-sm border border-[#050A18] px-6 py-3 text-xs font-semibold tracking-tight text-[#050A18]"
                  disabled={isGenerating}
                >
                  {isGenerating ? "Génération..." : "Valider le prompt"}
                </button>
              </section>
            )}

            {flow === "ai" && step === 2 && (
              <section className="mt-8 space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span className="text-[#050A18]/70">Titre du poste</span>
                    <input
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                      value={form.title}
                      onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-[#050A18]/70">Ville</span>
                    <input
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                      value={form.city}
                      onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-[#050A18]/70">Type de contrat</span>
                    <select
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                      value={form.contractType}
                      onChange={(event) => setForm((prev) => ({ ...prev, contractType: event.target.value }))}
                    >
                      <option>Apprentissage</option>
                      <option>Stage</option>
                      <option>CDI</option>
                      <option>CDD</option>
                    <option>Freelance / Mission</option>
                    </select>
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-[#050A18]/70">Télétravail</span>
                    <select
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                      value={form.remotePolicy}
                      onChange={(event) => setForm((prev) => ({ ...prev, remotePolicy: event.target.value }))}
                    >
                      <option>Jamais</option>
                      <option>Hybride</option>
                      <option>Full Remote</option>
                      <option>À négocier</option>
                    </select>
                  </label>
                {isFreelance ? (
                  <>
                    <label className="space-y-2 text-sm">
                      <span className="text-[#050A18]/70">TJM souhaité</span>
                      <input
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                        placeholder="400"
                        value={form.dailyRate}
                        onChange={(event) => setForm((prev) => ({ ...prev, dailyRate: event.target.value }))}
                      />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span className="text-[#050A18]/70">Durée estimée de la mission</span>
                      <input
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                        placeholder="3 mois"
                        value={form.missionDuration}
                        onChange={(event) => setForm((prev) => ({ ...prev, missionDuration: event.target.value }))}
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <label className="space-y-2 text-sm">
                      <span className="text-[#050A18]/70">Rémunération min</span>
                      <input
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                        value={form.salaryMin}
                        onChange={(event) => setForm((prev) => ({ ...prev, salaryMin: event.target.value }))}
                      />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span className="text-[#050A18]/70">Rémunération max</span>
                      <input
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                        value={form.salaryMax}
                        onChange={(event) => setForm((prev) => ({ ...prev, salaryMax: event.target.value }))}
                      />
                    </label>
                  </>
                )}
                  {!isFreelance && (
                    <label className="space-y-2 text-sm">
                      <span className="text-[#050A18]/70">Travail le week-end</span>
                      <select
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                        value={form.weekendWork}
                        onChange={(event) => setForm((prev) => ({ ...prev, weekendWork: event.target.value }))}
                      >
                        <option>Jamais</option>
                        <option>De temps en temps</option>
                        <option>Régulier</option>
                      </select>
                    </label>
                  )}
                  <label className="space-y-2 text-sm">
                    <span className="text-[#050A18]/70">Date de début</span>
                    <input
                      type="date"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                      value={form.startDate}
                      onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
                    />
                  </label>
                  {!isFreelance && (
                    <label className="space-y-2 text-sm md:col-span-2">
                      <span className="text-[#050A18]/70">Avantages</span>
                      <input
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                        placeholder="Ticket resto, Mutuelle, Prime..."
                        value={form.benefits}
                        onChange={(event) => setForm((prev) => ({ ...prev, benefits: event.target.value }))}
                      />
                    </label>
                  )}
                  {isFreelance ? (
                    <>
                      <label className="space-y-2 text-sm md:col-span-2">
                        <span className="text-[#050A18]/70">Objectifs de la mission</span>
                        <textarea
                          className="min-h-[120px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                          value={form.missionObjectives}
                          onChange={(event) => setForm((prev) => ({ ...prev, missionObjectives: event.target.value }))}
                        />
                      </label>
                      <label className="space-y-2 text-sm md:col-span-2">
                        <span className="text-[#050A18]/70">Périmètre &amp; brief</span>
                        <textarea
                          className="min-h-[120px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                          value={form.missionScope}
                          onChange={(event) => setForm((prev) => ({ ...prev, missionScope: event.target.value }))}
                        />
                      </label>
                      <label className="space-y-2 text-sm md:col-span-2">
                        <span className="text-[#050A18]/70">Livrables attendus</span>
                        <textarea
                          className="min-h-[120px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                          value={form.missionDeliverables}
                          onChange={(event) => setForm((prev) => ({ ...prev, missionDeliverables: event.target.value }))}
                        />
                      </label>
                    </>
                  ) : (
                    <label className="space-y-2 text-sm md:col-span-2">
                      <span className="text-[#050A18]/70">Missions</span>
                      <textarea
                        className="min-h-[140px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                        value={form.description}
                        onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                        required
                      />
                    </label>
                  )}
                  {!isFreelance && (
                    <label className="space-y-2 text-sm md:col-span-2">
                      <span className="text-[#050A18]/70">Profil recherché</span>
                      <textarea
                        className={`min-h-[140px] w-full rounded-xl border px-4 py-3 text-sm ${
                          requirementsError && !form.requirements.trim() ? "border-red-500" : "border-slate-200"
                        }`}
                        value={form.requirements}
                        onChange={(event) => {
                          const value = event.target.value;
                          setForm((prev) => ({ ...prev, requirements: value }));
                          if (value.trim()) setRequirementsError(false);
                        }}
                        required
                      />
                      <span className="text-xs text-[#050A18]/50">
                        Ce champ est indispensable pour que nous puissions calculer vos scores de matching avec les talents.
                      </span>
                    </label>
                  )}
                  <div className="space-y-2 text-sm md:col-span-2">
                    <span className="text-[#050A18]/70">Culture &amp; ambiance</span>
                    <div className="flex flex-wrap gap-2">
                      {cultureTags.map((tag) => {
                        const active = selectedCulture.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() =>
                              setSelectedCulture((prev) =>
                                active ? prev.filter((item) => item !== tag) : [...prev, tag]
                              )
                            }
                            className={`rounded-full border px-3 py-1 text-[11px] tracking-tight ${
                              active ? "border-[#050A18] bg-[#050A18] text-white" : "border-slate-200 text-[#050A18]/70"
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {!isFreelance && (
                    <div className="space-y-2 text-sm md:col-span-2">
                      <span className="text-[#050A18]/70">Avantages &amp; perks</span>
                      <div className="flex flex-wrap gap-2">
                        {perkTags.map((tag) => {
                          const active = selectedPerks.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() =>
                                setSelectedPerks((prev) =>
                                  active ? prev.filter((item) => item !== tag) : [...prev, tag]
                                )
                              }
                              className={`rounded-full border px-3 py-1 text-[11px] tracking-tight ${
                                active ? "border-[#050A18] bg-[#050A18] text-white" : "border-slate-200 text-[#050A18]/70"
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <label className="space-y-2 text-sm md:col-span-2">
                    <span className="text-[#050A18]/70">Vision de l&apos;entreprise</span>
                    <textarea
                      className="min-h-[120px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                      value={vision}
                      onChange={(event) => setVision(event.target.value)}
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-[#050A18]/70">Ton de l&apos;annonce</span>
                    <select
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                      value={tone}
                      onChange={(event) => setTone(event.target.value)}
                    >
                      {toneOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="grid gap-3">
                  <p className="text-sm text-[#050A18]/70">Soft skills prioritaires</p>
                  <div className="flex flex-wrap gap-2">
                    {softSkillOptions.map((skill) => {
                      const active = selectedSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() =>
                            setSelectedSkills((prev) =>
                              active ? prev.filter((item) => item !== skill) : [...prev, skill]
                            )
                          }
                          className={`rounded-full border px-3 py-1 text-[11px] tracking-tight ${
                            active ? "border-[#050A18] bg-[#050A18] text-white" : "border-slate-200 text-[#050A18]/70"
                          }`}
                        >
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {renderOfferCard()}
                <button
                  type="button"
                  onClick={handlePublish}
                  className="w-fit rounded-sm bg-[#050A18] px-8 py-3 text-xs font-semibold tracking-tight text-white"
                  disabled={isPublishing}
                >
                  {isPublishing ? "Publication..." : "PUBLIER L'OFFRE"}
                </button>
              </section>
            )}

              <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && flow === "ai") {
                    setFlow("choice");
                    return;
                  }
                  setStep((prev) => Math.max(1, prev - 1));
                }}
                className="rounded-full border border-slate-200 px-6 py-2 text-xs font-semibold tracking-tight text-[#050A18]"
              >
                Retour
              </button>
              {flow === "manual" && step < totalSteps && (
                <button
                  type="button"
                  onClick={() => setStep((prev) => prev + 1)}
                  className="rounded-full bg-[#050A18] px-6 py-2 text-xs font-semibold tracking-tight text-white"
                  disabled={!canContinue}
                >
                  Continuer
                </button>
              )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
