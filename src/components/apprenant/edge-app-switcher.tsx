"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import {
  EDGE_APPS,
  getEdgeAppTransitionName,
  type EdgeAppId,
  setStoredEdgeAppId,
} from "@/lib/apprenant/edge-apps";
import { EdgeAppsLauncher } from "@/components/edge/edge-apps-launcher";
import { edgePerfMark } from "@/lib/edge/perf-marks";

type EdgeAppSwitcherProps = {
  activeAppId: EdgeAppId;
  onAppChange: (id: EdgeAppId) => void;
  className?: string;
};

export function EdgeAppSwitcher({ activeAppId, onAppChange, className }: EdgeAppSwitcherProps) {
  const router = useRouter();

  const prefetchApps = useCallback(() => {
    edgePerfMark("switcher-open-prefetch");
    for (const app of EDGE_APPS) {
      try {
        router.prefetch(app.homeHref);
      } catch {
        /* ignore */
      }
    }
  }, [router]);

  return (
    <EdgeAppsLauncher
      className={className}
      title="Applications"
      apps={EDGE_APPS}
      activeAppId={activeAppId}
      onOpenPrefetch={prefetchApps}
      onAppChange={(id) => {
        edgePerfMark("switcher-app-click", { id });
        setStoredEdgeAppId(id as EdgeAppId);
        onAppChange(id as EdgeAppId);
      }}
    />
  );
}

/** Exposé pour la transition shell. */
export { getEdgeAppTransitionName };
