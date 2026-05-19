"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Debug: désactivé pour nettoyer les logs serveur (PGRST204).
    return;
    const trackView = async () => {
      try {
        await fetch("/api/page-views", {
          method: "POST",
          body: JSON.stringify({
            path: pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : ""),
            referrer: document.referrer,
          }),
        });
      } catch (error) {
        console.error("Erreur tracking:", error);
      }
    };

    trackView();
  }, [pathname, searchParams]);

  return null;
}
