/**
 * Mémoire du Coach EDGE — continuité entre les missions.
 * Permet au coach de saluer, se souvenir et personnaliser chaque échange.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CareerMatchingResult } from "@/lib/career-profiles/career-profile-matching";
import { getDailyMission } from "@/lib/apprenant/edge-gamification";
import { secondarySkillsFor } from "@/lib/apprenant/edge-mission-generator-helpers";

export type PastMissionSummary = {
  title: string;
  skill: string;
  completedAt: string;
  summary: string;
  strengths: string[];
};

export type CoachMemory = {
  firstName: string;
  totalMissions: number;
  currentStreak: number;
  lastMission: PastMissionSummary | null;
  recentMissions: PastMissionSummary[];
  avoidedSkills: string[];
  strongSkills: string[];
  badgeNearSkill: string | null;
  badgeNearProgress: number;
};

export type DailyMissionPreview = {
  greeting: string;
  skill: string;
  title: string;
  whyToday: string[];
  whyImportant: string;
  learnings: string[];
  estimatedMinutes: number;
  impact: "Fort" | "Moyen";
  xpReward: number;
  difficulty: string;
};

type DB = SupabaseClient;

function firstNameFromProfile(row: { first_name?: string | null } | null): string {
  const raw = String(row?.first_name ?? "").trim();
  return raw || "toi";
}

function daysSince(iso: string): number {
  const then = new Date(iso).getTime();
  const now = Date.now();
  return Math.floor((now - then) / 86_400_000);
}

function relativeDayLabel(iso: string): string {
  const d = daysSince(iso);
  if (d === 0) return "aujourd'hui";
  if (d === 1) return "hier";
  if (d < 7) return "la semaine dernière";
  if (d < 30) return "récemment";
  return "il y a quelque temps";
}

export async function fetchCoachMemory(db: DB, userId: string): Promise<CoachMemory> {
  const [profileRes, runsRes, streakRes, badgeRes, allRunsRes] = await Promise.all([
    db.from("profiles").select("first_name").eq("id", userId).maybeSingle(),
    db
      .from("edge_challenge_runs")
      .select("skill_name, completed_at, summary, strengths")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(6),
    db.from("edge_streaks").select("current_streak").eq("user_id", userId).maybeSingle(),
    db
      .from("edge_badge_progress")
      .select("skill_name, progress, status")
      .eq("user_id", userId)
      .eq("status", "in_progress")
      .order("progress", { ascending: false })
      .limit(1),
    db
      .from("edge_challenge_runs")
      .select("skill_name", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed"),
  ]);

  const recentMissions: PastMissionSummary[] = (runsRes.data ?? []).map((r) => ({
    title: String(r.skill_name ?? "Mission"),
    skill: String(r.skill_name ?? ""),
    completedAt: String(r.completed_at ?? ""),
    summary: String(r.summary ?? ""),
    strengths: Array.isArray(r.strengths) ? r.strengths.map(String) : [],
  }));

  const skillCounts = new Map<string, number>();
  for (const r of runsRes.data ?? []) {
    const s = String(r.skill_name ?? "");
    if (s) skillCounts.set(s, (skillCounts.get(s) ?? 0) + 1);
  }
  const strongSkills = [...skillCounts.entries()]
    .filter(([, c]) => c >= 2)
    .map(([s]) => s)
    .slice(0, 3);

  const badgeRow = badgeRes.data?.[0];
  const badgeNearSkill = badgeRow ? String(badgeRow.skill_name ?? "") : null;
  const badgeNearProgress = badgeRow ? Number(badgeRow.progress) || 0 : 0;

  return {
    firstName: firstNameFromProfile(profileRes.data),
    totalMissions: allRunsRes.count ?? recentMissions.length,
    currentStreak: Number(streakRes.data?.current_streak) || 0,
    lastMission: recentMissions[0] ?? null,
    recentMissions,
    avoidedSkills: [],
    strongSkills,
    badgeNearSkill,
    badgeNearProgress,
  };
}

export function enrichCoachMemoryWithMatching(
  memory: CoachMemory,
  matching: CareerMatchingResult,
): CoachMemory {
  const completedSkills = new Set(memory.recentMissions.map((m) => m.skill.toLowerCase()));
  const avoided = [...matching.develop, ...matching.consolidate].filter(
    (s) => s && !completedSkills.has(s.toLowerCase()),
  );
  return { ...memory, avoidedSkills: avoided.slice(0, 3) };
}

export function buildCoachGreeting(memory: CoachMemory, skillToday: string): string {
  const name = memory.firstName === "toi" ? "" : ` ${memory.firstName}`;
  const last = memory.lastMission;

  if (!last) {
    return `Bonjour${name}.\n\nJe suis ravi de t'accompagner. Aujourd'hui, j'ai préparé une mission sur ${skillToday} — c'est un excellent point de départ pour progresser.`;
  }

  const when = relativeDayLabel(last.completedAt);
  const success =
    last.strengths[0] ??
    (last.summary ? last.summary.slice(0, 80) : `ta mission ${last.title}`);

  if (memory.avoidedSkills.includes(skillToday)) {
    return `Bonjour${name}.\n\nJ'ai remarqué que tu évites souvent les situations de ${skillToday}. Je pense que c'est justement là que tu peux énormément progresser — j'ai donc préparé quelque chose d'adapté pour toi aujourd'hui.`;
  }

  if (last.skill.toLowerCase() === skillToday.toLowerCase()) {
    return `Bonjour${name}.\n\n${when.charAt(0).toUpperCase() + when.slice(1)}, tu as très bien réussi ta mission ${last.skill}. Aujourd'hui j'aimerais te proposer quelque chose d'un peu plus difficile sur cette même compétence.`;
  }

  if (memory.strongSkills.some((s) => s.toLowerCase() === skillToday.toLowerCase())) {
    return `Bonjour${name}.\n\nJe retrouve la même dynamique que lors de tes missions en ${skillToday}. Continuons sur cette lancée — j'ai une nouvelle situation pour toi.`;
  }

  return `Bonjour${name}.\n\n${when.charAt(0).toUpperCase() + when.slice(1)}, ${success}. Aujourd'hui j'ai préparé une mission sur ${skillToday} pour poursuivre ta progression.`;
}

export function buildDailyMissionPreview(
  matching: CareerMatchingResult,
  memory: CoachMemory,
  date = new Date(),
): DailyMissionPreview | null {
  const daily = getDailyMission(matching, date);
  if (!daily) return null;

  const skill = daily.skill;
  const secondary = secondarySkillsFor(skill);
  const greeting = buildCoachGreeting(memory, skill);

  const whyToday: string[] = [];
  if (memory.lastMission) {
    whyToday.push(
      `${relativeDayLabel(memory.lastMission.completedAt).charAt(0).toUpperCase() + relativeDayLabel(memory.lastMission.completedAt).slice(1)}, vous avez travaillé ${memory.lastMission.skill}`,
    );
  }
  if (matching.nextPriority?.skill === skill) {
    whyToday.push("cette compétence est votre priorité EDGE actuelle");
  }
  if (memory.avoidedSkills.includes(skill)) {
    whyToday.push(`vous n'avez pas encore pratiqué ${skill} en mission — c'est le bon moment`);
  }
  if (memory.badgeNearSkill === skill && memory.badgeNearProgress >= 50) {
    whyToday.push(`vous êtes à ${memory.badgeNearProgress} % du badge ${skill}`);
  }
  if (!whyToday.length) {
    whyToday.push("cette compétence est essentielle pour votre objectif professionnel");
    whyToday.push(`votre niveau actuel appelle une pratique régulière en ${skill}`);
  }

  const impact: "Fort" | "Moyen" =
    matching.nextPriority?.skill === skill || memory.avoidedSkills.includes(skill) ? "Fort" : "Moyen";

  return {
    greeting,
    skill,
    title: `Mission du jour · ${skill}`,
    whyToday,
    whyImportant:
      impact === "Fort"
        ? `Maîtriser ${skill} accélère directement votre progression vers votre objectif.`
        : `Chaque mission en ${skill} renforce votre aisance professionnelle au quotidien.`,
    learnings: [
      `Réagir avec assurance en situation de ${skill.toLowerCase()}`,
      ...secondary.slice(0, 2).map((s) => `Renforcer ${s.toLowerCase()} dans un contexte réaliste`),
    ],
    estimatedMinutes: Number(daily.mechanic.meta?.replace(/\D/g, "")) || 15,
    impact,
    xpReward: daily.xpReward,
    difficulty: memory.totalMissions >= 5 ? "Intermédiaire" : "Accessible",
  };
}

export function memoryBlockForPrompt(memory: CoachMemory): string {
  const lines: string[] = [
    `Prénom : ${memory.firstName}`,
    `Missions terminées : ${memory.totalMissions}`,
    `Série : ${memory.currentStreak} jour(s)`,
  ];
  if (memory.lastMission) {
    lines.push(
      `Dernière mission : « ${memory.lastMission.title} » (${memory.lastMission.skill}, ${relativeDayLabel(memory.lastMission.completedAt)})`,
    );
    if (memory.lastMission.summary) lines.push(`Résumé : ${memory.lastMission.summary.slice(0, 200)}`);
    if (memory.lastMission.strengths.length) {
      lines.push(`Points forts observés : ${memory.lastMission.strengths.join(" ; ")}`);
    }
  }
  if (memory.recentMissions.length > 1) {
    lines.push(
      `Missions récentes : ${memory.recentMissions
        .slice(1, 4)
        .map((m) => `« ${m.title} » (${m.skill})`)
        .join(", ")}`,
    );
  }
  if (memory.avoidedSkills.length) {
    lines.push(`Compétences peu pratiquées : ${memory.avoidedSkills.join(", ")}`);
  }
  if (memory.strongSkills.length) {
    lines.push(`Compétences où l'apprenant progresse bien : ${memory.strongSkills.join(", ")}`);
  }
  if (memory.badgeNearSkill) {
    lines.push(`Badge proche : ${memory.badgeNearSkill} (${memory.badgeNearProgress} %)`);
  }
  return lines.join("\n");
}
