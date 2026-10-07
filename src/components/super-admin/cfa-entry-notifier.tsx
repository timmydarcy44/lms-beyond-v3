"use client";

import { useEffect } from "react";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";

const LAST_SEEN_KEY = "byound_super_cfa_last_seen";

export function CfaEntryNotifier() {
  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/super-admin/crm/cfa", { cache: "no-store" });
        if (!response.ok) return;

        const result = await response.json();
        const latest = result.applications?.[0] as
          | { created_at: string; first_name: string; last_name: string }
          | undefined;
        if (!latest) return;

        const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
        if (lastSeen && new Date(latest.created_at) <= new Date(lastSeen)) return;

        toast("Nouvelle candidature CFA", {
          description: `${latest.first_name} ${latest.last_name} vient d’entrer dans le parcours Byound.`,
          icon: <GraduationCap className="h-4 w-4 text-indigo-600" />,
          duration: 9000,
          action: {
            label: "Ouvrir",
            onClick: () => {
              window.location.href = "/super/crm/cfa";
            },
          },
        });
        localStorage.setItem(LAST_SEEN_KEY, latest.created_at);
      } catch {
        // Notification non bloquante.
      }
    })();
  }, []);

  return null;
}
