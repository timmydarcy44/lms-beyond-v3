export type PlaygroundActivityType = "sandbox" | "situation" | "module";
export type PlaygroundRunMode = "training" | "certification";
export type InteractiveModuleFormat = "scorm12" | "scorm2004" | "xapi" | "cmi5" | "html5" | "unknown";

export type SituationMoment = {
  id: string;
  prompt: string;
  choices: string[];
  freeTalk: boolean;
  requiresJustification: boolean;
};

export type PlaygroundSituation = {
  character: string;
  objective: string;
  moments: SituationMoment[];
  variants: string[];
  mode: PlaygroundRunMode;
};

export type PlaygroundModuleFile = {
  format: InteractiveModuleFormat;
  version: number;
  fileName: string;
  sha256: string;
  entry: string;
  scoreOnly: boolean;
  objectiveIds: string[];
  objectiveMap: Array<{ objectiveId: string; criterionId: string }>;
};

export type PlaygroundActivity = {
  id: string;
  type: PlaygroundActivityType;
  learnerPrompt: string;
  maxAttempts: number;
  mode: PlaygroundRunMode;
  situation?: PlaygroundSituation;
  module?: PlaygroundModuleFile;
};

export type PlaygroundConfig = {
  learnerPrompt: string;
  maxAttempts: number;
  activityType?: PlaygroundActivityType;
  activities?: PlaygroundActivity[];
  situation?: PlaygroundSituation;
  module?: PlaygroundModuleFile;
};

const SUBTITLES: Record<PlaygroundActivityType, string> = {
  sandbox: "Playground · Bac à sable IA",
  situation: "Playground · Mise en situation",
  module: "Playground · Module interactif",
};

export function playgroundSubtitle(type: PlaygroundActivityType): string {
  return SUBTITLES[type];
}

export function activityExamKey(activity: PlaygroundActivity): string {
  return `playground:${activity.type}:${activity.id}`;
}

export function activityTypeFromKey(key: string): PlaygroundActivityType | null {
  if (key === "playground") return "sandbox";
  const match = /^playground:(sandbox|situation|module):/.exec(key);
  return match ? (match[1] as PlaygroundActivityType) : null;
}

export function listPlaygroundActivities(playground: PlaygroundConfig | undefined): PlaygroundActivity[] {
  if (playground?.activities?.length) return playground.activities;
  return [{
    id: "main",
    type: playground?.activityType ?? "sandbox",
    learnerPrompt: playground?.learnerPrompt ?? "",
    maxAttempts: playground?.maxAttempts ?? 2,
    mode: playground?.situation?.mode ?? "certification",
    situation: playground?.situation,
    module: playground?.module,
  }];
}

export function coverageExamKeys(methodIds: string[], playground: PlaygroundConfig | undefined): string[] {
  return methodIds.flatMap((id) => {
    if (id !== "playground") return [id];
    if (!playground?.activities?.length) return ["playground"];
    return playground.activities.map(activityExamKey);
  });
}

export function prefersSituation(text: string): boolean {
  return /accompagnement|vente|management|relationnel|accueil|négociation|entretien/i.test(text);
}

export function playgroundCardStatus(activity: PlaygroundActivity, criterionCount: number): string {
  if (activity.type === "module") {
    if (!activity.module) return "Correspondance des critères à faire";
    if (activity.module.scoreOnly && activity.module.objectiveMap.length === 0) return "Ce module n'envoie que son score";
    const mapped = new Set(activity.module.objectiveMap.map((item) => item.criterionId));
    if (criterionCount > 0 && mapped.size < criterionCount) return "Correspondance des critères à faire";
  }
  if (activity.type === "situation" && !activity.situation?.character.trim()) return "Personnage à rédiger";
  if (activity.type === "sandbox" && activity.learnerPrompt.trim().length < 40) return "Consigne à compléter";
  if (criterionCount === 0) return "Critères à relier";
  return "✓ Prête";
}

export function scoreOnlyReviewIssue(
  activities: PlaygroundActivity[],
  reviewMode: "HUMAN" | "AI" | "MIXED",
): string | null {
  const blocked = activities.some((activity) => activity.type === "module" && activity.module?.scoreOnly && activity.mode !== "training");
  if (!blocked || reviewMode === "HUMAN") return null;
  return "Ce module n'envoie que son score : en certification, seule la validation par un expert est possible.";
}

export type ModuleStatement = {
  objectiveId?: string;
  success?: boolean;
  scoreRaw?: number;
  scoreMin?: number;
  scoreMax?: number;
};

/** Score 0–100 recalculé depuis les objectifs, sans reprendre le total envoyé par le module. */
export function serverModuleScore(
  statements: ModuleStatement[],
  objectiveIds: string[],
): number {
  const watched = objectiveIds.length ? objectiveIds : statements.map((item) => item.objectiveId).filter((id): id is string => Boolean(id));
  if (watched.length === 0) return 0;
  const total = watched.reduce((sum, objectiveId) => {
    const statement = statements.find((item) => item.objectiveId === objectiveId);
    if (!statement) return sum;
    if (statement.success === true && statement.scoreRaw == null) return sum + 100;
    const min = statement.scoreMin ?? 0;
    const max = statement.scoreMax ?? 100;
    const raw = statement.scoreRaw ?? (statement.success ? max : min);
    const span = max - min;
    const scaled = span === 0 ? (raw >= max ? 100 : 0) : ((raw - min) / span) * 100;
    return sum + Math.min(100, Math.max(0, scaled));
  }, 0);
  return Math.round(total / watched.length);
}

export function scoreIntegrity(clientScore: number | null, serverScore: number): "ok" | "à vérifier" {
  if (clientScore == null || Number.isNaN(clientScore)) return "ok";
  return Math.abs(clientScore - serverScore) > 0.5 ? "à vérifier" : "ok";
}

export function classifyModuleEntries(names: string[], manifest = ""): { format: InteractiveModuleFormat; entry: string; scoreOnly: boolean; objectiveIds: string[] } {
  const lower = names.map((name) => name.toLowerCase());
  const objectives = [...manifest.matchAll(/<(?:imsss:)?objective\b[^>]*\bid=["']([^"']+)["']/gi)].map((match) => match[1]);
  const scoreOnly = objectives.length === 0;
  if (lower.some((name) => name.endsWith("cmi5.xml"))) return { format: "cmi5", entry: names.find((name) => name.toLowerCase().endsWith("cmi5.xml")) ?? "cmi5.xml", scoreOnly, objectiveIds: objectives };
  if (lower.some((name) => name.endsWith("tincan.xml"))) return { format: "xapi", entry: names.find((name) => name.toLowerCase().endsWith("tincan.xml")) ?? "tincan.xml", scoreOnly, objectiveIds: objectives };
  if (lower.some((name) => name.endsWith("imsmanifest.xml"))) {
    const version = /2004|cam 1\.3|adlcp:scormtype/i.test(manifest) && !/schemaversion>\s*1\.2\s*</i.test(manifest) ? "scorm2004" : "scorm12";
    return { format: version, entry: names.find((name) => name.toLowerCase().endsWith("imsmanifest.xml")) ?? "imsmanifest.xml", scoreOnly, objectiveIds: objectives };
  }
  const html = names.find((name) => name.toLowerCase().endsWith("index.html")) ?? names.find((name) => name.toLowerCase().endsWith(".html"));
  if (html) return { format: "html5", entry: html, scoreOnly: true, objectiveIds: [] };
  return { format: "unknown", entry: names[0] ?? "", scoreOnly: true, objectiveIds: [] };
}

export const MODULE_IFRAME_SANDBOX = "allow-scripts allow-forms";
