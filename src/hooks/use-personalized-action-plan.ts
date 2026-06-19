"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DiscScores } from "@/components/apprenant/apprenant-assessment-results";
import type { AxisKey } from "@/components/idmc/IdmcRadarChart";
import { buildPersonalizedActionPlan } from "@/lib/learner/personalized-action-plan";
import type { LearnerSnapshot } from "@/components/learner/learner-snapshot-provider";
import { invalidateLearnerSnapshotProviderCache } from "@/components/learner/learner-snapshot-provider";

type Surface = "apprenant" | "salarie";

let cachedSnapshot: LearnerSnapshot | null = null;
let inflight: Promise<LearnerSnapshot | null> | null = null;

async function loadSnapshot(): Promise<LearnerSnapshot | null> {
  if (cachedSnapshot) return cachedSnapshot;
  if (inflight) return inflight;
  inflight = fetch("/api/dashboard/learner-snapshot", { credentials: "include" })
    .then(async (res) => {
      if (!res.ok) return null;
      const data = (await res.json()) as LearnerSnapshot;
      cachedSnapshot = data;
      return data;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Hook léger (1 requête API cacheable) — préférer usePersonalizedActionPlanFromSnapshot dans l'espace salarié. */
export function usePersonalizedActionPlan(surface: Surface = "apprenant") {
  const [loading, setLoading] = useState(!cachedSnapshot);
  const [snapshot, setSnapshot] = useState<LearnerSnapshot | null>(cachedSnapshot);

  const load = useCallback(async () => {
    if (cachedSnapshot) {
      setSnapshot(cachedSnapshot);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await loadSnapshot();
    setSnapshot(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
    firstName: snapshot?.firstName ?? "Vous",
    parcoursHref,
  };
}

export function invalidateLearnerSnapshotCache() {
  cachedSnapshot = null;
  inflight = null;
  invalidateLearnerSnapshotProviderCache();
}
