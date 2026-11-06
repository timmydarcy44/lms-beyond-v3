"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  QUALIOPI_CARD,
  QUALIOPI_CARD_INNER,
  QUALIOPI_MUTED,
} from "@/components/super-admin/qualiopi/qualiopi-audit-styles";
import {
  RECLAMATION_THEMES,
  RECLAMATION_THEME_LABELS,
  type ReclamationTheme,
} from "@/lib/qualiopi/reclamation-themes";
import { cn } from "@/lib/utils";

type Reclamation = {
  id: string;
  subject: string;
  requester_name: string | null;
  requester_email: string | null;
  status: "open" | "in_progress" | "closed";
  channel: string;
  audience?: string | null;
  theme?: ReclamationTheme | null;
  description: string;
  response: string | null;
  received_at: string;
  closed_at?: string | null;
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
  const [theme, setTheme] = useState<ReclamationTheme>("autre");
  const [themeFilter, setThemeFilter] = useState<ReclamationTheme | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);
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
      const list = (rJson.reclamations ?? []) as Reclamation[];
      setReclamations(list);
      setActions(aJson.actions ?? []);
      setSelectedId((prev) => {
        if (prev && list.some((r) => r.id === prev)) return prev;
        return list[0]?.id ?? null;
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (themeFilter === "all") return reclamations;
    return reclamations.filter((r) => (r.theme ?? "autre") === themeFilter);
  }, [reclamations, themeFilter]);

  const selected = useMemo(
    () => filtered.find((r) => r.id === selectedId) ?? filtered[0] ?? null,
    [filtered, selectedId],
  );

  useEffect(() => {
    setReply(selected?.response ?? "");
  }, [selected?.id, selected?.response]);

  const countsByTheme = useMemo(() => {
    const counts: Record<string, number> = { all: reclamations.length };
    for (const t of RECLAMATION_THEMES) counts[t] = 0;
    for (const r of reclamations) {
      const key = r.theme ?? "autre";
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [reclamations]);

  const addReclamation = async () => {
    const res = await fetch("/api/super-admin/crm/qualiopi/reclamations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, description, channel: "autre", theme }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Création impossible");
      return;
    }
    setSubject("");
    setDescription("");
    setTheme("autre");
    toast.success("Réclamation enregistrée");
    await load();
    if (json.reclamation?.id) setSelectedId(json.reclamation.id);
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
      return false;
    }
    await load();
    return true;
  };

  const sendReply = async (close: boolean) => {
    if (!selected) return;
    if (!reply.trim()) {
      toast.error("Saisissez une réponse");
      return;
    }
    setReplyBusy(true);
    try {
      const ok = await patchReclamation(selected.id, {
        response: reply.trim(),
        close,
        status: close ? "closed" : "in_progress",
        ack: true,
      });
      if (ok) toast.success(close ? "Réponse envoyée — réclamation clôturée" : "Réponse enregistrée");
    } finally {
      setReplyBusy(false);
    }
  };

  const addAction = async () => {
    const res = await fetch("/api/super-admin/crm/qualiopi/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: actionTitle, cause: actionCause, source: "manual" }),
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
      }),
    });
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
          `- [${r.status}] ${r.received_at.slice(0, 10)} | ${RECLAMATION_THEME_LABELS[(r.theme as ReclamationTheme) ?? "autre"]} | ${r.subject} | ${r.requester_name || "—"} | ${r.channel}${r.response ? ` | réponse: ${r.response.replace(/\s+/g, " ").slice(0, 120)}` : ""}`,
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
            Espace réclamation avec thématique + réponse. Classement : organisation, outil Byound, programmation,
            contenu, formateur, autre.
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
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setThemeFilter("all")}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold",
                themeFilter === "all" ? "bg-[#6E5BFF] text-white" : "border border-white/10 text-white/60 hover:bg-white/5",
              )}
            >
              Toutes ({countsByTheme.all ?? 0})
            </button>
            {RECLAMATION_THEMES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setThemeFilter(t)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold",
                  themeFilter === t ? "bg-[#6E5BFF] text-white" : "border border-white/10 text-white/60 hover:bg-white/5",
                )}
              >
                {RECLAMATION_THEME_LABELS[t]} ({countsByTheme[t] ?? 0})
              </button>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1.1fr_0.9fr]">
            <section className={cn(QUALIOPI_CARD, "p-5")}>
              <h2 className="text-lg font-semibold text-white">Réclamations</h2>
              <div className="mt-3 space-y-2">
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as ReclamationTheme)}
                  className="w-full rounded-xl border border-white/10 bg-[#0B1122] px-3 py-2 text-sm text-white"
                >
                  {RECLAMATION_THEMES.map((t) => (
                    <option key={t} value={t}>
                      {RECLAMATION_THEME_LABELS[t]}
                    </option>
                  ))}
                </select>
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
              <ul className="mt-4 max-h-[420px] space-y-2 overflow-y-auto">
                {filtered.length === 0 ? (
                  <li className={cn("text-sm", QUALIOPI_MUTED)}>Aucune réclamation — registre prêt.</li>
                ) : (
                  filtered.map((row) => (
                    <li key={row.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(row.id)}
                        className={cn(
                          QUALIOPI_CARD_INNER,
                          "w-full space-y-1 p-3 text-left",
                          selected?.id === row.id ? "border-[#6E5BFF]/50 bg-[#6E5BFF]/10" : "",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-white">{row.subject}</p>
                          <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase text-white/50">
                            {row.status}
                          </span>
                        </div>
                        <p className={cn("text-xs", QUALIOPI_MUTED)}>
                          {RECLAMATION_THEME_LABELS[(row.theme as ReclamationTheme) ?? "autre"]} ·{" "}
                          {row.received_at.slice(0, 10)}
                          {row.audience ? ` · ${row.audience}` : ""}
                        </p>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </section>

            <section className={cn(QUALIOPI_CARD, "p-5")}>
              <h2 className="text-lg font-semibold text-white">Détail & réponse</h2>
              {!selected ? (
                <p className={cn("mt-4 text-sm", QUALIOPI_MUTED)}>Sélectionnez une réclamation.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-base font-semibold text-white">{selected.subject}</p>
                    <p className={cn("mt-1 text-xs", QUALIOPI_MUTED)}>
                      {selected.requester_name || "Anonyme"}
                      {selected.requester_email ? ` · ${selected.requester_email}` : ""}
                      {selected.audience ? ` · ${selected.audience}` : ""} · {selected.channel}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={selected.theme ?? "autre"}
                      onChange={(e) => void patchReclamation(selected.id, { theme: e.target.value })}
                      className="rounded-full border border-white/10 bg-[#0B1122] px-3 py-1.5 text-xs text-white"
                    >
                      {RECLAMATION_THEMES.map((t) => (
                        <option key={t} value={t}>
                          {RECLAMATION_THEME_LABELS[t]}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selected.status}
                      onChange={(e) => void patchReclamation(selected.id, { status: e.target.value })}
                      className="rounded-full border border-white/10 bg-[#0B1122] px-3 py-1.5 text-xs text-white"
                    >
                      <option value="open">Ouverte</option>
                      <option value="in_progress">En cours</option>
                      <option value="closed">Clôturée</option>
                    </select>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 border-white/15 text-[11px] text-white/70"
                      onClick={() => void patchReclamation(selected.id, { ack: true, status: "in_progress" })}
                    >
                      Accuser réception
                    </Button>
                  </div>
                  <div className={cn(QUALIOPI_CARD_INNER, "p-3")}>
                    <p className={cn("text-[11px] uppercase tracking-wide", QUALIOPI_MUTED)}>Réclamation</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-white/80">{selected.description || "—"}</p>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-white">Répondre</p>
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Votre réponse au demandeur…"
                      className="min-h-28 w-full rounded-xl border border-white/10 bg-[#0B1122] px-3 py-2 text-sm text-white outline-none focus:border-[#6E5BFF]"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        disabled={replyBusy}
                        onClick={() => void sendReply(true)}
                        className="bg-[#6E5BFF] text-white hover:bg-[#5a49e6]"
                      >
                        {replyBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Répondre et clôturer
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={replyBusy}
                        onClick={() => void sendReply(false)}
                        className="border-white/15 bg-transparent text-white"
                      >
                        Enregistrer la réponse
                      </Button>
                    </div>
                    {selected.response ? (
                      <p className={cn("mt-3 text-xs", QUALIOPI_MUTED)}>
                        Dernière réponse enregistrée
                        {selected.closed_at ? ` · clôturée le ${selected.closed_at.slice(0, 10)}` : ""}.
                      </p>
                    ) : null}
                  </div>
                </div>
              )}
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
        </>
      )}
    </div>
  );
}
