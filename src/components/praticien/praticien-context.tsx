"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type PraticienProfile = {
  id: string;
  prenom: string;
  nom: string;
  photo_url: string | null;
  titre: string | null;
  biographie: string | null;
  specialites: string[] | null;
  tarif_session: number;
  duree_session: number;
  bct_certified: boolean;
  stripe_onboarding_complete: boolean;
  note_moyenne: number | null;
  nombre_avis: number;
};

export type SessionRow = {
  id: string;
  date_session: string;
  heure_debut: string;
  duree_minutes?: number;
  status?: string;
  payment_status?: string;
  consentement_donnees?: boolean;
  montant_praticien?: number;
  montantLabel?: string;
  profiles?: { first_name?: string; full_name?: string } | null;
};

export type Creneau = {
  id: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  disponible: boolean;
};

type DashboardData = {
  praticien?: PraticienProfile;
  stats?: {
    sessionsMois: number;
    aVenir: number;
    revenusMois: string;
    revenusMoisCents?: number;
    noteMoyenne: number | null;
    nombreAvis: number;
  };
  prochainesSessions?: SessionRow[];
  sessionsPassees?: SessionRow[];
  creneaux?: Creneau[];
};

type Ctx = {
  loading: boolean;
  error: string | null;
  praticien: PraticienProfile | null;
  stats: DashboardData["stats"];
  prochainesSessions: SessionRow[];
  sessionsPassees: SessionRow[];
  creneaux: Creneau[];
  calendarMonth: Date;
  setCalendarMonth: (d: Date) => void;
  refresh: () => Promise<void>;
};

const PraticienCtx = createContext<Ctx | null>(null);

export function PraticienProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const browser = createSupabaseBrowserClient();
      const { data: auth } = browser ? await browser.auth.getUser() : { data: { user: null } };
      if (isJadeDemoEmail(auth.user?.email)) {
        const today = new Date().toISOString().slice(0, 10);
        setData({
          praticien: {
            id: "jade-demo",
            prenom: "Jade",
            nom: "Martin",
            photo_url: null,
            titre: "Praticienne",
            biographie: "Compte démo",
            specialites: ["Coaching", "Bilan"],
            tarif_session: 120,
            duree_session: 60,
            bct_certified: true,
            stripe_onboarding_complete: true,
            note_moyenne: 4.9,
            nombre_avis: 18,
          },
          stats: { sessionsMois: 11, aVenir: 3, revenusMois: "1 840 €", noteMoyenne: 4.9, nombreAvis: 18 },
          prochainesSessions: [
            { id: "jade-seance", date_session: today, heure_debut: "16:00", duree_minutes: 60, status: "confirmed", profiles: { first_name: "Camille", full_name: "Camille Bernard" }, montantLabel: "120 €" },
          ],
          creneaux: [{ id: "jade-slot", date: today, heure_debut: "16:00", heure_fin: "17:00", disponible: true }],
        });
        return;
      }
      const q = new URLSearchParams({
        year: String(calendarMonth.getFullYear()),
        month: String(calendarMonth.getMonth()),
      });
      const res = await fetch(`/api/marketplace/praticien/dashboard?${q}`);
      const json = (await res.json()) as DashboardData & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Chargement impossible");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [calendarMonth]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<Ctx>(
    () => ({
      loading,
      error,
      praticien: data?.praticien ?? null,
      stats: data?.stats,
      prochainesSessions: data?.prochainesSessions ?? [],
      sessionsPassees: data?.sessionsPassees ?? [],
      creneaux: data?.creneaux ?? [],
      calendarMonth,
      setCalendarMonth,
      refresh,
    }),
    [loading, error, data, calendarMonth, refresh],
  );

  return <PraticienCtx.Provider value={value}>{children}</PraticienCtx.Provider>;
}

export function usePraticien() {
  const ctx = useContext(PraticienCtx);
  if (!ctx) throw new Error("usePraticien dans PraticienProvider");
  return ctx;
}
