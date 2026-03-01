"use client";

import {
  GameState,
  KPIsState,
  WorldBible,
  JERSEY_SIZES,
} from "../../game-state/types";
import { clamp } from "../../game-state/utils";

export type SanityIssue = {
  level: "error" | "warn";
  code: string;
  message: string;
  path?: string;
  turnNumber?: number;
  value?: unknown;
};

type NumericEntry = {
  path: string;
  value: number;
};

const MAX_ISSUES = 50;

export function runKpiSanityChecks(params: {
  state: GameState;
  worldBible: WorldBible;
  kpis: KPIsState;
  lastKpis?: KPIsState;
}): SanityIssue[] {
  const issues: SanityIssue[] = [];
  const { state, worldBible, kpis, lastKpis } = params;

  const numericEntries = collectNumericKpis(kpis);
  numericEntries.forEach((entry) => {
    if (!Number.isFinite(entry.value)) {
      pushIssue(issues, {
        level: "error",
        code: "KPI_NAN",
        message: "Valeur numérique invalide (NaN/Infinity)",
        path: entry.path,
      });
    }
  });

  const capacityTotal = worldBible.stadium.capacityTotal || worldBible.stadium.capacity;

  if (kpis.matchday.fillRate < 0 || kpis.matchday.fillRate > 1.001) {
    pushIssue(issues, {
      level: "error",
      code: "KPI_FILLRATE_RANGE",
      message: "Taux de remplissage hors bornes [0,1]",
      value: kpis.matchday.fillRate,
    });
  }

  if (kpis.matchday.attendance > capacityTotal + 1) {
    pushIssue(issues, {
      level: "error",
      code: "KPI_ATTENDANCE_CAPACITY",
      message: "Affluence supérieure à la capacité du stade",
      value: {
        attendance: kpis.matchday.attendance,
        capacity: capacityTotal,
      },
    });
  }

  if (kpis.matchday.ticketRevenuePerMatch < 0) {
    pushIssue(issues, {
      level: "error",
      code: "KPI_TICKET_REVENUE_NEGATIVE",
      message: "CA billetterie négatif",
      value: kpis.matchday.ticketRevenuePerMatch,
    });
  }

  if (kpis.merchandising.jerseyUnitsSold < 0 || kpis.merchandising.jerseyCogs < 0) {
    pushIssue(issues, {
      level: "error",
      code: "KPI_MERCH_NEGATIVE",
      message: "Ventes ou coût maillot négatif",
      value: {
        units: kpis.merchandising.jerseyUnitsSold,
        cogs: kpis.merchandising.jerseyCogs,
      },
    });
  }

  if (
    kpis.merchandising.jerseyGrossMarginRate < -1.1 ||
    kpis.merchandising.jerseyGrossMarginRate > 1.1
  ) {
    pushIssue(issues, {
      level: "warn",
      code: "KPI_MERCH_MARGIN_RATE",
      message: "Taux de marge maillot incohérent",
      value: kpis.merchandising.jerseyGrossMarginRate,
    });
  }

  if (kpis.merchandising.jerseyStockRemaining < -1e-3) {
    pushIssue(issues, {
      level: "error",
      code: "KPI_MERCH_NEGATIVE_STOCK",
      message: "Stock maillot négatif après calcul",
      value: kpis.merchandising.jerseyStockRemaining,
    });
  }

  JERSEY_SIZES.forEach((size) => {
    const initial = kpis.merchandising.jerseyStockBySizeInitial[size] ?? 0;
    const remaining = kpis.merchandising.jerseyStockBySizeRemaining[size] ?? 0;
    const sold = kpis.merchandising.jerseyUnitsSoldBySize[size] ?? 0;
    if (initial < -1e-3 || remaining < -1e-3 || sold < -1e-3) {
      pushIssue(issues, {
        level: "error",
        code: "KPI_MERCH_NEGATIVE_SIZE_STOCK",
        message: `Stock maillot négatif pour la taille ${size}`,
        value: { size, initial, remaining, sold },
      });
    }
  });

  const sizeShareWarningThreshold = 0.6;
  const totalStockInitial = Math.max(kpis.merchandising.jerseyStockInitial, 1);
  JERSEY_SIZES.forEach((size) => {
    const initial = kpis.merchandising.jerseyStockBySizeInitial[size] ?? 0;
    const share = initial / totalStockInitial;
    if (share > sizeShareWarningThreshold) {
      pushIssue(issues, {
        level: "warn",
        code: "KPI_MERCH_SIZE_SHARE",
        message: `Une taille représente plus de ${Math.round(
          sizeShareWarningThreshold * 100,
        )}% du stock initial`,
        value: { size, share },
      });
    }
  });

  const sumSoldBySize = JERSEY_SIZES.reduce(
    (acc, size) => acc + (kpis.merchandising.jerseyUnitsSoldBySize[size] ?? 0),
    0,
  );
  if (Math.abs(sumSoldBySize - kpis.merchandising.jerseyUnitsSold) > 1) {
    pushIssue(issues, {
      level: "warn",
      code: "KPI_MERCH_SIZE_SUM_MISMATCH",
      message: "Somme des ventes par taille différente du total global",
      value: {
        sumBySize: sumSoldBySize,
        global: kpis.merchandising.jerseyUnitsSold,
      },
    });
  }

  const sumInitialBySize = JERSEY_SIZES.reduce(
    (acc, size) => acc + (kpis.merchandising.jerseyStockBySizeInitial[size] ?? 0),
    0,
  );
  if (Math.abs(sumInitialBySize - kpis.merchandising.jerseyStockInitial) > 1) {
    pushIssue(issues, {
      level: "warn",
      code: "KPI_MERCH_SIZE_INITIAL_MISMATCH",
      message: "Somme des stocks initiaux par taille différente du stock global",
      value: {
        sumBySize: sumInitialBySize,
        global: kpis.merchandising.jerseyStockInitial,
      },
    });
  }

  const sumRemainingBySize = JERSEY_SIZES.reduce(
    (acc, size) => acc + (kpis.merchandising.jerseyStockBySizeRemaining[size] ?? 0),
    0,
  );
  if (Math.abs(sumRemainingBySize - kpis.merchandising.jerseyStockRemaining) > 1) {
    pushIssue(issues, {
      level: "warn",
      code: "KPI_MERCH_SIZE_REMAINING_MISMATCH",
      message: "Somme des stocks restants par taille différente du stock global restant",
      value: {
        sumBySize: sumRemainingBySize,
        global: kpis.merchandising.jerseyStockRemaining,
      },
    });
  }

  if (kpis.merchandising.jerseyGrossMarginRate < 0) {
    pushIssue(issues, {
      level: "warn",
      code: "KPI_MERCH_MARGIN_NEGATIVE",
      message: "Marge maillot négative",
      value: kpis.merchandising.jerseyGrossMarginRate,
    });
  }

  const cashForInventory = Math.max(Math.abs(kpis.transverse.cash), 1);
  if (kpis.merchandising.jerseyInventoryValue > cashForInventory * 0.3) {
    pushIssue(issues, {
      level: "warn",
      code: "KPI_MERCH_INVENTORY_HEAVY",
      message: "Valeur de stock maillot supérieure à 30% de la trésorerie",
      value: {
        inventory: kpis.merchandising.jerseyInventoryValue,
        cash: kpis.transverse.cash,
      },
    });
  }

  checkIndexBounds(
    issues,
    "fansIndex",
    kpis.transverse.fansIndex,
    0,
    120,
  );
  checkIndexBounds(
    issues,
    "brandIndex",
    kpis.transverse.brandIndex,
    0,
    120,
  );
  checkIndexBounds(
    issues,
    "sponsorSatisfactionIndex",
    kpis.sponsoring.sponsorSatisfactionIndex,
    0,
    120,
  );

  const cashBaseline = Math.max(Math.abs(state.cash), 1);
  const cashDeltaAbsolute = Math.abs(kpis.transverse.cashDeltaThisTurn);
  const cashDeltaThreshold = cashBaseline * 0.3;
  if (cashDeltaAbsolute > cashDeltaThreshold) {
    pushIssue(issues, {
      level: "error",
      code: "KPI_CASH_DELTA_SPIKE",
      message: "Variation de trésorerie anormalement élevée (>30%)",
      value: {
        delta: kpis.transverse.cashDeltaThisTurn,
        cash: state.cash,
      },
    });
  }

  if (
    kpis.sponsoring.totalRevenue <= 0 &&
    kpis.sponsoring.activePartners > 0
  ) {
    pushIssue(issues, {
      level: "warn",
      code: "KPI_SPONSOR_REVENUE_ZERO",
      message: "Sponsors actifs mais revenus à zéro",
      value: {
        activePartners: kpis.sponsoring.activePartners,
        revenue: kpis.sponsoring.totalRevenue,
      },
    });
  }

  if (lastKpis) {
    const retentionDelta =
      kpis.sponsoring.sponsorRetentionRate - lastKpis.sponsoring.sponsorRetentionRate;
    if (
      retentionDelta > 0.05 &&
      state.sponsorPortfolio.length < state.baselines.sponsorCount
    ) {
      pushIssue(issues, {
        level: "warn",
        code: "KPI_RETENTION_INCREASE_WITH_LOSS",
        message:
          "Le taux de rétention augmente malgré une baisse du nombre de partenaires",
        value: {
          retentionDelta: retentionDelta,
          activePartners: kpis.sponsoring.activePartners,
          baseline: state.baselines.sponsorCount,
        },
      });
    }
  }

  if (issues.length > MAX_ISSUES) {
    return issues.slice(0, MAX_ISSUES - 1).concat({
      level: "warn",
      code: "KPI_SANITY_TRUNCATED",
      message: `Trop d'anomalies (${issues.length}). Seules les ${MAX_ISSUES} premières sont affichées.`,
    });
  }

  return issues;
}

function pushIssue(issues: SanityIssue[], issue: SanityIssue) {
  if (issues.length < MAX_ISSUES) {
    issues.push(issue);
  }
}

function collectNumericKpis(kpis: KPIsState): NumericEntry[] {
  const entries: NumericEntry[] = [];

  function collect(obj: unknown, basePath: string) {
    if (!obj || typeof obj !== "object") return;
    Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
      const newPath = basePath ? `${basePath}.${key}` : key;
      if (value !== null && typeof value === "object") {
        collect(value, newPath);
      } else if (typeof value === "number") {
        entries.push({ path: newPath, value });
      }
    });
  }

  collect(kpis, "");
  return entries;
}

function checkIndexBounds(
  issues: SanityIssue[],
  path: string,
  value: number,
  min: number,
  toleratedMax: number,
) {
  if (!Number.isFinite(value)) return;
  if (value < min || value > toleratedMax) {
    pushIssue(issues, {
      level: value > toleratedMax ? "error" : "warn",
      code: "KPI_INDEX_RANGE",
      message: `Indice ${path} hors bornes`,
      path,
      value: clamp(value, min, toleratedMax),
    });
  }
}


