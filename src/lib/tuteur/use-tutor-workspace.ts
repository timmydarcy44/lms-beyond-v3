"use client";

import { useCallback, useEffect, useState } from "react";

import type { TutorWorkspacePayload } from "@/lib/tuteur/workspace-server";

export function useTutorWorkspace() {
  const [data, setData] = useState<TutorWorkspacePayload | null>(null);
  const [error, setError] = useState<"auth" | "network" | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tuteur/workspace", { cache: "no-store" });
      if (res.status === 401 || res.status === 403) {
        setError("auth");
        setData(null);
        return;
      }
      if (!res.ok) {
        setError("network");
        setData(null);
        return;
      }
      const json = (await res.json()) as TutorWorkspacePayload;
      setData(json);
      setError(null);
    } catch {
      setError("network");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, error, loading, reload };
}
