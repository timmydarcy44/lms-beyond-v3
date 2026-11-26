/**
 * Définition unique des métriques LMS (temps connecté, temps actif, séances).
 *
 * ## Séance
 * Suite d’événements d’un même utilisateur sans interruption de plus de
 * {@link SESSION_GAP_MS} (30 min). Une nouvelle page ou un rafraîchissement
 * ne crée pas de nouvelle séance : on rattache les signaux à la séance ouverte.
 *
 * ## Temps connecté
 * Pour chaque séance (événements live) : durée = (dernier − premier) + 1 min,
 * plafonnée à {@link MAX_CONNECTED_PER_SESSION_MS} (4 h).
 * Sur données legacy (`learning_sessions`) : on croit `duration_seconds` quand
 * le wall-clock `ended_at − started_at` est absurde (onglet abandonné) ;
 * sinon max(durée, wall) pour absorber une durée sous-déclarée.
 *
 * ## Temps actif
 * Somme des intervalles entre deux heartbeats d’activité (onglet visible +
 * interaction depuis moins de {@link INTERACTION_WINDOW_MS} = 2 min),
 * chaque intervalle plafonné à {@link MAX_ACTIVE_INTERVAL_MS} (2 min).
 *
 * ## Invariant
 * temps actif ≤ temps connecté (par séance et au global).
 */

export const SESSION_GAP_MS = 30 * 60 * 1000;
export const SESSION_TAIL_MS = 60 * 1000;
export const MAX_CONNECTED_PER_SESSION_MS = 4 * 60 * 60 * 1000;
export const HEARTBEAT_INTERVAL_MS = 30 * 1000;
export const INTERACTION_WINDOW_MS = 2 * 60 * 1000;
export const MAX_ACTIVE_INTERVAL_MS = 2 * 60 * 1000;

export type MetricEvent = {
  /** Instant ISO ou epoch ms */
  at: string | number | Date;
  /** Heartbeat d’activité (onglet visible + interaction récente) */
  kind?: "heartbeat" | "interaction" | "presence" | "legacy";
};

export type LogicalSession = {
  startedAt: Date;
  endedAt: Date;
  connectedSeconds: number;
  activeSeconds: number;
  eventCount: number;
};

export type LearnerTimeMetrics = {
  sessionCount: number;
  connectedSeconds: number;
  activeSeconds: number;
  sessions: LogicalSession[];
};

function toDate(value: string | number | Date): Date {
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  return new Date(value);
}

function clampNonNeg(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

/**
 * Regroupe une chronologie d’événements en séances logiques (gap ≤ 30 min).
 */
export function clusterEventsIntoSessions(events: MetricEvent[]): Array<{ startedAt: Date; endedAt: Date; events: Date[] }> {
  const sorted = events
    .map((e) => toDate(e.at))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  if (sorted.length === 0) return [];

  const clusters: Array<{ startedAt: Date; endedAt: Date; events: Date[] }> = [];
  let current: { startedAt: Date; endedAt: Date; events: Date[] } = {
    startedAt: sorted[0],
    endedAt: sorted[0],
    events: [sorted[0]],
  };

  for (let i = 1; i < sorted.length; i++) {
    const t = sorted[i];
    const gap = t.getTime() - current.endedAt.getTime();
    if (gap > SESSION_GAP_MS) {
      clusters.push(current);
      current = { startedAt: t, endedAt: t, events: [t] };
    } else {
      current.endedAt = t;
      current.events.push(t);
    }
  }
  clusters.push(current);
  return clusters;
}

/** Durée connectée d’une séance : (fin − début) + 1 min, max 4 h. */
export function connectedSecondsForSession(startedAt: Date, endedAt: Date): number {
  const raw = endedAt.getTime() - startedAt.getTime() + SESSION_TAIL_MS;
  return clampNonNeg(Math.min(raw, MAX_CONNECTED_PER_SESSION_MS) / 1000);
}

/**
 * Temps actif à partir d’une série de heartbeats (timestamps d’activité).
 * Chaque intervalle entre deux pings successifs est plafonné à 2 min.
 */
export function activeSecondsFromHeartbeats(heartbeatAts: Array<string | number | Date>): number {
  const sorted = heartbeatAts
    .map((v) => toDate(v).getTime())
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => a - b);

  if (sorted.length < 2) return 0;

  let totalMs = 0;
  for (let i = 1; i < sorted.length; i++) {
    const delta = sorted[i] - sorted[i - 1];
    if (delta <= 0) continue;
    totalMs += Math.min(delta, MAX_ACTIVE_INTERVAL_MS);
  }
  return clampNonNeg(totalMs / 1000);
}

/**
 * Calcule séances / temps connecté / temps actif.
 * - `events` : toute présence (start, end, heartbeat, interaction)
 * - `heartbeats` : sous-ensemble activité (si omis → events.kind === 'heartbeat'|'interaction')
 * - `legacyActiveSeconds` : borne haute héritée (duration_active_seconds), jamais > connecté
 */
export function computeLearnerTimeMetrics(input: {
  events: MetricEvent[];
  heartbeats?: Array<string | number | Date>;
  /** Actif stocké historiquement (somme duration_active_seconds) — plafonné par le connecté recalculé */
  legacyActiveSeconds?: number;
}): LearnerTimeMetrics {
  const clusters = clusterEventsIntoSessions(input.events);
  const heartbeatTimes = (input.heartbeats ?? input.events.filter((e) => e.kind === "heartbeat" || e.kind === "interaction").map((e) => e.at))
    .map((v) => toDate(v))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  const sessions: LogicalSession[] = clusters.map((cluster) => {
    const connectedSeconds = connectedSecondsForSession(cluster.startedAt, cluster.endedAt);
    const hbInSession = heartbeatTimes.filter(
      (t) => t.getTime() >= cluster.startedAt.getTime() && t.getTime() <= cluster.endedAt.getTime() + SESSION_TAIL_MS,
    );
    let activeSeconds = activeSecondsFromHeartbeats(hbInSession);
    // Sans heartbeats : on ne invente pas d’activité ; legacy sert de borne haute si fourni au global.
    activeSeconds = Math.min(activeSeconds, connectedSeconds);
    return {
      startedAt: cluster.startedAt,
      endedAt: cluster.endedAt,
      connectedSeconds,
      activeSeconds,
      eventCount: cluster.events.length,
    };
  });

  let connectedSeconds = sessions.reduce((s, x) => s + x.connectedSeconds, 0);
  let activeSeconds = sessions.reduce((s, x) => s + x.activeSeconds, 0);

  // Données historiques sans heartbeats : reporter le legacy actif, plafonné par le connecté recalculé.
  if (activeSeconds === 0 && typeof input.legacyActiveSeconds === "number" && input.legacyActiveSeconds > 0) {
    activeSeconds = Math.min(clampNonNeg(input.legacyActiveSeconds), connectedSeconds);
    // Répartir proportionnellement sur les séances pour garder l’invariant local.
    if (connectedSeconds > 0 && sessions.length > 0) {
      let remaining = activeSeconds;
      for (let i = 0; i < sessions.length; i++) {
        const share =
          i === sessions.length - 1
            ? remaining
            : Math.min(sessions[i].connectedSeconds, Math.floor((activeSeconds * sessions[i].connectedSeconds) / connectedSeconds));
        sessions[i].activeSeconds = share;
        remaining -= share;
      }
    }
  }

  // Invariant global (filet de sécurité)
  if (activeSeconds > connectedSeconds) {
    activeSeconds = connectedSeconds;
  }

  return {
    sessionCount: sessions.length,
    connectedSeconds,
    activeSeconds,
    sessions,
  };
}

/**
 * Fusionne des séances dont le début tombe dans le gap de la précédente
 * (rafraîchissements / lignes orphelines espacées de quelques secondes).
 */
function mergeCloseLogicalSessions(sessions: LogicalSession[]): LogicalSession[] {
  const sorted = [...sessions].sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
  if (sorted.length === 0) return [];

  const out: LogicalSession[] = [];
  let cur: LogicalSession = { ...sorted[0]! };

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i]!;
    const gap = next.startedAt.getTime() - cur.endedAt.getTime();
    if (gap <= SESSION_GAP_MS) {
      const endedAt = next.endedAt.getTime() > cur.endedAt.getTime() ? next.endedAt : cur.endedAt;
      const connectedSeconds = connectedSecondsForSession(cur.startedAt, endedAt);
      const activeSeconds = Math.min(cur.activeSeconds + next.activeSeconds, connectedSeconds);
      cur = {
        startedAt: cur.startedAt,
        endedAt,
        connectedSeconds,
        activeSeconds,
        eventCount: cur.eventCount + next.eventCount,
      };
    } else {
      out.push(cur);
      cur = { ...next };
    }
  }
  out.push(cur);
  return out;
}

/**
 * Une ligne `learning_sessions` → une séance logique.
 *
 * Priorité aux durées mesurées par le client (`duration_seconds` /
 * `duration_active_seconds`) quand le wall-clock `ended_at − started_at`
 * est absurde (onglet laissé ouvert toute la nuit) — cas Anaïs.
 *
 * Si la durée stockée est sous-estimée face à un wall-clock raisonnable
 * (cas Jérôme : 3 s stockés, 5 min réelles), on garde le wall-clock.
 */
export function sessionFromLegacyRow(row: {
  started_at: string | null;
  ended_at?: string | null;
  duration_seconds?: number | null;
  duration_active_seconds?: number | null;
}): LogicalSession | null {
  if (!row.started_at) return null;
  const startedAt = toDate(row.started_at);
  if (Number.isNaN(startedAt.getTime())) return null;

  const maxConnected = MAX_CONNECTED_PER_SESSION_MS / 1000;
  const gapSec = SESSION_GAP_MS / 1000;
  const durSec = clampNonNeg(Number(row.duration_seconds) || 0);
  const activeRaw = clampNonNeg(Number(row.duration_active_seconds) || 0);

  let wallSec = 0;
  let wallEnd: Date | null = null;
  if (row.ended_at) {
    const end = toDate(row.ended_at);
    if (!Number.isNaN(end.getTime()) && end.getTime() >= startedAt.getTime()) {
      wallEnd = end;
      wallSec = connectedSecondsForSession(startedAt, end);
    }
  }

  let connectedSeconds: number;
  let endedAt: Date;

  if (durSec > 0 && wallSec > Math.max(gapSec, durSec * 3)) {
    // Onglet abandonné : wall >> durée mesurée → on croit le compteur client.
    connectedSeconds = Math.min(durSec, maxConnected);
    endedAt = new Date(startedAt.getTime() + connectedSeconds * 1000);
  } else if (durSec <= 0 && wallSec > gapSec) {
    // Fin lointaine sans durée mesurée → ne pas inventer 4 h.
    connectedSeconds = SESSION_TAIL_MS / 1000;
    endedAt = new Date(startedAt.getTime() + connectedSeconds * 1000);
  } else if (wallSec > 0 || durSec > 0) {
    // Normal : max(durée, wall) pour absorber une durée sous-déclarée.
    connectedSeconds = Math.min(Math.max(durSec, wallSec), maxConnected);
    endedAt =
      wallEnd && wallSec >= durSec
        ? wallEnd
        : new Date(startedAt.getTime() + connectedSeconds * 1000);
  } else {
    connectedSeconds = SESSION_TAIL_MS / 1000;
    endedAt = new Date(startedAt.getTime() + connectedSeconds * 1000);
  }

  const activeSeconds = Math.min(activeRaw, connectedSeconds);

  return {
    startedAt,
    endedAt,
    connectedSeconds,
    activeSeconds,
    eventCount: 1,
  };
}

/**
 * Recalcule à partir des lignes `learning_sessions` historiques
 * (sans table de heartbeats). Ne modifie aucune donnée.
 *
 * Chaque ligne = une séance ; on fusionne ensuite les lignes proches
 * (< 30 min) pour les rafraîchissements / orphelins.
 */
export function metricsFromLegacySessionRows(
  rows: Array<{
    started_at: string | null;
    ended_at?: string | null;
    duration_seconds?: number | null;
    duration_active_seconds?: number | null;
  }>,
): LearnerTimeMetrics {
  const built: LogicalSession[] = [];
  for (const row of rows) {
    const session = sessionFromLegacyRow(row);
    if (session) built.push(session);
  }

  const sessions = mergeCloseLogicalSessions(built);
  const connectedSeconds = sessions.reduce((sum, s) => sum + s.connectedSeconds, 0);
  let activeSeconds = sessions.reduce((sum, s) => sum + s.activeSeconds, 0);
  if (activeSeconds > connectedSeconds) activeSeconds = connectedSeconds;

  return {
    sessionCount: sessions.length,
    connectedSeconds,
    activeSeconds,
    sessions,
  };
}

/**
 * Écart max pour reconstruire une séance à partir des validations de contenu
 * hors `learning_sessions` (cas Anaïs : lecture le soir sans heartbeat).
 * Plus large que {@link MAX_LEAF_CONTENT_DELTA_SEC} (affichage feuille).
 */
export const SESSION_RECONSTRUCTION_MAX_DELTA_SEC = 45 * 60;

function sessionCoversInstant(session: LogicalSession, atMs: number): boolean {
  const start = session.startedAt.getTime();
  const end = session.endedAt.getTime() + SESSION_TAIL_MS;
  return atMs >= start && atMs <= end;
}

/** Séance chronométrée (flashcards, etc.) → séance logique. */
export function sessionFromTimedActivity(row: {
  started_at?: string | null;
  completed_at?: string | null;
  ended_at?: string | null;
  duration_seconds?: number | null;
}): LogicalSession | null {
  const startRaw = row.started_at || row.completed_at || row.ended_at;
  if (!startRaw) return null;
  const startedAt = toDate(startRaw);
  if (Number.isNaN(startedAt.getTime())) return null;

  const endRaw = row.completed_at || row.ended_at || row.started_at;
  let endedAt = endRaw ? toDate(endRaw) : startedAt;
  if (Number.isNaN(endedAt.getTime()) || endedAt.getTime() < startedAt.getTime()) {
    endedAt = startedAt;
  }

  const durSec = clampNonNeg(Number(row.duration_seconds) || 0);
  const wallSec = connectedSecondsForSession(startedAt, endedAt);
  const connectedSeconds = Math.min(
    Math.max(durSec, wallSec, SESSION_TAIL_MS / 1000),
    MAX_CONNECTED_PER_SESSION_MS / 1000,
  );
  if (durSec > 0 && wallSec > Math.max(SESSION_GAP_MS / 1000, durSec * 3)) {
    // Fin absurde → croire la durée mesurée
    const connected = Math.min(durSec, MAX_CONNECTED_PER_SESSION_MS / 1000);
    return {
      startedAt,
      endedAt: new Date(startedAt.getTime() + connected * 1000),
      connectedSeconds: connected,
      activeSeconds: connected,
      eventCount: 1,
    };
  }

  const activeSeconds = Math.min(durSec > 0 ? durSec : connectedSeconds, connectedSeconds);
  return {
    startedAt,
    endedAt:
      wallSec >= durSec
        ? endedAt
        : new Date(startedAt.getTime() + connectedSeconds * 1000),
    connectedSeconds,
    activeSeconds,
    eventCount: 1,
  };
}

/**
 * Reconstruit des séances à partir de validations de feuilles non couvertes
 * par les séances déjà retenues (trou Qualiopi si seuls les heartbeats comptent).
 */
export function sessionsFromUncoveredLeafCompletions(
  completedAts: string[],
  existingSessions: LogicalSession[],
  maxDeltaSec: number = SESSION_RECONSTRUCTION_MAX_DELTA_SEC,
): LogicalSession[] {
  const times = completedAts
    .map((iso) => ({ iso, ms: Date.parse(iso) }))
    .filter((x) => Number.isFinite(x.ms))
    .sort((a, b) => a.ms - b.ms);

  const uncovered = times.filter(
    (t) => !existingSessions.some((s) => sessionCoversInstant(s, t.ms)),
  );
  if (uncovered.length === 0) return [];

  const clusters: Array<typeof uncovered> = [];
  let current: typeof uncovered = [uncovered[0]!];
  for (let i = 1; i < uncovered.length; i++) {
    const prev = current[current.length - 1]!;
    const next = uncovered[i]!;
    if (next.ms - prev.ms > SESSION_GAP_MS) {
      clusters.push(current);
      current = [next];
    } else {
      current.push(next);
    }
  }
  clusters.push(current);

  const out: LogicalSession[] = [];
  for (const cluster of clusters) {
    const startedAt = new Date(cluster[0]!.ms);
    const endedAt = new Date(cluster[cluster.length - 1]!.ms);
    const connectedSeconds = connectedSecondsForSession(startedAt, endedAt);
    const gapEstimates = estimateDurationsFromCompletionGaps(
      cluster.map((c) => c.iso),
      maxDeltaSec,
    );
    const fromGaps = gapEstimates.reduce<number>((sum, v) => sum + (v ?? 0), 0);
    // Une validation isolée : crédit minimal (présence), pas 0.
    const activeRaw =
      fromGaps > 0
        ? fromGaps
        : cluster.length === 1
          ? SESSION_TAIL_MS / 1000
          : connectedSeconds;
    out.push({
      startedAt,
      endedAt,
      connectedSeconds,
      activeSeconds: Math.min(activeRaw, connectedSeconds),
      eventCount: cluster.length,
    });
  }
  return out;
}

/**
 * Enrichit les métriques `learning_sessions` avec flashcards + validations
 * hors séance (évite de sous-estimer le temps Qualiopi).
 */
export function enrichMetricsWithEvidence(input: {
  learningSessionRows: Array<{
    started_at: string | null;
    ended_at?: string | null;
    duration_seconds?: number | null;
    duration_active_seconds?: number | null;
  }>;
  flashcardRows?: Array<{
    started_at?: string | null;
    completed_at?: string | null;
    ended_at?: string | null;
    duration_seconds?: number | null;
  }>;
  leafCompletedAts?: string[];
}): LearnerTimeMetrics {
  const base = metricsFromLegacySessionRows(input.learningSessionRows);
  const extras: LogicalSession[] = [...base.sessions];

  for (const row of input.flashcardRows ?? []) {
    const session = sessionFromTimedActivity(row);
    if (!session) continue;
    // Ignore si déjà entièrement couvert par une séance learning_sessions.
    const mid = session.startedAt.getTime() + (session.endedAt.getTime() - session.startedAt.getTime()) / 2;
    if (base.sessions.some((s) => sessionCoversInstant(s, mid))) continue;
    extras.push(session);
  }

  const leafSessions = sessionsFromUncoveredLeafCompletions(
    input.leafCompletedAts ?? [],
    extras,
  );
  extras.push(...leafSessions);

  const sessions = mergeCloseLogicalSessions(extras);
  const connectedSeconds = sessions.reduce((sum, s) => sum + s.connectedSeconds, 0);
  let activeSeconds = sessions.reduce((sum, s) => sum + s.activeSeconds, 0);
  if (activeSeconds > connectedSeconds) activeSeconds = connectedSeconds;

  return {
    sessionCount: sessions.length,
    connectedSeconds,
    activeSeconds,
    sessions,
  };
}

/** Vérifie l’invariant actif ≤ connecté. */
export function assertActiveLeqConnected(metrics: Pick<LearnerTimeMetrics, "activeSeconds" | "connectedSeconds">): boolean {
  return metrics.activeSeconds <= metrics.connectedSeconds;
}

export function formatDurationMinutes(totalSeconds: number): string {
  const seconds = clampNonNeg(totalSeconds);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours} h ${minutes}`;
  if (minutes > 0) return `${minutes} min`;
  return seconds > 0 ? `${seconds} s` : "0 min";
}

export function formatDurationCompact(totalSeconds: number): string {
  const seconds = clampNonNeg(totalSeconds);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours} h ${minutes}`;
  if (minutes > 0) return `${minutes} min`;
  return seconds > 0 ? `${seconds} s` : "—";
}

/**
 * Écart max retenu entre deux validations de feuille pour estimer un temps
 * de contenu. Au-delà = pause / onglet abandonné, pas du temps d’étude.
 */
export const MAX_LEAF_CONTENT_DELTA_SEC = 20 * 60;

/**
 * Estime une durée par validation à partir de l’écart avec la précédente.
 * Première feuille = null (pas d’ancre). Écarts > maxDeltaSec = null.
 */
export function estimateDurationsFromCompletionGaps(
  completedAts: string[],
  maxDeltaSec: number = MAX_LEAF_CONTENT_DELTA_SEC,
): Array<number | null> {
  return completedAts.map((iso, index) => {
    if (index === 0) return null;
    const prev = completedAts[index - 1];
    const delta = Math.round((Date.parse(iso) - Date.parse(prev)) / 1000);
    if (!Number.isFinite(delta) || delta <= 0 || delta > maxDeltaSec) return null;
    return delta;
  });
}

/**
 * Plafonne une liste de durées pour que leur somme ≤ `capSeconds`
 * (ex. temps actif / connecté mesuré). Conserve les proportions.
 */
export function scaleDurationsToCap(
  durations: Array<number | null>,
  capSeconds: number,
): Array<number | null> {
  const cap = clampNonNeg(capSeconds);
  const values = durations.map((d) => (d == null ? 0 : clampNonNeg(d)));
  const raw = values.reduce((a, b) => a + b, 0);
  if (raw === 0) return durations.map((d) => (d == null ? null : 0));
  if (cap === 0) return durations.map((d) => (d == null ? null : 0));
  if (raw <= cap) return durations.map((d, i) => (d == null ? null : values[i]!));

  const factor = cap / raw;
  const scaled = values.map((v) => (v > 0 ? Math.max(1, Math.round(v * factor)) : 0));
  let sum = scaled.reduce((a, b) => a + b, 0);
  // Corrige l’arrondi pour ne jamais dépasser le plafond.
  if (sum > cap) {
    const order = scaled
      .map((v, i) => ({ v, i }))
      .filter((x) => x.v > 0)
      .sort((a, b) => b.v - a.v);
    for (const item of order) {
      if (sum <= cap) break;
      scaled[item.i]! -= 1;
      sum -= 1;
    }
  }
  return durations.map((d, i) => (d == null ? null : scaled[i]!));
}

/**
 * Plafond du temps contenu : on ne peut pas « lire » plus longtemps
 * qu’on a été actif (sinon connecté).
 */
export function contentTimeCapSeconds(metrics: Pick<LearnerTimeMetrics, "activeSeconds" | "connectedSeconds">): number {
  if (metrics.activeSeconds > 0) return metrics.activeSeconds;
  return metrics.connectedSeconds;
}
