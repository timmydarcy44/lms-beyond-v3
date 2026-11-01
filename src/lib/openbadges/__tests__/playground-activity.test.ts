import { deflateRawSync, crc32 } from "node:zlib";
import { describe, expect, it } from "vitest";
import { assessGeneratedBadge } from "@/lib/openbadges/badge-quality";
import {
  activityExamKey,
  coverageExamKeys,
  playgroundCardStatus,
  scoreIntegrity,
  scoreOnlyReviewIssue,
  serverModuleScore,
  type PlaygroundActivity,
} from "@/lib/openbadges/playground-activity";
import { moduleVersionFromZip } from "@/lib/openbadges/playground-zip";
import type { GeneratedBadge } from "@/lib/openbadges/badge-catalog";

function zipWith(name: string, content: string): Uint8Array {
  const data = Buffer.from(content);
  const stored = deflateRawSync(data);
  const nameBytes = Buffer.from(name);
  const checksum = crc32(data);
  const local = Buffer.alloc(30 + nameBytes.length + stored.length);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(8, 8);
  local.writeUInt32LE(checksum, 14);
  local.writeUInt32LE(stored.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(nameBytes.length, 26);
  nameBytes.copy(local, 30);
  stored.copy(local, 30 + nameBytes.length);
  const central = Buffer.alloc(46 + nameBytes.length);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(8, 10);
  central.writeUInt32LE(checksum, 16);
  central.writeUInt32LE(stored.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(nameBytes.length, 28);
  nameBytes.copy(central, 46);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(central.length, 12);
  eocd.writeUInt32LE(local.length, 16);
  return new Uint8Array(Buffer.concat([local, central, eocd]));
}

const baseBadge = {
  name: "Neuroéducation",
  description: "La personne accompagne un apprenant.",
  domain: "Neuroéducation",
  level: 2,
  criteria: [
    { label: "Repérer les signes", description: "", expectedOutcome: "La personne relève au moins trois observations factuelles dans le cas proposé.", sourceModule: "L'attention" },
    { label: "Analyser la difficulté", description: "", expectedOutcome: "L'explication s'appuie sur au moins un mécanisme vu en formation.", sourceModule: "Le cerveau" },
    { label: "Concevoir un plan", description: "", expectedOutcome: "Le plan comporte au moins trois actions concrètes, chacune justifiée.", sourceModule: "Byound Care" },
    { label: "Mesurer les progrès", description: "", expectedOutcome: "La personne définit au moins deux indicateurs observables avec une échéance.", sourceModule: "Byound Care" },
  ],
  competencies: [
    { name: "Accompagnement", definition: "Conduire un entretien à partir d'observations." },
    { name: "Analyse", definition: "Relier une difficulté à un mécanisme." },
  ],
  questions: [],
} satisfies Omit<GeneratedBadge, "methods">;

describe("playground activities", () => {
  it("refuses an AI sandbox on neuroeducation and accepts a situation", () => {
    const shared = {
      criterionIndexes: [0, 1, 2, 3],
      learnerPrompt: "Menez l'entretien. Justifiez chaque choix important.",
      deliverables: [{ title: "Entretien", description: "", format: "text" as const }],
    };
    const sandbox = assessGeneratedBadge({
      ...baseBadge,
      methods: [
        { id: "playground", activityType: "sandbox", context: "Léa, 14 ans, oublie ses leçons et décroche en fin de journée.", ...shared },
        { id: "qcm", criterionIndexes: [1], learnerPrompt: "Répondez au questionnaire. Chaque question porte sur une notion.", deliverables: [] },
      ],
    }, { minCriteria: 4, maxCriteria: 6, aiTopic: false, askedQuestions: 4 });
    expect(sandbox.some((issue) => issue.includes("bac à sable"))).toBe(true);

    const situation = assessGeneratedBadge({
      ...baseBadge,
      methods: [
        { id: "playground", activityType: "situation", context: "Léa, 14 ans, oublie ses leçons et décroche en fin de journée.", ...shared },
        { id: "qcm", criterionIndexes: [1], learnerPrompt: "Répondez au questionnaire. Chaque question porte sur une notion.", deliverables: [] },
      ],
    }, { minCriteria: 4, maxCriteria: 6, aiTopic: false, askedQuestions: 4 });
    expect(situation.some((issue) => issue.includes("bac à sable"))).toBe(false);
    expect(situation.some((issue) => issue.includes("mise en pratique"))).toBe(false);
  });

  it("keeps two playground exams distinct in the coverage keys", () => {
    const situation: PlaygroundActivity = { id: "sit", type: "situation", learnerPrompt: "Entretien", maxAttempts: 2, mode: "certification", situation: { character: "Léa", objective: "Repérer", moments: [], variants: [], mode: "certification" } };
    const moduleActivity: PlaygroundActivity = { id: "zip", type: "module", learnerPrompt: "", maxAttempts: 1, mode: "certification" };
    const keys = coverageExamKeys(["case_study", "playground"], { learnerPrompt: "", maxAttempts: 2, activities: [situation, moduleActivity] });
    expect(keys).toEqual(["case_study", activityExamKey(situation), activityExamKey(moduleActivity)]);
    expect(playgroundCardStatus(moduleActivity, 2)).toBe("Correspondance des critères à faire");
  });

  it("recalculates the module score and flags a console edit", () => {
    const server = serverModuleScore([
      { objectiveId: "attention", success: true, scoreRaw: 1, scoreMin: 0, scoreMax: 1 },
      { objectiveId: "memoire", success: false, scoreRaw: 0, scoreMin: 0, scoreMax: 1 },
    ], ["attention", "memoire"]);
    expect(server).toBe(50);
    expect(scoreIntegrity(100, server)).toBe("à vérifier");
    expect(scoreIntegrity(50, server)).toBe("ok");
    const issue = scoreOnlyReviewIssue([
      { id: "zip", type: "module", learnerPrompt: "", maxAttempts: 1, mode: "certification", module: { format: "xapi", version: 1, fileName: "jeu.zip", sha256: "abc", entry: "tincan.xml", scoreOnly: true, objectiveIds: [], objectiveMap: [] } },
    ], "MIXED");
    expect(issue).toContain("score");
    expect(scoreOnlyReviewIssue([
      { id: "zip", type: "module", learnerPrompt: "", maxAttempts: 1, mode: "training", module: { format: "xapi", version: 1, fileName: "jeu.zip", sha256: "abc", entry: "tincan.xml", scoreOnly: true, objectiveIds: [], objectiveMap: [] } },
    ], "MIXED")).toBeNull();
  });

  it("reads an xAPI zip, versions it, and refuses a path escape", () => {
    const moduleFile = moduleVersionFromZip(zipWith("tincan.xml", "<tincan></tincan>"), "jeu.zip");
    expect(moduleFile.format).toBe("xapi");
    expect(moduleFile.version).toBe(1);
    expect(moduleFile.scoreOnly).toBe(true);
    expect(() => moduleVersionFromZip(zipWith("../secret.html", "<p>x</p>"), "piege.zip")).toThrow(/chemin/);
  });
});
