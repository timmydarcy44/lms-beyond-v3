"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const LOCAL_STORAGE_KEY = "bns_club_survey_v1_draft";

const hardSkills = [
  {
    key: "negocier_grands_comptes",
    label: "Négocier un deal grands comptes",
    helper: "Négociation complexe avec cycles longs et multiples décideurs.",
  },
  {
    key: "sales_deck",
    label: "Construire un Sales Deck convaincant",
    helper: "Structurer un récit clair, data-driven et orienté impact.",
  },
  {
    key: "solution_complexe",
    label: "Vendre une solution complexe (hospitalités/naming/digital)",
    helper: "Orchestrer l’offre, le pricing et les parties prenantes.",
  },
  {
    key: "prospecter_comptes",
    label: "Prospecter et ouvrir des comptes stratégiques",
    helper: "Identifier, approcher et qualifier des comptes clés.",
  },
  {
    key: "crm_pipeline",
    label: "Piloter un CRM et sécuriser le pipeline",
    helper: "Vision claire sur les étapes, probabilités et risques.",
  },
];

const softSkills = [
  "Influencer sans autorité",
  "Gérer un conflit terrain",
  "Prioriser vite sous pression",
  "Créer de la confiance durable",
  "Savoir dire non proprement",
  "Décider dans l’ambiguïté",
  "Écouter activement",
  "Animer une réunion décisive",
  "Rendre un feedback utile",
  "Coordonner en transverse",
];

const proofOptions = [
  {
    id: "audit_deck",
    label: "Audit Sales Deck (PDF)",
    description: "Audit structuré d’un deck commercial.",
  },
  {
    id: "negotiation_dossier",
    label: "Dossier de négociation (PDF)",
    description: "Argumentaire, objections, concessions.",
  },
  {
    id: "pitch_simulation",
    label: "Simulation de pitch (vidéo ou lien)",
    description: "Présentation filmée ou visio.",
  },
  {
    id: "timed_case",
    label: "Étude de cas chronométrée (texte/PDF)",
    description: "Analyse structurée en temps limité.",
  },
  {
    id: "crm_analysis",
    label: "Analyse CRM/Pipeline (export + questions guidées)",
    description: "Lecture critique d’un pipe et plan d’action.",
  },
  {
    id: "qcm",
    label: "QCM ciblé (validation de connaissances)",
    description: "Validation des fondamentaux.",
  },
];

const proofSuggestions: Record<string, string[]> = {
  negocier_grands_comptes: ["negotiation_dossier", "pitch_simulation"],
  sales_deck: ["audit_deck"],
  solution_complexe: ["timed_case"],
  prospecter_comptes: ["timed_case", "qcm"],
  crm_pipeline: ["crm_analysis"],
};

const validationSignalOptions = [
  "Critères explicites (checklist)",
  "Barème / scoring",
  "Exemples acceptés vs refusés",
  "Contexte fourni (brief, objectifs, contraintes)",
  "Temps limité (anti-copie)",
  "Validation humaine en plus de l’IA",
  "Réplicabilité (même résultat avec un autre cas)",
  "Traçabilité (sources/données jointes)",
];

type HardSkillValue = "critique" | "importante" | "utile" | "bonus";

type SkillProofMapping = {
  skillId: string;
  skillLabel: string;
  priority: HardSkillValue;
  proofId: string;
  proofLabel: string;
};

type SurveyState = {
  club: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  phone: string;
  hardSkills: Record<string, HardSkillValue | "">;
  skillProofMapping: SkillProofMapping[];
  hideBonus: boolean;
  validationSignals: {
    topSignals: string[];
    note: string;
  };
  qualitative: {
    hardestToAssess: string;
    marketGap: string;
  };
  softSkills: string[];
  preferredValidation: string;
  beyondConnectOptin: boolean;
  preferredContactChannel: string;
  website: string;
};

const defaultState: SurveyState = {
  club: "",
  firstName: "",
  lastName: "",
  role: "",
  email: "",
  phone: "",
  hardSkills: hardSkills.reduce((acc, skill) => ({ ...acc, [skill.key]: "" }), {}),
  skillProofMapping: [],
  hideBonus: true,
  validationSignals: {
    topSignals: [],
    note: "",
  },
  qualitative: {
    hardestToAssess: "",
    marketGap: "",
  },
  softSkills: [],
  preferredValidation: "",
  beyondConnectOptin: false,
  preferredContactChannel: "",
  website: "",
};

const fadeVariants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -18 },
};

export default function BeyondNoSchoolClubSurveyPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [survey, setSurvey] = useState<SurveyState>(defaultState);
  const [isHydrated, setIsHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setSurvey({ ...defaultState, ...(parsed.data ?? parsed) });
        setStep(parsed.step ?? 0);
      } catch {
        setSurvey(defaultState);
      }
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return;
    window.localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({ step, data: survey }),
    );
  }, [step, survey, isHydrated]);

  const totalSteps = 8;
  const progress = Math.round((step / (totalSteps - 1)) * 100);

  useEffect(() => {
    setSurvey((prev) => {
      const nextMappings = prev.skillProofMapping.filter((mapping) =>
        hardSkills.some((skill) => skill.key === mapping.skillId),
      );
      const missing = hardSkills.filter(
        (skill) => !nextMappings.some((mapping) => mapping.skillId === skill.key),
      );
      const created = missing.map((skill) => {
        const suggestion = proofSuggestions[skill.key]?.[0] ?? proofOptions[0].id;
        const proof = proofOptions.find((option) => option.id === suggestion) ?? proofOptions[0];
        return {
          skillId: skill.key,
          skillLabel: skill.label,
          priority: (prev.hardSkills[skill.key] as HardSkillValue) || "utile",
          proofId: proof.id,
          proofLabel: proof.label,
        };
      });
      const updated = [...nextMappings, ...created];
      const changed = JSON.stringify(updated) !== JSON.stringify(prev.skillProofMapping);
      if (!changed) return prev;
      return { ...prev, skillProofMapping: updated };
    });
  }, [survey.hardSkills]);

  const canContinue = useMemo(() => {
    if (step === 0) {
      return survey.club.trim() && survey.firstName.trim() && survey.lastName.trim();
    }
    if (step === 1) {
      return hardSkills.every((skill) => Boolean(survey.hardSkills[skill.key]));
    }
    if (step === 2) {
      return hardSkills.every((skill) =>
        survey.skillProofMapping.some(
          (mapping) => mapping.skillId === skill.key && mapping.proofId,
        ),
      );
    }
    if (step === 3) {
      return survey.softSkills.length <= 3;
    }
    if (step === 4) {
      return survey.validationSignals.topSignals.length <= 3;
    }
    if (step === 5) {
      return true;
    }
    if (step === 6) {
      if (survey.beyondConnectOptin) {
        if (!survey.preferredContactChannel) return false;
        if (survey.preferredContactChannel === "phone" && !survey.phone.trim()) return false;
      }
      return true;
    }
    return true;
  }, [step, survey]);

  const handleNext = () => {
    if (!canContinue) {
      setError("Merci de compléter les champs requis pour continuer.");
      return;
    }
    setError(null);
    setStep((prev) => Math.min(prev + 1, totalSteps - 1));
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handleFinish = () => {
    router.push("/beyond-no-school");
  };

  const handleSubmit = async () => {
    if (!canContinue) {
      setError("Merci de compléter les champs requis.");
      return;
    }
    setStatus("loading");
    setError(null);
    setErrorDetail(null);
    try {
      const proofToValidation: Record<string, string> = {
        audit_deck: "audit_pdf",
        negotiation_dossier: "audit_pdf",
        pitch_simulation: "video",
        timed_case: "case_timed",
        crm_analysis: "crm_analysis",
        qcm: "qcm",
      };
      const preferredValidation =
        survey.skillProofMapping
          .map((mapping) => proofToValidation[mapping.proofId])
          .filter(Boolean)
          .reduce<Record<string, number>>((acc, value) => {
            acc[value] = (acc[value] ?? 0) + 1;
            return acc;
          }, {});
      const topValidation = Object.entries(preferredValidation).sort((a, b) => b[1] - a[1])[0]?.[0];

      const response = await fetch("/api/bns/survey/club", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          club: survey.club,
          first_name: survey.firstName,
          last_name: survey.lastName,
          role: survey.role || null,
          email: survey.email || null,
          phone: survey.phone || null,
          hard_skills: {
            priorities: survey.hardSkills,
            skill_proof_mapping: survey.skillProofMapping,
            validation_signals: {
              topSignals: survey.validationSignals.topSignals,
              note: survey.validationSignals.note || null,
            },
            qualitative: {
              hardestToAssess: survey.qualitative.hardestToAssess || null,
              marketGap: survey.qualitative.marketGap || null,
            },
          },
          soft_skills: survey.softSkills,
          preferred_validation: topValidation ?? "audit_pdf",
          market_gap: survey.qualitative.marketGap || null,
          beyond_connect_optin: survey.beyondConnectOptin,
          preferred_contact_channel: survey.preferredContactChannel || null,
          source: "bns",
          version: "v1",
          website: survey.website,
        }),
      });
      const rawBody = await response.text();
      const parsedBody = rawBody ? (() => {
        try {
          return JSON.parse(rawBody);
        } catch {
          return rawBody;
        }
      })() : null;
      const debugPayload = {
        status: response.status,
        body: parsedBody,
      };
      console.info("[BNS] club survey response", debugPayload);
      if (!response.ok || !parsedBody || (parsedBody as { ok?: boolean }).ok !== true) {
        const apiError =
          (parsedBody as { errorId?: string; details?: string; code?: string })?.details ||
          (parsedBody as { errorId?: string; details?: string; code?: string })?.code ||
          (parsedBody as { errorId?: string })?.errorId ||
          "Impossible d’enregistrer la réponse.";
        setErrorDetail(JSON.stringify(debugPayload, null, 2));
        throw new Error(apiError);
      }
      setStatus("success");
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0b10] pb-16 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(255,88,61,0.18),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(80,130,255,0.12),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(180deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:2px_2px]" />

      <div className="relative mx-auto w-full max-w-3xl px-6 py-14">
        <div className="mb-10 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/50">
          <span>Beyond — Enquête Clubs</span>
          <span>{progress}%</span>
        </div>
        <div className="mb-8 h-1 w-full rounded-full bg-white/10">
          <div className="h-1 rounded-full bg-white" style={{ width: `${progress}%` }} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="rounded-3xl border border-white/10 bg-black/40 p-8 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur"
          >
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-semibold">
                    Construisons ensemble le standard de compétence du Sport Business.
                  </h1>
                  <p className="mt-2 text-white/70">
                    5 minutes. Vos choix structurent les preuves Beyond 2026 et le vivier Beyond
                    Connect.
                  </p>
                  <p className="mt-3 text-sm text-white/60">
                    Aucun blabla. Des soft skills mesurables. Des preuves auditables.
                  </p>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80"
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                    Votre contribution
                  </p>
                  <ul className="mt-3 space-y-2">
                    <li>• Vous priorisez les soft skills qui comptent vraiment</li>
                    <li>• Vous choisissez des preuves vérifiables (audit IA + validation humaine)</li>
                    <li>• Vous accédez ensuite au vivier Beyond Connect (optionnel)</li>
                  </ul>
                </motion.div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    placeholder="Club"
                    value={survey.club}
                    onChange={(event) => setSurvey({ ...survey, club: event.target.value })}
                  />
                  <Input
                    placeholder="Prénom"
                    value={survey.firstName}
                    onChange={(event) => setSurvey({ ...survey, firstName: event.target.value })}
                  />
                  <Input
                    placeholder="Nom"
                    value={survey.lastName}
                    onChange={(event) => setSurvey({ ...survey, lastName: event.target.value })}
                  />
                  <select
                    className="h-10 rounded-md border border-white/10 bg-black/60 px-3 text-sm text-white"
                    value={survey.role}
                    onChange={(event) => setSurvey({ ...survey, role: event.target.value })}
                  >
                    <option value="">Fonction (optionnel)</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Partenariats">Partenariats</option>
                    <option value="Direction">Direction</option>
                    <option value="Autre">Autre</option>
                  </select>
                  <Input
                    placeholder="Email (optionnel)"
                    value={survey.email}
                    onChange={(event) => setSurvey({ ...survey, email: event.target.value })}
                  />
                  <Input
                    placeholder="Téléphone (optionnel)"
                    value={survey.phone}
                    onChange={(event) => setSurvey({ ...survey, phone: event.target.value })}
                  />
                  <input
                    className="hidden"
                    aria-hidden="true"
                    tabIndex={-1}
                    autoComplete="off"
                    value={survey.website}
                    onChange={(event) => setSurvey({ ...survey, website: event.target.value })}
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold">Soft Skills clés à prioriser</h2>
                  <p className="mt-2 text-white/60">Indique le niveau de priorité.</p>
                </div>
                <div className="space-y-4">
                  {hardSkills.map((skill) => (
                    <div key={skill.key} className="rounded-2xl border border-white/10 p-4">
                      <p className="text-sm text-white">{skill.label}</p>
                      <p className="mt-1 text-xs text-white/60">{skill.helper}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(["critique", "importante", "utile", "bonus"] as HardSkillValue[]).map((value) => (
                          <button
                            key={value}
                            type="button"
                            className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] ${
                              survey.hardSkills[skill.key] === value
                                ? "border-white bg-white text-black"
                                : "border-white/20 text-white/60"
                            }`}
                            onClick={() =>
                              setSurvey({
                                ...survey,
                                hardSkills: { ...survey.hardSkills, [skill.key]: value },
                                skillProofMapping: survey.skillProofMapping.map((mapping) =>
                                  mapping.skillId === skill.key
                                    ? { ...mapping, priority: value }
                                    : mapping,
                                ),
                              })
                            }
                          >
                            {value === "critique"
                              ? "Critique"
                              : value === "importante"
                              ? "Importante"
                              : value === "utile"
                              ? "Utile"
                              : "Bonus"}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold">
                    Pour chaque compétence, quelle preuve te paraît la plus fiable ?
                  </h2>
                  <p className="mt-2 text-white/60">
                    Choisis le format audit-able le plus pertinent.
                  </p>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-white/70">
                  <span>Masquer les soft skills Bonus</span>
                  <button
                    type="button"
                    onClick={() => setSurvey((prev) => ({ ...prev, hideBonus: !prev.hideBonus }))}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      survey.hideBonus
                        ? "border-white bg-white text-black"
                        : "border-white/30 text-white/70"
                    }`}
                  >
                    {survey.hideBonus ? "On" : "Off"}
                  </button>
                </div>
                <div className="space-y-4">
                  {hardSkills
                    .filter((skill) => {
                      const priority = survey.hardSkills[skill.key];
                      return !survey.hideBonus || priority !== "bonus";
                    })
                    .map((skill) => {
                      const mapping =
                        survey.skillProofMapping.find((item) => item.skillId === skill.key) ??
                        null;
                      const selectedProof = proofOptions.find(
                        (option) => option.id === mapping?.proofId,
                      );
                      const priority = survey.hardSkills[skill.key] as HardSkillValue | "";
                      return (
                        <div key={skill.key} className="rounded-2xl border border-white/10 p-4">
                          <div className="flex items-center justify-between gap-4">
                            <p className="text-sm text-white">{skill.label}</p>
                            <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70">
                              {priority
                                ? priority === "critique"
                                  ? "Critique"
                                  : priority === "importante"
                                  ? "Importante"
                                  : priority === "utile"
                                  ? "Utile"
                                  : "Bonus"
                                : "—"}
                            </span>
                          </div>
                          <select
                            className="mt-3 h-10 w-full rounded-md border border-white/10 bg-black/60 px-3 text-sm text-white"
                            value={mapping?.proofId ?? ""}
                            onChange={(event) => {
                              const proof = proofOptions.find(
                                (option) => option.id === event.target.value,
                              );
                              setSurvey((prev) => ({
                                ...prev,
                                skillProofMapping: prev.skillProofMapping.map((item) =>
                                  item.skillId === skill.key
                                    ? {
                                        ...item,
                                        proofId: event.target.value,
                                        proofLabel: proof?.label ?? "",
                                      }
                                    : item,
                                ),
                              }));
                            }}
                          >
                            <option value="">Preuve recommandée</option>
                            {proofOptions.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <p className="mt-2 text-xs text-white/60">
                            {selectedProof?.description ?? "Choisir un format audit-able."}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold">Soft skills prioritaires</h2>
                  <p className="mt-2 text-white/60">Sélectionne jusqu’à 3 soft skills.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {softSkills.map((skill) => {
                    const selected = survey.softSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        className={`rounded-full border px-3 py-1 text-xs ${
                          selected ? "border-white bg-white text-black" : "border-white/20 text-white/60"
                        }`}
                        onClick={() => {
                          if (selected) {
                            setSurvey({
                              ...survey,
                              softSkills: survey.softSkills.filter((item) => item !== skill),
                            });
                          } else if (survey.softSkills.length < 3) {
                            setSurvey({
                              ...survey,
                              softSkills: [...survey.softSkills, skill],
                            });
                          }
                        }}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
                <p className="text-sm text-white/60">
                  {survey.softSkills.length}/3 sélectionnées
                </p>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold">
                    Qu’est-ce qui te fait dire qu’une preuve est solide ?
                  </h2>
                  <p className="mt-2 text-white/60">
                    Aide-nous à calibrer l’audit IA + la validation humaine.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {validationSignalOptions.map((signal) => {
                    const selected = survey.validationSignals.topSignals.includes(signal);
                    return (
                      <button
                        key={signal}
                        type="button"
                        className={`rounded-2xl border p-4 text-left text-sm ${
                          selected
                            ? "border-white bg-white text-black"
                            : "border-white/20 bg-black/20 text-white"
                        }`}
                        onClick={() => {
                          if (selected) {
                            setSurvey({
                              ...survey,
                              validationSignals: {
                                ...survey.validationSignals,
                                topSignals: survey.validationSignals.topSignals.filter(
                                  (item) => item !== signal,
                                ),
                              },
                            });
                          } else if (survey.validationSignals.topSignals.length < 3) {
                            setSurvey({
                              ...survey,
                              validationSignals: {
                                ...survey.validationSignals,
                                topSignals: [...survey.validationSignals.topSignals, signal],
                              },
                            });
                          }
                        }}
                      >
                        {signal}
                      </button>
                    );
                  })}
                </div>
                <p className="text-sm text-white/60">
                  {survey.validationSignals.topSignals.length}/3 sélectionnés
                </p>
                <Textarea
                  placeholder="Un détail qui compte vraiment pour vous (optionnel)"
                  value={survey.validationSignals.note}
                  onChange={(event) =>
                    setSurvey({
                      ...survey,
                      validationSignals: { ...survey.validationSignals, note: event.target.value },
                    })
                  }
                />
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold">
                    Besoins réels & difficile à quantifier
                  </h2>
                  <p className="mt-2 text-white/60">2 min, très utile pour construire le standard.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-white">
                      Sur quelles soft skills avez-vous le plus de mal à évaluer un candidat ?
                    </p>
                    <Textarea
                      className="mt-2"
                      placeholder="Ex: ‘l’influence en rendez-vous’, ‘le niveau réel sur CRM’, ‘la structuration d’une offre’…"
                      value={survey.qualitative.hardestToAssess}
                      onChange={(event) =>
                        setSurvey({
                          ...survey,
                          qualitative: {
                            ...survey.qualitative,
                            hardestToAssess: event.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <p className="text-sm text-white">
                      Qu’est-ce qui manque aujourd’hui sur le marché (dans votre contexte club) ?
                    </p>
                    <Textarea
                      className="mt-2"
                      placeholder="Ex: ‘capacité à vendre du naming’, ‘prospection B2B hors sport’, ‘structuration d’un sales deck’, etc."
                      value={survey.qualitative.marketGap}
                      onChange={(event) =>
                        setSurvey({
                          ...survey,
                          qualitative: {
                            ...survey.qualitative,
                            marketGap: event.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold">Coordonnées & Beyond Connect</h2>
                  <p className="mt-2 text-white/60">Facultatif.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <label className="flex items-center justify-between text-sm text-white">
                    <span>Je souhaite recevoir un accès privilégié au vivier Beyond Connect.</span>
                    <input
                      type="checkbox"
                      checked={survey.beyondConnectOptin}
                      onChange={(event) =>
                        setSurvey({ ...survey, beyondConnectOptin: event.target.checked })
                      }
                    />
                  </label>
                  {survey.beyondConnectOptin ? (
                    <div className="mt-4 space-y-3">
                      <select
                        className="h-10 w-full rounded-md border border-white/10 bg-black/60 px-3 text-sm text-white"
                        value={survey.preferredContactChannel}
                        onChange={(event) =>
                          setSurvey({ ...survey, preferredContactChannel: event.target.value })
                        }
                      >
                        <option value="">Canal préféré</option>
                        <option value="email">Email</option>
                        <option value="phone">Téléphone</option>
                      </select>
                      {survey.preferredContactChannel === "phone" ? (
                        <Input
                          placeholder="Téléphone (obligatoire)"
                          value={survey.phone}
                          onChange={(event) => setSurvey({ ...survey, phone: event.target.value })}
                        />
                      ) : null}
                      <p className="text-xs text-white/50">
                        Aucun spam. On te contacte uniquement pour proposer l’accès au vivier.
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {step === 7 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Merci.</h2>
                <p className="text-white/60">
                  Merci. Vos réponses contribuent directement au standard 2026.
                </p>
                {status === "success" ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-emerald-200">
                    <CheckCircle2 className="h-5 w-5" />
                    Réponse enregistrée ✅ Merci.
                  </div>
                ) : null}
                {status === "error" ? (
                  <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-red-200">
                    <p>Erreur d’envoi. Tu peux réessayer.</p>
                    {error ? <p className="mt-2 text-sm text-red-100">{error}</p> : null}
                    {errorDetail ? (
                      <div className="mt-3 space-y-2">
                        <pre className="whitespace-pre-wrap text-xs text-red-100/80">
                          {errorDetail}
                        </pre>
                        <Button
                          variant="outline"
                          onClick={async () => {
                            await navigator.clipboard.writeText(errorDetail);
                          }}
                        >
                          Copier l’erreur
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  {status === "success" ? (
                    <Button
                      onClick={handleFinish}
                      className="rounded-full bg-white px-6 text-xs uppercase tracking-[0.3em] text-black hover:bg-white/90"
                    >
                      Terminer
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={status === "loading"}
                      className="rounded-full bg-white px-6 text-xs uppercase tracking-[0.3em] text-black hover:bg-white/90"
                    >
                      {status === "loading" ? "Envoi..." : "Envoyer mes réponses"}
                    </Button>
                  )}
                  {status === "error" ? (
                    <Button variant="outline" onClick={handleSubmit}>
                      Réessayer
                    </Button>
                  ) : null}
                </div>
              </div>
            )}

            {error ? <p className="mt-6 text-sm text-red-300">{error}</p> : null}
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            className="text-white/60 hover:text-white"
            onClick={handleBack}
            disabled={step === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          {step < totalSteps - 1 ? (
          <Button
            onClick={handleNext}
            className={`rounded-full bg-white px-6 text-xs uppercase tracking-[0.3em] text-black hover:bg-white/90 ${
              step === 0 ? "w-full justify-center sm:w-auto" : ""
            }`}
          >
            {step === 0 ? "Commencer" : "Continuer"}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

