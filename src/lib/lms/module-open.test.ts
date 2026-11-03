import { describe, expect, it } from "vitest";

import {
  moduleOpenPreview,
  readModuleOpenRule,
  scheduleLockForModule,
  type ScheduleContext,
  type ScheduleModule,
} from "./module-open";

const NOW = Date.parse("2026-11-03T12:00:00Z");

function ctx(partial: Partial<ScheduleContext> = {}): ScheduleContext {
  return {
    now: NOW,
    ready: true,
    enrolledAt: Date.parse("2026-10-20T12:00:00Z"),
    completedAt: {},
    isDone: () => false,
    ...partial,
  };
}

describe("ouverture de module", () => {
  it("reste ouvert immédiatement, y compris le premier module réglé sur le précédent", () => {
    const modules: ScheduleModule[] = [{ openRule: { mode: "previous" }, lessons: [{ id: "a" }] }];
    expect(scheduleLockForModule(modules, 0, ctx())).toBeNull();
    expect(readModuleOpenRule({ mode: "nope" }).mode).toBe("immediate");
  });

  it("ouvre à la date choisie, en jour de Paris", () => {
    const future: ScheduleModule[] = [{ openRule: { mode: "date", date: "2026-11-10" }, lessons: [{ id: "a" }] }];
    const today: ScheduleModule[] = [{ openRule: { mode: "date", date: "2026-11-03" }, lessons: [{ id: "a" }] }];
    expect(scheduleLockForModule(future, 0, ctx())).toBe("Ce module s’ouvre le 10 novembre 2026.");
    expect(scheduleLockForModule(today, 0, ctx())).toBeNull();
  });

  it("ouvre une semaine après l’inscription", () => {
    const modules: ScheduleModule[] = [
      { openRule: { mode: "enrollment", amount: 1, unit: "weeks" }, lessons: [{ id: "a" }] },
    ];
    expect(scheduleLockForModule(modules, 0, ctx({ enrolledAt: Date.parse("2026-10-28T12:00:00Z") }))).toBe(
      "Ce module s’ouvre le 4 novembre 2026.",
    );
    expect(scheduleLockForModule(modules, 0, ctx({ enrolledAt: Date.parse("2026-10-27T12:00:00Z") }))).toBeNull();
    expect(scheduleLockForModule(modules, 0, ctx({ enrolledAt: undefined, ready: false }))).toBe(
      "Ce module s’ouvre 1 semaine après ton inscription.",
    );
    expect(scheduleLockForModule(modules, 0, ctx({ enrolledAt: null }))).toBe(
      "Ce module s’ouvre 1 semaine après ton inscription.",
    );
  });

  it("ouvre une semaine après la fin du module précédent", () => {
    const modules: ScheduleModule[] = [
      { lessons: [{ id: "a" }] },
      { openRule: { mode: "previous", amount: 1, unit: "weeks" }, lessons: [{ id: "b" }] },
    ];
    expect(moduleOpenPreview(readModuleOpenRule(modules[1]?.openRule))).toBe(
      "Ce module s’ouvre 1 semaine après la fin du module précédent.",
    );
    expect(scheduleLockForModule(modules, 1, ctx())).toBe(
      "Ce module s’ouvre 1 semaine après la fin du module précédent.",
    );
    const done = ctx({
      isDone: (id) => id === "a",
      completedAt: { a: Date.parse("2026-10-28T12:00:00Z") },
    });
    expect(scheduleLockForModule(modules, 1, done)).toBe("Ce module s’ouvre le 4 novembre 2026.");
    expect(
      scheduleLockForModule(modules, 1, ctx({ isDone: (id) => id === "a", completedAt: { a: Date.parse("2026-10-27T12:00:00Z") } })),
    ).toBeNull();
  });
});
