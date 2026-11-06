"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  QUALIOPI_CARD,
  QUALIOPI_CARD_INNER,
  QUALIOPI_MUTED,
} from "@/components/super-admin/qualiopi/qualiopi-audit-styles";
import { cn } from "@/lib/utils";

type Reclamation = {
  id: string;
  subject: string;
  requester_name: string | null;
  status: "open" | "in_progress" | "closed";
  channel: string;
  audience?: string | null;
  description: string;
  response: string | null;
  received_at: string;
};

type Action = {
  id: string;
  title: string;
  cause: string | null;
  owner_name: string | null;
  due_at: string | null;
  status: "todo" | "doing" | "done";
  source: string;
  reviewed_at: string | null;
};

export function QualiopiQualitePanel() {
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [actionTitle, setActionTitle] = useState("");
  const [actionCause, setActionCause] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, aRes] = await Promise.all([
        fetch("/api/super-admin/crm/qualiopi/reclamations"),
        fetch("/api/super-admin/crm/qualiopi/actions"),
      ]);
      const rJson = await rRes.json();
      const aJson = await aRes.json();
      if (!rRes.ok) throw new Error(rJson.error || "Réclamations");
      if (!aRes.ok) throw new Error(aJson.error || "Actions");
      setReclamations(rJson.reclamations ?? []);
      setActions(aJson.actions ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const addReclamation = async () => {
    const res = await fetch("/api/super-admin/crm/qualiopi/reclamations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, description, channel: "autre" }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Création impossible");
      return;
    }
    setSubject("");
    setDescription("");
    toast.success("Réclamation enregistrée");
    await load();
  };

  const patchReclamation = async (id: string, patch: Record<string, unknown>) => {
    const res = await fetch(`/api/super-admin/crm/qualiopi/reclamations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      toast.error(json.error || "Mise à jour impossible");
      return;
    }
    await load();
  };

  const addAction = async (source: string = "manual") => {
    const res = await fetch("/api/super-admin/crm/qualiopi/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: actionTitle, cause: actionCause, source }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Création impossible");
      return;
    }
    setActionTitle("");
    setActionCause("");
    toast.success("Action PAQ créée");
    await load();
  };

  const markRevue = async () => {
    const res = await fetch("/api/super-admin/crm/qualiopi/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `Revue qualité ${new Date().toISOString().slice(0, 10)}`,
        cause: "Comité / revue mensuelle",
        source: "revue",
        status: "done",
      }),
    });
    // create as done via patch
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Revue impossible");
      return;
    }
    await fetch(`/api/super-admin/crm/qualiopi/actions/${json.action.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done", mark_reviewed: true }),
    });
    toast.success("Revue qualité enregistrée");
    await load();
  };

  const patchAction = async (id: string, patch: Record<string, unknown>) => {
    const res = await fetch(`/api/super-admin/crm/qualiopi/actions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      toast.error(json.error || "Mise à jour impossible");
      return;
    }
    await load();
  };

  const exportRegistre = () => {
    const lines = [
      "Registre des réclamations Byound",
      `Export ${new Date().toISOString()}`,
      "",
      ...reclamations.map(
        (r) =>
          `- [${r.status}] ${r.received_at.slice(0, 10)} | ${r.subject} | ${r.requester_name || "—"} | ${r.channel}`,
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registre-reclamations-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Qualité — réclamations & PAQ</h1>
          <p className={cn("mt-1 max-w-2xl text-sm", QUALIOPI_MUTED)}>
            Indicateurs 31 et 32. Registre même vide = preuve de process. Une revue mensuelle suffit pour démarrer.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={exportRegistre} className="border-white/15 bg-transparent text-white">
            Exporter le registre
          </Button>
          <Button type="button" onClick={() => void markRevue()} className="bg-[#6E5BFF] text-white hover:bg-[#5a49e6]">
            Enregistrer une revue qualité
          </Button>
        </div>
      </div>

      {loading ? (
        <p className={cn("flex items-center gap-2 text-sm", QUALIOPI_MUTED)}>
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className={cn(QUALIOPI_CARD, "p-5")}>
            <h2 className="text-lg font-semibold text-white">Réclamations</h2>
            <div className="mt-3 space-y-2">
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Objet"
                className="w-full rounded-xl border border-white/10 bg-[#0B1122] px-3 py-2 text-sm text-white outline-none focus:border-[#6E5BFF]"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                className="min-h-20 w-full rounded-xl border border-white/10 bg-[#0B1122] px-3 py-2 text-sm text-white outline-none focus:border-[#6E5BFF]"
              />
              <Button type="button" onClick={() => void addReclamation()} className="bg-[#3D7BFF] text-white">
                <Plus className="mr-1 h-4 w-4" /> Enregistrer
              </Button>
            </div>
            <ul className="mt-4 space-y-2">
              {reclamations.length === 0 ? (
                <li className={cn("text-sm", QUALIOPI_MUTED)}>Aucune réclamation — registre prêt.</li>
              ) : (
                reclamations.map((row) => (
                  <li key={row.id} className={cn(QUALIOPI_CARD_INNER, "space-y-2 p-3")}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-white">{row.subject}</p>
                        <p className={cn("text-xs", QUALIOPI_MUTED)}>
                          {row.received_at.slice(0, 10)} · {row.channel}
                          {row.audience ? ` · ${row.audience}` : ""}
                          {row.requester_name ? ` · ${row.requester_name}` : ""}
                        </p>
                      </div>
                      <select
                        value={row.status}
                        onChange={(e) => void patchReclamation(row.id, { status: e.target.value })}
                        className="rounded-full border border-white/10 bg-[#0B1122] px-2 py-1 text-xs text-white"
                      >
                        <option value="open">Ouverte</option>
                        <option value="in_progress">En cours</option>
                        <option value="closed">Clôturée</option>
                      </select>
                    </div>
                    {row.description ? <p className="text-sm text-white/65">{row.description}</p> : null}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 border-white/15 text-[11px] text-white/70"
                      onClick={() => void patchReclamation(row.id, { ack: true, status: "in_progress" })}
                    >
                      Accuser réception
                    </Button>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className={cn(QUALIOPI_CARD, "p-5")}>
            <h2 className="text-lg font-semibold text-white">Plan d’actions</h2>
            <div className="mt-3 space-y-2">
              <input
                value={actionTitle}
                onChange={(e) => setActionTitle(e.target.value)}
                placeholder="Action"
                className="w-full rounded-xl border border-white/10 bg-[#0B1122] px-3 py-2 text-sm text-white outline-none focus:border-[#6E5BFF]"
              />
              <input
                value={actionCause}
                onChange={(e) => setActionCause(e.target.value)}
                placeholder="Cause / origine"
                className="w-full rounded-xl border border-white/10 bg-[#0B1122] px-3 py-2 text-sm text-white outline-none focus:border-[#6E5BFF]"
              />
              <Button type="button" onClick={() => void addAction()} className="bg-[#3D7BFF] text-white">
                <Plus className="mr-1 h-4 w-4" /> Ajouter
              </Button>
            </div>
            <ul className="mt-4 space-y-2">
              {actions.length === 0 ? (
                <li className={cn("text-sm", QUALIOPI_MUTED)}>Aucune action — créez une revue ou une action.</li>
              ) : (
                actions.map((row) => (
                  <li key={row.id} className={cn(QUALIOPI_CARD_INNER, "flex items-start justify-between gap-2 p-3")}>
                    <div>
                      <p className="text-sm font-semibold text-white">{row.title}</p>
                      <p className={cn("text-xs", QUALIOPI_MUTED)}>
                        {row.source}
                        {row.cause ? ` · ${row.cause}` : ""}
                        {row.due_at ? ` · échéance ${row.due_at}` : ""}
                      </p>
                    </div>
                    <select
                      value={row.status}
                      onChange={(e) => void patchAction(row.id, { status: e.target.value })}
                      className="rounded-full border border-white/10 bg-[#0B1122] px-2 py-1 text-xs text-white"
                    >
                      <option value="todo">À faire</option>
                      <option value="doing">En cours</option>
                      <option value="done">Fait</option>
                    </select>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
