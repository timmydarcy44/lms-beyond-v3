"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Link2, RefreshCw, Loader2 } from "lucide-react";
import { JessicaSuperButton } from "@/components/jessica-contentin/super/jessica-super-ui";
import { jessicaSuper } from "@/lib/jessica-contentin/super-theme";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Props = {
  connected: boolean;
  lastSyncedAt: string | null;
};

export function GoogleCalendarConnectPanel({ connected, lastSyncedAt }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const googleStatus = searchParams.get("google");

  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/jessica/google-calendar/connect");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Connexion impossible");
      window.location.href = data.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur Google Calendar");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/jessica/google-calendar/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Synchronisation échouée");
      toast.success(`${data.imported} RDV importés depuis Google Calendar`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur de synchronisation");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className={cn(jessicaSuper.card, "mb-6 p-5")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-black">
            <Calendar className="h-5 w-5 text-indigo-600" />
            Google Agenda
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            {connected
              ? `Connecté${lastSyncedAt ? ` · dernière synchro ${new Date(lastSyncedAt).toLocaleString("fr-FR")}` : ""}`
              : "Connectez l'agenda Google pour importer les RDV et calculer le CA cabinet (75€/h)."}
          </p>
          {googleStatus === "connected" && (
            <p className="mt-1 text-sm text-green-600">Agenda connecté avec succès.</p>
          )}
          {googleStatus === "error" && (
            <p className="mt-1 text-sm text-red-600">Échec de connexion — vérifiez les identifiants Google OAuth.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {!connected ? (
            <JessicaSuperButton onClick={handleConnect} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              Connecter Google Agenda
            </JessicaSuperButton>
          ) : (
            <JessicaSuperButton onClick={handleSync} disabled={syncing} variant="outline">
              {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Synchroniser
            </JessicaSuperButton>
          )}
        </div>
      </div>
    </div>
  );
}
