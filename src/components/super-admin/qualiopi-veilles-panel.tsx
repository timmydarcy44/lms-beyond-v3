"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Highlighter, Link2, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  QUALIOPI_CARD,
  QUALIOPI_CARD_INNER,
  QUALIOPI_MUTED,
} from "@/components/super-admin/qualiopi/qualiopi-audit-styles";
import {
  VEILLE_KIND_HINTS,
  VEILLE_KIND_LABELS,
  VEILLE_KINDS,
  type VeilleDigest,
  type VeilleDigestItem,
  type VeilleHighlight,
  type VeilleKind,
  type VeilleSource,
} from "@/lib/qualiopi/veille-shared";

export function QualiopiVeillesPanel() {
  const [kind, setKind] = useState<VeilleKind>("legale");
  const [sources, setSources] = useState<VeilleSource[]>([]);
  const [digests, setDigests] = useState<VeilleDigest[]>([]);
  const [highlights, setHighlights] = useState<VeilleHighlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sourcesRes, digestsRes, highlightsRes] = await Promise.all([
        fetch("/api/super-admin/crm/qualiopi/veilles/sources"),
        fetch("/api/super-admin/crm/qualiopi/veilles/digests"),
        fetch("/api/super-admin/crm/qualiopi/veilles/highlights"),
      ]);
      const sourcesJson = await sourcesRes.json();
      const digestsJson = await digestsRes.json();
      const highlightsJson = await highlightsRes.json();
      if (!sourcesRes.ok) throw new Error(sourcesJson.error || "Sources");
      if (!digestsRes.ok) throw new Error(digestsJson.error || "Synthèses");
      if (!highlightsRes.ok) throw new Error(highlightsJson.error || "Surlignages");
      setSources(sourcesJson.sources ?? []);
      setDigests(
        (digestsJson.digests ?? []).map((row: VeilleDigest & { items?: unknown }) => ({
          ...row,
          items: Array.isArray(row.items) ? row.items : [],
        })),
      );
      setHighlights(highlightsJson.highlights ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const kindSources = useMemo(() => sources.filter((row) => row.kind === kind), [sources, kind]);
  const kindDigests = useMemo(() => digests.filter((row) => row.kind === kind), [digests, kind]);
  const latest = kindDigests[0] ?? null;
  const kindHighlights = useMemo(
    () => highlights.filter((row) => row.kind === kind),
    [highlights, kind],
  );

  const addSource = async () => {
    const res = await fetch("/api/super-admin/crm/qualiopi/veilles/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, url, title, is_priority: true }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Ajout impossible");
      return;
    }
    setUrl("");
    setTitle("");
    toast.success("URL prioritaire ajoutée");
    await load();
  };

  const removeSource = async (id: string) => {
    const res = await fetch(`/api/super-admin/crm/qualiopi/veilles/sources/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      toast.error(json.error || "Suppression impossible");
      return;
    }
    await load();
  };

  const runNow = async (sendEmail: boolean) => {
    setRunning(true);
    try {
      const res = await fetch("/api/super-admin/crm/qualiopi/veilles/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendEmail }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Échec");
      toast.success(sendEmail ? "Synthèse générée et mail envoyé" : "Synthèse générée");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Échec");
    } finally {
      setRunning(false);
    }
  };

  const saveHighlight = async (payload: {
    kind: VeilleKind;
    digest_id?: string | null;
    title: string;
    excerpt: string;
    url?: string | null;
  }) => {
    const res = await fetch("/api/super-admin/crm/qualiopi/veilles/highlights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Surlignage impossible");
      return;
    }
    toast.success("Information surlignée");
    await load();
  };

  const highlightItem = async (digest: VeilleDigest, item: VeilleDigestItem) => {
    await saveHighlight({
      kind: digest.kind,
      digest_id: digest.id,
      title: item.title,
      excerpt: item.summary,
      url: item.url ?? null,
    });
  };

  const highlightSelection = async () => {
    if (!latest) return;
    const selected = typeof window !== "undefined" ? window.getSelection()?.toString().trim() : "";
    if (!selected || selected.length < 8) {
      toast.error("Sélectionnez un passage dans la synthèse (8 caractères min.)");
      return;
    }
    await saveHighlight({
      kind: latest.kind,
      digest_id: latest.id,
      title: selected.slice(0, 80) + (selected.length > 80 ? "…" : ""),
      excerpt: selected.slice(0, 2000),
      url: null,
    });
  };

  const updateHighlight = async (id: string, patch: { note?: string; status?: VeilleHighlight["status"] }) => {
    const res = await fetch(`/api/super-admin/crm/qualiopi/veilles/highlights/${id}`, {
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

  const deleteHighlight = async (id: string) => {
    const res = await fetch(`/api/super-admin/crm/qualiopi/veilles/highlights/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      toast.error(json.error || "Suppression impossible");
      return;
    }
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Veilles Qualiopi</h1>
          <p className={cn("mt-1 max-w-2xl text-sm", QUALIOPI_MUTED)}>
            Légale, métier et pédagogie. URL prioritaires + recherche web. Synthèse envoyée chaque lundi matin.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={running}
            onClick={() => void runNow(false)}
            className="border-white/15 bg-transparent text-white hover:bg-white/5"
          >
            {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Générer maintenant
          </Button>
          <Button
            type="button"
            disabled={running}
            onClick={() => void runNow(true)}
            className="bg-[#6E5BFF] text-white hover:bg-[#5a49e6]"
          >
            Générer + envoyer le mail
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {VEILLE_KINDS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setKind(value)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold",
              kind === value ? "bg-[#6E5BFF] text-white" : "border border-white/10 text-white/70 hover:bg-white/5",
            )}
          >
            {VEILLE_KIND_LABELS[value]}
          </button>
        ))}
      </div>

      <p className={cn("text-sm", QUALIOPI_MUTED)}>{VEILLE_KIND_HINTS[kind]}</p>

      {loading ? (
        <p className={cn("text-sm", QUALIOPI_MUTED)}>Chargement…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className={cn(QUALIOPI_CARD, "p-5")}>
            <h2 className="text-lg font-semibold text-white">URL prioritaires</h2>
            <p className={cn("mt-1 text-sm", QUALIOPI_MUTED)}>
              Ces pages sont lues en premier. Le reste vient de la recherche web.
            </p>
            <div className="mt-4 space-y-2">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Titre (optionnel)"
                className="w-full rounded-xl border border-white/10 bg-[#0B1122] px-3 py-2 text-sm text-white outline-none focus:border-[#6E5BFF]"
              />
              <div className="flex gap-2">
                <input
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://…"
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0B1122] px-3 py-2 text-sm text-white outline-none focus:border-[#6E5BFF]"
                />
                <Button type="button" onClick={() => void addSource()} className="bg-[#3D7BFF] text-white hover:bg-[#3568d4]">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <ul className="mt-4 space-y-2">
              {kindSources.length === 0 ? (
                <li className={cn("text-sm", QUALIOPI_MUTED)}>Aucune URL pour cette veille.</li>
              ) : (
                kindSources.map((source) => (
                  <li key={source.id} className={cn(QUALIOPI_CARD_INNER, "flex items-start gap-3 p-3")}>
                    <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-[#8C94B2]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{source.title || source.url}</p>
                      <a href={source.url} target="_blank" rel="noreferrer" className="truncate text-xs text-[#9BB0FF] hover:underline">
                        {source.url}
                      </a>
                    </div>
                    <button type="button" onClick={() => void removeSource(source.id)} className="text-white/40 hover:text-red-300" aria-label="Supprimer">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className={cn(QUALIOPI_CARD, "p-5")}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-white">Dernière synthèse</h2>
              {latest ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void highlightSelection()}
                  className="border-[#F2C15A]/35 bg-[#F2C15A]/10 text-[#F2C15A] hover:bg-[#F2C15A]/20"
                >
                  <Highlighter className="mr-1 h-3.5 w-3.5" />
                  Surligner la sélection
                </Button>
              ) : null}
            </div>
            {!latest ? (
              <p className={cn("mt-3 text-sm", QUALIOPI_MUTED)}>Pas encore de synthèse. Lancez une génération.</p>
            ) : (
              <div className="mt-3 space-y-3">
                <p className={cn("text-xs", QUALIOPI_MUTED)}>
                  Sélectionnez un passage puis cliquez « Surligner la sélection », ou utilisez le bouton sur chaque point.
                </p>
                <p className="text-xs text-white/40">
                  Semaine du {latest.week_start}
                  {latest.email_sent_at ? ` · mail envoyé` : ""}
                </p>
                <h3 className="font-semibold text-white">{latest.title}</h3>
                <p className="text-sm leading-relaxed text-white/70">{latest.summary}</p>
                <ul className="space-y-3">
                  {(latest.items ?? []).map((item) => (
                    <li key={item.id} className={cn(QUALIOPI_CARD_INNER, "p-3")}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white">
                            {item.isPriority ? <span className="mr-2 text-[10px] uppercase tracking-wide text-[#F2C15A]">Priorité</span> : null}
                            {item.title}
                          </p>
                          <p className="mt-1 text-sm text-white/65">{item.summary}</p>
                          {item.url ? (
                            <a href={item.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-[#9BB0FF] hover:underline">
                              {item.url}
                            </a>
                          ) : null}
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void highlightItem(latest, item)}
                          className="shrink-0 border-[#6E5BFF]/40 bg-[#6E5BFF]/10 text-[#d9d4ff] hover:bg-[#6E5BFF]/20"
                        >
                          <Highlighter className="mr-1 h-3.5 w-3.5" />
                          Surligner
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>
      )}

      <section className={cn(QUALIOPI_CARD, "p-5")}>
        <h2 className="text-lg font-semibold text-white">Informations surlignées</h2>
        <p className={cn("mt-1 text-sm", QUALIOPI_MUTED)}>
          À retravailler de votre côté (offre, procédure, support). C’est la preuve que la veille est exploitée.
        </p>
        <ul className="mt-4 space-y-3">
          {kindHighlights.length === 0 ? (
            <li className={cn("text-sm", QUALIOPI_MUTED)}>Rien de surligné pour cette veille.</li>
          ) : (
            kindHighlights.map((row) => (
              <li key={row.id} className={cn(QUALIOPI_CARD_INNER, "space-y-3 p-4")}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white">{row.title}</p>
                    <p className="mt-1 text-sm text-white/65">{row.excerpt}</p>
                    {row.url ? (
                      <a href={row.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-[#9BB0FF] hover:underline">
                        {row.url}
                      </a>
                    ) : null}
                  </div>
                  <select
                    value={row.status}
                    onChange={(event) =>
                      void updateHighlight(row.id, {
                        status: event.target.value as VeilleHighlight["status"],
                      })
                    }
                    className="rounded-full border border-white/10 bg-[#0B1122] px-3 py-1.5 text-xs text-white"
                  >
                    <option value="saved">Sauvegardé</option>
                    <option value="in_progress">En cours</option>
                    <option value="done">Traité</option>
                  </select>
                </div>
                <textarea
                  defaultValue={row.note ?? ""}
                  placeholder="Note de retravail…"
                  onBlur={(event) => {
                    const next = event.target.value.trim();
                    if (next !== (row.note ?? "").trim()) void updateHighlight(row.id, { note: next });
                  }}
                  className="min-h-20 w-full rounded-xl border border-white/10 bg-[#0B1122] px-3 py-2 text-sm text-white outline-none focus:border-[#6E5BFF]"
                />
                <button type="button" onClick={() => void deleteHighlight(row.id)} className="text-xs text-red-300 hover:underline">
                  Supprimer
                </button>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
