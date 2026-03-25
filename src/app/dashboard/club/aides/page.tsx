"use client";

import { useEffect, useMemo, useState } from "react";
import { Medal } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";
import { ClubLayout } from "@/components/club/club-layout";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const AUDIT_QUESTIONS = [
  {
    categorie: "Commercial & Revenus",
    question: "Combien de partenaires actifs votre club compte-t-il cette saison ?",
    cle: "nb_partenaires",
    options: [
      { label: "Moins de 5", value: 1 },
      { label: "Entre 5 et 15", value: 2 },
      { label: "Entre 15 et 30", value: 3 },
      { label: "Plus de 30", value: 4 },
    ],
  },
  {
    categorie: "Commercial & Revenus",
    question: "Avez-vous un process structuré pour démarcher de nouveaux partenaires ?",
    cle: "process_commercial",
    options: [
      { label: "Non, c'est informel et au cas par cas", value: 1 },
      { label: "On a quelques contacts mais pas de méthode", value: 2 },
      { label: "On a une liste de prospects mais peu de suivi", value: 3 },
      { label: "Oui, avec un CRM et des relances régulières", value: 4 },
    ],
  },
  {
    categorie: "Commercial & Revenus",
    question: "Quel est votre budget partenariats annuel (CA généré) ?",
    cle: "budget_partenariats",
    options: [
      { label: "Moins de 10 000€", value: 1 },
      { label: "Entre 10 000€ et 30 000€", value: 2 },
      { label: "Entre 30 000€ et 80 000€", value: 3 },
      { label: "Plus de 80 000€", value: 4 },
    ],
  },
  {
    categorie: "Commercial & Revenus",
    question: "Comment valorisez-vous vos offres partenaires ?",
    cle: "valorisation_offres",
    options: [
      { label: "On n'a pas de grille tarifaire formelle", value: 1 },
      { label: "On a des packs mais sans calcul de ROI", value: 2 },
      { label: "On a des packs avec quelques éléments de valorisation", value: 3 },
      { label: "On utilise une grille IREP avec preuves de ROI", value: 4 },
    ],
  },
  {
    categorie: "Commercial & Revenus",
    question: "Quel est votre taux de renouvellement partenaires d'une saison à l'autre ?",
    cle: "taux_renouvellement",
    options: [
      { label: "Moins de 40%", value: 1 },
      { label: "Entre 40% et 60%", value: 2 },
      { label: "Entre 60% et 80%", value: 3 },
      { label: "Plus de 80%", value: 4 },
    ],
  },
  {
    categorie: "Marketing & Communication",
    question: "Quelle est votre présence sur les réseaux sociaux ?",
    cle: "reseaux_sociaux",
    options: [
      { label: "Peu ou pas de réseaux actifs", value: 1 },
      { label: "1-2 réseaux mais publication irrégulière", value: 2 },
      { label: "2-3 réseaux avec publication régulière", value: 3 },
      { label: "Stratégie multi-réseaux avec planning éditorial", value: 4 },
    ],
  },
  {
    categorie: "Marketing & Communication",
    question: "Produisez-vous du contenu vidéo pour vos matchs ?",
    cle: "contenu_video",
    options: [
      { label: "Non, aucune vidéo", value: 1 },
      { label: "Occasionnellement, de manière amateur", value: 2 },
      { label: "Oui, highlights après les matchs", value: 3 },
      { label: "Oui, live + highlights + contenus sponsorisés", value: 4 },
    ],
  },
  {
    categorie: "Marketing & Communication",
    question: "Disposez-vous d'une base de données contacts (supporters, partenaires) ?",
    cle: "base_contacts",
    options: [
      { label: "Non, aucune base structurée", value: 1 },
      { label: "Quelques contacts dans un fichier Excel", value: 2 },
      { label: "Une newsletter avec moins de 500 abonnés", value: 3 },
      { label: "Une base segmentée de plus de 500 contacts", value: 4 },
    ],
  },
  {
    categorie: "Marketing & Communication",
    question: "Comment gérez-vous votre image de marque ?",
    cle: "image_marque",
    options: [
      { label: "On n'y pense pas vraiment", value: 1 },
      { label: "On a un logo mais pas de charte graphique", value: 2 },
      { label: "On a une charte graphique appliquée partiellement", value: 3 },
      { label: "Identité visuelle cohérente sur tous les supports", value: 4 },
    ],
  },
  {
    categorie: "Marketing & Communication",
    question: "Organisez-vous des événements pour animer votre communauté ?",
    cle: "evenements",
    options: [
      { label: "Non, uniquement les matchs", value: 1 },
      { label: "Rarement (1-2 événements/an)", value: 2 },
      { label: "Régulièrement (soirées, tournois, etc.)", value: 3 },
      { label: "Programme événementiel structuré tout au long de l'année", value: 4 },
    ],
  },
  {
    categorie: "Activation Partenaires",
    question: "Comment activez-vous vos partenaires sur les jours de match ?",
    cle: "activation_match",
    options: [
      { label: "Panneau bord terrain, c'est tout", value: 1 },
      { label: "Panneau + mention sur les réseaux", value: 2 },
      { label: "Expérience VIP + visibilité digitale + réseaux", value: 3 },
      { label: "Programme d'activation complet avec ROI mesuré", value: 4 },
    ],
  },
  {
    categorie: "Activation Partenaires",
    question: "Fournissez-vous un rapport de visibilité à vos partenaires ?",
    cle: "rapport_visibilite",
    options: [
      { label: "Non jamais", value: 1 },
      { label: "À la demande uniquement", value: 2 },
      { label: "Un bilan en fin de saison", value: 3 },
      { label: "Rapport trimestriel avec métriques précises", value: 4 },
    ],
  },
  {
    categorie: "Activation Partenaires",
    question: "Vos partenaires participent-ils à la vie du club en dehors du sponsoring ?",
    cle: "engagement_partenaires",
    options: [
      { label: "Non, relation purement commerciale", value: 1 },
      { label: "Quelques-uns viennent aux matchs", value: 2 },
      { label: "Réseau actif, échanges business entre partenaires", value: 3 },
      { label: "Communauté de partenaires engagés dans le projet club", value: 4 },
    ],
  },
  {
    categorie: "Sportif & Performance",
    question: "Avez-vous un staff technique professionnel ?",
    cle: "staff_technique",
    options: [
      { label: "Entraîneur bénévole uniquement", value: 1 },
      { label: "1 entraîneur indemnisé", value: 2 },
      { label: "Staff de 2-3 personnes indemnisées", value: 3 },
      { label: "Staff complet (coach, adjoint, préparateur physique, kiné)", value: 4 },
    ],
  },
  {
    categorie: "Sportif & Performance",
    question: "Utilisez-vous des outils d'analyse de performance ?",
    cle: "analyse_performance",
    options: [
      { label: "Non, analyse intuitive uniquement", value: 1 },
      { label: "Vidéo basique (smartphone)", value: 2 },
      { label: "Logiciel de vidéo-analyse", value: 3 },
      { label: "Data + vidéo + GPS / wearables", value: 4 },
    ],
  },
  {
    categorie: "Sportif & Performance",
    question: "Comment gérez-vous le recrutement et le renouvellement des effectifs ?",
    cle: "recrutement",
    options: [
      { label: "Réseau informel et bouche à oreille", value: 1 },
      { label: "Quelques contacts agents/clubs", value: 2 },
      { label: "Processus de scouting structuré", value: 3 },
      { label: "Cellule recrutement avec base de données de joueurs", value: 4 },
    ],
  },
  {
    categorie: "Sportif & Performance",
    question: "Votre club dispose-t-il d'un centre de formation ou préformation ?",
    cle: "formation",
    options: [
      { label: "Non, uniquement équipe première", value: 1 },
      { label: "Équipes jeunes sans structure de formation", value: 2 },
      { label: "Filière jeunes structurée avec montée vers l'équipe première", value: 3 },
      { label: "Centre de formation agréé FFF", value: 4 },
    ],
  },
  {
    categorie: "Gouvernance & Structure",
    question: "Quel est le niveau de professionnalisation de votre direction ?",
    cle: "professionnalisation",
    options: [
      { label: "100% bénévoles", value: 1 },
      { label: "1 salarié administratif", value: 2 },
      { label: "2-3 salariés permanents", value: 3 },
      { label: "Direction générale + services structurés", value: 4 },
    ],
  },
  {
    categorie: "Gouvernance & Structure",
    question: "Avez-vous un budget prévisionnel formalisé ?",
    cle: "budget_previsionnel",
    options: [
      { label: "Non, gestion au fil de l'eau", value: 1 },
      { label: "Budget approximatif non formalisé", value: 2 },
      { label: "Budget annuel formalisé", value: 3 },
      { label: "Budget pluriannuel avec tableaux de bord mensuels", value: 4 },
    ],
  },
  {
    categorie: "Gouvernance & Structure",
    question: "Votre club est-il à jour de ses obligations DNCG ?",
    cle: "dncg_compliance",
    options: [
      { label: "On ne sait pas exactement ce qu'on doit fournir", value: 1 },
      { label: "On rassemble les documents chaque année en urgence", value: 2 },
      { label: "On anticipe mais on manque d'organisation", value: 3 },
      { label: "Process DNCG maîtrisé, documents prêts en avance", value: 4 },
    ],
  },
  {
    categorie: "Gouvernance & Structure",
    question: "Comment évaluez-vous les besoins en formation de vos collaborateurs ?",
    cle: "besoin_formation",
    options: [
      { label: "On n'évalue pas, formations très rares", value: 1 },
      { label: "À la demande des personnes concernées", value: 2 },
      { label: "Entretiens annuels avec quelques formations ciblées", value: 3 },
      { label: "Plan de développement des compétences structuré", value: 4 },
    ],
  },
];

const calculateResults = (answers: Record<number, number>) => {
  const avg = (start: number, end: number) => {
    const slice = [];
    for (let i = start; i <= end; i += 1) {
      slice.push(answers[i] ?? 0);
    }
    const total = slice.reduce((sum, value) => sum + value, 0);
    return slice.length ? total / slice.length : 0;
  };
  const scores = {
    commercial: avg(0, 4),
    marketing: avg(5, 9),
    activation: avg(10, 12),
    sportif: avg(13, 16),
    gouvernance: avg(17, 19),
  };
  const scoreGlobal = Math.round((Object.values(scores).reduce((a, b) => a + b, 0) / 5) * 25);
  const sorted = Object.entries(scores).sort((a, b) => a[1] - b[1]);
  const formations = {
    commercial: "Développement des revenus club",
    marketing: "Réseaux sociaux & Content Club",
    activation: "Soirées partenaires & Activation",
    sportif: "Performance & Analyse vidéo",
    gouvernance: "Gestion & Administration club",
  };
  const priorite1 = formations[sorted[0][0] as keyof typeof formations];
  const priorite2 = formations[sorted[1][0] as keyof typeof formations];

  return { scores, scoreGlobal, priorite1, priorite2 };
};

export default function ClubAidesPage() {
  const [showAudit, setShowAudit] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [auditCompleted, setAuditCompleted] = useState(false);
  const [auditResults, setAuditResults] = useState<{ priorite1: string; priorite2: string; score: number } | null>(
    null
  );
  const [clubId, setClubId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;
      const { data: userResult } = await supabase.auth.getUser();
      const user = userResult?.user;
      if (!user) return;
      const { data: club } = await supabase.from("clubs").select("id").eq("user_id", user.id).single();
      if (!club) return;
      setClubId(club.id);
      const { data: audit } = await supabase
        .from("club_audits")
        .select("*")
        .eq("club_id", club.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (audit) {
        setAuditCompleted(true);
        setAuditResults({
          priorite1: audit.priorite1,
          priorite2: audit.priorite2,
          score: audit.score_global || 0,
        });
        setAnswers((audit.answers as Record<number, number>) || {});
      }
    };
    load();
  }, []);

  const handleAnswer = (index: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [index]: value }));
  };

  const handleSubmitAudit = async () => {
    const results = calculateResults(answers);
    setAuditResults({
      priorite1: results.priorite1,
      priorite2: results.priorite2,
      score: results.scoreGlobal,
    });
    setAuditCompleted(true);
    setShowAudit(false);
    if (clubId) {
      const supabase = createSupabaseBrowserClient();
      if (supabase) {
        await supabase.from("club_audits").insert({
          club_id: clubId,
          answers,
          scores: results.scores,
          score_global: results.scoreGlobal,
          priorite1: results.priorite1,
          priorite2: results.priorite2,
        });
      }
    }
  };

  const radarData = useMemo(() => {
    if (!auditCompleted || !auditResults) return [];
    const scores = calculateResults(answers).scores;
    return [
      { subject: "Commercial", value: scores.commercial * 25 },
      { subject: "Marketing", value: scores.marketing * 25 },
      { subject: "Activation", value: scores.activation * 25 },
      { subject: "Sportif", value: scores.sportif * 25 },
      { subject: "Gouvernance", value: scores.gouvernance * 25 },
    ];
  }, [auditCompleted, auditResults, answers]);

  return (
    <ClubLayout activeItem="Aides & Formation">
      <div className="p-4 lg:p-8 pt-6 lg:pt-8 space-y-10">
        <div className="mb-8 rounded-2xl border border-[#C8102E]/30 bg-gradient-to-br from-[#1a2942] to-[#0d1b2e] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <span className="text-2xl">🎯</span>
                <h2 className="text-xl font-bold text-white">Audit de vos besoins en compétences</h2>
              </div>
              <p className="text-sm text-white/60">
                Questionnaire de 8 minutes — Identifiez vos priorités et découvrez les formations adaptées à votre club
              </p>
              <div className="mt-3 flex gap-4">
                <span className="text-xs text-white/40">✓ Commercial & Revenus</span>
                <span className="text-xs text-white/40">✓ Marketing & Communication</span>
                <span className="text-xs text-white/40">✓ Sportif & Performance</span>
              </div>
            </div>
            <button
              onClick={() => setShowAudit(true)}
              className="whitespace-nowrap rounded-xl bg-[#C8102E] px-6 py-3 font-semibold text-white transition-all hover:bg-[#a50d26]"
            >
              Commencer l&apos;audit →
            </button>
          </div>

          {auditCompleted && auditResults ? (
            <div className="mt-4 grid grid-cols-1 gap-3 border-t border-white/10 pt-4 sm:grid-cols-3">
              <div className="rounded-xl bg-white/5 p-3">
                <div className="mb-1 text-xs text-white/50">Priorité 1</div>
                <div className="text-sm font-semibold text-white">{auditResults.priorite1}</div>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <div className="mb-1 text-xs text-white/50">Priorité 2</div>
                <div className="text-sm font-semibold text-white">{auditResults.priorite2}</div>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <div className="mb-1 text-xs text-white/50">Score global</div>
                <div className="text-sm font-semibold text-[#C8102E]">{auditResults.score}/100</div>
              </div>
            </div>
          ) : null}
        </div>
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-900/60 to-blue-800/40 p-6">
            <div className="text-xs uppercase tracking-wider text-blue-300">
              Plan de Développement des Compétences
            </div>
            <div className="mt-3 text-2xl font-black text-white lg:text-4xl">jusqu'à 1 800€</div>
            <div className="text-sm text-white/60">par salarié / an</div>
            <div className="mt-4 h-2 rounded-full bg-white/10">
              <div className="h-2 w-[60%] rounded-full bg-blue-400" />
            </div>
            <div className="mt-3 text-xs text-white/50">
              Dossier à déposer avant le début de la formation
            </div>
          </div>

          <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-900/60 to-purple-800/40 p-6">
            <div className="text-xs uppercase tracking-wider text-purple-300">AFEST</div>
            <div className="mt-3 text-2xl font-black text-white lg:text-4xl">jusqu'à 6 000€</div>
            <div className="text-sm text-white/60">par action de formation</div>
            <div className="mt-3 text-xs text-white/40">
              150h max • 15€/h • dont 2 250€ distanciel
            </div>
            <button className="mt-3 text-xs text-purple-300 underline">Simuler mon financement →</button>
          </div>

          <div className="rounded-2xl border border-[#C8102E]/30 bg-gradient-to-br from-[#C8102E]/20 to-[#8B0000]/10 p-6">
            <div className="flex items-center gap-2">
              <Medal className="h-5 w-5 text-[#C8102E]" />
              <span className="rounded-full bg-[#C8102E]/20 px-3 py-1 text-xs text-[#C8102E]">Open Badges</span>
            </div>
            <div className="mt-3 text-xl font-black text-white">Beyond Compétences</div>
            <div className="text-sm text-white/60">Compétences certifiées par Open Badge</div>
            <div className="mt-3 text-xl font-black text-[#C8102E] lg:text-3xl">Jusqu'à 100% financé</div>
            <div className="mt-3 text-xs text-white/70">
              <ul className="space-y-1">
                <li>• Référentiels validés par des pros du sport</li>
                <li>• Badges numériques reconnus et partageables</li>
                <li>• Formations 100% en ligne et asynchrones</li>
                <li>• Éligible AFDAS Plan de Développement</li>
              </ul>
            </div>
            <button className="mt-3 text-sm text-[#C8102E] underline">Voir les parcours Beyond →</button>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#111] p-4 lg:p-8">
          <div className="inline-flex items-center rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-300">
            ✓ Votre club cotise à l'AFDAS via vos charges patronales
          </div>
          <div className="mt-4 text-xl font-black text-white lg:text-3xl">Aides au développement</div>
          <div className="mt-2 max-w-2xl text-sm text-white/70">
            Financez la montée en compétences de vos collaborateurs grâce aux dispositifs de l'AFDAS, OPCO de la
            branche Sport
          </div>
        </section>

        {auditCompleted && auditResults ? (
          <section className="rounded-2xl border border-white/10 bg-[#111] p-4 lg:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-lg font-bold text-white">Résultats de l&apos;audit</div>
                <div className="text-sm text-white/60">Score global : {auditResults.score}/100</div>
              </div>
              <button
                onClick={() => {
                  setAuditCompleted(false);
                  setAuditResults(null);
                  setAnswers({});
                  setCurrentQuestion(0);
                }}
                className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white"
              >
                Refaire l&apos;audit
              </button>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="h-[260px] min-h-[260px] rounded-xl bg-white/5 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#1f2a44" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                    <Radar dataKey="value" stroke="#C8102E" fill="#C8102E" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl bg-white/5 p-4">
                  <div className="text-xs text-white/50">Formation prioritaire</div>
                  <div className="text-sm font-semibold text-white">{auditResults.priorite1}</div>
                  <button className="mt-3 rounded-full bg-[#C8102E] px-4 py-2 text-xs text-white">
                    En savoir plus
                  </button>
                </div>
                <div className="rounded-xl bg-white/5 p-4">
                  <div className="text-xs text-white/50">Seconde priorité</div>
                  <div className="text-sm font-semibold text-white">{auditResults.priorite2}</div>
                  <button className="mt-3 rounded-full bg-white/10 px-4 py-2 text-xs text-white">
                    En savoir plus
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-[#111] p-6">
            <div className="inline-flex items-center rounded-full bg-blue-500/20 px-3 py-1 text-xs text-blue-200">
              📚
            </div>
            <div className="mt-4 text-lg font-semibold text-white">Plan de Développement des Compétences</div>
            <p className="mt-2 text-sm text-white/70">
              Financez les formations de vos salariés permanents. Dépôt de dossier obligatoire AVANT le début de la
              formation.
            </p>
            <div className="mt-3 text-sm text-white/70">
              <div>Plafonds 2026 :</div>
              <ul className="mt-2 space-y-1">
                <li>• Moins de 11 salariés → 1 100€ HT/an</li>
                <li>• 11 à 49 salariés → 1 800€ HT/an</li>
              </ul>
            </div>
            <div className="mt-3 inline-flex rounded-full bg-orange-500/20 px-3 py-1 text-xs text-orange-200">
              ⚠ Déposer 2 semaines avant
            </div>
            <a
              href="https://www.afdas.com"
              className="mt-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-xs text-white hover:bg-white/20"
              target="_blank"
              rel="noreferrer"
            >
              Accéder à MyA (portail AFDAS)
            </a>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111] p-6">
            <div className="inline-flex items-center rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-200">
              ⚽
            </div>
            <div className="mt-4 text-lg font-semibold text-white">Fonds Conventionnels — Branche Sport</div>
            <p className="mt-2 text-sm text-white/70">
              Budget complémentaire négocié par les partenaires sociaux de la branche. Vient EN PLUS des fonds légaux.
            </p>
            <div className="mt-3 text-sm text-white/70">
              <div>Bénéficiaires :</div>
              <ul className="mt-2 space-y-1">
                <li>• Salariés du club</li>
                <li>
                  • Dirigeants bénévoles (Président, VP, Trésorier, Secrétaire général)
                  <div className="text-xs text-white/50">
                    → depuis jan. 2025 : réservé aux actions collectives et catalogue sport
                  </div>
                </li>
              </ul>
            </div>
            <div className="mt-3 inline-flex rounded-full bg-red-500/20 px-3 py-1 text-xs text-red-200">
              Budget actions collectives épuisé depuis avril 2025
            </div>
            <button className="mt-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-xs text-white hover:bg-white/20">
              Voir le catalogue branche sport
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111] p-6">
            <div className="inline-flex items-center rounded-full bg-purple-500/20 px-3 py-1 text-xs text-purple-200">
              🎯
            </div>
            <div className="mt-4 text-lg font-semibold text-white">AFEST — Formation en Situation de Travail</div>
            <p className="mt-2 text-sm text-white/70">
              Formez vos collaborateurs directement sur le terrain, au poste de travail. Idéal pour les nouveaux
              recrutements et montées en compétences internes.
            </p>
            <div className="mt-3 text-sm text-white/70">
              <ul className="space-y-1">
                <li>• Alterne pratique et temps de réflexivité</li>
                <li>• S'appuie sur l'expertise de vos collaborateurs seniors</li>
                <li>• Limite les coûts de déplacement</li>
                <li>
                  • Financement : jusqu'à 6 000€ HT (150h max, 15€/h max → 2 250€ HT pour la partie distancielle)
                </li>
              </ul>
            </div>
            <button className="mt-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-xs text-white hover:bg-white/20">
              En savoir plus sur l'AFEST
            </button>
          </div>

          <div className="rounded-2xl border border-[#C8102E]/30 bg-gradient-to-br from-[#C8102E]/20 to-[#8B0000]/10 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">B</div>
              <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-300">Éligible AFDAS</span>
            </div>
            <div className="mt-4 text-xl font-black text-white">Beyond — Formations Club</div>
            <div className="mt-2 text-sm italic text-white/70">
              Référentiels validés par des professionnels du sport
            </div>
            <div className="my-4 h-px bg-white/10" />
            <div className="text-sm font-bold uppercase tracking-wider text-[#C8102E]">Développement des revenus</div>
            <div className="mt-2 flex flex-wrap gap-2 text-sm text-white">
              {[
                "Prospecter de nouveaux partenaires",
                "Réussir une soirée partenaires",
                "Négocier un contrat de sponsoring",
                "Développer ses revenus de billetterie",
                "Construire son budget prévisionnel",
              ].map((item) => (
                <button
                  key={item}
                  className="rounded-full bg-white/10 px-3 py-1 text-sm text-white hover:bg-[#C8102E]/30"
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="mt-4 text-sm font-bold uppercase tracking-wider text-[#C8102E]">
              Communication & Réseaux
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-sm text-white">
              {[
                "Développement réseaux sociaux",
                "Créer du contenu vidéo match day",
                "Gérer sa e-réputation",
                "Animer une communauté de supporters",
              ].map((item) => (
                <button
                  key={item}
                  className="rounded-full bg-white/10 px-3 py-1 text-sm text-white hover:bg-[#C8102E]/30"
                >
                  {item}
                </button>
              ))}
            </div>
            <a
              href="/dashboard/formateur"
              className="mt-4 inline-flex rounded-full bg-[#C8102E] px-5 py-2 text-sm font-semibold text-white"
            >
              Voir tous les parcours Beyond →
            </a>
          </div>
        </section>

        <section className="rounded-2xl bg-gradient-to-r from-[#C8102E] to-[#8B0000] p-4 lg:p-8">
          <div className="text-lg font-black text-white lg:text-2xl">Formez votre club avec Beyond</div>
          <div className="mt-2 max-w-2xl text-sm text-white/80">
            Parcours 100% en ligne, finançables AFDAS, conçus avec et pour les clubs sportifs professionnels et
            amateurs.
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-white">
            <span>✓ Référentiels validés par des pros du sport</span>
            <span>✓ Suivi de progression en temps réel</span>
            <span>✓ Attestations et badges automatiques</span>
          </div>
          <div className="mt-4 text-sm text-white/80">
            Nos formations phares : Développement des revenus • Réseaux sociaux • Soirée partenaires • Prospection
            commerciale • Management d'équipe
          </div>
          <a
            href="mailto:contact@beyond.fr"
            className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#8B0000]"
          >
            Demander une démo Beyond
          </a>
          <div className="mt-3 text-xs text-white/70">
            Votre conseiller AFDAS peut financer votre abonnement Beyond dans le cadre du Plan de Développement des
            Compétences.
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#111] p-4 lg:p-8">
          <div className="text-xl font-bold text-white">Par où commencer ?</div>
          <ol className="mt-4 space-y-3 text-sm text-white/70">
            <li>1️⃣ Créez votre compte AFDAS sur mya.afdas.com</li>
            <li>2️⃣ Identifiez les besoins de formation de vos salariés</li>
            <li>3️⃣ Choisissez le bon dispositif (PDC, AFEST, Catalogue branche)</li>
            <li>4️⃣ Déposez votre demande AVANT le début de la formation</li>
            <li>5️⃣ Attendez l'accord de prise en charge (ne pas commencer avant !)</li>
          </ol>
          <div className="mt-4 inline-flex rounded-full bg-orange-500/20 px-3 py-1 text-xs text-orange-200">
            ⚠ Sans accord préalable de l'AFDAS, aucun financement possible
          </div>
        </section>
      </div>

      {showAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0d1b2e]">
            <div className="sticky top-0 z-10 border-b border-white/10 bg-[#0d1b2e] p-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">
                  Audit compétences — Question {currentQuestion + 1}/{AUDIT_QUESTIONS.length}
                </h3>
                <button
                  onClick={() => setShowAudit(false)}
                  className="text-xl text-white/40 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#C8102E] transition-all"
                  style={{
                    width: `${((currentQuestion + 1) / AUDIT_QUESTIONS.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-6">
              <div className="mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-[#C8102E]">
                  {AUDIT_QUESTIONS[currentQuestion].categorie}
                </span>
              </div>
              <h4 className="mb-6 text-lg font-semibold text-white">
                {AUDIT_QUESTIONS[currentQuestion].question}
              </h4>
              <div className="space-y-3">
                {AUDIT_QUESTIONS[currentQuestion].options.map((option, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(currentQuestion, option.value)}
                    className={`w-full rounded-xl border p-4 text-left transition-all ${
                      answers[currentQuestion] === option.value
                        ? "border-[#C8102E] bg-[#C8102E]/10 text-white"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/30"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  className={`rounded-xl px-4 py-2 text-white/60 transition-all hover:text-white ${
                    currentQuestion === 0 ? "invisible" : ""
                  }`}
                >
                  ← Précédent
                </button>
                {currentQuestion < AUDIT_QUESTIONS.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestion(currentQuestion + 1)}
                    disabled={!answers[currentQuestion]}
                    className="rounded-xl bg-[#C8102E] px-6 py-2 font-semibold text-white transition-all disabled:opacity-40"
                  >
                    Suivant →
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitAudit}
                    disabled={!answers[currentQuestion]}
                    className="rounded-xl bg-green-500 px-6 py-2 font-semibold text-white transition-all disabled:opacity-40"
                  >
                    Voir mes résultats ✓
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </ClubLayout>
  );
}
