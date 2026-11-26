import { describe, expect, it } from "vitest";
import {
  assertActiveLeqConnected,
  computeLearnerTimeMetrics,
  connectedSecondsForSession,
  contentTimeCapSeconds,
  activeSecondsFromHeartbeats,
  enrichMetricsWithEvidence,
  estimateDurationsFromCompletionGaps,
  metricsFromLegacySessionRows,
  scaleDurationsToCap,
  SESSION_GAP_MS,
  MAX_CONNECTED_PER_SESSION_MS,
  MAX_ACTIVE_INTERVAL_MS,
  MAX_LEAF_CONTENT_DELTA_SEC,
} from "@/lib/lms/lms-metrics";

describe("lms-metrics", () => {
  it("calcule le temps connecté : (fin − début) + 1 min, max 4 h", () => {
    const start = new Date("2026-11-01T10:00:00.000Z");
    const end = new Date("2026-11-01T10:10:00.000Z");
    expect(connectedSecondsForSession(start, end)).toBe(11 * 60);

    const longEnd = new Date(start.getTime() + 5 * 60 * 60 * 1000);
    expect(connectedSecondsForSession(start, longEnd)).toBe(MAX_CONNECTED_PER_SESSION_MS / 1000);
  });

  it("plafonne chaque intervalle de heartbeat à 2 min", () => {
    const t0 = Date.parse("2026-11-01T10:00:00.000Z");
    // 5 min entre deux pings → compte 2 min
    expect(activeSecondsFromHeartbeats([t0, t0 + 5 * 60 * 1000])).toBe(MAX_ACTIVE_INTERVAL_MS / 1000);
    // 30 s → 30 s
    expect(activeSecondsFromHeartbeats([t0, t0 + 30_000])).toBe(30);
  });

  it("fusionne les événements espacés de moins de 30 min en une seule séance", () => {
    const base = Date.parse("2026-11-01T10:00:00.000Z");
    const metrics = computeLearnerTimeMetrics({
      events: [
        { at: base, kind: "presence" },
        { at: base + 10 * 60 * 1000, kind: "heartbeat" },
        { at: base + 20 * 60 * 1000, kind: "heartbeat" },
        // même séance (gap 25 min < 30)
        { at: base + 45 * 60 * 1000, kind: "heartbeat" },
      ],
    });
    expect(metrics.sessionCount).toBe(1);
  });

  it("crée une nouvelle séance après une interruption > 30 min", () => {
    const base = Date.parse("2026-11-01T10:00:00.000Z");
    const metrics = computeLearnerTimeMetrics({
      events: [
        { at: base, kind: "presence" },
        { at: base + 5 * 60 * 1000, kind: "heartbeat" },
        { at: base + 5 * 60 * 1000 + SESSION_GAP_MS + 1, kind: "presence" },
        { at: base + 5 * 60 * 1000 + SESSION_GAP_MS + 30_000, kind: "heartbeat" },
      ],
    });
    expect(metrics.sessionCount).toBe(2);
  });

  it("respecte l’invariant temps actif ≤ temps connecté (heartbeats)", () => {
    const base = Date.parse("2026-11-01T12:00:00.000Z");
    // Présence courte, mais heartbeats « absurdes » espacés → actif borné par connecté
    const metrics = computeLearnerTimeMetrics({
      events: [
        { at: base, kind: "presence" },
        { at: base + 60_000, kind: "presence" },
        { at: base, kind: "heartbeat" },
        { at: base + 60_000, kind: "heartbeat" },
      ],
    });
    expect(assertActiveLeqConnected(metrics)).toBe(true);
    expect(metrics.activeSeconds).toBeLessThanOrEqual(metrics.connectedSeconds);
  });

  it("respecte l’invariant sur données legacy (actif stocké > connecté)", () => {
    // Cas Jérôme : 3 s connecté / 1016 s actif stocké
    const metrics = metricsFromLegacySessionRows([
      {
        started_at: "2026-11-10T19:19:40.000Z",
        ended_at: "2026-11-10T19:25:05.000Z",
        duration_seconds: 3,
        duration_active_seconds: 1016,
      },
      {
        started_at: "2026-09-01T12:42:40.000Z",
        ended_at: null,
        duration_seconds: 0,
        duration_active_seconds: 0,
      },
    ]);
    expect(assertActiveLeqConnected(metrics)).toBe(true);
    expect(metrics.activeSeconds).toBeLessThanOrEqual(metrics.connectedSeconds);
    // Connecté = max(durée, wall) ≈ 5 min + 1 min + séance orpheline 1 min
    expect(metrics.connectedSeconds).toBeGreaterThan(3);
  });

  it("ne compte pas 890 lignes orphelines comme 890 séances si gap < 30 min", () => {
    const base = Date.parse("2026-09-07T09:50:00.000Z");
    const rows = Array.from({ length: 50 }, (_, i) => ({
      started_at: new Date(base + i * 5_000).toISOString(),
      ended_at: null as string | null,
      duration_seconds: 0,
      duration_active_seconds: 0,
    }));
    const metrics = metricsFromLegacySessionRows(rows);
    expect(metrics.sessionCount).toBe(1);
    expect(metrics.connectedSeconds).toBeLessThanOrEqual(MAX_CONNECTED_PER_SESSION_MS / 1000);
  });

  it("cas Anaïs : onglet ouvert la nuit → croit duration_seconds, pas le wall-clock", () => {
    const metrics = metricsFromLegacySessionRows([
      {
        started_at: "2026-11-25T15:10:13.537Z",
        ended_at: "2026-11-26T05:48:19.947Z",
        duration_seconds: 1311,
        duration_active_seconds: 959,
      },
    ]);
    expect(metrics.sessionCount).toBe(1);
    expect(metrics.connectedSeconds).toBe(1311);
    expect(metrics.activeSeconds).toBe(959);
    expect(assertActiveLeqConnected(metrics)).toBe(true);
    // Ne doit plus coller à 2 min (2 × 60 s) ni à 4 h de plafond wall-clock
    expect(metrics.connectedSeconds).toBeGreaterThan(120);
    expect(metrics.connectedSeconds).toBeLessThan(2 * 3600);
  });

  it("cas Anaïs : validations + flashcards du soir comptent dans le temps Qualiopi", () => {
    const metrics = enrichMetricsWithEvidence({
      learningSessionRows: [
        {
          started_at: "2026-11-25T15:10:13.537Z",
          ended_at: "2026-11-26T05:48:19.947Z",
          duration_seconds: 1311,
          duration_active_seconds: 959,
        },
      ],
      flashcardRows: [
        {
          started_at: "2026-11-25T22:49:03.038Z",
          completed_at: "2026-11-25T22:57:57.598Z",
          duration_seconds: 534,
        },
        {
          started_at: "2026-11-25T22:58:53.345Z",
          completed_at: "2026-11-25T23:03:25.155Z",
          duration_seconds: 272,
        },
      ],
      leafCompletedAts: [
        "2026-11-25T22:03:41.719Z",
        "2026-11-25T22:31:33.734Z",
        "2026-11-25T22:58:38.171Z",
      ],
    });
    expect(assertActiveLeqConnected(metrics)).toBe(true);
    // Après-midi (959) + soirée (flashcards / lecture) — plus d’une seule séance
    expect(metrics.sessionCount).toBeGreaterThanOrEqual(2);
    expect(metrics.activeSeconds).toBeGreaterThan(959 + 500);
    // La soirée ne doit pas être avalée par le wall-clock de l’onglet abandonné
    const evening = metrics.sessions.find(
      (s) => s.startedAt.toISOString().startsWith("2026-11-25T22"),
    );
    expect(evening).toBeTruthy();
    expect(evening!.activeSeconds).toBeGreaterThan(500);
  });

  it("sans durée mesurée et fin lointaine → présence minimale (pas 4 h inventées)", () => {
    const metrics = metricsFromLegacySessionRows([
      {
        started_at: "2026-11-25T10:00:00.000Z",
        ended_at: "2026-11-26T02:00:00.000Z",
        duration_seconds: 0,
        duration_active_seconds: 0,
      },
    ]);
    expect(metrics.sessionCount).toBe(1);
    expect(metrics.connectedSeconds).toBe(60);
    expect(metrics.activeSeconds).toBe(0);
  });

  it("n’invente pas 45+ min de contenu entre deux validations", () => {
    const t0 = "2026-11-25T15:00:00.000Z";
    const t1 = new Date(Date.parse(t0) + 12 * 60 * 1000).toISOString();
    const t2 = new Date(Date.parse(t1) + 40 * 60 * 1000).toISOString(); // > max delta
    const estimated = estimateDurationsFromCompletionGaps([t0, t1, t2]);
    expect(estimated[0]).toBeNull();
    expect(estimated[1]).toBe(12 * 60);
    expect(estimated[2]).toBeNull();
    expect(MAX_LEAF_CONTENT_DELTA_SEC).toBe(20 * 60);
  });

  it("plafonne le temps contenu au temps actif (cas 54 min > 15 min)", () => {
    const metrics = {
      sessionCount: 1,
      connectedSeconds: 1311,
      activeSeconds: 959,
      sessions: [],
    };
    const cap = contentTimeCapSeconds(metrics);
    expect(cap).toBe(959);
    const scaled = scaleDurationsToCap([null, 1800, 1440], cap);
    const sum = scaled.reduce<number>((s, v) => s + (v ?? 0), 0);
    expect(sum).toBeLessThanOrEqual(cap);
    expect(sum).toBe(959);
    expect(scaled[0]).toBeNull();
  });
});
