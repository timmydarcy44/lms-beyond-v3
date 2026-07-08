/**
 * Jauges de mission EDGE — état dynamique de la situation (jeu de situation interne).
 */

import type { MissionGauge, MissionGaugeDelta, MissionGaugeSnapshot, MissionOutcome } from "@/lib/apprenant/edge-mission-types";

export type GaugeDefinition = { key: string; label: string; initial: number };

function skillKey(skill: string): string {
  return skill.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Jauges par défaut selon le type de compétence / scénario. */
export function defaultGaugeDefinitions(skill: string): GaugeDefinition[] {
  const k = skillKey(skill);
  if (k.includes("negoc") || k.includes("commercial") || k.includes("vente") || k.includes("argument")) {
    return [
      { key: "trust", label: "Confiance du client", initial: 38 },
      { key: "tension", label: "Tension", initial: 62 },
      { key: "clarity", label: "Clarté de l'argumentation", initial: 45 },
      { key: "goal", label: "Avancée vers l'objectif", initial: 20 },
    ];
  }
  if (k.includes("leader") || k.includes("management") || k.includes("equipe")) {
    return [
      { key: "trust", label: "Confiance de l'équipe", initial: 40 },
      { key: "tension", label: "Niveau de tension", initial: 55 },
      { key: "clarity", label: "Clarté du message", initial: 42 },
      { key: "adhesion", label: "Adhésion au changement", initial: 25 },
    ];
  }
  if (k.includes("entretien") || k.includes("oral") || k.includes("commun")) {
    return [
      { key: "credibility", label: "Crédibilité", initial: 42 },
      { key: "clarity", label: "Clarté", initial: 45 },
      { key: "impact", label: "Impact", initial: 35 },
      { key: "stress", label: "Maîtrise du stress", initial: 50 },
    ];
  }
  return [
    { key: "trust", label: "Confiance", initial: 40 },
    { key: "tension", label: "Tension", initial: 55 },
    { key: "clarity", label: "Clarté", initial: 45 },
    { key: "goal", label: "Avancée vers l'objectif", initial: 22 },
  ];
}

export function initialMissionGauges(skill: string): MissionGauge[] {
  return defaultGaugeDefinitions(skill).map((g) => ({
    key: g.key,
    name: g.label,
    value: g.initial,
  }));
}

function clampGauge(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function applyGaugeDeltas(gauges: MissionGauge[], deltas: MissionGaugeDelta[]): MissionGauge[] {
  if (!deltas.length) return gauges;
  const byKey = new Map(gauges.map((g) => [g.key, { ...g }]));
  const byName = new Map(gauges.map((g) => [g.name.toLowerCase(), g.key]));

  for (const d of deltas) {
    const key = byKey.has(d.key ?? "") ? (d.key as string) : byName.get(d.name.toLowerCase());
    if (!key) continue;
    const g = byKey.get(key);
    if (g) g.value = clampGauge(g.value + d.delta);
  }
  return gauges.map((g) => byKey.get(g.key) ?? g);
}

export function gaugeBehaviorHints(gauges: MissionGauge[]): string {
  const trust = gauges.find((g) => g.key === "trust")?.value ?? 40;
  const tension = gauges.find((g) => g.key === "tension")?.value ?? 50;
  const goal = gauges.find((g) => g.key === "goal")?.value ?? 20;

  const hints: string[] = [];
  if (trust < 35) hints.push("Confiance basse : réponses courtes, sceptiques, regarde sa montre, menace de couper.");
  else if (trust >= 60) hints.push("Confiance élevée : plus d'informations, objections nuancées, ouverture à explorer.");
  if (tension >= 70) hints.push("Tension élevée : coupe la parole, challenge dur, agacement visible.");
  else if (tension <= 40) hints.push("Tension modérée : échange plus fluide.");
  if (goal >= 65) hints.push("Objectif proche : envisage une prochaine étape, demande une proposition concrète.");
  return hints.length ? `Comportement personnage selon jauges :\n${hints.join("\n")}` : "";
}

export function gaugesBlockForPrompt(gauges: MissionGauge[]): string {
  return gauges.map((g) => `- ${g.name} : ${g.value}/100`).join("\n");
}

export function parseGaugeDeltas(raw: unknown): MissionGaugeDelta[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((d) => d && typeof d === "object")
    .map((d) => {
      const o = d as Record<string, unknown>;
      const name = String(o.name ?? "");
      const delta = Number(o.delta) || 0;
      const reason = String(o.reason ?? "").slice(0, 200);
      const key = String(o.key ?? "").slice(0, 40) || undefined;
      return { name, delta, reason, key };
    })
    .filter((d) => d.name && d.delta !== 0)
    .slice(0, 5);
}

export function computeMissionOutcome(gauges: MissionGauge[]): MissionOutcome {
  const trust = gauges.find((g) => g.key === "trust" || g.key === "credibility")?.value ?? 40;
  const tension = gauges.find((g) => g.key === "tension" || g.key === "stress")?.value ?? 50;
  const goal = gauges.find((g) => g.key === "goal" || g.key === "adhesion" || g.key === "impact")?.value ?? 25;

  if (goal >= 75 && trust >= 60 && tension <= 50) {
    return {
      level: "success",
      title: "Mission réussie",
      message: "Vous avez atteint l'objectif de la mission avec une relation de confiance solide.",
    };
  }
  if (goal >= 50 || (trust >= 50 && tension <= 60)) {
    return {
      level: "partial",
      title: "Réussite partielle",
      message: "Vous avez fait progresser la situation. Quelques axes restent à consolider pour atteindre l'objectif pleinement.",
    };
  }
  if (trust < 30 || tension > 75 || goal < 25) {
    return {
      level: "retry",
      title: "Mission à rejouer",
      message:
        "Cette mission n'est pas encore validée. Ce n'est pas grave : vous venez d'identifier un point de progression très utile.",
    };
  }
  return {
    level: "constructive_failure",
    title: "Échec constructif",
    message: "La situation n'a pas tourné en votre faveur, mais vous avez révélé des réflexes à travailler — c'est précieux.",
  };
}

export function snapshotGauges(gauges: MissionGauge[]): MissionGaugeSnapshot {
  return {
    gauges: gauges.map((g) => ({ ...g })),
    capturedAt: new Date().toISOString(),
  };
}
