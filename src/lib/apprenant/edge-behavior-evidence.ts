/**
 * Dossier de preuves comportementales — matrice progressive de validation compétence.
 */

import {
  VALIDATION_RULES,
  behaviorByKey,
  getBehaviorGrid,
  type BehaviorDefinition,
  type BehaviorGrid,
} from "@/lib/apprenant/edge-behavior-grids";

export type BehaviorObservationRecord = {
  behaviorKey: string;
  behaviorLabel: string;
  observed: boolean;
  evidenceQuote: string;
  turn: number;
  missionRunId?: string;
  missionTitle?: string;
  observedAt: string;
};

export type BehaviorEvidenceEntry = {
  behaviorKey: string;
  behaviorLabel: string;
  observations: BehaviorObservationRecord[];
  missionContexts: string[];
  observationCount: number;
  firstObservedAt?: string;
  lastObservedAt?: string;
};

export type BehaviorProofRow = {
  behaviorKey: string;
  behaviorLabel: string;
  description: string;
  observed: boolean;
  observationCount: number;
  missionContextCount: number;
  status: "not_observed" | "emerging" | "confirmed";
  latestEvidence?: string;
  debriefLine?: string;
};

export type SkillProofMatrix = {
  skillName: string;
  skillKey: string;
  totalBehaviors: number;
  observedBehaviors: number;
  distinctMissionContexts: number;
  rows: BehaviorProofRow[];
  validationProgress: number;
  isValidated: boolean;
  validationMessage: string;
  behaviorsToWork: string[];
};

export type BehaviorTurnObservation = {
  turn: number;
  behaviors: Array<{
    key: string;
    label: string;
    observed: boolean;
    evidenceQuote: string;
  }>;
};

function uniqueContexts(entries: BehaviorEvidenceEntry[]): number {
  const contexts = new Set<string>();
  for (const e of entries) {
    for (const c of e.missionContexts) contexts.add(c);
  }
  return contexts.size;
}

export function emptyEvidenceForGrid(grid: BehaviorGrid): BehaviorEvidenceEntry[] {
  return grid.behaviors.map((b) => ({
    behaviorKey: b.key,
    behaviorLabel: b.label,
    observations: [],
    missionContexts: [],
    observationCount: 0,
  }));
}

export function mergeEvidenceEntries(
  existing: BehaviorEvidenceEntry[],
  newObservations: BehaviorObservationRecord[],
  missionContext: string,
): BehaviorEvidenceEntry[] {
  const byKey = new Map(existing.map((e) => [e.behaviorKey, { ...e, observations: [...e.observations], missionContexts: [...e.missionContexts] }]));

  for (const obs of newObservations) {
    if (!obs.observed || !obs.evidenceQuote.trim()) continue;
    const entry = byKey.get(obs.behaviorKey);
    if (!entry) continue;

    const duplicate = entry.observations.some(
      (o) => o.evidenceQuote === obs.evidenceQuote && o.missionRunId === obs.missionRunId,
    );
    if (duplicate) continue;

    entry.observations.push(obs);
    entry.observationCount = entry.observations.length;
    if (missionContext && !entry.missionContexts.includes(missionContext)) {
      entry.missionContexts.push(missionContext);
    }
    entry.firstObservedAt = entry.firstObservedAt ?? obs.observedAt;
    entry.lastObservedAt = obs.observedAt;
    byKey.set(obs.behaviorKey, entry);
  }

  return Array.from(byKey.values());
}

export function observationsFromTurns(
  turns: BehaviorTurnObservation[],
  missionRunId: string,
  missionTitle: string,
  grid: BehaviorGrid,
): BehaviorObservationRecord[] {
  const now = new Date().toISOString();
  const out: BehaviorObservationRecord[] = [];

  for (const turn of turns) {
    for (const b of turn.behaviors) {
      const def = behaviorByKey(grid, b.key);
      if (!def && !b.label) continue;
      out.push({
        behaviorKey: b.key,
        behaviorLabel: def?.label ?? b.label,
        observed: b.observed,
        evidenceQuote: b.evidenceQuote.slice(0, 300),
        turn: turn.turn,
        missionRunId,
        missionTitle,
        observedAt: now,
      });
    }
  }
  return out;
}

function rowStatus(entry: BehaviorEvidenceEntry): BehaviorProofRow["status"] {
  if (entry.observationCount === 0) return "not_observed";
  if (entry.observationCount >= 2 && entry.missionContexts.length >= 2) return "confirmed";
  return "emerging";
}

function buildDebriefLine(skillName: string, def: BehaviorDefinition, entry: BehaviorEvidenceEntry, status: BehaviorProofRow["status"]): string {
  const latest = entry.observations[entry.observations.length - 1]?.evidenceQuote;
  if (status === "confirmed") {
    return `J'ai observé à plusieurs reprises que tu ${def.label.toLowerCase()} — notamment : « ${latest?.slice(0, 80)}… ». C'est un comportement attendu pour ${skillName}.`;
  }
  if (status === "emerging") {
    return `Aujourd'hui, j'ai observé que tu as spontanément ${def.label.toLowerCase()}${latest ? ` : « ${latest.slice(0, 80)}… »` : ""}. C'est un signal encourageant pour ${skillName}.`;
  }
  return `Je n'ai pas encore observé le comportement « ${def.label} » dans des situations variées. C'est un axe à travailler pour ${skillName}.`;
}

export function computeSkillProofMatrix(skillName: string, evidence: BehaviorEvidenceEntry[]): SkillProofMatrix {
  const grid = getBehaviorGrid(skillName);
  const merged = mergeEvidenceEntries(emptyEvidenceForGrid(grid), [], "");
  const byKey = new Map(merged.map((e) => [e.behaviorKey, e]));
  for (const e of evidence) {
    const base = byKey.get(e.behaviorKey);
    if (base) byKey.set(e.behaviorKey, e);
  }
  const entries = Array.from(byKey.values());

  const rows: BehaviorProofRow[] = grid.behaviors.map((def) => {
    const entry = entries.find((e) => e.behaviorKey === def.key) ?? {
      behaviorKey: def.key,
      behaviorLabel: def.label,
      observations: [],
      missionContexts: [],
      observationCount: 0,
    };
    const status = rowStatus(entry);
    const latest = entry.observations[entry.observations.length - 1]?.evidenceQuote;
    return {
      behaviorKey: def.key,
      behaviorLabel: def.label,
      description: def.description,
      observed: entry.observationCount > 0,
      observationCount: entry.observationCount,
      missionContextCount: entry.missionContexts.length,
      status,
      latestEvidence: latest,
      debriefLine: buildDebriefLine(skillName, def, entry, status),
    };
  });

  const observedBehaviors = rows.filter((r) => r.observed).length;
  const distinctMissionContexts = uniqueContexts(entries);
  const confirmedBehaviors = rows.filter((r) => r.status === "confirmed").length;

  const isValidated =
    observedBehaviors >= VALIDATION_RULES.minBehaviorsObserved &&
    distinctMissionContexts >= VALIDATION_RULES.minDistinctMissions &&
    confirmedBehaviors >= Math.max(2, VALIDATION_RULES.minBehaviorsObserved - 1);

  const validationProgress = Math.min(
    100,
    Math.round(
      (observedBehaviors / grid.behaviors.length) * 50 +
        (distinctMissionContexts / VALIDATION_RULES.minDistinctMissions) * 30 +
        (confirmedBehaviors / VALIDATION_RULES.minBehaviorsObserved) * 20,
    ),
  );

  const behaviorsToWork = rows.filter((r) => !r.observed).map((r) => r.behaviorLabel);

  let validationMessage: string;
  if (isValidated) {
    validationMessage = `La compétence ${skillName} est considérée comme acquise : ${observedBehaviors} comportements observés dans ${distinctMissionContexts} contextes variés.`;
  } else if (observedBehaviors === 0) {
    validationMessage = `Aucun comportement observable n'a encore été documenté pour ${skillName}. Continuez les missions pour constituer votre dossier de preuves.`;
  } else {
    validationMessage = `Dossier en construction : ${observedBehaviors}/${grid.behaviors.length} comportements observés, ${distinctMissionContexts}/${VALIDATION_RULES.minDistinctMissions} contextes. Une seule mission ne suffit pas à valider la compétence.`;
  }

  return {
    skillName,
    skillKey: grid.skillKey,
    totalBehaviors: grid.behaviors.length,
    observedBehaviors,
    distinctMissionContexts,
    rows,
    validationProgress,
    isValidated,
    validationMessage,
    behaviorsToWork,
  };
}

export function missionBehaviorHighlights(
  matrix: SkillProofMatrix,
  missionRows: BehaviorProofRow[],
): { observed: string[]; notObserved: string[]; coachLines: string[] } {
  const observedKeys = new Set(missionRows.filter((r) => r.observed).map((r) => r.behaviorKey));
  const observed = matrix.rows.filter((r) => observedKeys.has(r.behaviorKey)).map((r) => r.behaviorLabel);
  const notObserved = matrix.rows.filter((r) => !observedKeys.has(r.behaviorKey) && r.status === "not_observed").slice(0, 2).map((r) => r.behaviorLabel);
  const coachLines = missionRows.filter((r) => r.observed && r.debriefLine).map((r) => r.debriefLine as string);
  return { observed, notObserved, coachLines };
}

export function parseBehaviorTurns(raw: unknown): BehaviorTurnObservation[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((t) => t && typeof t === "object")
    .map((t) => {
      const o = t as Record<string, unknown>;
      const behaviors = Array.isArray(o.behaviors)
        ? o.behaviors
            .filter((b) => b && typeof b === "object")
            .map((b) => {
              const bb = b as Record<string, unknown>;
              return {
                key: String(bb.key ?? "").slice(0, 40),
                label: String(bb.label ?? "").slice(0, 80),
                observed: Boolean(bb.observed),
                evidenceQuote: String(bb.evidenceQuote ?? "").slice(0, 300),
              };
            })
            .filter((b) => b.key)
        : [];
      return { turn: Number(o.turn) || 0, behaviors };
    })
    .slice(-30);
}

export function parseObservedBehaviors(raw: unknown): BehaviorTurnObservation["behaviors"] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((b) => b && typeof b === "object")
    .map((b) => {
      const bb = b as Record<string, unknown>;
      return {
        key: String(bb.key ?? bb.behaviorKey ?? "").slice(0, 40),
        label: String(bb.label ?? bb.behaviorLabel ?? "").slice(0, 80),
        observed: Boolean(bb.observed),
        evidenceQuote: String(bb.evidenceQuote ?? bb.evidence ?? "").slice(0, 300),
      };
    })
    .filter((b) => b.key);
}

/** Détection heuristique de secours à partir du texte utilisateur. */
export function heuristicBehaviorDetection(
  userText: string,
  grid: BehaviorGrid,
): BehaviorTurnObservation["behaviors"] {
  const t = userText.toLowerCase();
  const hits: BehaviorTurnObservation["behaviors"] = [];

  const rules: Array<{ keys: string[]; patterns: RegExp[] }> = [
    { keys: ["reformule"], patterns: [/si je comprends bien/, /en d'autres termes/, /donc vous dites/, /ce que vous me dites/] },
    { keys: ["questions_ouvertes"], patterns: [/qu'est-ce qui/, /comment/, /pourquoi/, /pouvez-vous m'expliquer/, /quel est/] },
    { keys: ["verifie_comprehension"], patterns: [/est-ce bien/, /ai-je bien compris/, /c'est bien ça/, /pour confirmer/] },
    { keys: ["adapte_discours"], patterns: [/dans votre contexte/, /pour votre équipe/, /concrètement pour vous/] },
    { keys: ["repond_objections"], patterns: [/je comprends votre préoccupation/, /concernant le prix/, /par rapport à/, /votre objection/] },
    { keys: ["conclut_echange", "conclut_accord"], patterns: [/prochaine étape/, /je vous propose/, /on se revoit/, /pour conclure/, /d'accord pour/] },
    { keys: ["decide"], patterns: [/je décide/, /nous allons/, /je tranche/, /la décision est/] },
    { keys: ["ecoute"], patterns: [/j'entends/, /je prends note/, /votre point de vue/, /d'après ce que vous dites/] },
    { keys: ["analyse_faits"], patterns: [/les données/, /les chiffres/, /le fait est/, /objectivement/] },
    { keys: ["compare_options"], patterns: [/d'un côté/, /alternative/, /par rapport à l'option/, /plusieurs options/] },
    { keys: ["justifie_decision"], patterns: [/parce que/, /la raison/, /mon critère/, /j'ai choisi car/] },
  ];

  for (const rule of rules) {
    if (!rule.patterns.some((p) => p.test(t))) continue;
    for (const key of rule.keys) {
      const def = behaviorByKey(grid, key);
      if (!def) continue;
      hits.push({
        key: def.key,
        label: def.label,
        observed: true,
        evidenceQuote: userText.slice(0, 200),
      });
      break;
    }
  }
  return hits.slice(0, 3);
}
