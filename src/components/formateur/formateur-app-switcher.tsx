"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { EdgeAppsLauncher } from "@/components/edge/edge-apps-launcher";
import { FORMATEUR_APPS, type FormateurAppId } from "@/lib/formateur/expert-apps";

type FormateurAppSwitcherProps = {
  activeAppId: FormateurAppId | "";
  onAppChange: (id: FormateurAppId) => void;
  className?: string;
};

/** Même lanceur que l’espace apprenant : ouverture, préchargement, choix d’application. */
export function FormateurAppSwitcher({ activeAppId, onAppChange, className }: FormateurAppSwitcherProps) {
  const router = useRouter();

  const prefetchApps = useCallback(() => {
    for (const app of FORMATEUR_APPS) {
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
      title="Espace Expert"
      apps={FORMATEUR_APPS}
      activeAppId={activeAppId}
      onOpenPrefetch={prefetchApps}
      onAppChange={(id) => onAppChange(id as FormateurAppId)}
    />
  );
}
