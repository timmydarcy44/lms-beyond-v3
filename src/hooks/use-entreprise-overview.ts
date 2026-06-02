"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type EntrepriseEmployee = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  job_title: string | null;
  department: string | null;
  created_at: string | null;
  diagnostic_done: boolean;
  idmc_score: number | null;
  formation_active: boolean;
};

export type EntrepriseOverviewData = {
  super_admin_preview?: boolean;
  configuration_required?: boolean;
  needsOnboarding?: boolean;
  onboarding_href?: string;
  viewer: { email: string | null; prenom: string | null; nom: string | null };
  organisation?: { id: string; name: string };
  kpis?: {
    employees_total: number;
    diagnostics_completed: number;
    diagnostics_total: number;
    diagnostics_pct: number;
    enrollments_active: number;
  };
  employees: EntrepriseEmployee[];
  employees_pending?: number;
  [key: string]: unknown;
};

const MAX_RETRIES = 4;
const RETRY_MS = 2000;

const emptyKpis = {
  employees_total: 0,
  diagnostics_completed: 0,
  diagnostics_total: 0,
  diagnostics_pct: 0,
  enrollments_active: 0,
};

export function useEntrepriseOverview() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EntrepriseOverviewData | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const attemptRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);

    const tryFetch = async (attempt: number): Promise<void> => {
      try {
        const res = await fetch("/api/dashboard/entreprise/overview", {
          credentials: "include",
          cache: "no-store",
        });
        const json = (await res.json()) as EntrepriseOverviewData & { error?: string };

        if (!res.ok) {
          throw new Error(json.error ?? `Erreur serveur (${res.status})`);
        }

        if (!mountedRef.current) return;
        setData({
          ...json,
          employees: json.employees ?? [],
          kpis: json.kpis ?? emptyKpis,
        });
        attemptRef.current = 0;
        setLoading(false);
      } catch (e) {
        if (!mountedRef.current) return;
        if (attempt < MAX_RETRIES) {
          setTimeout(() => void tryFetch(attempt + 1), RETRY_MS);
        } else {
          setFetchError(e instanceof Error ? e.message : "Erreur de chargement");
          setLoading(false);
        }
      }
    };

    await tryFetch(0);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const organisationId = data?.organisation?.id ?? null;
  const superAdminPreview = Boolean(data?.super_admin_preview);
  const configurationRequired = Boolean(data?.configuration_required) && !superAdminPreview;

  return {
    loading,
    data,
    fetchError,
    organisationId,
    superAdminPreview,
    configurationRequired,
    reload: load,
  };
}
