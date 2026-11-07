"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseFetchJson } from "@/lib/api/parse-fetch-json";
import type { QualiopiSession } from "@/lib/crm/qualiopi-shared";

/** Board legacy : conversion manuelle vers Dossiers, puis redirection Programmation. */
export default function CrmFormationsLegacyPage() {
  const [sessions, setSessions] = useState<QualiopiSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/crm/qualiopi/sessions");
      const json = await parseFetchJson<{ sessions?: QualiopiSession[]; error?: string }>(res);
      if (!res.ok) throw new Error(json.error);
      setSessions(json.sessions ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const convert = async (sessionId: string) => {
    setConverting(sessionId);
    try {
      const res = await fetch("/api/super-admin/crm/formation-dossiers/convert-legacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const json = await parseFetchJson<{ dossierId?: string; already?: boolean; error?: string }>(
        res,
      );
      if (!res.ok) throw new Error(json.error);
      toast.success(
        json.already ? "Déjà converti — dossier existant" : "Converti en dossier formation",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Conversion impossible");
    } finally {
      setConverting(null);
    }
  };

  return (
    <div className="min-h-screen space-y-6 bg-[#0A0C1B] px-3 py-6 text-[#F3F4FA] sm:px-6 sm:py-8">
      <div className="rounded-2xl border border-[#262A4A] bg-[#141731] p-5">
        <h1 className="text-2xl font-bold">Formations (legacy Qualiopi)</h1>
        <p className="mt-2 max-w-3xl text-sm text-[#A3A8C7]">
          Le cockpit ops est désormais{" "}
          <Link href="/super/crm/programmation" className="text-[#B7AEFF] underline">
            Programmation
          </Link>
          . Convertissez ici les sessions déjà programmées, puis utilisez le nouveau Kanban.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild className="bg-[#6C5CF5] text-white hover:bg-[#5B4DE0]">
            <Link href="/super/crm/programmation">
              Aller à Programmation
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-[#262A4A] bg-transparent text-[#F3F4FA]"
            onClick={() => void load()}
          >
            <RefreshCw className="mr-1 h-4 w-4" />
            Rafraîchir
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-[#A3A8C7]">Chargement…</p>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-[#A3A8C7]">Aucune session Qualiopi active.</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <article
              key={session.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#262A4A] bg-[#141731] px-4 py-3"
            >
              <div>
                <p className="font-semibold">{session.company_name}</p>
                <p className="text-sm text-[#A3A8C7]">
                  {session.course_name}
                  {session.scheduled_at ? ` · ${session.scheduled_at}` : ""}
                  {` · ${session.status}`}
                </p>
              </div>
              <Button
                type="button"
                disabled={converting === session.id}
                className="bg-[#6C5CF5] text-white hover:bg-[#5B4DE0]"
                onClick={() => void convert(session.id)}
              >
                {converting === session.id ? "Conversion…" : "Convertir en dossier"}
              </Button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
