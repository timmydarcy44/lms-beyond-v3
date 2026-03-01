"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  BarChart2,
  Map,
  MessageCircle,
  Award,
  Briefcase,
  Calendar,
  Settings,
  UserCheck,
  Lock,
  CheckCircle2,
  Target,
  Shield,
  Zap,
  FileText,
  Star,
  BookOpen,
  PanelLeft,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import PremiumLocker from "@/components/PremiumLocker";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { SOFT_SKILLS } from "@/lib/soft-skills";

type UserProfile = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  school_class?: string | null;
  school_id?: string | null;
  entreprise_id?: string | null;
  school_subscription?: string | null;
  is_handicap_device?: boolean | null;
  avatar_url?: string | null;
  quote?: string | null;
  disc_profile?: string | null;
  disc_scores?: { D: number; I: number; S: number; C: number } | null;
  disc_score?: number | null;
  disc_status?: "in_progress" | "completed" | null;
  soft_skills_score?: number | null;
  soft_skills_status?: "in_progress" | "completed" | null;
  stress_score_global?: number | null;
  stress_status?: "in_progress" | "completed" | null;
  dys_concentration?: string | null;
  dys_score?: number | null;
  dys_status?: "in_progress" | "completed" | null;
  mai_planification?: boolean | null;
  mai_score?: number | null;
  mai_status?: "in_progress" | "completed" | null;
  administratif?: {
    rqth_file_url?: string | null;
  } | null;
  cv_url?: string | null;
  cerfa_url?: string | null;
  dossier_candidature_url?: string | null;
  dossier_inscription_url?: string | null;
};

type TestsResultats = {
  stress_score_global?: number | null;
  mai_planification?: boolean | null;
  disc_profile?: string | null;
  disc_scores?: { D: number; I: number; S: number; C: number } | null;
  dys_concentration?: string | null;
  soft_skills_score?: number | null;
  disc_status?: "in_progress" | "completed" | null;
  soft_skills_status?: "in_progress" | "completed" | null;
  mai_status?: "in_progress" | "completed" | null;
  stress_status?: "in_progress" | "completed" | null;
  dys_status?: "in_progress" | "completed" | null;
  disc_score?: number | null;
  mai_score?: number | null;
  dys_score?: number | null;
};

type SoftSkillsStatus = {
  exists: boolean;
  result: {
    total_score?: number | null;
    scores?: Record<string, number> | null;
  } | null;
};

const NAV_ITEMS = [
  { label: "Tableau de bord", icon: LayoutDashboard, href: "/dashboard/apprenant", active: true },
  { label: "Mes résultats", icon: BarChart2, href: "/dashboard/apprenant/resultats" },
  { label: "Mon coach", icon: MessageCircle, href: "/dashboard/apprenant/coach" },
  { label: "Mes badges", icon: Award, href: "/dashboard/apprenant/badges" },
  { label: "Mon agenda", icon: Calendar, href: "/dashboard/apprenant/agenda" },
  { label: "Carrière", icon: UserCheck, href: "/dashboard/apprenant/carriere" },
];

type DiscLabel = "D" | "I" | "S" | "C";

const DISC_LABELS: Record<DiscLabel, { profile: string; axis: string }> = {
  D: { profile: "Dominant", axis: "Dominance" },
  I: { profile: "Influent", axis: "Influence" },
  S: { profile: "Stable", axis: "Stabilité" },
  C: { profile: "Consciencieux", axis: "Conformité" },
};

const DISC_BLOCKS: Array<{ id: number; items: Array<{ text: string; score: DiscLabel }> }> = [
  {
    id: 1,
    items: [
      { text: "J'aime enthousiasmer les autres pour mes idées.", score: "I" },
      { text: "J'agis vite pour obtenir des résultats concrets.", score: "D" },
      { text: "Je m'assure que tout est fait avec précision.", score: "C" },
      { text: "Je cherche à maintenir un rythme de travail stable.", score: "S" },
    ],
  },
  {
    id: 2,
    items: [
      { text: "J'analyse les faits de manière logique et froide.", score: "C" },
      { text: "Je préfère écouter plutôt que de prendre la parole.", score: "S" },
      { text: "Je vais droit au but, même si c'est brusque.", score: "D" },
      { text: "Je suis amical et j'aime plaisanter avec l'équipe.", score: "I" },
    ],
  },
  {
    id: 3,
    items: [
      { text: "J'apprécie la routine et les méthodes claires.", score: "S" },
      { text: "J'aime être reconnu et apprécié par mes pairs.", score: "I" },
      { text: "Je respecte scrupuleusement les règles.", score: "C" },
      { text: "J'aime relever des défis et prendre des risques.", score: "D" },
    ],
  },
  {
    id: 4,
    items: [
      { text: "Je perds patience face à la lenteur des autres.", score: "D" },
      { text: "Je déteste l'improvisation et le manque de données.", score: "C" },
      { text: "Je déteste travailler seul dans mon coin.", score: "I" },
      { text: "Je fuis les conflits et cherche l'harmonie.", score: "S" },
    ],
  },
  {
    id: 5,
    items: [
      { text: "Je suis très loyal et fiable sur le long terme.", score: "S" },
      { text: "Je prends les décisions avec assurance.", score: "D" },
      { text: "Je vérifie plusieurs fois la qualité de mon travail.", score: "C" },
      { text: "Je motive les autres par mon optimisme.", score: "I" },
    ],
  },
  {
    id: 6,
    items: [
      { text: "J'aime être au centre de l'attention.", score: "I" },
      { text: "Je suis très attentif aux protocoles.", score: "C" },
      { text: "Je cherche à contrôler la situation.", score: "D" },
      { text: "Je déteste bousculer les habitudes des autres.", score: "S" },
    ],
  },
  {
    id: 7,
    items: [
      { text: "Je suis patient, même avec les personnes lentes.", score: "S" },
      { text: "Je suis compétitif et je veux gagner.", score: "D" },
      { text: "J'aime convaincre par la parole.", score: "I" },
      { text: "J'ai besoin de preuves avant de changer d'avis.", score: "C" },
    ],
  },
  {
    id: 8,
    items: [
      { text: "Je suis réservé et très analytique.", score: "C" },
      { text: "Je suis discret et je n'aime pas me mettre en avant.", score: "S" },
      { text: "Je suis direct et je dis ce que je pense.", score: "D" },
      { text: "J'aime partager mes sentiments et émotions.", score: "I" },
    ],
  },
  {
    id: 9,
    items: [
      { text: 'Je me focalise sur le "Quoi" (le résultat).', score: "D" },
      { text: 'Je me focalise sur le "Comment" (la méthode).', score: "S" },
      { text: 'Je me focalise sur le "Pourquoi" (la logique).', score: "C" },
      { text: 'Je me focalise sur le "Qui" (les personnes).', score: "I" },
    ],
  },
  {
    id: 10,
    items: [
      { text: "Je suis persuasif et charismatique.", score: "I" },
      { text: "Je suis précis et pointilleux sur les détails.", score: "C" },
      { text: "Je suis déterminé et opiniâtre.", score: "D" },
      { text: "Je suis calme et posé en toute circonstance.", score: "S" },
    ],
  },
  {
    id: 11,
    items: [
      { text: "J'aime la collaboration et l'effervescence.", score: "I" },
      { text: "J'aime l'indépendance et l'autonomie.", score: "D" },
      { text: "J'aime la structure et l'organisation rigoureuse.", score: "C" },
      { text: "J'aime le soutien mutuel et la bienveillance.", score: "S" },
    ],
  },
  {
    id: 12,
    items: [
      { text: "Je demande aux autres d'être plus rigoureux.", score: "C" },
      { text: "J'encourage les autres par des compliments.", score: "I" },
      { text: "Je pousse les autres à se dépasser.", score: "D" },
      { text: "J'aide les autres à se sentir en sécurité.", score: "S" },
    ],
  },
  {
    id: 13,
    items: [
      { text: "Je suis spontané et je suis mon instinct.", score: "I" },
      { text: "Je suis systématique et j'étudie les options.", score: "C" },
      { text: "Je suis rapide dans mes prises de position.", score: "D" },
      { text: "Je suis réfléchi et je prends mon temps.", score: "S" },
    ],
  },
  {
    id: 14,
    items: [
      { text: "Je tolère mal les changements brusques.", score: "S" },
      { text: "Je tolère mal les erreurs d'inattention.", score: "D" },
      { text: "Je tolère mal le désordre ou l'imprécision.", score: "C" },
      { text: "Je tolère mal l'isolement ou le silence.", score: "I" },
    ],
  },
  {
    id: 15,
    items: [
      { text: "Je suis orienté vers les faits et les chiffres.", score: "C" },
      { text: "Je suis orienté vers l'avenir et les objectifs.", score: "D" },
      { text: "Je suis orienté vers le plaisir et le contact.", score: "I" },
      { text: "Je suis orienté vers le passé et l'expérience.", score: "S" },
    ],
  },
  {
    id: 16,
    items: [
      { text: "Je suis un coéquipier fiable et stable.", score: "S" },
      { text: "Je suis un leader naturel et directif.", score: "D" },
      { text: "Je suis un expert technique et consciencieux.", score: "C" },
      { text: "Je suis un communicant et un animateur.", score: "I" },
    ],
  },
  {
    id: 17,
    items: [
      { text: "J'aime la perfection et la conformité.", score: "C" },
      { text: "J'aime la prévisibilité et le calme.", score: "S" },
      { text: "Je suis exigeant envers moi et les autres.", score: "D" },
      { text: "J'aime la variété et la nouveauté.", score: "I" },
    ],
  },
  {
    id: 18,
    items: [
      { text: "Je réagis par l'expression de mon émotion.", score: "I" },
      { text: "Je réagis par l'analyse et la critique.", score: "C" },
      { text: "Je réagis par la colère ou l'agacement.", score: "D" },
      { text: "Je réagis par le retrait ou le silence.", score: "S" },
    ],
  },
  {
    id: 19,
    items: [
      { text: "Je valorise la gentillesse et la patience.", score: "S" },
      { text: "Je valorise l'intelligence et la logique.", score: "C" },
      { text: "Je valorise la force et le courage.", score: "D" },
      { text: "Je valorise l'humour et la créativité.", score: "I" },
    ],
  },
  {
    id: 20,
    items: [
      { text: "Ma priorité est de construire des relations.", score: "I" },
      { text: "Ma priorité est de gagner du temps.", score: "D" },
      { text: "Ma priorité est d'éviter les erreurs.", score: "C" },
      { text: "Ma priorité est de maintenir la paix.", score: "S" },
    ],
  },
];

const AGENDA_ITEMS = [
  {
    title: "RDV Psychopédagogue · Jessica Perrin",
    date: "15 mars · 14h00",
    badge: "Dans 26 jours",
    action: "Rejoindre",
    color: "#5B3DE8",
    icon: MessageCircle,
    filled: true,
  },
  {
    title: "Point alternance · Mme Lefèvre",
    date: "18 mars · 09h00",
    badge: "Dans 29 jours",
    action: "Préparer",
    color: "#0077FF",
    icon: Briefcase,
    filled: false,
  },
  {
    title: "Cours Management",
    date: "20 mars · 10h30",
    badge: "Dans 31 jours",
    action: "Voir",
    color: "#A8A8A8",
    icon: BookOpen,
    filled: false,
  },
];

const getWeekStartISO = (date: Date) => {
  const current = new Date(date);
  const day = current.getDay() || 7;
  if (day !== 1) {
    current.setDate(current.getDate() - (day - 1));
  }
  current.setHours(0, 0, 0, 0);
  return current.toISOString().split("T")[0];
};

const formatWeekLabel = (isoDate: string) => {
  const parsed = new Date(isoDate);
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(parsed);
};

export default function DashboardApprenant() {
  const supabase = createSupabaseBrowserClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const hasOrganisation = Boolean(profile?.entreprise_id || profile?.school_id);
  const navItems = useMemo(() => {
    const items = [...NAV_ITEMS];
    if (hasOrganisation) {
      items.splice(4, 0, {
        label: "Mon entreprise",
        icon: Briefcase,
        href: "/dashboard/apprenant/entreprise",
      });
    }
    return items;
  }, [hasOrganisation]);
  const [tests, setTests] = useState<TestsResultats | null>(null);
  const [loading, setLoading] = useState(true);
  const [weeklyModalOpen, setWeeklyModalOpen] = useState(false);
  const [weeklyForm, setWeeklyForm] = useState({ moral: 7, stress: 4, motivation: 7 });
  const [weeklyData, setWeeklyData] = useState<
    Array<{ weekLabel: string; moral: number; stress: number; motivation: number }>
  >([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [softSkillsStatus, setSoftSkillsStatus] = useState<SoftSkillsStatus | null>(null);
  const [discScores, setDiscScores] = useState<{ D: number; I: number; S: number; C: number }>({
    D: 0,
    I: 0,
    S: 0,
    C: 0,
  });
  const [discCompleted, setDiscCompleted] = useState(false);
  const [discProfile, setDiscProfile] = useState<string | null>(null);

  const testsProgress = useMemo(() => {
    const testsCompleted =
      (tests?.disc_profile ? 1 : 0) +
      (tests?.soft_skills_score ? 1 : 0) +
      (tests?.mai_planification !== null && tests?.mai_planification !== undefined ? 1 : 0) +
      (typeof tests?.stress_score_global === "number" ? 1 : 0) +
      (tests?.dys_concentration ? 1 : 0);
    return Math.round((testsCompleted / 5) * 100) || 75;
  }, [tests]);

  const circumference = useMemo(() => 2 * Math.PI * 36, []);
  const dashOffset = circumference * (1 - testsProgress / 100);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (!supabase) {
        setLoading(false);
        return;
      }
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user?.id) {
          setLoading(false);
          return;
        }
        const userId = userData.user.id;
        const { data: userProfile } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
        const { data: weeklyTracking } = await supabase
          .from("weekly_tracking")
          .select("week_start, moral, stress, motivation")
          .eq("apprenant_id", userId)
          .order("week_start", { ascending: false })
          .limit(4);
        setProfile(userProfile as UserProfile | null);
        const testsFromProfile: TestsResultats | null = userProfile
          ? {
              disc_profile: userProfile.disc_profile ?? null,
              disc_scores: userProfile.disc_scores ?? null,
              disc_score: userProfile.disc_score ?? null,
              disc_status: userProfile.disc_status ?? null,
              soft_skills_score: userProfile.soft_skills_score ?? null,
              soft_skills_status: userProfile.soft_skills_status ?? null,
              stress_score_global: userProfile.stress_score_global ?? null,
              stress_status: userProfile.stress_status ?? null,
              dys_concentration: userProfile.dys_concentration ?? null,
              dys_score: userProfile.dys_score ?? null,
              dys_status: userProfile.dys_status ?? null,
              mai_planification: userProfile.mai_planification ?? null,
              mai_score: userProfile.mai_score ?? null,
              mai_status: userProfile.mai_status ?? null,
            }
          : null;
        setTests(testsFromProfile);
        const normalizedWeekly =
          weeklyTracking?.map((row) => ({
            weekLabel: formatWeekLabel(row.week_start),
            moral: row.moral ?? 0,
            stress: row.stress ?? 0,
            motivation: row.motivation ?? 0,
          })) || [];
        setWeeklyData(normalizedWeekly.reverse());
        const weekStart = getWeekStartISO(new Date());
        const hasThisWeek = weeklyTracking?.some((row) => row.week_start === weekStart);
        setWeeklyModalOpen(!hasThisWeek);
      } catch (error) {
        console.error("[dashboard-apprenant] Supabase auth error:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [supabase]);

  useEffect(() => {
    if (!tests) return;
    if (tests.disc_scores) {
      setDiscScores(tests.disc_scores);
      setDiscCompleted(true);
    }
    if (tests.disc_profile) {
      setDiscProfile(tests.disc_profile);
    }
  }, [tests]);

  useEffect(() => {
    const loadSoftSkills = async () => {
      try {
        const response = await fetch("/api/soft-skills/status");
        if (!response.ok) return;
        const data = (await response.json()) as SoftSkillsStatus;
        setSoftSkillsStatus(data);
      } catch {
        // ignore API errors to avoid blocking the dashboard
      }
    };
    loadSoftSkills();
  }, []);

  const displayName =
    profile?.first_name ||
    (profile?.full_name ? profile.full_name.split(" ")[0] : null) ||
    "Utilisateur";
  const className = profile?.school_id ? profile?.school_class || "Compte Personnel" : "Compte Personnel";
  const avatar =
    profile?.avatar_url ||
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150";
  const isConnect = profile?.school_subscription?.toLowerCase() === "connect";
  const [demoMatching, setDemoMatching] = useState(false);
  const canSeeMatching = isConnect || demoMatching;
  const isHandicapDevice = profile?.is_handicap_device === true;
  const testsCompletedCount = useMemo(() => {
    return (
      (tests?.disc_profile ? 1 : 0) +
      (tests?.soft_skills_score ? 1 : 0) +
      (tests?.mai_planification !== null && tests?.mai_planification !== undefined ? 1 : 0) +
      (typeof tests?.stress_score_global === "number" ? 1 : 0) +
      (tests?.dys_concentration ? 1 : 0)
    );
  }, [tests]);
  const softSkillsScores = softSkillsStatus?.result?.scores ?? null;
  const softSkillsRanking = useMemo(() => {
    if (!softSkillsScores) return [];
    return SOFT_SKILLS.map((skill) => ({
      label: skill.titre,
      value: softSkillsScores[skill.titre] ?? 0,
    }))
      .sort((a, b) => b.value - a.value)
      .filter((item) => item.value > 0);
  }, [softSkillsScores]);
  const softSkillsTop = softSkillsRanking.slice(0, 3);
  const softSkillsRadar = softSkillsRanking.slice(0, 6);
  const offers = [
    {
      company: "LVMH",
      role: "Assistant marketing",
      match: 98,
      logo: "https://images.unsplash.com/photo-1545239351-ef35f43d514b?auto=format&fit=crop&w=200&q=80",
    },
    {
      company: "Décathlon",
      role: "Conseiller commercial",
      match: 93,
      logo: "https://images.unsplash.com/photo-1522071901873-411886a10004?auto=format&fit=crop&w=200&q=80",
    },
    {
      company: "Sephora",
      role: "Retail specialist",
      match: 90,
      logo: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=200&q=80",
    },
  ];

  const profileItems = useMemo(() => {
    const items: Array<{ icon: React.ReactNode; iconBg: string; title: string; desc: string }> = [];
    if (tests?.mai_planification === false) {
      items.push({
        icon: <Target className="text-[#F59E0B]" size={16} strokeWidth={1.5} />,
        iconBg: "#2A2A2A",
        title: "Visuel · Kinesthésique",
        desc: "Tu apprends en faisant",
      });
    }
    if ((tests?.disc_profile || "").toLowerCase().includes("stable")) {
      items.push({
        icon: <Shield className="text-[#F59E0B]" size={16} strokeWidth={1.5} />,
        iconBg: "#2A2A2A",
        title: "Profil Stable · Test comportemental",
        desc: "Fiable et persévérante",
      });
    }
    if (typeof tests?.stress_score_global === "number") {
      const stressLabel = tests.stress_score_global < 15 ? "Stress maîtrisé" : "Stress modéré";
      items.push({
        icon: <Zap className="text-[#F59E0B]" size={16} strokeWidth={1.5} />,
        iconBg: "#2A2A2A",
        title: `${stressLabel} · ${tests.stress_score_global}/20`,
        desc: "Tu gardes la tête froide",
      });
    }
    if (!items.length) {
      items.push({
        icon: <Target className="text-[#F59E0B]" size={16} strokeWidth={1.5} />,
        iconBg: "#2A2A2A",
        title: "Prochaine étape : Ton test comportemental",
        desc: "Lance le test pour enrichir ton profil",
      });
    }
    return items;
  }, [tests]);

  const resolveTestStatus = (
    status: "in_progress" | "completed" | null | undefined,
    hasValue: boolean,
  ): "idle" | "in_progress" | "completed" => {
    if (status === "in_progress") return "in_progress";
    if (status === "completed") return "completed";
    return hasValue ? "completed" : "idle";
  };


  const diagnosticCards = useMemo(
    () => [
      {
        title: "Test comportemental",
      image:
          "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
        status: resolveTestStatus(tests?.disc_status ?? null, !!tests?.disc_profile),
        scoreLabel: tests?.disc_score ? `${tests.disc_score}/100` : tests?.disc_profile || null,
    },
    {
        title: "Soft Skills",
      image:
          "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80",
        status: resolveTestStatus(tests?.soft_skills_status ?? null, !!tests?.soft_skills_score),
        scoreLabel: tests?.soft_skills_score ? `${tests.soft_skills_score}/100` : null,
        href: "/soft-skills",
    },
    {
        title: "Stratégies d'apprentissage",
      image:
          "https://images.unsplash.com/photo-1457694587812-e8bf29a43845?auto=format&fit=crop&w=1200&q=80",
        status: resolveTestStatus(
          tests?.mai_status ?? null,
          tests?.mai_planification !== null && tests?.mai_planification !== undefined,
        ),
        scoreLabel: tests?.mai_score ? `${tests.mai_score}/100` : null,
      },
      {
        title: "Stress Académique",
      image:
          "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80",
        status: resolveTestStatus(tests?.stress_status ?? null, typeof tests?.stress_score_global === "number"),
        scoreLabel: typeof tests?.stress_score_global === "number" ? `${tests.stress_score_global}/20` : null,
    },
    {
        title: "Pré-diagnostic DYS",
      image:
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
        status: resolveTestStatus(tests?.dys_status ?? null, !!tests?.dys_concentration),
        scoreLabel: tests?.dys_score ? `${tests.dys_score}/100` : tests?.dys_concentration || null,
      },
    ],
    [tests],
  );

  const weeklyChartData = useMemo(() => {
    if (weeklyData.length) return weeklyData;
    return [
      { weekLabel: "12 jan", moral: 6, stress: 5, motivation: 7 },
      { weekLabel: "19 jan", moral: 7, stress: 4, motivation: 7 },
      { weekLabel: "26 jan", moral: 8, stress: 3, motivation: 8 },
      { weekLabel: "02 fév", moral: 7, stress: 4, motivation: 7 },
    ];
  }, [weeklyData]);

  const handleWeeklySubmit = async () => {
    if (!supabase) return;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user?.id) return;
    const weekStart = getWeekStartISO(new Date());
    const schoolId = profile?.school_id || null;
    const payload = {
      apprenant_id: userData.user.id,
      school_id: schoolId,
      week_start: weekStart,
      moral: weeklyForm.moral,
      stress: weeklyForm.stress,
      motivation: weeklyForm.motivation,
    };
    const { error } = await supabase.from("weekly_tracking").insert(payload);
    if (error) {
      console.error(error);
      toast.error("Impossible d'enregistrer le questionnaire.");
      return;
    }
    setWeeklyData((prev) => [
      ...prev.slice(-3),
      {
        weekLabel: formatWeekLabel(weekStart),
        moral: weeklyForm.moral,
        stress: weeklyForm.stress,
        motivation: weeklyForm.motivation,
      },
    ]);
    setWeeklyModalOpen(false);
    toast.success("Questionnaire enregistré.");
  };

  const handleInterest = async () => {
    if (!supabase) return;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user?.id) return;
    const payload = {
      school_id: profile?.school_id ?? null,
      apprenant_id: userData.user.id,
      type: "connect_interest",
      message:
        "Ton établissement n'a pas encore activé le matching. Contacte ton référent pour débloquer Beyond Connect.",
      created_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("school_notifications").insert(payload);
    if (error) {
      console.error(error);
      toast.error("Impossible d'envoyer la demande.");
      return;
    }
    toast.success("Ton intérêt a été transmis.");
  };

  const handleOpenUpload = () => {
    fileInputRef.current?.click();
  };

  const handleRqthUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!supabase || !file || !profile?.id) return;
    setUploading(true);
    try {
      const path = `${profile.id}/rqth.pdf`;
      const { error } = await supabase.storage.from("documents_apprenants").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: publicData } = supabase.storage.from("documents_apprenants").getPublicUrl(path);
      const url = publicData.publicUrl;
      const administratif = { ...(profile.administratif || {}), rqth_file_url: url };
      await supabase.from("profiles").update({ administratif }).eq("id", profile.id);
      setProfile((prev) => (prev ? { ...prev, administratif } : prev));
      toast.success("RQTH envoyé.");
    } catch (error) {
      console.error(error);
      toast.error("Impossible d'uploader le RQTH.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] font-['Manrope'] text-white" style={{ colorScheme: "dark" }}>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap");
        html,
        body {
          background: #121212;
        }
      `}</style>

      <div className="flex min-h-screen">
        <motion.aside
          animate={{ width: sidebarCollapsed ? 80 : 256 }}
          className="fixed left-0 top-0 h-full border-r border-white/10 bg-[rgba(20,20,20,0.7)] backdrop-blur-xl"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-6 pb-6 pt-8">
            <div className={`${sidebarCollapsed ? "hidden" : "block"}`}>
              <div className="text-[18px] font-extrabold tracking-[-0.5px] text-white">Beyond</div>
              <div className="mt-1 text-[11px] font-medium uppercase tracking-[1.5px] text-[#9CA3AF]">
                Mon Profil
              </div>
            </div>
            <button
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="rounded-full border border-white/10 p-2 text-[#9CA3AF] hover:text-white"
              aria-label="Réduire la sidebar"
            >
              <PanelLeft size={16} strokeWidth={1.5} />
            </button>
          </div>
          <nav className="flex flex-1 flex-col gap-1 px-3 py-6">
            <div className={`px-3 pb-2 text-[10px] font-bold uppercase tracking-[1px] text-[#9CA3AF] ${sidebarCollapsed ? "opacity-0" : ""}`}>
              Principal
            </div>
            {navItems.slice(0, 3).map((item) => (
              <NavItem
                key={item.label}
                icon={<item.icon size={16} strokeWidth={1.5} />}
                label={item.label}
                href={item.href}
                active={item.active}
                collapsed={sidebarCollapsed}
              />
            ))}
            <div className={`px-3 pt-4 text-[10px] font-bold uppercase tracking-[1px] text-[#9CA3AF] ${sidebarCollapsed ? "opacity-0" : ""}`}>
              Accompagnement
            </div>
            {navItems.slice(3).map((item) => (
              <NavItem
                key={item.label}
                icon={<item.icon size={16} strokeWidth={1.5} />}
                label={item.label}
                href={item.href}
                collapsed={sidebarCollapsed}
              />
            ))}
          </nav>
          <div className="flex items-center gap-3 border-t border-white/10 px-4 py-5">
            <div className="h-[34px] w-[34px] overflow-hidden rounded-full bg-gradient-to-br from-[#F59E0B] to-[#FCD34D]">
              <img src={avatar} alt={displayName} className="h-full w-full object-cover" />
            </div>
            {!sidebarCollapsed && (
              <>
                <div>
                  <div className="text-[13px] font-bold text-white">{displayName}</div>
                  <div className="text-[11px] text-[#9CA3AF]">{className}</div>
                </div>
                <Settings size={16} strokeWidth={1.5} className="ml-auto text-[#9CA3AF]" />
              </>
            )}
          </div>
        </motion.aside>

        <main
          className="flex-1 bg-[#121212] px-6 py-12"
          style={{ paddingLeft: sidebarCollapsed ? 110 : 300 }}
        >
          <div className="rounded-3xl border border-white/5 bg-[#171717]/70 p-10 shadow-[0_20px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <section className="flex items-start justify-between">
            <div>
              <div className="text-[38px] font-extrabold tracking-[-1.5px] text-white">Bonjour {displayName}</div>
              <div className="mt-2 text-[14px] font-medium text-[#9CA3AF]">Semaine 18 · {className}</div>
              </div>

            <div className="text-center">
              <svg width="88" height="88" viewBox="0 0 88 88">
                <circle cx="44" cy="44" r="36" fill="none" stroke="#2A2A2A" strokeWidth="7" />
                <circle
                  cx="44"
                  cy="44"
                  r="36"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  transform="rotate(-90 44 44)"
                />
                <text
                  x="44"
                  y="44"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontFamily="Manrope"
                  fontSize="17"
                  fontWeight="800"
                  fill="#FFFFFF"
                >
                  {loading ? "..." : `${testsProgress}%`}
                </text>
              </svg>
              <div className="mt-2 text-[11px] font-medium text-[#9CA3AF]">Profil complété</div>
            </div>
          </section>

          <section className="mt-10">
            <div className="text-[11px] font-bold uppercase tracking-[1.2px] text-[#9CA3AF]">
              Centre de Diagnostic
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              {diagnosticCards.map((card) => {
                if (card.title === "Test comportemental") {
                  return (
                    <div
                      key={card.title}
                      className="relative overflow-hidden rounded-[20px] border border-[#2A2A2A] bg-[#1C1C1C] shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
                    >
                      {discCompleted && discProfile ? (
                        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold text-[#9CA3AF]">
                          {discProfile}
                        </span>
                      ) : null}
                      <div className="aspect-[3/4]">
                        <img src={card.image} alt={card.title} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4">
                        <p className="text-[15px] font-bold text-white">{card.title}</p>
                        <Link
                          href="/dashboard/apprenant/disc"
                          className="w-full rounded-full bg-[#F59E0B] px-3 py-2 text-[12px] font-semibold text-[#111827]"
                        >
                          {discCompleted ? "Voir mon profil" : "Découvrir le test"}
                        </Link>
                      </div>
                    </div>
                  );
                }

                if (card.title === "Soft Skills" && softSkillsStatus?.exists && softSkillsRadar.length) {
                  return (
                    <PremiumLocker key={card.title} locked>
                      <Link
                        href="/soft-skills/resultats"
                        className="relative flex flex-col rounded-[20px] border border-[#2A2A2A] bg-[#1C1C1C] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-[14px] font-bold text-white">Soft Skills</p>
                            <p className="mt-1 text-[11px] text-[#9CA3AF]">Score global</p>
                          </div>
                          <span className="rounded-full bg-[#2A2A2A] px-3 py-1 text-[11px] font-bold text-[#F59E0B]">
                            {softSkillsStatus?.result?.total_score ?? 0}/300
                          </span>
                        </div>
                        <div className="mt-3 h-[120px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={softSkillsRadar}>
                              <PolarGrid stroke="#2A2A2A" />
                              <PolarAngleAxis dataKey="label" tick={{ fill: "#9CA3AF", fontSize: 9 }} />
                              <PolarRadiusAxis domain={[0, 15]} tick={false} />
                              <Radar dataKey="value" stroke="#F59E0B" fill="rgba(245,158,11,0.25)" />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="mt-3 text-[11px] text-[#9CA3AF]">Forces principales</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {softSkillsTop.map((item) => (
                            <span
                              key={item.label}
                              className="rounded-full border border-[#2A2A2A] bg-[#121212] px-3 py-1 text-[11px] text-white"
                            >
                              {item.label}
                            </span>
                          ))}
                        </div>
                      </Link>
                    </PremiumLocker>
                  );
                }

                const lockedCards = ["Stress Académique", "Pré-diagnostic DYS"];
                const cardBody = (
                  <div className="relative overflow-hidden rounded-[20px] border border-[#2A2A2A] bg-[#1C1C1C] shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                    {card.status === "completed" && card.scoreLabel && (
                      <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold text-[#9CA3AF]">
                        {card.scoreLabel}
                      </span>
                    )}
                    <div className="aspect-[3/4]">
                      <img src={card.image} alt={card.title} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4">
                      <p className="text-[15px] font-bold text-white">{card.title}</p>
                      {card.status === "completed" ? (
                        <button className="flex w-full items-center justify-center gap-2 rounded-full bg-[#10B981] px-3 py-2 text-[12px] font-semibold text-white">
                          <CheckCircle2 className="h-4 w-4" />
                          Voir mes résultats
                        </button>
                      ) : (
                        <Link
                          href={card.href || "#"}
                          className={`w-full rounded-full px-3 py-2 text-[12px] font-semibold ${
                            card.status === "in_progress"
                              ? "bg-[#2563EB] text-white"
                              : "bg-[#F59E0B] text-[#111827]"
                          }`}
                        >
                          {card.status === "in_progress" ? "Continuer" : "Commencer"}
                        </Link>
                      )}
                    </div>
                  </div>
                );
                return lockedCards.includes(card.title) ? (
                  <PremiumLocker key={card.title} locked>
                    {cardBody}
                  </PremiumLocker>
                ) : (
                  <div key={card.title}>{cardBody}</div>
                );
              })}
            </div>
          </section>

          <section className="mt-10 grid grid-cols-3 gap-[18px]">
            <Card>
              <div className="text-[16px] font-extrabold text-white">Mon profil</div>
              <div className="mt-1 text-[12px] font-medium text-[#9CA3AF]">Basé sur tes 4 tests</div>
              <div className="mt-5 space-y-3">
                {profileItems.map((item) => (
                  <ProfileItem key={item.title} {...item} />
            ))}
          </div>
              <div className="mt-4 space-y-2">
                <div className="text-[12px] font-semibold text-[#9CA3AF]">
                  {testsCompletedCount}/5 tests complétés
                </div>
                <div className="h-2 w-full rounded-full bg-[#2A2A2A]">
                  <div
                    className="h-full rounded-full bg-[#F59E0B]"
                    style={{ width: `${(testsCompletedCount / 5) * 100}%` }}
                  />
                </div>
              </div>
              <button className="mt-4 text-[13px] font-bold text-[#F59E0B]">Voir mon profil complet →</button>
            </Card>

            <Card>
              <div className="text-[16px] font-extrabold text-white">Ma progression</div>
              <div className="mt-1 text-[12px] font-medium text-[#9CA3AF]">Bien-être vs performance · 4 semaines</div>
              <div className="mt-5 rounded-[16px] border border-[#2A2A2A] bg-[#121212] p-4">
                {weeklyData.length ? (
                  <>
                    <svg viewBox="0 0 280 120" className="h-[120px] w-full">
                      <line x1="0" y1="100" x2="280" y2="100" stroke="#2A2A2A" strokeWidth="2" />
                      <line x1="0" y1="60" x2="280" y2="60" stroke="#2A2A2A" strokeWidth="2" />
                      {renderLine(weeklyChartData, "moral", "#F59E0B")}
                      {renderLine(weeklyChartData, "motivation", "#9CA3AF")}
                    </svg>
                    <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-[#9CA3AF]">
                      {weeklyChartData.map((point) => (
                        <span key={point.weekLabel}>{point.weekLabel}</span>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="py-10 text-center text-[12px] text-[#9CA3AF]">
                    Ta courbe de progression s&apos;animera dès ta première semaine de suivi 🚀
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center gap-3 text-[12px] font-semibold text-[#9CA3AF]">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
                  Bien-être
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#9CA3AF]" />
                  Performance
                </span>
              </div>
            </Card>

            <Card>
              <div className="text-[16px] font-extrabold text-white">Mon accompagnement</div>
              <div className="relative mt-5">
                <div className={`space-y-5 ${isHandicapDevice ? "" : "blur-md"}`}>
                  <div className="border-b border-[#2A2A2A] pb-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-gradient-to-br from-[#F59E0B] to-[#FCD34D] text-[14px] font-bold text-[#111827]">
                        JP
                      </div>
                      <div className="flex-1">
                        <div className="text-[14px] font-bold text-white">Jessica Perrin</div>
                        <div className="text-[12px] text-[#9CA3AF]">Psychopédagogue</div>
                      </div>
                      <div className="text-[13px] text-[#F59E0B]">★★★★★</div>
                    </div>
                    <button className="mt-4 w-full rounded-[12px] bg-[#F59E0B] py-3 text-[14px] font-bold text-[#111827] hover:-translate-y-0.5 hover:bg-[#D97706] hover:shadow-[0_6px_20px_rgba(245,158,11,0.3)]">
                      Prendre RDV
                    </button>
                    <div className="mt-2 text-center text-[12px] text-[#9CA3AF]">Prochain RDV : 15 mars · 14h00</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-[36px] w-[36px] items-center justify-center rounded-[10px] bg-[#2A2A2A]">
                        <FileText size={18} strokeWidth={1.5} className="text-[#F59E0B]" />
                      </div>
                      <div className="text-[14px] font-bold text-white">Dossier RQTH</div>
                      <span className="ml-auto rounded-full bg-[#2A2A2A] px-2 py-1 text-[10px] font-bold text-[#F59E0B]">
                        Obtenu · 2028
                      </span>
                    </div>
                    <div className="mt-3 space-y-1 text-[12px] text-[#9CA3AF]">
                      <div>✅ Tiers-temps aux examens validé</div>
                      <div className="text-[#F59E0B]">⚠️ Poste adapté en attente</div>
                    </div>
                    <button
                      onClick={handleOpenUpload}
                      className="mt-3 text-[13px] font-bold text-[#F59E0B]"
                      disabled={uploading}
                    >
                      {uploading ? "Upload..." : "Voir mon dossier →"}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={handleRqthUpload}
                    />
                  </div>
                </div>
                {!isHandicapDevice && (
                  <div className="absolute inset-0 flex items-center justify-center text-center text-[12px] text-[#9CA3AF]">
                    Section réservée au dispositif d&apos;accompagnement spécifique.
                  </div>
                )}
              </div>
            </Card>
          </section>

          <section className="mt-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[16px] font-extrabold text-white">Espace Entreprise</div>
                <div className="text-[12px] font-medium text-[#9CA3AF]">
                  Matching intelligent & offres ciblées
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDemoMatching(true)}
                  className="rounded-full border border-white/10 px-4 py-2 text-[12px] font-semibold text-white/80 transition hover:border-[#F59E0B] hover:text-white"
                >
                  {isConnect ? "Voir le matching" : "Voir le matching (démo)"}
                </button>
                <Link href="/dashboard/apprenant/carriere" className="text-[13px] font-bold text-[#F59E0B]">
                  Voir mon profil public →
                </Link>
              </div>
            </div>
            <div className="relative mt-4 rounded-[20px] border border-[#2A2A2A] bg-[#1C1C1C] p-5">
              <div className={`grid gap-4 md:grid-cols-2 ${canSeeMatching ? "" : "blur-md"}`}>
                {offers.map((offer) => (
                  <div
                    key={offer.company}
                    className="flex items-center gap-4 rounded-[20px] border border-[#2A2A2A] bg-[#121212] p-4 shadow-[0_8px_20px_rgba(0,0,0,0.35)]"
                  >
                    <img
                      src={offer.logo}
                      alt={offer.company}
                      className="h-12 w-12 rounded-full border border-[#2A2A2A] object-cover"
                    />
                    <div className="flex-1">
                      <div className="text-[14px] font-bold text-white">{offer.company}</div>
                      <div className="text-[12px] text-[#9CA3AF]">{offer.role}</div>
                    </div>
                    <span className="rounded-full bg-[#2A2A2A] px-3 py-1 text-[12px] font-bold text-[#F59E0B]">
                      {offer.match}% Match
                    </span>
                  </div>
                ))}
              </div>
              {!canSeeMatching && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[20px] bg-[#121212]/80 text-center backdrop-blur-xl">
                  <Lock className="h-5 w-5 text-[#F59E0B]" />
                  <div className="text-[14px] font-bold text-white">
                    Ton établissement n&apos;a pas encore activé le matching.
                  </div>
                  <div className="max-w-[320px] text-[12px] text-[#9CA3AF]">
                    Contacte ton référent pour débloquer Beyond Connect.
                  </div>
                  <button
                    onClick={handleInterest}
                    className="mt-2 rounded-full bg-[#F59E0B] px-4 py-2 text-[12px] font-semibold text-[#111827]"
                  >
                    Je suis intéressé
                  </button>
                  <button
                    onClick={() => setDemoMatching(true)}
                    className="rounded-full border border-white/20 px-4 py-2 text-[12px] font-semibold text-white/80 hover:border-[#F59E0B] hover:text-white"
                  >
                    Voir le matching (démo)
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="mt-6">
            <div className="flex items-center justify-between">
              <div className="text-[20px] font-extrabold tracking-[-0.5px] text-white">Mon agenda</div>
              <button className="text-[13px] font-bold text-[#F59E0B]">Voir tout →</button>
            </div>
            <div className="mt-3 overflow-hidden rounded-[20px] border border-[#2A2A2A] bg-[#1C1C1C]">
              {AGENDA_ITEMS.map((item) => (
                <AgendaItem key={item.title} {...item} />
              ))}
            </div>
          </section>
          </div>
        </main>
          </div>

      {weeklyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-[20px] border border-[#2A2A2A] bg-[#1C1C1C] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
            <div className="text-[16px] font-extrabold text-white">Weekly Temperature Check</div>
            <div className="mt-1 text-[12px] text-[#9CA3AF]">
              3 questions rapides pour suivre ton bien-être cette semaine.
            </div>

            <div className="mt-5 space-y-4 text-[13px] font-semibold text-white">
              <SliderRow
                label="Moral"
                value={weeklyForm.moral}
                onChange={(value) => setWeeklyForm((prev) => ({ ...prev, moral: value }))}
              />
              <SliderRow
                label="Stress"
                value={weeklyForm.stress}
                onChange={(value) => setWeeklyForm((prev) => ({ ...prev, stress: value }))}
              />
              <SliderRow
                label="Motivation"
                value={weeklyForm.motivation}
                onChange={(value) => setWeeklyForm((prev) => ({ ...prev, motivation: value }))}
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setWeeklyModalOpen(false)}
                className="rounded-full border border-[#2A2A2A] px-4 py-2 text-[12px] font-semibold text-[#9CA3AF]"
              >
                Plus tard
              </button>
              <button
                onClick={handleWeeklySubmit}
                className="rounded-full bg-[#F59E0B] px-5 py-2 text-[12px] font-semibold text-[#111827]"
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
            )}
          </div>
  );
}

const renderLine = (
  data: Array<{ weekLabel: string; moral: number; stress: number; motivation: number }>,
  key: "moral" | "motivation",
  color: string,
) => {
  if (!data.length) return null;
  const max = 10;
  const minY = 20;
  const maxY = 100;
  const width = 280;
  const step = data.length > 1 ? width / (data.length - 1) : width;
  const points = data.map((point, index) => {
    const value = Math.max(0, Math.min(max, point[key]));
    const y = maxY - (value / max) * (maxY - minY);
    return { x: index * step, y };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  return (
    <>
      <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      {points.map((point, index) => (
        <circle key={`${key}-${index}`} cx={point.x} cy={point.y} r="3" fill={color} />
      ))}
    </>
  );
};

const SliderRow = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) => (
  <div>
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="text-[12px] font-semibold text-[#F59E0B]">{value}/10</span>
    </div>
    <input
      type="range"
      min={0}
      max={10}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-[#2A2A2A] accent-[#F59E0B]"
    />
  </div>
);

const NavItem = ({
  icon,
  label,
  href,
  active = false,
  collapsed = false,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  collapsed?: boolean;
}) => (
  <Link
    href={href}
    className={`flex items-center gap-2 rounded-[10px] px-3 py-2 text-[13.5px] font-medium ${
      active ? "bg-[#F59E0B]/20 text-white font-bold" : "text-white hover:bg-white/10"
    } ${collapsed ? "justify-center" : ""}`}
  >
    {icon}
    {!collapsed && label}
  </Link>
);

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-[20px] border border-[#2A2A2A] bg-[#1C1C1C] p-[26px] transition-all duration-200 hover:-translate-y-[3px] hover:border-[#3A3A3A] hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
    {children}
  </div>
);

const ProfileItem = ({
  icon,
  iconBg,
  title,
  desc,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  desc: string;
}) => (
  <div className="flex items-center gap-3 border-b border-[#2A2A2A] py-3 last:border-none">
    <div className="flex h-[36px] w-[36px] items-center justify-center rounded-[10px]" style={{ background: iconBg }}>
      {icon}
    </div>
    <div>
      <div className="text-[13px] font-bold text-white">{title}</div>
      <div className="text-[12px] text-[#9CA3AF]">{desc}</div>
    </div>
  </div>
);

const AgendaItem = ({
  title,
  date,
  badge,
  action,
  color,
  icon: Icon,
  filled,
}: {
  title: string;
  date: string;
  badge: string;
  action: string;
  color: string;
  icon: React.ElementType;
  filled: boolean;
}) => (
  <div className="flex items-center gap-4 border-b border-[#2A2A2A] px-6 py-5 last:border-none hover:bg-[#1F1F1F]">
    <div className="h-[42px] w-[3px] rounded-full" style={{ background: color }} />
    <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[12px]" style={{ background: `${color}35`, color }}>
      <Icon size={18} strokeWidth={1.5} />
    </div>
    <div className="flex-1">
      <div className="text-[14px] font-bold text-white">{title}</div>
      <div className="text-[12px] text-[#9CA3AF]">{date}</div>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-[12px] font-semibold text-[#9CA3AF]">{badge}</span>
      <button
        className={`rounded-full px-4 py-[7px] text-[12px] font-bold ${
          filled
            ? "bg-[#F59E0B] text-[#111827]"
            : "border border-[#2A2A2A] text-[#9CA3AF] hover:bg-[#2A2A2A]"
        }`}
      >
        {action}
      </button>
    </div>
  </div>
);
