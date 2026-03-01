"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import { DecisionsEditor } from "./_components/DecisionsEditor";
import { ScenesEditor } from "./_components/ScenesEditor";
import { PartnerSeedsEditor } from "./_components/PartnerSeedsEditor";
import {
  saveLocal,
  loadLocal,
  clearLocal,
} from "./storage/consoleStorage";
import {
  turnTemplates,
  TurnTemplate,
  ForcedEvent,
} from "@/modules/beyond-play/seeds/turnTemplates";
import {
  defaultWorldBible,
  GameState,
  JerseySize,
  PartnerState,
  SizeAllocation,
  WorldBible,
  TurnPackage,
  TurnHistoryEntry,
  KPIsState,
  rulesEngine,
  AppliedDecisions,
  EventSummary,
  JERSEY_SIZES,
  TurnPipelineResult,
} from "@/modules/beyond-play";
import {
  aiEngine,
  runTurnPipeline,
  appendHistory,
} from "@/modules/beyond-play";
import {
  createPricingFromBible,
  createEmptyKpis,
  createSizeAllocation,
  normalizeSizeAllocation,
} from "@/modules/beyond-play/game-state/utils";
import { calculateKpis } from "@/modules/beyond-play/rules-engine/kpi/calculateKpis";
import {
  runKpiSanityChecks,
  SanityIssue,
} from "@/modules/beyond-play/rules-engine/kpi/kpiSanity";
import {
  runStressTest,
  StressPreset,
  StressTestResult,
} from "@/modules/beyond-play/execution/stressTest";
import { demoWorldBible } from "@/modules/beyond-play/seeds/demo/demoWorldBible";
import { demoTurns, demoDecisions } from "@/modules/beyond-play/seeds/demo/demoDecisions";
import {
  getTour1PresetDecisions,
  Tour1PresetName,
} from "@/modules/beyond-play/execution/presets/tour1Presets";

type EditableTurn = TurnTemplate;

function deepClone<T>(value: T): T {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : (JSON.parse(JSON.stringify(value)) as T);
}

const cloneTurnsState = (source: TurnTemplate[]): EditableTurn[] =>
  deepClone(source);
const cloneWorldBibleState = (source: WorldBible): WorldBible => deepClone(source);
const cloneGameStateState = (source: GameState): GameState => deepClone(source);

function normalizeWorldBible(source: WorldBible): WorldBible {
  const cloned = cloneWorldBibleState(source);
  const defaultMerch = defaultWorldBible.merchandising;
  const sourceMerch = cloned.merchandising ?? defaultMerch;
  const normalizedDefaultMix = normalizeSizeAllocation(
    sourceMerch.jerseyDefaultSizeMix ?? defaultMerch.jerseyDefaultSizeMix,
    defaultMerch.jerseyDefaultSizeMix,
  );
  const normalizedDemandWeights = normalizeSizeAllocation(
    sourceMerch.jerseyDemandSizeWeights ?? defaultMerch.jerseyDemandSizeWeights,
    normalizedDefaultMix,
  );
  const surstockThresholdRaw = sourceMerch.jerseySizeSurstockThreshold;
  const surstockThreshold =
    typeof surstockThresholdRaw === "number"
      ? Math.min(Math.max(surstockThresholdRaw, 0), 1)
      : defaultMerch.jerseySizeSurstockThreshold;

  return {
    ...defaultWorldBible,
    ...cloned,
    demandModel: {
      ...defaultWorldBible.demandModel,
      ...cloned.demandModel,
    },
    jerseyUnitCostTable:
      cloned.jerseyUnitCostTable && cloned.jerseyUnitCostTable.length > 0
        ? cloned.jerseyUnitCostTable
        : defaultWorldBible.jerseyUnitCostTable,
    merchandising: {
      ...defaultMerch,
      ...sourceMerch,
      jerseyDefaultSizeMix: normalizedDefaultMix,
      jerseyDemandSizeWeights: normalizedDemandWeights,
      jerseySizeSurstockThreshold: surstockThreshold,
      jerseySizePenalty: {
        ...defaultMerch.jerseySizePenalty,
        ...(sourceMerch.jerseySizePenalty ?? {}),
      },
    },
    matchdayCosts: {
      ...defaultWorldBible.matchdayCosts,
      ...(cloned.matchdayCosts ?? {}),
      stadiumCostPerAttendee:
        typeof cloned.matchdayCosts?.stadiumCostPerAttendee === "number"
          ? Math.max(0, cloned.matchdayCosts.stadiumCostPerAttendee)
          : defaultWorldBible.matchdayCosts.stadiumCostPerAttendee,
      vipBoxFixedCostPerMatch:
        typeof cloned.matchdayCosts?.vipBoxFixedCostPerMatch === "number"
          ? Math.max(0, cloned.matchdayCosts.vipBoxFixedCostPerMatch)
          : defaultWorldBible.matchdayCosts.vipBoxFixedCostPerMatch,
      vipBoxCostAppliesWhen:
        cloned.matchdayCosts?.vipBoxCostAppliesWhen ??
        defaultWorldBible.matchdayCosts.vipBoxCostAppliesWhen,
    },
    vip: {
      ...defaultWorldBible.vip,
      ...(cloned.vip ?? {}),
      vipSeatCapacity:
        typeof cloned.vip?.vipSeatCapacity === "number"
          ? Math.max(0, Math.round(cloned.vip.vipSeatCapacity))
          : defaultWorldBible.vip.vipSeatCapacity,
      vipBoxCapacity:
        typeof cloned.vip?.vipBoxCapacity === "number"
          ? Math.max(0, Math.round(cloned.vip.vipBoxCapacity))
          : defaultWorldBible.vip.vipBoxCapacity,
      vipBoxMaxSoldPerMatch:
        typeof cloned.vip?.vipBoxMaxSoldPerMatch === "number"
          ? Math.max(0, Math.round(cloned.vip.vipBoxMaxSoldPerMatch))
          : defaultWorldBible.vip.vipBoxMaxSoldPerMatch,
      vipHospitalityFixedCostPerMatch:
        typeof cloned.vip?.vipHospitalityFixedCostPerMatch === "number"
          ? Math.max(0, cloned.vip.vipHospitalityFixedCostPerMatch)
          : defaultWorldBible.vip.vipHospitalityFixedCostPerMatch,
      defaultSeatPrice:
        typeof cloned.vip?.defaultSeatPrice === "number"
          ? Math.max(0, cloned.vip.defaultSeatPrice)
          : defaultWorldBible.vip.defaultSeatPrice,
      defaultBoxPackPrice:
        typeof cloned.vip?.defaultBoxPackPrice === "number"
          ? Math.max(0, cloned.vip.defaultBoxPackPrice)
          : defaultWorldBible.vip.defaultBoxPackPrice,
    },
  };
}

const TOUR1_BASELINE_STORAGE_KEY = "beyondfc_tour1_baseline_v1";

type CalibrationResult = {
  preset: Tour1PresetName;
  kpis: KPIsState;
  cash: number;
  fans: number;
  brand: number;
  createdAt: string;
};

type Tour1Baseline = {
  createdAt: string;
  worldBibleFingerprint: string;
  kpis: {
    fillRate: number;
    ticketRevenuePerMatch: number;
    jerseyUnitsSold: number;
    jerseyGrossMarginRate: number;
    cash: number;
    fansIndex: number;
    brandIndex: number;
  };
};

const TOUR1_PRESET_LABELS: Record<
  Tour1PresetName,
  { title: string; description: string }
> = {
  RUPTURE: {
    title: "Rupture",
    description: "Production minimale, prix agressifs → risque rupture & frustration.",
  },
  SURSTOCK: {
    title: "Surstock",
    description:
      "Production maximale, prix élevés → immobilisation de cash et pression supporters.",
  },
};

function simpleHash(serialised: string): number {
  let hash = 0;
  for (let idx = 0; idx < serialised.length; idx += 1) {
    hash = (hash * 31 + serialised.charCodeAt(idx)) >>> 0;
  }
  return hash;
}

function computeFingerprint(turns: TurnTemplate[], worldBible: WorldBible): string {
  const serialised = JSON.stringify({ turns, worldBible });
  return `${serialised.length}-${simpleHash(serialised)}`;
}

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("fr-FR", {
  style: "percent",
  maximumFractionDigits: 1,
});

const baselineDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeStyle: "short",
});

const sponsorCategoryLabels: Record<string, string> = {
  led: "LED",
  giantScreen: "Écran géant",
  hospitality: "Hospitalité",
  jersey: "Maillot",
  digital: "Digital",
  backdrop: "Backdrop",
};

const BASE_TABS = ["tours", "world", "performance", "preview"] as const;
type BaseTab = (typeof BASE_TABS)[number];
type TabKey = BaseTab | "diagnostics";
const TAB_VALUES_WITH_DIAGNOSTICS = [
  "tours",
  "world",
  "performance",
  "preview",
  "diagnostics",
] as const;

const TAB_LABELS: Record<TabKey, string> = {
  tours: "Tours & scénarios",
  world: "WorldBible & Prix N-1",
  performance: "Performance",
  preview: "IA Preview",
  diagnostics: "Diagnostics",
};

const STRESS_PRESET_OPTIONS: Array<{
  value: StressPreset;
  label: string;
  description: string;
}> = [
  {
    value: "LOW_PRICES",
    label: "Prix bas",
    description: "Tous les sliders prix au minimum, politiques tarifaires favorables.",
  },
  {
    value: "HIGH_PRICES",
    label: "Prix élevés",
    description: "Sliders prix au maximum pour tester la sensibilité fans/marché.",
  },
  {
    value: "MAX_MARKETING",
    label: "Max marketing",
    description: "Budgets marketing et activations poussés au maximum.",
  },
  {
    value: "MIN_MARKETING",
    label: "Min marketing",
    description: "Budgets marketing et activations réduits au minimum.",
  },
  {
    value: "AGGRESSIVE_SPONSOR_PRICING",
    label: "Sponsors agressifs",
    description: "Tarifs packs sponsors au plafond pour tester la rétention.",
  },
];

type QuickStartSummary = {
  errors: number;
  warnings: number;
  issues: SanityIssue[];
  status: "PASS" | "FAIL";
};

function formatCurrency(value: number): string {
  return currencyFormatter.format(Math.round(value));
}

function formatNumber(value: number): string {
  return numberFormatter.format(Math.round(value));
}

function formatPercent(value: number): string {
  return percentFormatter.format(clampZeroOne(value));
}

function formatPercentUnbounded(value: number): string {
  const sign = value >= 0 ? "" : "-";
  return `${sign}${Math.abs(value * 100).toFixed(1)} %`;
}

function formatPercentPoints(value: number): string {
  const points = (value * 100).toFixed(1);
  const sign = value > 0 ? "+" : "";
  return `${sign}${points} pts`;
}

function formatPointsDelta(delta: number): string {
  if (!delta) return "0 pts";
  const sign = delta > 0 ? "+" : "";
  return `${sign}${Math.round(delta)} pts`;
}

function formatDelta(
  current: number,
  previous: number | undefined,
  type: "currency" | "number" | "percent" | "points",
): string {
  if (previous === undefined) {
    return "—";
  }
  const delta = current - previous;
  if (Math.abs(delta) < 1e-6) {
    return "0";
  }
  const sign = delta > 0 ? "+" : "";
  switch (type) {
    case "currency":
      return `${sign}${formatCurrency(delta)}`;
    case "percent":
      return `${sign}${percentFormatter.format(delta)}`;
    case "points":
      return formatPercentPoints(delta);
    case "number":
    default:
      return `${sign}${formatNumber(delta)}`;
  }
}

function clampZeroOne(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

const initialPartners: PartnerState[] = [
  {
    id: "P_LED_MAIN",
    name: "NeoVision",
    category: "led",
    contractValueCurrent: 20000,
    satisfaction: 68,
    loyalty: 55,
    churnRisk: 30,
    notes: [],
  },
  {
    id: "P_SCREEN",
    name: "CityMedia",
    category: "jumbo",
    contractValueCurrent: 10000,
    satisfaction: 62,
    loyalty: 60,
    churnRisk: 25,
    notes: [],
  },
  {
    id: "P_HOSP",
    name: "LuxeHabitat",
    category: "boxes",
    contractValueCurrent: 15000,
    satisfaction: 70,
    loyalty: 66,
    churnRisk: 18,
    notes: [],
  },
];

const forcedEventTypeMap: Record<ForcedEvent["type"], EventSummary["type"]> = {
  MATCH_RESULT_NEWS: "match_result",
  SOCIAL_BACKLASH: "social_backlash",
  SPONSOR_COMPLAINT: "sponsorship",
  HOSPITALITY_INCIDENT: "hospitality_incident",
  GOOD_NEWS: "good_news",
};

const forcedEventSeverityMap: Record<ForcedEvent["severity"], "low" | "medium" | "high"> = {
  1: "low",
  2: "medium",
  3: "high",
};

function buildInitialPartners(): PartnerState[] {
  return deepClone(initialPartners);
}

function buildInitialGameState(bible: WorldBible): GameState {
  const pricing = createPricingFromBible(bible);
  const baseState: GameState = {
    turn: 0,
    cash: 250000,
    fansMood: 58,
    brandAwareness: 54,
    sponsorPortfolio: buildInitialPartners(),
    pendingIncidents: [],
    pricing,
    kpis: createEmptyKpis(),
    lastTurnKpis: undefined,
    merchandising: {
      jerseyStockInitial: 0,
      jerseyStockRemaining: 0,
      jerseyStockBySizeInitial: createSizeAllocation(0),
      jerseyStockBySizeRemaining: createSizeAllocation(0),
      jerseyUnitsSoldBySize: createSizeAllocation(0),
      jerseyInventoryValue: 0,
      jerseyRupture: false,
      jerseySurstock: false,
      jerseyRuptureSizes: [],
      jerseySurstockSizes: [],
    },
    baselines: {
      sponsorCount: initialPartners.length,
    },
  };

  const kpis = calculateKpis({
    state: baseState,
    worldBible: bible,
    decisionsApplied: { sliders: {}, choices: {} },
  });

  baseState.kpis = {
    ...kpis,
    transverse: {
      ...kpis.transverse,
      cash: baseState.cash,
      brandIndex: baseState.brandAwareness,
      fansIndex: baseState.fansMood,
      cashDeltaThisTurn: 0,
      brandDeltaThisTurn: 0,
      fansDeltaThisTurn: 0,
    },
  };

  return baseState;
}

function buildCalibrationTurnPackage(template: TurnTemplate): TurnPackage {
  const context =
    template.fixedContext.lastWeekHook ??
    template.fixedContext.seasonRecap ??
    template.learningGoal;

  const events: EventSummary[] = template.forcedEvents.slice(0, 2).map((event, idx) => ({
    id: `calibration-${template.turnNumber}-${idx}`,
    type: forcedEventTypeMap[event.type] ?? "good_news",
    severity: forcedEventSeverityMap[event.severity] ?? "medium",
    summary: event.seed,
    partnerInvolved: template.partnerSeeds[0]?.partnerId,
  }));

  return {
    turnNumber: template.turnNumber,
    title: template.title,
    learningGoal: template.learningGoal,
    contextNarrative: context,
    events,
    decisions: {
      sliders: template.requiredDecisions.sliders.map((slider) => ({ ...slider })),
      choices: template.requiredDecisions.choices.map((choice) => ({ ...choice })),
    },
    scenes: [],
  };
}

const showcaseState: GameState = buildInitialGameState(defaultWorldBible);

function BeyondPlayExecutiveWorkbenchContent() {
  const searchParams = useSearchParams();
  const diagnosticsEnabled = process.env.NODE_ENV !== "production";

  const tabValues: readonly TabKey[] = diagnosticsEnabled
    ? TAB_VALUES_WITH_DIAGNOSTICS
    : BASE_TABS;

  const [activeTab, setActiveTab] = useState<TabKey>(tabValues[0]);
  const [demoMode, setDemoMode] = useState(false);
  const [demoInitialized, setDemoInitialized] = useState(false);
  const [turns, setTurns] = useState<EditableTurn[]>(() =>
    cloneTurnsState(turnTemplates),
  );
  const [selectedTurnId, setSelectedTurnId] = useState<number>(
    turnTemplates[0]?.turnNumber ?? 1,
  );
  const [worldBible, setWorldBible] = useState<WorldBible>(() =>
    cloneWorldBibleState(defaultWorldBible),
  );
  const [previewPackage, setPreviewPackage] = useState<TurnPackage | null>(null);
  const [previewState, setPreviewState] =
    useState<GameState>(() => cloneGameStateState(showcaseState));
  const [previewResult, setPreviewResult] = useState<TurnPipelineResult | null>(null);
  const [schemaErrors, setSchemaErrors] = useState<
    ReturnType<typeof aiEngine.validateSchema>
  >([]);
  const [history, setHistory] = useState<TurnHistoryEntry[]>([]);
  const [lastSavedFingerprint, setLastSavedFingerprint] = useState<string | null>(null);
  const [sanityIssues, setSanityIssues] = useState<SanityIssue[]>([]);
  const [sanityRunning, setSanityRunning] = useState(false);
  const [stressPresets, setStressPresets] = useState<StressPreset[]>([]);
  const [stressResult, setStressResult] = useState<StressTestResult | null>(null);
  const [stressRunning, setStressRunning] = useState(false);
  const [quickStartRunning, setQuickStartRunning] = useState(false);
  const [quickStartSummary, setQuickStartSummary] = useState<QuickStartSummary | null>(null);
  const [calibrationRuns, setCalibrationRuns] = useState<
    Record<Tour1PresetName, CalibrationResult | null>
  >({
    RUPTURE: null,
    SURSTOCK: null,
  });
  const [calibrationRunningPreset, setCalibrationRunningPreset] = useState<
    Tour1PresetName | null
  >(null);
  const [lastCalibrationResult, setLastCalibrationResult] = useState<CalibrationResult | null>(
    null,
  );
  const [tour1Baseline, setTour1Baseline] = useState<Tour1Baseline | null>(null);

  const selectedTurn = useMemo(
    () => turns.find((turn) => turn.turnNumber === selectedTurnId),
    [turns, selectedTurnId],
  );

  useEffect(() => {
    const isDemo = searchParams?.get("demo") === "1";
    setDemoMode(isDemo);
  }, [searchParams]);

  useEffect(() => {
    if (demoMode) {
      if (!demoInitialized) {
        setDemoInitialized(true);
        setTurns(cloneTurnsState(demoTurns));
        setWorldBible(normalizeWorldBible(demoWorldBible));
        setLastSavedFingerprint("demo");
      }
      return;
    }

    if (demoInitialized) {
      setDemoInitialized(false);
      setTurns(cloneTurnsState(turnTemplates));
      setWorldBible(cloneWorldBibleState(defaultWorldBible));
      setLastSavedFingerprint(computeFingerprint(turnTemplates, defaultWorldBible));
    }
  }, [demoMode, demoInitialized]);

  useEffect(() => {
    generatePreview();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const raw = window.localStorage.getItem(TOUR1_BASELINE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Tour1Baseline;
        setTour1Baseline(parsed);
      }
    } catch (error) {
      console.error("[BeyondFC][calibration] load baseline failed", error);
    }
  }, []);

  useEffect(() => {
    if (demoMode) {
      setLastSavedFingerprint("demo");
      return;
    }
    const snapshot = loadLocal<{
      turns: EditableTurn[];
      worldBible: WorldBible;
    } | null>(null);
    if (snapshot) {
      const clonedWorld = normalizeWorldBible(snapshot.worldBible);
      const baseState = buildInitialGameState(clonedWorld);

      setTurns(cloneTurnsState(snapshot.turns));
      setWorldBible(clonedWorld);
      setSelectedTurnId(
        snapshot.turns[0]?.turnNumber ?? (turnTemplates[0]?.turnNumber ?? 1),
      );
      setLastSavedFingerprint(computeFingerprint(snapshot.turns, clonedWorld));
      toast.info("Sauvegarde locale chargée au démarrage");
    } else {
      setLastSavedFingerprint(computeFingerprint(turnTemplates, defaultWorldBible));
    }
  }, [demoMode]);

  useEffect(() => {
    if (demoMode) {
      if (!demoInitialized) {
        return;
      }
      const demoInitialState = buildInitialGameState(worldBible);
      const demoScenario = runStressTest({
        presets: [],
        turnsCount: demoTurns.length,
        seedTurns: demoTurns,
        worldBible,
        initialState: demoInitialState,
      });

      const lastEntry =
        demoScenario.entries?.[demoScenario.entries.length - 1] ?? null;

      if (lastEntry) {
        setPreviewState(cloneGameStateState(lastEntry.stateAfter));
        setPreviewPackage(lastEntry.package);
      } else {
        setPreviewState(cloneGameStateState(demoInitialState));
        setPreviewPackage(null);
      }
      setPreviewResult(null);

      setHistory(demoScenario.entries ?? []);
      setSchemaErrors([]);
      setSanityIssues(demoScenario.sanity ?? []);
      setStressResult(demoScenario);
      setStressPresets([]);
      return;
    }

    const baseState = buildInitialGameState(worldBible);
    setPreviewState(cloneGameStateState(baseState));
    setHistory([]);
    setPreviewPackage(null);
    setPreviewResult(null);
    setSchemaErrors([]);
  }, [worldBible, demoMode, demoInitialized]);

  useEffect(() => {
    if (!tabValues.includes(activeTab)) {
      setActiveTab(tabValues[0] as TabKey);
    }
  }, [tabValues, activeTab]);

  const updateTurn = (
    turnNumber: number,
    updater: (turn: TurnTemplate) => TurnTemplate,
  ) => {
    setTurns((current) =>
      current.map((turn) => {
        if (turn.turnNumber !== turnNumber) {
          return turn;
        }
        const base =
          typeof structuredClone === "function"
            ? structuredClone(turn)
            : (JSON.parse(JSON.stringify(turn)) as TurnTemplate);
        return updater(base);
      }),
    );
  };

  const handleTurnFieldChange = <K extends keyof EditableTurn>(
    turnNumber: number,
    field: K,
    value: EditableTurn[K],
  ) => {
    setTurns((current) =>
      current.map((turn) =>
        turn.turnNumber === turnNumber ? { ...turn, [field]: value } : turn,
      ),
    );
  };

  const handleContextChange = (
    turnNumber: number,
    key: string,
    value: string,
  ) => {
    setTurns((current) =>
      current.map((turn) =>
        turn.turnNumber === turnNumber
          ? {
              ...turn,
              fixedContext: {
                ...turn.fixedContext,
                [key]: value,
              },
            }
          : turn,
      ),
    );
  };

  const handleForcedEventChange = <K extends keyof ForcedEvent>(
    turnNumber: number,
    index: number,
    field: K,
    value: ForcedEvent[K],
  ) => {
    setTurns((current) =>
      current.map((turn) =>
        turn.turnNumber === turnNumber
          ? {
              ...turn,
              forcedEvents: turn.forcedEvents.map((event, idx) =>
                idx === index ? { ...event, [field]: value } : event,
              ),
            }
          : turn,
      ),
    );
  };

  const addNewTurn = () => {
    const nextNumber = Math.max(...turns.map((turn) => turn.turnNumber)) + 1;
    const newTurn: EditableTurn = {
      turnNumber: nextNumber,
      title: "Nouveau tour",
      learningGoal: "",
      fixedContext: {
        lastWeekHook: "",
        tone: "neutre",
      },
      n1Baselines: {},
      forcedEvents: [],
      requiredDecisions: { sliders: [], choices: [] },
      requiredScenes: [],
      partnerSeeds: [],
    };
    setTurns((current) => [...current, newTurn]);
    setSelectedTurnId(nextNumber);
    toast.success("Nouveau tour ajouté.");
  };

  const generatePreview = async () => {
    try {
      setPreviewResult(null);
      const turnPackage = await aiEngine.generateTurnPackage({
        gameState: previewState,
        worldBible,
        history,
        templateOverride: selectedTurnId,
      });
      setPreviewPackage(turnPackage);
      setSchemaErrors(aiEngine.validateSchema(turnPackage));
      toast.success("Prévisualisation générée");
    } catch (error) {
      console.error(error);
      setSchemaErrors([]);
      toast.error("Impossible de générer la prévisualisation");
    }
  };

  const simulateTurn = async () => {
    try {
      const appliedDecisions = { sliders: {}, choices: {} };
      const result = await runTurnPipeline(
        {
          gameState: previewState,
          worldBible,
          history,
          templateOverride: selectedTurnId,
        },
        appliedDecisions,
      );
      setPreviewPackage(result.turnPackage);
      setPreviewState(result.nextState);
      setPreviewResult(result);
      setSchemaErrors(aiEngine.validateSchema(result.turnPackage));
      setHistory((current) =>
        appendHistory(current, {
          turnNumber: result.turnPackage.turnNumber,
          package: result.turnPackage,
          appliedDecisions,
          stateAfter: result.nextState,
          result,
        }),
      );
      toast.success("Tour simulé (décisions par défaut)");
    } catch (error) {
      console.error(error);
      toast.error("Simulation impossible");
    }
  };

  const handleSaveLocal = () => {
    if (demoMode) {
      toast.info("Sauvegarde désactivée en mode démo");
      return;
    }
    saveLocal({ turns, worldBible });
    setLastSavedFingerprint(computeFingerprint(turns, worldBible));
    toast.success("Sauvegarde locale effectuée");
  };

  const handleLoadLocal = () => {
    if (demoMode) {
      toast.info("Chargement désactivé en mode démo");
      return;
    }
    const backup = loadLocal<{
      turns: EditableTurn[];
      worldBible: WorldBible;
    } | null>(null);
    if (!backup) {
      toast.info("Aucune sauvegarde locale trouvée");
      return;
    }

    const clonedTurns = cloneTurnsState(backup.turns);
    const clonedWorld = normalizeWorldBible(backup.worldBible);

    setTurns(clonedTurns);
    setSelectedTurnId(clonedTurns[0]?.turnNumber ?? (turnTemplates[0]?.turnNumber ?? 1));
    setWorldBible(clonedWorld);
    setHistory([]);
    setPreviewPackage(null);
    setPreviewResult(null);
    setSchemaErrors([]);
    setLastSavedFingerprint(computeFingerprint(clonedTurns, clonedWorld));
    toast.success("Sauvegarde locale chargée");
  };

  const handleResetLocal = () => {
    if (demoMode) {
      toast.info("Réinitialisation indisponible en mode démo");
      return;
    }
    clearLocal();
    const resetTurns = cloneTurnsState(turnTemplates);
    const resetWorld = cloneWorldBibleState(defaultWorldBible);

    setTurns(resetTurns);
    setSelectedTurnId(resetTurns[0]?.turnNumber ?? (turnTemplates[0]?.turnNumber ?? 1));
    setWorldBible(resetWorld);
    setHistory([]);
    setPreviewPackage(null);
    setPreviewResult(null);
    setSchemaErrors([]);
    setLastSavedFingerprint(computeFingerprint(resetTurns, resetWorld));
    toast.success("Console réinitialisée");
  };

  const handleResetDemandModel = () => {
    setWorldBible((current) => ({
      ...current,
      demandModel: { ...defaultWorldBible.demandModel },
      limits: {
        ...current.limits,
        attendanceDeltaPerTurn: defaultWorldBible.limits.attendanceDeltaPerTurn,
        jerseyUnitsDeltaPerTurn: defaultWorldBible.limits.jerseyUnitsDeltaPerTurn,
      },
    }));
    toast.success("Coefficients du demand model réinitialisés");
  };

  const handleRunSanityCheck = () => {
    setSanityRunning(true);
    try {
      const issues = runKpiSanityChecks({
        state: previewState,
        worldBible,
        kpis: previewState.kpis,
        lastKpis: previewState.lastTurnKpis,
      });
      setSanityIssues(issues);
      toast.success(
        issues.length === 0
          ? "Aucune anomalie détectée"
          : `${issues.length} anomalie${issues.length > 1 ? "s" : ""} détectée(s)`,
      );
    } catch (error) {
      console.error("[BeyondFC][sanity] run error", error);
      toast.error("Impossible d'exécuter les sanity checks");
    } finally {
      setSanityRunning(false);
    }
  };

  const handlePresetToggle = (preset: StressPreset, checked: boolean | "indeterminate") => {
    setStressPresets((current) => {
      const isChecked = checked === true;
      if (isChecked) {
        if (current.includes(preset)) {
          return current;
        }
        return [...current, preset];
      }
      return current.filter((value) => value !== preset);
    });
  };

  const handleRunStress = () => {
    setStressRunning(true);
    try {
      const presetsToUse: StressPreset[] =
        stressPresets.length > 0 ? stressPresets : ["LOW_PRICES", "HIGH_PRICES"];
      const result = runStressTest({
        presets: presetsToUse,
        turnsCount: 10,
        seedTurns: turns,
        worldBible,
        initialState: cloneGameStateState(previewState),
      });
      setStressResult(result);
      const errorCount = result.sanity.filter((issue) => issue.level === "error").length;
      const warnCount = result.sanity.filter((issue) => issue.level === "warn").length;
      toast.success(
        `Stress test terminé · ${errorCount} erreur(s), ${warnCount} avertissement(s)`,
      );
    } catch (error) {
      console.error("[BeyondFC][stressTest] run error", error);
      toast.error("Impossible de lancer le stress test");
    } finally {
      setStressRunning(false);
    }
  };

  const handleRunTour1Preset = async (preset: Tour1PresetName) => {
    const template = turnTemplates.find((turn) => turn.turnNumber === 1);
    if (!template) {
      toast.error("Template Tour 1 introuvable.");
      return;
    }

    setCalibrationRunningPreset(preset);
    try {
      const baseState = buildInitialGameState(worldBible);
      const presetDecisions = getTour1PresetDecisions(preset);

      const applied: AppliedDecisions = { sliders: {}, choices: {} };

      template.requiredDecisions.sliders.forEach((slider) => {
        const rawValue = presetDecisions[slider.id];
        const fallback =
          typeof slider.defaultValue === "number" ? slider.defaultValue : slider.min;
        const numeric = typeof rawValue === "number" ? rawValue : fallback;
        const bounded = Math.max(slider.min, Math.min(slider.max, numeric));
        applied.sliders[slider.id] = bounded;
      });

      template.requiredDecisions.choices.forEach((choice) => {
        const rawValue = presetDecisions[choice.id];
        const fallback = choice.options[0]?.id ?? "";
        const picked = typeof rawValue === "string" ? rawValue : fallback;
        applied.choices[choice.id] = picked;
      });

      const turnPackage = buildCalibrationTurnPackage(template);
      const nextState = rulesEngine.applyTurn(
        baseState,
        worldBible,
        template,
        turnPackage,
        applied,
      );

      const storedKpis = deepClone(nextState.kpis);
      const result: CalibrationResult = {
        preset,
        kpis: storedKpis,
        cash: nextState.cash,
        fans: nextState.fansMood,
        brand: nextState.brandAwareness,
        createdAt: new Date().toISOString(),
      };

      setCalibrationRuns((current) => ({
        ...current,
        [preset]: result,
      }));
      setLastCalibrationResult(result);
      toast.success(
        preset === "RUPTURE"
          ? "Preset Rupture exécuté"
          : "Preset Surstock exécuté",
      );
    } catch (error) {
      console.error("[BeyondFC][calibration] preset error", error);
      toast.error("Impossible d'exécuter le preset Tour 1");
    } finally {
      setCalibrationRunningPreset(null);
    }
  };

  const handleSaveTour1Baseline = () => {
    if (!lastCalibrationResult) {
      toast.info("Lance au moins un preset avant de sauvegarder une baseline.");
      return;
    }
    if (typeof window === "undefined") {
      return;
    }

    try {
      const baselinePayload: Tour1Baseline = {
        createdAt: new Date().toISOString(),
        worldBibleFingerprint: computeFingerprint(turns, worldBible),
        kpis: {
          fillRate: lastCalibrationResult.kpis.matchday.fillRate,
          ticketRevenuePerMatch:
            lastCalibrationResult.kpis.matchday.ticketRevenuePerMatch,
          jerseyUnitsSold: lastCalibrationResult.kpis.merchandising.jerseyUnitsSold,
          jerseyGrossMarginRate:
            lastCalibrationResult.kpis.merchandising.jerseyGrossMarginRate,
          cash: lastCalibrationResult.kpis.transverse.cash,
          fansIndex: lastCalibrationResult.kpis.transverse.fansIndex,
          brandIndex: lastCalibrationResult.kpis.transverse.brandIndex,
        },
      };

      window.localStorage.setItem(
        TOUR1_BASELINE_STORAGE_KEY,
        JSON.stringify(baselinePayload),
      );
      setTour1Baseline(baselinePayload);
      toast.success("Baseline Tour 1 sauvegardée");
    } catch (error) {
      console.error("[BeyondFC][calibration] save baseline failed", error);
      toast.error("Impossible de sauvegarder la baseline Tour 1");
    }
  };

  const handleLoadTour1Baseline = () => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const raw = window.localStorage.getItem(TOUR1_BASELINE_STORAGE_KEY);
      if (!raw) {
        toast.info("Aucune baseline Tour 1 sauvegardée.");
        return;
      }
      const parsed = JSON.parse(raw) as Tour1Baseline;
      setTour1Baseline(parsed);
      toast.success("Baseline Tour 1 chargée");
    } catch (error) {
      console.error("[BeyondFC][calibration] load baseline failed", error);
      toast.error("Impossible de charger la baseline Tour 1");
    }
  };

  const handleQuickStartTest = () => {
    if (quickStartRunning) {
      return;
    }
    setQuickStartRunning(true);
    setQuickStartSummary(null);
    try {
      const sanity = runKpiSanityChecks({
        state: previewState,
        worldBible,
        kpis: previewState.kpis,
        lastKpis: previewState.lastTurnKpis,
      });

      const stress = runStressTest({
        presets: ["LOW_PRICES", "HIGH_PRICES"],
        turnsCount: 10,
        seedTurns: turns,
        worldBible,
        initialState: cloneGameStateState(previewState),
      });

      setSanityIssues(sanity);
      setStressResult(stress);

      const combinedIssues = [...sanity, ...(stress.sanity ?? [])];
      const errorCount = combinedIssues.filter((issue) => issue.level === "error").length;
      const warnCount = combinedIssues.filter((issue) => issue.level === "warn").length;
      const topIssues = combinedIssues.slice(0, 5);
      const status: "PASS" | "FAIL" = errorCount > 0 ? "FAIL" : "PASS";

      setQuickStartSummary({
        errors: errorCount,
        warnings: warnCount,
        issues: topIssues,
        status,
      });

      if (status === "PASS") {
        toast.success("Quick Start Test réussi");
      } else {
        toast.error(`Quick Start Test détecte ${errorCount} erreur(s)`);
      }
    } catch (error) {
      console.error("[BeyondFC][quickStart] run error", error);
      toast.error("Quick Start Test impossible");
    } finally {
      setQuickStartRunning(false);
    }
  };

  const currentFingerprint = computeFingerprint(turns, worldBible);
  const hasUnsavedChanges =
    demoMode ? false : lastSavedFingerprint !== null && currentFingerprint !== lastSavedFingerprint;

  const baselineMismatch =
    tour1Baseline !== null && tour1Baseline.worldBibleFingerprint !== currentFingerprint;

  const calibrationPresetOrder: Tour1PresetName[] = ["RUPTURE", "SURSTOCK"];

  type CalibrationMetricConfig = {
    key: string;
    label: string;
    getValue: (kpis: KPIsState) => number;
    format: (value: number) => string;
    deltaType: "currency" | "number" | "percent" | "points";
  };

  const calibrationMetricConfig: CalibrationMetricConfig[] = [
    {
      key: "fillRate",
      label: "Taux de remplissage",
      getValue: (kpis) => kpis.matchday.fillRate,
      format: (value) => formatPercent(value),
      deltaType: "percent",
    },
    {
      key: "ticketRevenuePerMatch",
      label: "CA billetterie / match",
      getValue: (kpis) => kpis.matchday.ticketRevenuePerMatch,
      format: (value) => formatCurrency(value),
      deltaType: "currency",
    },
    {
      key: "jerseyUnitsSold",
      label: "Maillots vendus",
      getValue: (kpis) => kpis.merchandising.jerseyUnitsSold,
      format: (value) => formatNumber(value),
      deltaType: "number",
    },
    {
      key: "jerseyGrossMarginRate",
      label: "Taux de marge maillot",
      getValue: (kpis) => kpis.merchandising.jerseyGrossMarginRate,
      format: (value) => formatPercentUnbounded(value),
      deltaType: "points",
    },
  ];

  const baselineMetricValues: Record<string, number | undefined> = tour1Baseline
    ? {
        fillRate: tour1Baseline.kpis.fillRate,
        ticketRevenuePerMatch: tour1Baseline.kpis.ticketRevenuePerMatch,
        jerseyUnitsSold: tour1Baseline.kpis.jerseyUnitsSold,
        jerseyGrossMarginRate: tour1Baseline.kpis.jerseyGrossMarginRate,
      }
    : {};

  const currentKpis = previewState.kpis;
  const previousKpis = previewState.lastTurnKpis;

  const fillRateCurrent = clampZeroOne(currentKpis.matchday.fillRate);
  const fillRatePrevious = previousKpis
    ? clampZeroOne(previousKpis.matchday.fillRate)
    : undefined;
  const fillRateDeltaLabel =
    previousKpis && fillRatePrevious !== undefined
      ? formatPercentPoints(fillRateCurrent - fillRatePrevious)
      : "—";

  const cashDeltaLabel = previousKpis
    ? formatDelta(
        currentKpis.transverse.cash,
        previousKpis.transverse.cash,
        "currency",
      )
    : "—";

  const ticketDeltaLabel = previousKpis
    ? formatDelta(
        currentKpis.matchday.ticketRevenuePerMatch,
        previousKpis.matchday.ticketRevenuePerMatch,
        "currency",
      )
    : "—";

  const sponsorDeltaRaw = previousKpis
    ? formatDelta(
        currentKpis.sponsoring.sponsorSatisfactionIndex,
        previousKpis.sponsoring.sponsorSatisfactionIndex,
        "number",
      )
    : "—";
  const sponsorDeltaLabel =
    sponsorDeltaRaw === "—" ? sponsorDeltaRaw : `${sponsorDeltaRaw} pts`;

  const attendanceDeltaLabel = previousKpis
    ? formatDelta(
        currentKpis.matchday.attendance,
        previousKpis.matchday.attendance,
        "number",
      )
    : "—";

  const avgRevenueDeltaLabel = previousKpis
    ? formatDelta(
        currentKpis.matchday.avgRevenuePerSpectator,
        previousKpis.matchday.avgRevenuePerSpectator,
        "currency",
      )
    : "—";

  const virageSubscribersDeltaLabel = previousKpis
    ? formatDelta(
        currentKpis.subscriptions.subscribersVirage,
        previousKpis.subscriptions.subscribersVirage,
        "number",
      )
    : "—";

  const centraleSubscribersDeltaLabel = previousKpis
    ? formatDelta(
        currentKpis.subscriptions.subscribersCentrale,
        previousKpis.subscriptions.subscribersCentrale,
        "number",
      )
    : "—";

  const subscriptionsRevenueDeltaLabel = previousKpis
    ? formatDelta(
        currentKpis.subscriptions.subscriptionsRevenue,
        previousKpis.subscriptions.subscriptionsRevenue,
        "currency",
      )
    : "—";

  const jerseyPriceDeltaLabel = previousKpis
    ? formatDelta(
        currentKpis.merchandising.jerseyPrice,
        previousKpis.merchandising.jerseyPrice,
        "currency",
      )
    : "—";

  const jerseyUnitsDeltaLabel = previousKpis
    ? formatDelta(
        currentKpis.merchandising.jerseyUnitsSold,
        previousKpis.merchandising.jerseyUnitsSold,
        "number",
      )
    : "—";

  const jerseyRevenueDeltaLabel = previousKpis
    ? formatDelta(
        currentKpis.merchandising.jerseyRevenue,
        previousKpis.merchandising.jerseyRevenue,
        "currency",
      )
    : "—";

  const jerseyMarginDeltaLabel = previousKpis
    ? formatDelta(
        currentKpis.merchandising.jerseyGrossMargin,
        previousKpis.merchandising.jerseyGrossMargin,
        "currency",
      )
    : "—";

  const jerseyMarginRateDeltaLabel = previousKpis
    ? formatPercentPoints(
        currentKpis.merchandising.jerseyGrossMarginRate -
          previousKpis.merchandising.jerseyGrossMarginRate,
      )
    : "—";

  const jerseyStockInitialDeltaLabel = previousKpis
    ? formatDelta(
        currentKpis.merchandising.jerseyStockInitial,
        previousKpis.merchandising.jerseyStockInitial,
        "number",
      )
    : "—";

  const jerseyStockRemainingDeltaLabel = previousKpis
    ? formatDelta(
        currentKpis.merchandising.jerseyStockRemaining,
        previousKpis.merchandising.jerseyStockRemaining,
        "number",
      )
    : "—";

  const jerseyInventoryValueDeltaLabel = previousKpis
    ? formatDelta(
        currentKpis.merchandising.jerseyInventoryValue,
        previousKpis.merchandising.jerseyInventoryValue,
        "currency",
      )
    : "—";

  const sponsorRevenueDeltaLabel = previousKpis
    ? formatDelta(
        currentKpis.sponsoring.totalRevenue,
        previousKpis.sponsoring.totalRevenue,
        "currency",
      )
    : "—";

  const activePartnersDeltaLabel = previousKpis
    ? formatDelta(
        currentKpis.sponsoring.activePartners,
        previousKpis.sponsoring.activePartners,
        "number",
      )
    : "—";

  const retentionDeltaLabel = previousKpis
    ? formatPercentPoints(
        currentKpis.sponsoring.sponsorRetentionRate -
          previousKpis.sponsoring.sponsorRetentionRate,
      )
    : "—";

  const churnDeltaRaw = previousKpis
    ? formatDelta(
        currentKpis.sponsoring.sponsorChurnRiskIndex,
        previousKpis.sponsoring.sponsorChurnRiskIndex,
        "number",
      )
    : "—";
  const churnDeltaLabel = churnDeltaRaw === "—" ? churnDeltaRaw : `${churnDeltaRaw} pts`;

  const matchdayStats = [
    {
      label: "Taux de remplissage",
      value: formatPercent(fillRateCurrent),
      delta: fillRateDeltaLabel,
    },
    {
      label: "Affluence",
      value: `${formatNumber(currentKpis.matchday.attendance)} spectateurs`,
      delta: attendanceDeltaLabel,
    },
    {
      label: "CA billetterie / match",
      value: formatCurrency(currentKpis.matchday.ticketRevenuePerMatch),
      delta: ticketDeltaLabel,
    },
    {
      label: "CA moyen / spectateur",
      value: formatCurrency(currentKpis.matchday.avgRevenuePerSpectator),
      delta: avgRevenueDeltaLabel,
    },
  ];

  const subscriptionsStats = [
    {
      label: "Abonnés Virage",
      value: formatNumber(currentKpis.subscriptions.subscribersVirage),
      delta: virageSubscribersDeltaLabel,
    },
    {
      label: "Abonnés Centrale",
      value: formatNumber(currentKpis.subscriptions.subscribersCentrale),
      delta: centraleSubscribersDeltaLabel,
    },
    {
      label: "CA abonnements",
      value: formatCurrency(currentKpis.subscriptions.subscriptionsRevenue),
      delta: subscriptionsRevenueDeltaLabel,
    },
  ];

  const merchandisingStats = [
    {
      label: "Stock initial",
      value: `${formatNumber(currentKpis.merchandising.jerseyStockInitial)} unités`,
      delta: jerseyStockInitialDeltaLabel,
    },
    {
      label: "Stock restant",
      value: `${formatNumber(currentKpis.merchandising.jerseyStockRemaining)} unités`,
      delta: jerseyStockRemainingDeltaLabel,
    },
    {
      label: "Valeur stock immobilisé",
      value: formatCurrency(currentKpis.merchandising.jerseyInventoryValue),
      delta: jerseyInventoryValueDeltaLabel,
    },
    {
      label: "Prix maillot",
      value: formatCurrency(currentKpis.merchandising.jerseyPrice),
      delta: jerseyPriceDeltaLabel,
    },
    {
      label: "Unités vendues",
      value: formatNumber(currentKpis.merchandising.jerseyUnitsSold),
      delta: jerseyUnitsDeltaLabel,
    },
    {
      label: "CA maillots",
      value: formatCurrency(currentKpis.merchandising.jerseyRevenue),
      delta: jerseyRevenueDeltaLabel,
    },
    {
      label: "Marge brute",
      value: formatCurrency(currentKpis.merchandising.jerseyGrossMargin),
      delta: jerseyMarginDeltaLabel,
    },
    {
      label: "Taux de marge",
      value: formatPercentUnbounded(currentKpis.merchandising.jerseyGrossMarginRate),
      delta: jerseyMarginRateDeltaLabel,
    },
  ];

  const ruptureSizesSet = new Set(
    currentKpis.merchandising.jerseyRuptureSizes ?? [],
  );
  const surstockSizesSet = new Set(
    currentKpis.merchandising.jerseySurstockSizes ?? [],
  );
  const merchandisingSizeRows = JERSEY_SIZES.map((size) => {
    const initial = currentKpis.merchandising.jerseyStockBySizeInitial[size] ?? 0;
    const sold = currentKpis.merchandising.jerseyUnitsSoldBySize[size] ?? 0;
    const remaining = currentKpis.merchandising.jerseyStockBySizeRemaining[size] ?? 0;
    const rupture = ruptureSizesSet.has(size);
    const surstock = surstockSizesSet.has(size);
    return {
      size,
      initial,
      sold,
      remaining,
      rupture,
      surstock,
    };
  });

  const sponsoringStats = [
    {
      label: "CA sponsoring total",
      value: formatCurrency(currentKpis.sponsoring.totalRevenue),
      delta: sponsorRevenueDeltaLabel,
    },
    {
      label: "Partenaires actifs",
      value: `${currentKpis.sponsoring.activePartners}/${currentKpis.sponsoring.totalPartnersBaseline}`,
      delta: activePartnersDeltaLabel,
    },
    {
      label: "Taux de rétention",
      value: formatPercent(clampZeroOne(currentKpis.sponsoring.sponsorRetentionRate)),
      delta: retentionDeltaLabel,
    },
    {
      label: "Satisfaction moyenne",
      value: `${Math.round(currentKpis.sponsoring.sponsorSatisfactionIndex)} / 100`,
      delta: sponsorDeltaLabel,
    },
    {
      label: "Risque de churn",
      value: `${Math.round(currentKpis.sponsoring.sponsorChurnRiskIndex)} / 100`,
      delta: churnDeltaLabel,
    },
  ];

  const kpiSummaryStats = [
    {
      label: "Taux de remplissage",
      value: formatPercent(fillRateCurrent),
      delta: fillRateDeltaLabel,
    },
    {
      label: "CA billetterie / match",
      value: formatCurrency(currentKpis.matchday.ticketRevenuePerMatch),
      delta: ticketDeltaLabel,
    },
    {
      label: "CA abonnements",
      value: formatCurrency(currentKpis.subscriptions.subscriptionsRevenue),
      delta: subscriptionsRevenueDeltaLabel,
    },
    {
      label: "CA merchandising",
      value: formatCurrency(currentKpis.merchandising.jerseyRevenue),
      delta: jerseyRevenueDeltaLabel,
    },
    {
      label: "Marge maillot",
      value: formatCurrency(currentKpis.merchandising.jerseyGrossMargin),
      delta: jerseyMarginDeltaLabel,
    },
    {
      label: "CA sponsoring total",
      value: formatCurrency(currentKpis.sponsoring.totalRevenue),
      delta: sponsorRevenueDeltaLabel,
    },
  ];

  const recentHistory = history.slice(0, 10);
  const stressErrorCount = stressResult
    ? stressResult.sanity.filter((issue) => issue.level === "error").length
    : 0;
  const stressWarnCount = stressResult
    ? stressResult.sanity.filter((issue) => issue.level === "warn").length
    : 0;
  const stressIssuesSorted = stressResult
    ? [...stressResult.sanity].sort((a, b) => {
        if (a.level === b.level) return 0;
        return a.level === "error" ? -1 : 1;
      })
    : [];

  const clampNotes: string[] = [];
  if (worldBible.limits.attendanceDeltaPerTurn > 0.3) {
    clampNotes.push(
      "Δ affluence par tour > 30 % : risque de pics irréalistes. Réduire la valeur.",
    );
  } else if (worldBible.limits.attendanceDeltaPerTurn < 0.05) {
    clampNotes.push(
      "Δ affluence par tour < 5 % : les décisions auront peu d'impact sur le remplissage.",
    );
  }
  if (worldBible.limits.jerseyUnitsDeltaPerTurn > 0.45) {
    clampNotes.push(
      "Δ ventes maillots par tour > 45 % : attention aux volumes incohérents.",
    );
  }


  const hudMetrics = [
    {
      id: "cash",
      label: "Trésorerie",
      value: formatCurrency(currentKpis.transverse.cash),
      delta: cashDeltaLabel,
    },
    {
      id: "fillRate",
      label: "Taux de remplissage",
      value: formatPercent(fillRateCurrent),
      delta: fillRateDeltaLabel,
    },
    {
      id: "ticketRevenue",
      label: "CA billetterie / match",
      value: formatCurrency(currentKpis.matchday.ticketRevenuePerMatch),
      delta: ticketDeltaLabel,
    },
    {
      id: "sponsorSatisfaction",
      label: "Satisfaction sponsors",
      value: `${Math.round(currentKpis.sponsoring.sponsorSatisfactionIndex)} / 100`,
      delta: sponsorDeltaLabel,
    },
  ];

  const tabsListClass = diagnosticsEnabled
    ? "grid w-full grid-cols-5 rounded-2xl bg-black/30 p-1"
    : "grid w-full grid-cols-4 rounded-2xl bg-black/30 p-1";

  const demoDecisionHighlights = useMemo(() => {
    if (!demoMode) {
      return [];
    }
    return demoDecisions.slice(0, 3).map((decision) => ({
      turn: decision.turnNumber,
      sliders: Object.keys(decision.sliders).length,
      choices: Object.keys(decision.choices).length,
    }));
  }, [demoMode]);

  return (
    <div className="space-y-6 p-8 text-white">
      <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-8 shadow-[0_60px_160px_-80px_rgba(0,0,0,0.75)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold">Beyond FC · Console Super Admin</h1>
            {demoMode && (
              <Badge className="border border-cyan-400/70 bg-cyan-500/10 text-cyan-100">
                Mode démo
              </Badge>
            )}
          </div>
          <Badge
            variant="outline"
            className={`border ${
              hasUnsavedChanges
                ? "border-amber-400/80 bg-amber-500/10 text-amber-200"
                : "border-emerald-400/80 bg-emerald-500/10 text-emerald-200"
            }`}
          >
            {hasUnsavedChanges ? "Non sauvegardé" : "Sauvegardé"}
          </Badge>
        </div>
        <p className="mt-3 max-w-3xl text-sm text-white/70">
          Configure les 10 tours, ajuste le WorldBible (prix N-1, contraintes) et prévisualise le
          TurnPackage généré par l’IA avant chaque sprint pédagogique.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {hudMetrics.map((metric) => {
            const deltaClass =
              metric.delta === "—"
                ? "text-white/40"
                : metric.delta.startsWith("+")
                ? "text-emerald-300"
                : metric.delta.startsWith("-")
                ? "text-rose-300"
                : "text-white/50";
            return (
              <div
                key={metric.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-white/5"
              >
                <p className="text-xs uppercase tracking-wide text-white/50">{metric.label}</p>
                <p className="mt-1 text-2xl font-semibold text-white">{metric.value}</p>
                <p className={`mt-2 text-xs font-medium ${deltaClass}`}>
                  Δ {metric.delta}
                </p>
              </div>
            );
          })}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={addNewTurn} variant="secondary">
            Ajouter un tour
          </Button>
          <Button onClick={generatePreview} variant="outline">
            Générer le TurnPackage
          </Button>
          <Button onClick={simulateTurn} className="bg-blue-600 hover:bg-blue-700">
            Simuler le tour par défaut
          </Button>
          <Button onClick={handleSaveLocal} variant="outline" disabled={demoMode}>
            Save local
          </Button>
          <Button onClick={handleLoadLocal} variant="outline" disabled={demoMode}>
            Load local
          </Button>
          <Button
            onClick={handleResetLocal}
            variant="ghost"
            className="text-red-300 hover:text-red-200"
            disabled={demoMode}
          >
            Reset local
          </Button>
        </div>
        {demoMode && (
          <p className="mt-3 text-xs text-cyan-200/80">
            Mode démonstration actif : les sauvegardes locales sont désactivées. Pour repasser en
            mode édition, retire le paramètre <code className="rounded bg-white/10 px-1">?demo=1</code>{" "}
            de l’URL.
          </p>
        )}
      </header>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabKey)}>
        <TabsList className={tabsListClass}>
          {tabValues.map((tab) => (
            <TabsTrigger key={tab} value={tab} className="text-sm">
              {TAB_LABELS[tab]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="tours" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <Card className="border-white/10 bg-black/40">
              <CardHeader>
                <CardTitle>Tours disponibles</CardTitle>
                <CardDescription>10 tours seedés + vos créations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {turns.map((turn) => (
                  <button
                    key={turn.turnNumber}
                    onClick={() => setSelectedTurnId(turn.turnNumber)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      selectedTurnId === turn.turnNumber
                        ? "border-blue-400 bg-blue-500/20"
                        : "border-white/10 bg-transparent hover:border-white/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">
                        Tour {turn.turnNumber}
                      </span>
                      <Badge variant="outline">{turn.title || "Sans titre"}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-white/60">
                      {turn.learningGoal || "Objectif à définir"}
                    </p>
                  </button>
                ))}
                <div className="h-px w-full bg-white/10" />
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Button onClick={handleQuickStartTest} disabled={quickStartRunning}>
                      {quickStartRunning ? "Quick Start..." : "Quick Start Test"}
                    </Button>
                    {quickStartSummary && (
                      <Badge
                        className={`border ${
                          quickStartSummary.status === "PASS"
                            ? "border-emerald-400/70 bg-emerald-500/15 text-emerald-100"
                            : "border-red-400/70 bg-red-500/15 text-red-100"
                        }`}
                      >
                        {quickStartSummary.status === "PASS" ? "PASS" : "FAIL"}
                      </Badge>
                    )}
                    {quickStartSummary && (
                      <span className="text-xs text-white/50">
                        {quickStartSummary.errors} erreur(s) · {quickStartSummary.warnings} avertissement(s)
                      </span>
                    )}
                  </div>
                  {quickStartSummary && quickStartSummary.issues.length > 0 && (
                    <div className="space-y-2 text-xs text-white/70">
                      <p className="font-medium text-white/80">
                        Top {quickStartSummary.issues.length} issues à surveiller :
                      </p>
                      <ul className="space-y-2">
                        {quickStartSummary.issues.map((issue, index) => {
                          const badgeClass =
                            issue.level === "error"
                              ? "border border-red-500/40 bg-red-500/15 text-red-200"
                              : "border border-amber-400/40 bg-amber-400/15 text-amber-100";
                          return (
                            <li
                              key={`quickstart-issue-${issue.code}-${index}`}
                              className="rounded-lg border border-white/10 bg-white/5 p-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <Badge className={badgeClass}>{issue.level.toUpperCase()}</Badge>
                                {issue.turnNumber !== undefined && (
                                  <span className="text-white/40">Tour {issue.turnNumber}</span>
                                )}
                              </div>
                              <p className="mt-1 font-semibold text-white">{issue.code}</p>
                              <p>{issue.message}</p>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-black/40">
              <CardHeader>
                <CardTitle>
                  {selectedTurn ? `Tour ${selectedTurn.turnNumber}` : "Sélectionnez un tour"}
                </CardTitle>
                <CardDescription>
                  Contexte, événements imposés, décisions et scènes pédagogiques.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedTurn ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Titre</Label>
                        <Input
                          value={selectedTurn.title}
                          onChange={(e) =>
                            handleTurnFieldChange(selectedTurn.turnNumber, "title", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>Objectif pédagogique</Label>
                        <Input
                          value={selectedTurn.learningGoal}
                          onChange={(e) =>
                            handleTurnFieldChange(
                              selectedTurn.turnNumber,
                              "learningGoal",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="md:col-span-3">
                        <Label>Season Recap</Label>
                        <Textarea
                          value={selectedTurn.fixedContext.seasonRecap ?? ""}
                          onChange={(e) =>
                            handleContextChange(
                              selectedTurn.turnNumber,
                              "seasonRecap",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Hook Semaine dernière</Label>
                        <Textarea
                          value={selectedTurn.fixedContext.lastWeekHook}
                          onChange={(e) =>
                            handleContextChange(
                              selectedTurn.turnNumber,
                              "lastWeekHook",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label>Tonalité</Label>
                        <Input
                          value={selectedTurn.fixedContext.tone}
                          onChange={(e) =>
                            handleContextChange(
                              selectedTurn.turnNumber,
                              "tone",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white">Événements imposés</h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleTurnFieldChange(selectedTurn.turnNumber, "forcedEvents", [
                              ...selectedTurn.forcedEvents,
                              { type: "GOOD_NEWS", severity: 1, seed: "" },
                            ])
                          }
                        >
                          Ajouter
                        </Button>
                      </div>
                      {selectedTurn.forcedEvents.length === 0 && (
                        <p className="text-xs text-white/50">Aucun événement imposé.</p>
                      )}
                      {selectedTurn.forcedEvents.map((event, index) => (
                        <div
                          key={index}
                          className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm space-y-3"
                        >
                          <div className="grid gap-3 md:grid-cols-3">
                            <div>
                              <Label>Type</Label>
                              <Input
                                value={event.type}
                                onChange={(e) =>
                                  handleForcedEventChange(
                                    selectedTurn.turnNumber,
                                    index,
                                    "type",
                                    e.target.value as ForcedEvent["type"],
                                  )
                                }
                              />
                            </div>
                            <div>
                              <Label>Sévérité (1-3)</Label>
                              <Input
                                type="number"
                                value={event.severity}
                                onChange={(e) =>
                                  handleForcedEventChange(
                                    selectedTurn.turnNumber,
                                    index,
                                    "severity",
                                    Number(e.target.value) as ForcedEvent["severity"],
                                  )
                                }
                              />
                            </div>
                            <div className="md:col-span-3">
                              <Label>Seed / narration</Label>
                              <Textarea
                                value={event.seed}
                                onChange={(e) =>
                                  handleForcedEventChange(
                                    selectedTurn.turnNumber,
                                    index,
                                    "seed",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <DecisionsEditor
                      turn={selectedTurn}
                      onUpdateTurn={(updater) =>
                        updateTurn(
                          selectedTurn.turnNumber,
                          updater as (turn: TurnTemplate) => TurnTemplate,
                        )
                      }
                    />

                    <ScenesEditor
                      turn={selectedTurn}
                      onUpdateTurn={(updater) =>
                        updateTurn(
                          selectedTurn.turnNumber,
                          updater as (turn: TurnTemplate) => TurnTemplate,
                        )
                      }
                    />

                    <PartnerSeedsEditor
                      turn={selectedTurn}
                      onUpdateTurn={(updater) =>
                        updateTurn(
                          selectedTurn.turnNumber,
                          updater as (turn: TurnTemplate) => TurnTemplate,
                        )
                      }
                    />
                  </>
                ) : (
                  <p className="text-sm text-white/60">
                    Sélectionne un tour dans la colonne de gauche pour le modifier.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="mt-6 space-y-6">
          {demoMode && (
            <Card className="border-cyan-400/20 bg-cyan-500/10">
              <CardHeader>
                <CardTitle className="text-cyan-100">Parcours guidé (mode démo)</CardTitle>
                <CardDescription className="text-cyan-200/80">
                  Les KPI affichés proviennent d’une simulation “idéale” sur 10 tours : utilise-les
                  comme référence pédagogique pour comparer tes propres tests.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-cyan-100/80">
                <ul className="list-disc space-y-2 pl-5">
                  <li>Observe la progression du remplissage et du cash tour après tour.</li>
                  <li>Compare les revenus billetterie/merchandising selon les décisions appliquées.</li>
                  <li>Passe dans l’onglet Diagnostics pour lancer un stress test et voir l’écart.</li>
                </ul>
                {demoDecisionHighlights.length > 0 && (
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4 text-xs text-cyan-100/80">
                    <p className="mb-2 font-semibold text-cyan-50">
                      Pré-réglages appliqués :
                    </p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {demoDecisionHighlights.map((highlight) => (
                        <div key={`demo-highlight-${highlight.turn}`} className="space-y-1">
                          <p className="text-cyan-50">Tour {highlight.turn}</p>
                          <p>Sliders : {highlight.sliders}</p>
                          <p>Choix : {highlight.choices}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="border-white/10 bg-black/40">
            <CardHeader>
              <CardTitle>Billetterie & Matchday</CardTitle>
              <CardDescription>
                Remplissage, revenus et expérience spectateur pour le tour en cours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {matchdayStats.map((stat) => (
                  <KpiStat
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                    delta={stat.delta}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-black/40">
            <CardHeader>
              <CardTitle>Abonnements</CardTitle>
              <CardDescription>
                Volume d’abonnés par zone et chiffre d’affaires généré.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {subscriptionsStats.map((stat) => (
                  <KpiStat
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                    delta={stat.delta}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-black/40">
            <CardHeader>
              <CardTitle>Merchandising</CardTitle>
              <CardDescription>
                Performance maillot : prix, volume et marge brute.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {merchandisingStats.map((stat) => (
                  <KpiStat
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                    delta={stat.delta}
                  />
                ))}
              </div>
              {(currentKpis.merchandising.jerseyRupture ||
                currentKpis.merchandising.jerseySurstock) && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {currentKpis.merchandising.jerseyRupture && (
                    <Badge className="border border-rose-400/40 bg-rose-500/15 text-rose-100">
                      Rupture
                    </Badge>
                  )}
                  {currentKpis.merchandising.jerseySurstock && (
                    <Badge className="border border-amber-400/40 bg-amber-500/15 text-amber-100">
                      Surstock
                    </Badge>
                  )}
                </div>
              )}
              <div className="mt-6 space-y-2">
                <p className="text-xs uppercase tracking-wide text-white/50">
                  Répartition par taille
                </p>
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full min-w-[560px] text-left text-xs text-white/70">
                    <thead className="bg-white/5 text-[11px] uppercase tracking-wide text-white/50">
                      <tr>
                        <th className="px-4 py-2 font-medium">Taille</th>
                        <th className="px-4 py-2 font-medium">Stock initial</th>
                        <th className="px-4 py-2 font-medium">Vendus</th>
                        <th className="px-4 py-2 font-medium">Restant</th>
                        <th className="px-4 py-2 font-medium">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {merchandisingSizeRows.map((row) => (
                        <tr key={`merch-size-${row.size}`} className="border-t border-white/5">
                          <td className="px-4 py-3 text-sm font-semibold text-white">{row.size}</td>
                          <td className="px-4 py-3">{formatNumber(row.initial)}</td>
                          <td className="px-4 py-3">{formatNumber(row.sold)}</td>
                          <td className="px-4 py-3">{formatNumber(row.remaining)}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              {row.rupture && (
                                <Badge className="border border-rose-400/40 bg-rose-500/15 text-rose-100">
                                  Rupture
                                </Badge>
                              )}
                              {row.surstock && (
                                <Badge className="border border-amber-400/40 bg-amber-500/15 text-amber-100">
                                  Surstock
                                </Badge>
                              )}
                              {!row.rupture && !row.surstock && (
                                <span className="text-white/40">—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-black/40">
            <CardHeader>
              <CardTitle>Sponsoring</CardTitle>
              <CardDescription>
                Portefeuille partenaires : revenus, satisfaction et rétention.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sponsoringStats.map((stat) => (
                  <KpiStat
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                    delta={stat.delta}
                  />
                ))}
              </div>
              <div>
                <p className="mb-3 text-xs uppercase tracking-wide text-white/50">
                  Répartition des revenus par catégorie
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {Object.entries(currentKpis.sponsoring.revenueByCategory).map(
                    ([key, value]) => {
                      const label = sponsorCategoryLabels[key] ?? key;
                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-sm text-white/70"
                        >
                          <span className="text-white/60">{label}</span>
                          <span className="font-medium text-white">
                            {formatCurrency(value)}
                          </span>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-black/40">
            <CardHeader>
              <CardTitle>Historique des tours</CardTitle>
              <CardDescription>
                Les 10 derniers tours simulés avec les KPI clés.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentHistory.length === 0 ? (
                <p className="text-sm text-white/60">
                  Lance une simulation pour alimenter l’historique.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentHistory.map((entry) => {
                    const entryKpis = entry.stateAfter.kpis;
                    return (
                      <div
                        key={`${entry.turnNumber}-${entry.package.title}`}
                        className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="border-white/20 text-white">
                              Tour {entry.turnNumber}
                            </Badge>
                            <span className="font-semibold text-white">
                              {entry.package.title}
                            </span>
                          </div>
                          <span className="text-white/60">
                            Remplissage {formatPercent(entryKpis.matchday.fillRate)}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-4 text-[13px] text-white/70">
                          <span>
                            CA billetterie: {formatCurrency(entryKpis.matchday.ticketRevenuePerMatch)}
                          </span>
                          <span>
                            CA merchandising: {formatCurrency(entryKpis.merchandising.jerseyRevenue)}
                          </span>
                          <span>
                            CA sponsoring: {formatCurrency(entryKpis.sponsoring.totalRevenue)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="world" className="mt-6">
          <Card className="border-white/10 bg-black/40">
            <CardHeader>
              <CardTitle>WorldBible & Prix N-1</CardTitle>
              <CardDescription>
                Base économique utilisée par l’IA et le RulesEngine. Ajuste les prix de référence,
                capacité et limites pour refléter tes scénarios.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-white">Billetterie (match)</h4>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <Label>Virage (€)</Label>
                      <Input
                        type="number"
                        value={worldBible.referencePrices.ticket.virage}
                        onChange={(e) =>
                          setWorldBible((current) => ({
                            ...current,
                            referencePrices: {
                              ...current.referencePrices,
                              ticket: {
                                ...current.referencePrices.ticket,
                                virage: Number(e.target.value),
                              },
                            },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Centrale (€)</Label>
                      <Input
                        type="number"
                        value={worldBible.referencePrices.ticket.centrale}
                        onChange={(e) =>
                          setWorldBible((current) => ({
                            ...current,
                            referencePrices: {
                              ...current.referencePrices,
                              ticket: {
                                ...current.referencePrices.ticket,
                                centrale: Number(e.target.value),
                              },
                            },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Hospitalité (€)</Label>
                      <Input
                        type="number"
                        value={worldBible.referencePrices.ticket.hospitality}
                        onChange={(e) =>
                          setWorldBible((current) => ({
                            ...current,
                            referencePrices: {
                              ...current.referencePrices,
                              ticket: {
                                ...current.referencePrices.ticket,
                                hospitality: Number(e.target.value),
                              },
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-white">Abonnements</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Virage (€)</Label>
                      <Input
                        type="number"
                        value={worldBible.referencePrices.subscription.virage}
                        onChange={(e) =>
                          setWorldBible((current) => ({
                            ...current,
                            referencePrices: {
                              ...current.referencePrices,
                              subscription: {
                                ...current.referencePrices.subscription,
                                virage: Number(e.target.value),
                              },
                            },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Centrale (€)</Label>
                      <Input
                        type="number"
                        value={worldBible.referencePrices.subscription.centrale}
                        onChange={(e) =>
                          setWorldBible((current) => ({
                            ...current,
                            referencePrices: {
                              ...current.referencePrices,
                              subscription: {
                                ...current.referencePrices.subscription,
                                centrale: Number(e.target.value),
                              },
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-white">Merchandising</h4>
                  <div>
                    <Label>Prix maillot (€)</Label>
                    <Input
                      type="number"
                      value={worldBible.referencePrices.jersey}
                      onChange={(e) =>
                        setWorldBible((current) => ({
                          ...current,
                          referencePrices: {
                            ...current.referencePrices,
                            jersey: Number(e.target.value),
                          },
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-white">Sponsoring</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {Object.entries(worldBible.referencePrices.sponsor).map(([key, value]) => (
                      <div key={key}>
                        <Label>{sponsorCategoryLabels[key] ?? key}</Label>
                        <Input
                          type="number"
                          value={value}
                          onChange={(e) =>
                            setWorldBible((current) => ({
                              ...current,
                              referencePrices: {
                                ...current.referencePrices,
                                sponsor: {
                                  ...current.referencePrices.sponsor,
                                  [key]: Number(e.target.value),
                                },
                              },
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-4">
                <div>
                  <Label>Capacité totale</Label>
                  <Input
                    type="number"
                    value={worldBible.stadium.capacityTotal}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setWorldBible((current) => ({
                        ...current,
                        stadium: {
                          ...current.stadium,
                          capacityTotal: value,
                          capacity: value,
                          segments: current.stadium.segments,
                        },
                      }));
                    }}
                  />
                </div>
                <div>
                  <Label>Capacité utilisée</Label>
                  <Input
                    type="number"
                    value={worldBible.stadium.capacity}
                    onChange={(e) =>
                      setWorldBible((current) => ({
                        ...current,
                        stadium: {
                          ...current.stadium,
                          capacity: Number(e.target.value),
                          segments: current.stadium.segments,
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Places Virage</Label>
                  <Input
                    type="number"
                    value={worldBible.stadium.segments.virage.seats}
                    onChange={(e) =>
                      setWorldBible((current) => ({
                        ...current,
                        stadium: {
                          ...current.stadium,
                          segments: {
                            ...current.stadium.segments,
                            virage: { seats: Number(e.target.value) },
                          },
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Places Centrale</Label>
                  <Input
                    type="number"
                    value={worldBible.stadium.segments.centrale.seats}
                    onChange={(e) =>
                      setWorldBible((current) => ({
                        ...current,
                        stadium: {
                          ...current.stadium,
                          segments: {
                            ...current.stadium.segments,
                            centrale: { seats: Number(e.target.value) },
                          },
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Places Hospitalité</Label>
                  <Input
                    type="number"
                    value={worldBible.stadium.segments.hospitality.seats}
                    onChange={(e) =>
                      setWorldBible((current) => ({
                        ...current,
                        stadium: {
                          ...current.stadium,
                          segments: {
                            ...current.stadium.segments,
                            hospitality: { seats: Number(e.target.value) },
                          },
                        },
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label>Variation prix max (%)</Label>
                  <Input
                    type="number"
                    step="0.05"
                    value={worldBible.limits.maxPriceVariationPct}
                    onChange={(e) =>
                      setWorldBible((current) => ({
                        ...current,
                        limits: {
                          ...current.limits,
                          maxPriceVariationPct: Number(e.target.value),
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Δ affluence max / tour</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={worldBible.limits.attendanceDeltaPerTurn}
                    onChange={(e) =>
                      setWorldBible((current) => ({
                        ...current,
                        limits: {
                          ...current.limits,
                          attendanceDeltaPerTurn: Number(e.target.value),
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Δ ventes maillot max / tour</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={worldBible.limits.jerseyUnitsDeltaPerTurn}
                    onChange={(e) =>
                      setWorldBible((current) => ({
                        ...current,
                        limits: {
                          ...current.limits,
                          jerseyUnitsDeltaPerTurn: Number(e.target.value),
                        },
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Cash minimum</Label>
                  <Input
                    type="number"
                    value={worldBible.limits.minCash}
                    onChange={(e) =>
                      setWorldBible((current) => ({
                        ...current,
                        limits: {
                          ...current.limits,
                          minCash: Number(e.target.value),
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Cash maximum</Label>
                  <Input
                    type="number"
                    value={worldBible.limits.maxCash}
                    onChange={(e) =>
                      setWorldBible((current) => ({
                        ...current,
                        limits: {
                          ...current.limits,
                          maxCash: Number(e.target.value),
                        },
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label>Taux d’affluence de base</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={worldBible.demandModel.baseAttendanceRate}
                    onChange={(e) =>
                      setWorldBible((current) => ({
                        ...current,
                        demandModel: {
                          ...current.demandModel,
                          baseAttendanceRate: Number(e.target.value),
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Demande maillots de base</Label>
                  <Input
                    type="number"
                    value={worldBible.demandModel.baseJerseyDemand}
                    onChange={(e) =>
                      setWorldBible((current) => ({
                        ...current,
                        demandModel: {
                          ...current.demandModel,
                          baseJerseyDemand: Number(e.target.value),
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Élasticité billetterie</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={worldBible.demandModel.ticketDemandElasticity}
                    onChange={(e) =>
                      setWorldBible((current) => ({
                        ...current,
                        demandModel: {
                          ...current.demandModel,
                          ticketDemandElasticity: Number(e.target.value),
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Élasticité merchandising</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={worldBible.demandModel.jerseyDemandElasticity}
                    onChange={(e) =>
                      setWorldBible((current) => ({
                        ...current,
                        demandModel: {
                          ...current.demandModel,
                          jerseyDemandElasticity: Number(e.target.value),
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Poids fans</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={
                      worldBible.demandModel.fansWeight ??
                      defaultWorldBible.demandModel.fansWeight
                    }
                    onChange={(e) =>
                      setWorldBible((current) => ({
                        ...current,
                        demandModel: {
                          ...current.demandModel,
                          fansWeight: Number(e.target.value),
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Poids marque</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={
                      worldBible.demandModel.brandWeight ??
                      defaultWorldBible.demandModel.brandWeight
                    }
                    onChange={(e) =>
                      setWorldBible((current) => ({
                        ...current,
                        demandModel: {
                          ...current.demandModel,
                          brandWeight: Number(e.target.value),
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Poids fans (matchday)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={
                      worldBible.demandModel.fansWeightMatchday ??
                      defaultWorldBible.demandModel.fansWeightMatchday
                    }
                    onChange={(e) =>
                      setWorldBible((current) => ({
                        ...current,
                        demandModel: {
                          ...current.demandModel,
                          fansWeightMatchday: Number(e.target.value),
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Poids marque (matchday)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={
                      worldBible.demandModel.brandWeightMatchday ??
                      defaultWorldBible.demandModel.brandWeightMatchday
                    }
                    onChange={(e) =>
                      setWorldBible((current) => ({
                        ...current,
                        demandModel: {
                          ...current.demandModel,
                          brandWeightMatchday: Number(e.target.value),
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Sensibilité prix</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={worldBible.demandModel.priceSensitivity}
                    onChange={(e) =>
                      setWorldBible((current) => ({
                        ...current,
                        demandModel: {
                          ...current.demandModel,
                          priceSensitivity: Number(e.target.value),
                        },
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">Mix production par défaut</p>
                      <p className="text-xs text-white/50">
                        Répartition cible des volumes produits par taille (somme ≈ 100&nbsp;%).
                      </p>
                    </div>
                    <span className="text-xs text-white/40">
                      Total : {(
                        JERSEY_SIZES.reduce(
                          (acc, size) =>
                            acc + (worldBible.merchandising.jerseyDefaultSizeMix[size] ?? 0),
                          0,
                        ) * 100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {JERSEY_SIZES.map((size) => {
                      const currentValue =
                        (worldBible.merchandising.jerseyDefaultSizeMix[size] ?? 0) * 100;
                      return (
                        <div key={`default-mix-${size}`}>
                          <Label>{size}</Label>
                          <Input
                            type="number"
                            step={0.5}
                            value={Number.isFinite(currentValue) ? Number(currentValue.toFixed(1)) : 0}
                            onChange={(e) => {
                              const nextValue = Number(e.target.value);
                              setWorldBible((existing) => {
                                const merch =
                                  existing.merchandising ?? defaultWorldBible.merchandising;
                                return {
                                  ...existing,
                                  merchandising: {
                                    ...merch,
                                    jerseyDefaultSizeMix: {
                                      ...merch.jerseyDefaultSizeMix,
                                      [size]: Number.isFinite(nextValue) ? nextValue / 100 : 0,
                                    },
                                  },
                                };
                              });
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">Pondération de la demande</p>
                      <p className="text-xs text-white/50">
                        Poids de la demande par taille (sert à projeter les ventes).
                      </p>
                    </div>
                    <span className="text-xs text-white/40">
                      Total : {(
                        JERSEY_SIZES.reduce(
                          (acc, size) =>
                            acc +
                            (worldBible.merchandising.jerseyDemandSizeWeights[size] ?? 0),
                          0,
                        ) * 100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {JERSEY_SIZES.map((size) => {
                      const currentValue =
                        (worldBible.merchandising.jerseyDemandSizeWeights[size] ?? 0) * 100;
                      return (
                        <div key={`demand-weight-${size}`}>
                          <Label>{size}</Label>
                          <Input
                            type="number"
                            step={0.5}
                            value={Number.isFinite(currentValue) ? Number(currentValue.toFixed(1)) : 0}
                            onChange={(e) => {
                              const nextValue = Number(e.target.value);
                              setWorldBible((existing) => {
                                const merch =
                                  existing.merchandising ?? defaultWorldBible.merchandising;
                                return {
                                  ...existing,
                                  merchandising: {
                                    ...merch,
                                    jerseyDemandSizeWeights: {
                                      ...merch.jerseyDemandSizeWeights,
                                      [size]: Number.isFinite(nextValue) ? nextValue / 100 : 0,
                                    },
                                  },
                                };
                              });
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label>Seuil surstock par taille (%)</Label>
                  <Input
                    type="number"
                    step={1}
                    value={Number(
                      ((worldBible.merchandising.jerseySizeSurstockThreshold ?? 0) * 100).toFixed(0),
                    )}
                    onChange={(e) => {
                      const nextValue = Number(e.target.value);
                      setWorldBible((existing) => {
                        const merch =
                          existing.merchandising ?? defaultWorldBible.merchandising;
                        return {
                          ...existing,
                          merchandising: {
                            ...merch,
                            jerseySizeSurstockThreshold: Number.isFinite(nextValue)
                              ? Math.max(0, Math.min(nextValue / 100, 1))
                              : merch.jerseySizeSurstockThreshold,
                          },
                        };
                      });
                    }}
                  />
                </div>
                <div>
                  <Label>Pénalité rupture / taille (fans)</Label>
                  <Input
                    type="number"
                    step={0.1}
                    value={Number(
                      worldBible.merchandising.jerseySizePenalty.ruptureFansPenaltyPerSize.toFixed(1),
                    )}
                    onChange={(e) => {
                      const nextValue = Number(e.target.value);
                      setWorldBible((existing) => {
                        const merch =
                          existing.merchandising ?? defaultWorldBible.merchandising;
                        return {
                          ...existing,
                          merchandising: {
                            ...merch,
                            jerseySizePenalty: {
                              ...merch.jerseySizePenalty,
                              ruptureFansPenaltyPerSize: Number.isFinite(nextValue)
                                ? nextValue
                                : merch.jerseySizePenalty.ruptureFansPenaltyPerSize,
                            },
                          },
                        };
                      });
                    }}
                  />
                </div>
                <div>
                  <Label>Pénalité rupture / taille (marque)</Label>
                  <Input
                    type="number"
                    step={0.1}
                    value={Number(
                      worldBible.merchandising.jerseySizePenalty.ruptureBrandPenaltyPerSize.toFixed(
                        2,
                      ),
                    )}
                    onChange={(e) => {
                      const nextValue = Number(e.target.value);
                      setWorldBible((existing) => {
                        const merch =
                          existing.merchandising ?? defaultWorldBible.merchandising;
                        return {
                          ...existing,
                          merchandising: {
                            ...merch,
                            jerseySizePenalty: {
                              ...merch.jerseySizePenalty,
                              ruptureBrandPenaltyPerSize: Number.isFinite(nextValue)
                                ? nextValue
                                : merch.jerseySizePenalty.ruptureBrandPenaltyPerSize,
                            },
                          },
                        };
                      });
                    }}
                  />
                </div>
                <div>
                  <Label>Pénalité max / tour (pts)</Label>
                  <Input
                    type="number"
                    step={0.5}
                    value={Number(
                      worldBible.merchandising.jerseySizePenalty.maxTotalPenaltyPerTurn.toFixed(1),
                    )}
                    onChange={(e) => {
                      const nextValue = Number(e.target.value);
                      setWorldBible((existing) => {
                        const merch =
                          existing.merchandising ?? defaultWorldBible.merchandising;
                        return {
                          ...existing,
                          merchandising: {
                            ...merch,
                            jerseySizePenalty: {
                              ...merch.jerseySizePenalty,
                              maxTotalPenaltyPerTurn: Number.isFinite(nextValue)
                                ? Math.max(0, nextValue)
                                : merch.jerseySizePenalty.maxTotalPenaltyPerTurn,
                            },
                          },
                        };
                      });
                    }}
                  />
                </div>
              </div>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle>Matchday — coûts opérationnels</CardTitle>
                  <CardDescription>
                    Ajuste les coûts fixes et variables associés à chaque match pour refléter ta réalité terrain.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <Label>Coût par spectateur (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={Number(
                        worldBible.matchdayCosts?.stadiumCostPerAttendee?.toFixed(2) ??
                          defaultWorldBible.matchdayCosts.stadiumCostPerAttendee,
                      )}
                      onChange={(e) =>
                        setWorldBible((current) => ({
                          ...current,
                          matchdayCosts: {
                            ...defaultWorldBible.matchdayCosts,
                            ...(current.matchdayCosts ?? {}),
                            stadiumCostPerAttendee: Number(e.target.value),
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Coût fixe loges VIP / match (€)</Label>
                    <Input
                      type="number"
                      step="1000"
                      value={
                        worldBible.matchdayCosts?.vipBoxFixedCostPerMatch ??
                        defaultWorldBible.matchdayCosts.vipBoxFixedCostPerMatch
                      }
                      onChange={(e) =>
                        setWorldBible((current) => ({
                          ...current,
                          matchdayCosts: {
                            ...defaultWorldBible.matchdayCosts,
                            ...(current.matchdayCosts ?? {}),
                            vipBoxFixedCostPerMatch: Number(e.target.value),
                          },
                        vip: {
                          ...defaultWorldBible.vip,
                          ...(current.vip ?? {}),
                          vipHospitalityFixedCostPerMatch: Number(e.target.value),
                        },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Quand appliquer le coût loges</Label>
                    <select
                      className="w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                      value={
                        worldBible.matchdayCosts?.vipBoxCostAppliesWhen ??
                        defaultWorldBible.matchdayCosts.vipBoxCostAppliesWhen
                      }
                      onChange={(e) =>
                        setWorldBible((current) => ({
                          ...current,
                          matchdayCosts: {
                            ...defaultWorldBible.matchdayCosts,
                            ...(current.matchdayCosts ?? {}),
                            vipBoxCostAppliesWhen: e.target.value as
                              | "ALWAYS"
                              | "IF_VIP_REVENUE",
                          },
                        }))
                      }
                    >
                      <option value="IF_VIP_REVENUE">Uniquement si des revenus VIP sont générés</option>
                      <option value="ALWAYS">Toujours (coût engagé à chaque match)</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle>Hospitalités VIP — capacités & presets</CardTitle>
                  <CardDescription>
                    Configure la capacité siège/loges ainsi que les prix par défaut proposés aux équipes.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <Label>Capacité sièges VIP</Label>
                    <Input
                      type="number"
                      step="10"
                      min="0"
                      value={
                        worldBible.vip?.vipSeatCapacity ?? defaultWorldBible.vip.vipSeatCapacity
                      }
                      onChange={(e) =>
                        setWorldBible((current) => ({
                          ...current,
                          vip: {
                            ...defaultWorldBible.vip,
                            ...(current.vip ?? {}),
                            vipSeatCapacity: Math.max(0, Number(e.target.value)),
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Nombre de loges</Label>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      value={
                        worldBible.vip?.vipBoxCapacity ?? defaultWorldBible.vip.vipBoxCapacity
                      }
                      onChange={(e) =>
                        setWorldBible((current) => ({
                          ...current,
                          vip: {
                            ...defaultWorldBible.vip,
                            ...(current.vip ?? {}),
                            vipBoxCapacity: Math.max(0, Number(e.target.value)),
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Loges max vendues / match</Label>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      value={
                        worldBible.vip?.vipBoxMaxSoldPerMatch ??
                        defaultWorldBible.vip.vipBoxMaxSoldPerMatch
                      }
                      onChange={(e) =>
                        setWorldBible((current) => ({
                          ...current,
                          vip: {
                            ...defaultWorldBible.vip,
                            ...(current.vip ?? {}),
                            vipBoxMaxSoldPerMatch: Math.max(0, Number(e.target.value)),
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Prix référence siège VIP (HT)</Label>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      value={
                        worldBible.vip?.defaultSeatPrice ??
                        defaultWorldBible.vip.defaultSeatPrice ??
                        worldBible.referencePrices.ticket.hospitality
                      }
                      onChange={(e) =>
                        setWorldBible((current) => ({
                          ...current,
                          vip: {
                            ...defaultWorldBible.vip,
                            ...(current.vip ?? {}),
                            defaultSeatPrice: Math.max(0, Number(e.target.value)),
                          },
                          referencePrices: {
                            ...current.referencePrices,
                            ticket: {
                              ...current.referencePrices.ticket,
                              hospitality: Math.max(0, Number(e.target.value)),
                            },
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Prix référence pack loge (HT)</Label>
                    <Input
                      type="number"
                      step="500"
                      min="0"
                      value={
                        worldBible.vip?.defaultBoxPackPrice ??
                        defaultWorldBible.vip.defaultBoxPackPrice ??
                        0
                      }
                      onChange={(e) =>
                        setWorldBible((current) => ({
                          ...current,
                          vip: {
                            ...defaultWorldBible.vip,
                            ...(current.vip ?? {}),
                            defaultBoxPackPrice: Math.max(0, Number(e.target.value)),
                          },
                        }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="space-y-1 text-xs text-white/60">
                  <p>Raccourcis calibration :</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={handleResetDemandModel}>
                      Reset coefficients
                    </Button>
                  </div>
                </div>
                {clampNotes.length > 0 && (
                  <div className="space-y-1 text-xs text-amber-300">
                    <p className="font-medium uppercase tracking-wide text-amber-200">
                      Attention bornes
                    </p>
                    <ul className="space-y-1 list-disc pl-4">
                      {clampNotes.map((note, index) => (
                        <li key={index}>{note}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => toast.success("WorldBible sauvegardé localement")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Sauvegarder (local)
                </Button>
                <Button variant="outline" onClick={() => setWorldBible(defaultWorldBible)}>
                  Réinitialiser
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="mt-6 space-y-4">
          <Card className="border-white/10 bg-black/40">
            <CardHeader>
              <CardTitle>Résumé KPI</CardTitle>
              <CardDescription>
                Indicateurs clés transmis à l’IA pour contextualiser la génération du tour.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {kpiSummaryStats.map((stat) => (
                  <KpiStat
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                    delta={stat.delta}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-black/40">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>TurnPackage généré</CardTitle>
                {previewPackage
                  ? schemaErrors.length === 0
                    ? (
                        <Badge className="bg-emerald-500/20 text-emerald-300">
                          VALIDÉ
                        </Badge>
                      )
                    : (
                        <Badge className="bg-red-500/20 text-red-300">
                          INVALID
                        </Badge>
                      )
                  : null}
              </div>
              <CardDescription>
                Sortie IA pour le tour sélectionné. Utilisée par le RulesEngine et l’UX “jeu vidéo”.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="max-h-96 overflow-auto rounded-lg bg-black/70 p-4 text-xs text-emerald-200">
{previewPackage ? JSON.stringify(previewPackage, null, 2) : "// génère un TurnPackage pour le visualiser"}
              </pre>
              {schemaErrors.length > 0 && (
                <div className="mt-4 space-y-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-200">
                  <p className="font-semibold uppercase tracking-wider">
                    Erreurs de validation Ajv ({schemaErrors.length})
                  </p>
                  <ul className="space-y-1">
                    {schemaErrors.map((error, index) => (
                      <li key={`${error.instancePath}-${index}`}>
                        <span className="text-red-100">{error.instancePath || "/"}</span> —{" "}
                        {error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {previewResult?.feedback && (
            <Card className="border-white/10 bg-black/40">
              <CardHeader>
                <CardTitle>Feedback Game Master</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-white/80">
                <p>
                  <span className="font-semibold text-white">Résumé :</span>{" "}
                  {previewResult.feedback.summary}
                </p>
                <p>
                  <span className="font-semibold text-white">Supporters :</span>{" "}
                  {previewResult.feedback.supportersFeedback}
                </p>
                <p>
                  <span className="font-semibold text-white">Direction :</span>{" "}
                  {previewResult.feedback.managementFeedback}
                </p>
                <p>
                  <span className="font-semibold text-white">Marque :</span>{" "}
                  {previewResult.feedback.brandFeedback}
                </p>

                {previewResult.feedback.sizeAlerts.length > 0 && (
                  <ul className="list-disc space-y-1 pl-5 text-white/70">
                    {previewResult.feedback.sizeAlerts.map((alert, index) => (
                      <li key={`preview-feedback-alert-${index}`}>{alert}</li>
                    ))}
                  </ul>
                )}

                <p className="font-semibold italic text-white">
                  {previewResult.feedback.keyTakeaway}
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="border-white/10 bg-black/40">
            <CardHeader>
              <CardTitle>GameState après simulation (décisions par défaut)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  label="Trésorerie"
                  value={formatCurrency(currentKpis.transverse.cash)}
                  delta={cashDeltaLabel}
                />
                <MetricCard
                  label="Index fans"
                  value={`${Math.round(currentKpis.transverse.fansIndex)} / 100`}
                  delta={formatPointsDelta(currentKpis.transverse.fansDeltaThisTurn)}
                />
                <MetricCard
                  label="Index marque"
                  value={`${Math.round(currentKpis.transverse.brandIndex)} / 100`}
                  delta={formatPointsDelta(currentKpis.transverse.brandDeltaThisTurn)}
                />
                <MetricCard
                  label="Partenaires actifs"
                  value={`${currentKpis.sponsoring.activePartners}/${currentKpis.sponsoring.totalPartnersBaseline}`}
                  delta={activePartnersDeltaLabel}
                />
              </div>
              <pre className="max-h-64 overflow-auto rounded-lg bg-black/70 p-4 text-xs text-sky-200">
{JSON.stringify(previewState, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        {diagnosticsEnabled && (
          <TabsContent value="diagnostics" className="mt-6 space-y-6">
            <Card className="border-white/10 bg-black/40">
              <CardHeader>
                <CardTitle>KPI Sanity</CardTitle>
                <CardDescription>
                  Vérifie la cohérence des indicateurs calculés sur l’état actuel.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleRunSanityCheck} disabled={sanityRunning}>
                    {sanityRunning ? "Vérification..." : "Run sanity checks (current state)"}
                  </Button>
                  <span className="text-xs text-white/50">
                    {sanityIssues.length === 0
                      ? "Aucune anomalie détectée pour l’instant."
                      : `${sanityIssues.length} anomalie(s) détectée(s).`}
                  </span>
                </div>
                {sanityIssues.length === 0 ? (
                  <p className="text-sm text-white/60">
                    Lancez une vérification pour identifier les incohérences (NaN, overflow, indices hors bornes).
                  </p>
                ) : (
                  <div className="space-y-2">
                    {sanityIssues.map((issue, index) => {
                      const badgeClass =
                        issue.level === "error"
                          ? "border border-red-500/40 bg-red-500/15 text-red-200"
                          : "border border-amber-400/40 bg-amber-400/15 text-amber-100";
                      return (
                        <div
                          key={`${issue.code}-${index}`}
                          className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white/70"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <Badge className={badgeClass}>{issue.level.toUpperCase()}</Badge>
                            {issue.turnNumber !== undefined && (
                              <span className="text-white/40">Tour {issue.turnNumber}</span>
                            )}
                          </div>
                          <p className="mt-2 font-medium text-white">{issue.code}</p>
                          <p className="text-white/70">{issue.message}</p>
                          {issue.path && (
                            <p className="mt-1 text-white/40">Chemin: <span className="font-mono">{issue.path}</span></p>
                          )}
                          {issue.value !== undefined && (
                            <p className="mt-1 break-all text-white/50">
                              Valeur:{" "}
                              <span className="font-mono">
                                {typeof issue.value === "object"
                                  ? JSON.stringify(issue.value)
                                  : String(issue.value)}
                              </span>
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-black/40">
              <CardHeader>
                <CardTitle>Calibration Tour 1</CardTitle>
                <CardDescription>
                  Lance des presets Rupture / Surstock pour tester la sensibilité du Tour 1 sans IA.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-xs text-white/60">
                  💡 Pense à lancer le Quick Start Test avant de calibrer afin de vérifier ta configuration
                  actuelle.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => handleRunTour1Preset("RUPTURE")}
                    disabled={calibrationRunningPreset === "RUPTURE"}
                  >
                    {calibrationRunningPreset === "RUPTURE"
                      ? "Preset Rupture…"
                      : "Run preset : Rupture"}
                  </Button>
                  <Button
                    onClick={() => handleRunTour1Preset("SURSTOCK")}
                    disabled={calibrationRunningPreset === "SURSTOCK"}
                  >
                    {calibrationRunningPreset === "SURSTOCK"
                      ? "Preset Surstock…"
                      : "Run preset : Surstock"}
                  </Button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full min-w-[480px] text-left text-xs text-white/70">
                    <thead className="bg-white/5 text-[11px] uppercase tracking-wide text-white/50">
                      <tr>
                        <th className="px-4 py-2 font-medium">Indicateur</th>
                        {calibrationPresetOrder.map((preset) => (
                          <th key={`calib-head-${preset}`} className="px-4 py-2 font-medium">
                            {TOUR1_PRESET_LABELS[preset].title}
                          </th>
                        ))}
                        {tour1Baseline && (
                          <th className="px-4 py-2 font-medium">Baseline</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {calibrationMetricConfig.map((metric) => (
                        <tr key={`calib-row-${metric.key}`} className="border-t border-white/5">
                          <td className="px-4 py-2 font-medium text-white">{metric.label}</td>
                          {calibrationPresetOrder.map((preset) => {
                            const result = calibrationRuns[preset];
                            const value =
                              result !== null ? metric.getValue(result.kpis) : undefined;
                            const displayValue =
                              value !== undefined ? metric.format(value) : "—";
                            const baselineValue = baselineMetricValues[metric.key];
                            const deltaLabel =
                              baselineValue !== undefined && value !== undefined
                                ? formatDelta(value, baselineValue, metric.deltaType)
                                : "—";
                            const deltaClass =
                              deltaLabel === "—"
                                ? "text-white/40"
                                : deltaLabel.startsWith("+")
                                ? "text-emerald-300"
                                : deltaLabel.startsWith("-")
                                ? "text-rose-300"
                                : "text-white/50";
                            return (
                              <td key={`calib-cell-${metric.key}-${preset}`} className="px-4 py-3">
                                <div className="space-y-1">
                                  <span className="text-sm font-semibold text-white">
                                    {displayValue}
                                  </span>
                                  {tour1Baseline && (
                                    <span className={`block text-[11px] ${deltaClass}`}>
                                      Δ baseline : {deltaLabel}
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                          {tour1Baseline && (
                            <td className="px-4 py-3 text-sm text-white">
                              {baselineMetricValues[metric.key] !== undefined
                                ? metric.format(baselineMetricValues[metric.key] as number)
                                : "—"}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {calibrationPresetOrder.map((preset) => {
                    const result = calibrationRuns[preset];
                    return (
                      <div
                        key={`calib-summary-${preset}`}
                        className="rounded-xl border border-white/10 bg-white/5 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {TOUR1_PRESET_LABELS[preset].title}
                            </p>
                            <p className="text-[11px] text-white/50">
                              {TOUR1_PRESET_LABELS[preset].description}
                            </p>
                          </div>
                          {result && (
                            <Badge variant="outline" className="text-white">
                              {baselineDateFormatter.format(new Date(result.createdAt))}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-3 grid gap-1 text-xs text-white/70">
                          <span>
                            Cash final : {result ? formatCurrency(result.cash) : "—"}
                          </span>
                          <span>
                            Δ Cash :{" "}
                            {result
                              ? formatCurrency(result.kpis.transverse.cashDeltaThisTurn)
                              : "—"}
                          </span>
                          <span>
                            Fans finaux :{" "}
                            {result ? `${Math.round(result.fans)} pts` : "—"}
                          </span>
                          <span>
                            Δ Fans :{" "}
                            {result
                              ? formatPointsDelta(result.kpis.transverse.fansDeltaThisTurn)
                              : "—"}
                          </span>
                          <span>
                            Marque finale :{" "}
                            {result ? `${Math.round(result.brand)} pts` : "—"}
                          </span>
                          <span>
                            Δ Marque :{" "}
                            {result
                              ? formatPointsDelta(result.kpis.transverse.brandDeltaThisTurn)
                              : "—"}
                          </span>
                        </div>
                        {result && (
                          <div className="mt-3 space-y-1 text-[11px] text-white/55">
                            <p>
                              Tailles en rupture :{" "}
                              {result.kpis.merchandising.jerseyRuptureSizes.length > 0
                                ? result.kpis.merchandising.jerseyRuptureSizes.join(", ")
                                : "aucune"}
                            </p>
                            <p>
                              Tailles en surstock :{" "}
                              {result.kpis.merchandising.jerseySurstockSizes.length > 0
                                ? result.kpis.merchandising.jerseySurstockSizes.join(", ")
                                : "aucune"}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleSaveTour1Baseline}
                    disabled={!lastCalibrationResult}
                    variant={lastCalibrationResult ? "default" : "outline"}
                  >
                    Save as Tour 1 baseline
                  </Button>
                  <Button variant="outline" onClick={handleLoadTour1Baseline}>
                    Load baseline
                  </Button>
                </div>

                {tour1Baseline && (
                  <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/70">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-semibold text-white">
                        Baseline sauvegardée le{" "}
                        {baselineDateFormatter.format(new Date(tour1Baseline.createdAt))}
                      </p>
                      {baselineMismatch && (
                        <Badge className="border border-amber-400/60 bg-amber-500/15 text-amber-100">
                          Baseline mismatch
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <span>Taux remplissage : {formatPercent(tour1Baseline.kpis.fillRate)}</span>
                      <span>
                        CA billetterie : {formatCurrency(tour1Baseline.kpis.ticketRevenuePerMatch)}
                      </span>
                      <span>
                        Maillots vendus : {formatNumber(tour1Baseline.kpis.jerseyUnitsSold)}
                      </span>
                      <span>
                        Taux marge : {formatPercentUnbounded(tour1Baseline.kpis.jerseyGrossMarginRate)}
                      </span>
                      <span>Cash : {formatCurrency(tour1Baseline.kpis.cash)}</span>
                      <span>Fans : {Math.round(tour1Baseline.kpis.fansIndex)} pts</span>
                      <span>Marque : {Math.round(tour1Baseline.kpis.brandIndex)} pts</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-black/40">
              <CardHeader>
                <CardTitle>Stress test (10 tours)</CardTitle>
                <CardDescription>
                  Simule des décisions extrêmes sans IA pour vérifier la robustesse du moteur et des KPI.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-wide text-white/50">
                    Presets à combiner
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {STRESS_PRESET_OPTIONS.map((preset) => {
                      const checked = stressPresets.includes(preset.value);
                      return (
                        <label
                          key={preset.value}
                          htmlFor={`stress-${preset.value}`}
                          className={`flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80 transition ${
                            checked ? "border-blue-400/60 bg-blue-500/10" : "hover:border-white/20"
                          }`}
                        >
                          <Checkbox
                            id={`stress-${preset.value}`}
                            checked={checked}
                            onCheckedChange={(value) => handlePresetToggle(preset.value, value)}
                            className="mt-1 border-white/40 data-[state=checked]:bg-blue-500"
                          />
                          <span>
                            <span className="font-medium text-white">{preset.label}</span>
                            <span className="mt-1 block text-xs text-white/60">{preset.description}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={handleRunStress} disabled={stressRunning}>
                      {stressRunning ? "Stress test en cours..." : "Run stress test (10 tours)"}
                    </Button>
                    <span className="text-xs text-white/50">
                      {stressPresets.length === 0
                        ? "Les presets par défaut seront utilisés si aucun n’est sélectionné."
                        : `${stressPresets.length} preset(s) sélectionné(s).`}
                    </span>
                  </div>
                </div>

                {stressResult ? (
                  <div className="space-y-5">
                    <div className="flex flex-wrap gap-3 text-xs">
                      <Badge className="border border-red-500/40 bg-red-500/15 text-red-200">
                        {stressErrorCount} erreur(s)
                      </Badge>
                      <Badge className="border border-amber-400/40 bg-amber-400/15 text-amber-100">
                        {stressWarnCount} avertissement(s)
                      </Badge>
                      <span className="text-white/40">
                        {stressResult.entries.length} tour(s) simulé(s)
                      </span>
                    </div>

                    <div className="space-y-3">
                      {stressResult.entries.map((entry) => {
                        const entryKpis = entry.stateAfter.kpis;
                        return (
                          <div
                            key={`stress-entry-${entry.turnNumber}`}
                            className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="border-white/20 text-white">
                                  Tour {entry.turnNumber}
                                </Badge>
                                <span className="font-semibold text-white">
                                  {entry.package.title}
                                </span>
                              </div>
                              <span className="text-xs text-white/50">
                                Cash {formatCurrency(entryKpis.transverse.cash)} · Remplissage{" "}
                                {formatPercent(clampZeroOne(entryKpis.matchday.fillRate))}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-4 text-xs text-white/60">
                              <span>
                                CA billetterie {formatCurrency(entryKpis.matchday.ticketRevenuePerMatch)}
                              </span>
                              <span>
                                CA merchandising {formatCurrency(entryKpis.merchandising.jerseyRevenue)}
                              </span>
                              <span>
                                CA sponsoring {formatCurrency(entryKpis.sponsoring.totalRevenue)}
                              </span>
                              <span>
                                Sat sponsors {Math.round(entryKpis.sponsoring.sponsorSatisfactionIndex)}/100
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {stressIssuesSorted.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-white">
                          Anomalies détectées (top {Math.min(stressIssuesSorted.length, 30)})
                        </h4>
                        <div className="space-y-2">
                          {stressIssuesSorted.slice(0, 30).map((issue, index) => {
                            const badgeClass =
                              issue.level === "error"
                                ? "border border-red-500/40 bg-red-500/15 text-red-200"
                                : "border border-amber-400/40 bg-amber-400/15 text-amber-100";
                            return (
                              <div
                                key={`stress-issue-${issue.code}-${index}`}
                                className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white/70"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <Badge className={badgeClass}>{issue.level.toUpperCase()}</Badge>
                                  {issue.turnNumber !== undefined && (
                                    <span className="text-white/40">Tour {issue.turnNumber}</span>
                                  )}
                                </div>
                                <p className="mt-1 font-medium text-white">{issue.code}</p>
                                <p>{issue.message}</p>
                                {issue.path && (
                                  <p className="mt-1 text-white/50">
                                    Chemin: <span className="font-mono">{issue.path}</span>
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-white/60">
                    Sélectionnez un ou plusieurs presets puis lancez le stress test pour obtenir un rapport complet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

export default function BeyondPlayExecutiveWorkbench() {
  return (
    <Suspense fallback={null}>
      <BeyondPlayExecutiveWorkbenchContent />
    </Suspense>
  );
}

type KpiStatProps = {
  label: string;
  value: string;
  delta?: string;
  helperText?: string;
};

function KpiStat({ label, value, delta, helperText }: KpiStatProps) {
  const showDelta = delta !== undefined;
  const deltaText = delta ?? "";
  const deltaClass =
    deltaText === "—"
      ? "text-white/40"
      : deltaText.startsWith("+")
      ? "text-emerald-300"
      : deltaText.startsWith("-")
      ? "text-rose-300"
      : "text-white/50";

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-white">{label}</p>
        {showDelta ? (
          <span className={`text-xs font-medium ${deltaClass}`}>
            {deltaText === "—" ? "Δ —" : `Δ ${deltaText}`}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
      {helperText ? <p className="mt-1 text-xs text-white/50">{helperText}</p> : null}
    </div>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  delta?: string;
  helperText?: string;
};

function MetricCard({ label, value, delta, helperText }: MetricCardProps) {
  const showDelta = delta !== undefined;
  const deltaText = delta ?? "";
  const deltaClass =
    deltaText === "—"
      ? "text-white/40"
      : deltaText.startsWith("+")
      ? "text-emerald-300"
      : deltaText.startsWith("-")
      ? "text-rose-300"
      : "text-white/50";

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
      <p className="text-xs uppercase tracking-wide text-white/50">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
      {showDelta ? (
        <p className={`mt-2 text-xs font-medium ${deltaClass}`}>
          {deltaText === "—" ? "Δ —" : `Δ ${deltaText}`}
        </p>
      ) : null}
      {helperText ? <p className="mt-1 text-xs text-white/50">{helperText}</p> : null}
    </div>
  );
}


