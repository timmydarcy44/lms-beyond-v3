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
import type { EntrepriseOverviewData } from "@/lib/entreprise/overview-types";

type EnterpriseOverviewContextValue = {
  loading: boolean;
  data: EntrepriseOverviewData | null;
  fetchError: string | null;
  organisationId: string | null;
  superAdminPreview: boolean;
  configurationRequired: boolean;
  reload: (force?: boolean) => Promise<void>;
};

const EnterpriseOverviewContext = createContext<EnterpriseOverviewContextValue | null>(null);

const CACHE_MS = 45_000;
let cachedData: EntrepriseOverviewData | null = null;
let cachedAt = 0;
let inflight: Promise<EntrepriseOverviewData | null> | null = null;

async function fetchOverview(): Promise<EntrepriseOverviewData | null> {
  const res = await fetch("/api/dashboard/entreprise/overview", {
    credentials: "include",
    cache: "no-store",
  });
  const raw = await res.text();
  if (!raw.trim()) {
    throw new Error(
      res.status === 504 || res.status === 502
        ? "Le serveur met trop de temps à répondre. Réessayez dans un instant."
        : "Réponse serveur vide — rechargement impossible.",
    );
  }
  let json: EntrepriseOverviewData & { error?: string };
  try {
    json = JSON.parse(raw) as EntrepriseOverviewData & { error?: string };
  } catch {
    throw new Error(`Réponse serveur invalide (${res.status})`);
  }
  if (!res.ok) throw new Error(json.error ?? `Erreur serveur (${res.status})`);
  return {
    ...json,
    employees: json.employees ?? [],
    kpis: json.kpis ?? {
      employees_total: 0,
      diagnostics_completed: 0,
      diagnostics_total: 0,
      diagnostics_pct: 0,
      enrollments_active: 0,
    },
    formations: json.formations ?? { presentiel: [], elearning: [] },
    this_week: json.this_week ?? { from: "", to: "", agenda: [], recent_activity: [] },
  };
}

export function EnterpriseOverviewProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(!cachedData);
  const [data, setData] = useState<EntrepriseOverviewData | null>(cachedData);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const mounted = useRef(true);

  const reload = useCallback(async (force = false) => {
    const fresh = !force && cachedData && Date.now() - cachedAt < CACHE_MS;
    if (fresh) {
      setData(cachedData);
      setLoading(false);
      return;
    }

    if (!force && inflight) {
      try {
        const result = await inflight;
        if (mounted.current && result) setData(result);
      } catch (e) {
        if (mounted.current) {
          setFetchError(e instanceof Error ? e.message : "Erreur de chargement");
        }
      } finally {
        if (mounted.current) setLoading(false);
      }
      return;
    }

    setLoading(true);
    setFetchError(null);
    inflight = fetchOverview()
      .then((result) => {
        cachedData = result;
        cachedAt = Date.now();
        return result;
      })
      .finally(() => {
        inflight = null;
      });

    try {
      const result = await inflight;
      if (mounted.current) setData(result);
    } catch (e) {
      if (mounted.current) {
        setFetchError(e instanceof Error ? e.message : "Erreur de chargement");
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void reload();
    return () => {
      mounted.current = false;
    };
  }, [reload]);

  const organisationId = data?.organisation?.id ?? null;
  const superAdminPreview = Boolean(data?.super_admin_preview);
  const configurationRequired = Boolean(data?.configuration_required) && !superAdminPreview;

  const value = useMemo(
    () => ({
      loading,
      data,
      fetchError,
      organisationId,
      superAdminPreview,
      configurationRequired,
      reload,
    }),
    [configurationRequired, data, fetchError, loading, organisationId, reload, superAdminPreview],
  );

  return (
    <EnterpriseOverviewContext.Provider value={value}>{children}</EnterpriseOverviewContext.Provider>
  );
}

export function useEnterpriseOverviewContext() {
  const ctx = useContext(EnterpriseOverviewContext);
  if (!ctx) {
    throw new Error("useEnterpriseOverviewContext requires EnterpriseOverviewProvider");
  }
  return ctx;
}

export function useOptionalEnterpriseOverviewContext() {
  return useContext(EnterpriseOverviewContext);
}

export function invalidateEnterpriseOverviewCache() {
  cachedData = null;
  cachedAt = 0;
  inflight = null;
}
