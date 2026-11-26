import { describe, expect, it } from "vitest";
import type { SuiviLearnerDetail } from "@/lib/lms/learner-suivi-detail";
import { buildSuiviReleveHtml } from "@/lib/lms/suivi-releve-pdf";

function baseDetail(over: Partial<SuiviLearnerDetail> = {}): SuiviLearnerDetail {
  return {
    userId: "a21b9ec8-0000-0000-0000-000000000001",
    displayName: "Anaïs Bouquerel",
    nameMissing: false,
    firstName: "Anaïs",
    lastName: "Bouquerel",
    email: "anais@example.com",
    initials: "AB",
    originLabel: "Particulier",
    originKind: "btoc",
    clientHref: null,
    isTest: false,
    autoRelanceEnabled: false,
    courses: [{ id: "c1", title: "Fondamentaux de la neuroéducation" }],
    courseId: "c1",
    courseTitle: "Fondamentaux de la neuroéducation",
    accessWeeks: 12,
    plannedTotalSeconds: 36000,
    weeklyGoalSeconds: 3000,
    progressPct: 5,
    modulesDone: 0,
    modulesTotal: 7,
    chaptersDone: 1,
    chaptersTotal: 22,
    subchaptersDone: 2,
    subchaptersTotal: 96,
    contentSeconds: 959,
    readingSeconds: 959,
    sessionCount: 1,
    firstSessionAt: "2026-11-25T15:10:13.537Z",
    connectedSeconds: 1311,
    activeSeconds: 959,
    avgConnectedPerSession: 1311,
    activeRatioPct: 73,
    lastActivityAt: "2026-11-25T15:32:00.000Z",
    inactiveDays: 0,
    activityTone: "green",
    activityLabel: "Actif",
    weekBars: [
      {
        weekStartIso: "2026-11-23T00:00:00.000Z",
        label: "sem. du 23 nov.",
        seconds: 959,
        display: "15 min",
      },
    ],
    sessions: [
      {
        startedAt: "2026-11-25T15:10:13.537Z",
        endedAt: "2026-11-25T15:32:04.000Z",
        connectedSeconds: 1311,
        activeSeconds: 959,
        label: "Parcours / module",
        badge: null,
        suspicious: false,
      },
    ],
    anomalies: [],
    modules: [
      {
        id: "m1",
        title: "Le cerveau qui apprend",
        progressPct: 20,
        status: "current",
        timeLabel: "15 min",
        quizScore: null,
      },
    ],
    relances: [],
    quizzes: [],
    interviews: [],
    flashcards: [],
    games: [],
    leafTimes: [
      {
        leafId: "leaf-1",
        title: "Introduction",
        kind: "lecture",
        completedAt: "2026-11-25T15:20:00.000Z",
        durationSeconds: 480,
      },
    ],
    ...over,
  };
}

describe("buildSuiviReleveHtml", () => {
  it("embarque les indicateurs clés et échappe le HTML", () => {
    const html = buildSuiviReleveHtml(
      baseDetail({ displayName: 'Anaïs <script>alert(1)</script>' }),
      "2026-11-26T07:00:00.000Z",
    );
    expect(html).toContain("Byound Control");
    expect(html).toContain("Temps actif");
    expect(html).toContain("Temps connecté");
    expect(html).toContain("Progression");
    expect(html).toContain("Séances");
    expect(html).toContain("21 min");
    expect(html).toContain("15 min");
    expect(html).toContain("Fondamentaux de la neuroéducation");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
