"use client";

import { useCallback, useEffect, useState } from "react";

import type { TutorAssignmentDetail } from "@/lib/tuteur/workspace-server";

export function useTutorAssignmentDetail(assignmentId: string | undefined) {
  const [data, setData] = useState<TutorAssignmentDetail | null>(null);
  const [error, setError] = useState<"auth" | "not_found" | "network" | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!assignmentId) {
      setLoading(false);
      setData(null);
      setError("not_found");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/tuteur/assignments/${assignmentId}`, { cache: "no-store" });
      if (res.status === 401 || res.status === 403) {
        setError("auth");
        setData(null);
        return;
      }
      if (res.status === 404) {
        setError("not_found");
        setData(null);
        return;
      }
      if (!res.ok) {
        setError("network");
        setData(null);
        return;
      }
      setData((await res.json()) as TutorAssignmentDetail);
      setError(null);
    } catch {
      setError("network");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, error, loading, reload };
}
