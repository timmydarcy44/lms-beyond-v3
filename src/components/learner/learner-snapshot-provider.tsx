"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { DiscScores } from "@/components/apprenant/apprenant-assessment-results";
import type { AxisKey } from "@/components/idmc/IdmcRadarChart";
import { buildPersonalizedActionPlan } from "@/lib/learner/personalized-action-plan";

export type LearnerSnapshot = {
  userId: string;
  firstName: string;
  jobTitle: string | null;
  discScores: DiscScores | null;
  idmcAxes: Record<AxisKey, number> | null;
  softSkillsRadar: Array<{ skill: string; score: number }>;
};

type LearnerSnapshotContextValue = {
  loading: boolean;
  snapshot: LearnerSnapshot | null;
  refresh: () => Promise<void>;
};

const LearnerSnapshotContext = createContext<LearnerSnapshotContextValue | null>(null);

let sharedSnapshotPromise: Promise<LearnerSnapshot | null> | null = null;

async function fetchSnapshot(): Promise<LearnerSnapshot | null> {
  const res = await fetch("/api/dashboard/learner-snapshot", { credentials: "include" });
  if (!res.ok) return null;
  return (await res.json()) as LearnerSnapshot;
}

export function LearnerSnapshotProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<LearnerSnapshot | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async (force = false) => {
    if (!force && sharedSnapshotPromise) {
      const cached = await sharedSnapshotPromise;
      if (mounted.current) {
        setSnapshot(cached);
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    sharedSnapshotPromise = fetchSnapshot();
    try {
      const data = await sharedSnapshotPromise;
      if (mounted.current) setSnapshot(data);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  const value = useMemo(
    () => ({
      loading,
      snapshot,
      refresh: async () => {
        sharedSnapshotPromise = null;
        await load(true);
      },
    }),
    [load, loading, snapshot],
  );

  return (
    <LearnerSnapshotContext.Provider value={value}>{children}</LearnerSnapshotContext.Provider>
  );
}

export function useLearnerSnapshot() {
  const ctx = useContext(LearnerSnapshotContext);
  if (!ctx) {
    throw new Error("useLearnerSnapshot must be used within LearnerSnapshotProvider");
  }
  return ctx;
}

export function usePersonalizedActionPlanFromSnapshot(surface: "apprenant" | "salarie" = "salarie") {
  const { loading, snapshot } = useLearnerSnapshot();

  const plan = useMemo(
    () =>
      snapshot
        ? buildPersonalizedActionPlan({
            firstName: snapshot.firstName,
            jobTitle: snapshot.jobTitle,
            discScores: snapshot.discScores,
            idmcAxes: snapshot.idmcAxes,
            softSkills: snapshot.softSkillsRadar,
            surface,
          })
        : null,
    [snapshot, surface],
  );

  const parcoursHref =
    surface === "salarie" ? "/dashboard/salarie/parcours" : "/dashboard/apprenant/parcours";

  return {
    loading,
    plan,
    snapshot,
    firstName: snapshot?.firstName ?? "Vous",
    parcoursHref,
  };
}
