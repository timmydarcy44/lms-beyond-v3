"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Highlighter, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  QUALIOPI_CARD,
  QUALIOPI_CARD_INNER,
  QUALIOPI_MUTED,
} from "@/components/super-admin/qualiopi/qualiopi-audit-styles";
import {
  VEILLE_AXES,
  VEILLE_KIND,
  VEILLE_THEME_LABELS,
  type VeilleDigest,
  type VeilleDigestItem,
  type VeilleHighlight,
  type VeilleSource,
  type VeilleTheme,
} from "@/lib/qualiopi/veille-shared";

const HIGHLIGHT_THEMES: VeilleTheme[] = ["reglementaire", "metier", "pedagogie", "transversal"];
const MS_90_DAYS = 90 * 24 * 60 * 60 * 1000;

function nextMondayLabel(from = new Date()): string {
  const d = new Date(from);
  const day = d.getDay();
  const add = day === 1 ? 7 : (8 - day) % 7 || 7;
  d.setDate(d.getDate() + add);
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

export function QualiopiVeillesPanel() {
  const [sources, setSources] = useState<VeilleSource[]>([]);
  const [digests, setDigests] = useState<VeilleDigest[]>([]);
  const [highlights, setHighlights] = useState<VeilleHighlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [sourcesOpen, setSourcesOpen] = useState(false);

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

  const latest = useMemo(() => {
    const unified = digests.find((row) => row.kind === VEILLE_KIND);
    return unified ?? digests[0] ?? null;
  }, [digests]);

  const digests90 = useMemo(() => {
    const since = Date.now() - MS_90_DAYS;
    return digests.filter((row) => Date.parse(row.created_at || row.week_start) >= since);
  }, [digests]);

  const digestsLookStale = useMemo(() => {
    if (!latest?.created_at) return true;
    const ageMs = Date.now() - Date.parse(latest.created_at);
    return !Number.isFinite(ageMs) || ageMs > 10 * 24 * 60 * 60 * 1000;
  }, [latest]);

  const axisStats = useMemo(() => {
    return VEILLE_AXES.map((axis) => {
      const itemsInLatest = (latest?.items ?? []).filter((item) => item.theme === axis.theme).length;
      const treated = highlights.filter(
        (row) => row.theme === axis.theme && row.status === "done",
      ).length;
      const saved = highlights.filter(
        (row) => row.theme === axis.theme && row.status !== "done",
      ).length;
      return { ...axis, itemsInLatest, treated, saved };
    });
  }, [highlights, latest]);

  const itemsByTheme = useMemo(() => {
    const map: Record<VeilleTheme, VeilleDigestItem[]> = {
      reglementaire: [],
      metier: [],
      pedagogie: [],
      transversal: [],
    };
    for (const item of latest?.items ?? []) {
      const theme = (item.theme as VeilleTheme | null | undefined) ?? "transversal";
      map[theme].push(item);
    }
    return map;
  }, [latest]);

  const addSource = async () => {
    const res = await fetch("/api/super-admin/crm/qualiopi/veilles/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: VEILLE_KIND, url, title, is_priority: true }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Ajout impossible");
      return;
    }
    setUrl("");
    setTitle("");
    toast.success("Source RAG 1 ajoutée");
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
      toast.success(
        sendEmail
          ? "Veille générée et mail récap envoyé"
          : "Veille automatique terminée — synthèses à jour",
      );
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Échec");
    } finally {
      setRunning(false);
    }
  };

  const saveHighlight = async (payload: {
    digest_id?: string | null;
    title: string;
    excerpt: string;
    url?: string | null;
    theme?: VeilleTheme | null;
  }) => {
    const res = await fetch("/api/super-admin/crm/qualiopi/veilles/highlights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: VEILLE_KIND, ...payload }),
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
      digest_id: digest.id,
      title: item.title,
      excerpt: item.summary,
      url: item.url ?? null,
      theme: (item.theme as VeilleTheme | null | undefined) ?? "transversal",
    });
  };

  const highlightSelection = async () => {
    if (!latest) return;
    const selected = typeof window !== "undefined" ? window.getSelection()?.toString().trim() : "";
    if (!selected || selected.length < 8) {
      toast.error("Sélectionnez un passage (8 caractères min.)");
      return;
    }
    await saveHighlight({
      digest_id: latest.id,
      title: selected.slice(0, 80) + (selected.length > 80 ? "…" : ""),
      excerpt: selected.slice(0, 2000),
      url: null,
    });
  };

  const updateHighlight = async (
    id: string,
    patch: { note?: string; status?: VeilleHighlight["status"]; theme?: VeilleTheme },
  ) => {
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
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Veille Qualiopi</h1>
          <p className={cn("mt-1 max-w-2xl text-sm", QUALIOPI_MUTED)}>
            Trois axes (ind. 23, 24, 25) : légale & réglementaire, compétences & métiers, innovations
            pédagogiques. Recherche auto (sources + web) → synthèse → surlignage « Traité ».
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={running}
            onClick={() => void runNow(false)}
            className="bg-[#6E5BFF] text-white hover:bg-[#5a49e6]"
          >
            {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Lancer une recherche
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={running}
            onClick={() => void runNow(true)}
            className="border-white/15 bg-transparent text-white hover:bg-white/5"
          >
            Générer + envoyer le mail
          </Button>
        </div>
      </div>

      <section className={cn(QUALIOPI_CARD, "grid gap-3 p-4 sm:grid-cols-3")}>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">Automatique</p>
          <p className="mt-1 text-sm text-white/85">
            Chaque <strong className="font-semibold text-white">lundi matin</strong> : recherche + synthèse
            + mail récap.
          </p>
          <p className="mt-1 text-xs text-white/45">Prochain passage : {nextMondayLabel()}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">À la demande</p>
          <p className="mt-1 text-sm text-white/85">
            <strong className="font-semibold text-white">Lancer une recherche</strong> refait la même
            veille automatique (sans attendre le lundi).
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">Preuve 90 j</p>
          <p className="mt-1 text-sm text-white/85">
            <strong className="font-semibold text-white">{digests90.length}</strong> synthèse(s) sur 90 jours
            {latest?.email_sent_at ? " · dernier mail envoyé" : ""}.
          </p>
        </div>
      </section>

      {digestsLookStale ? (
        <div className="rounded-2xl border border-[#5A4A1E] bg-[#2A2410] px-4 py-3 text-sm text-[#F2CF6B]">
          Synthèse absente ou trop ancienne (&gt; 10 j). Cliquez{" "}
          <strong className="font-semibold">Lancer une recherche</strong> pour actualiser les 3 axes, puis
          surlignez ce qui compte.
        </div>
      ) : null}

      {loading ? (
        <p className={cn("text-sm", QUALIOPI_MUTED)}>Chargement…</p>
      ) : (
        <>
          <section className="grid gap-3 lg:grid-cols-3">
            {axisStats.map((axis) => (
              <article key={axis.theme} className={cn(QUALIOPI_CARD, "p-4")}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                  Ind. {axis.indicatorId}
                </p>
                <h2 className="mt-1 text-base font-semibold text-white">{axis.title}</h2>
                <p className={cn("mt-1 text-xs leading-relaxed", QUALIOPI_MUTED)}>{axis.description}</p>
                <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-white/[0.04] px-2 py-2">
                    <dt className="text-[10px] uppercase tracking-wide text-white/40">Semaine</dt>
                    <dd className="mt-0.5 text-lg font-semibold text-white">{axis.itemsInLatest}</dd>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] px-2 py-2">
                    <dt className="text-[10px] uppercase tracking-wide text-white/40">Traité</dt>
                    <dd className="mt-0.5 text-lg font-semibold text-[#6BE39B]">{axis.treated}</dd>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] px-2 py-2">
                    <dt className="text-[10px] uppercase tracking-wide text-white/40">En cours</dt>
                    <dd className="mt-0.5 text-lg font-semibold text-[#F2C15A]">{axis.saved}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </section>

          <section className={cn(QUALIOPI_CARD, "p-5")}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-white">Synthèse de la semaine</h2>
                {latest ? (
                  <p className="mt-1 text-xs text-white/40">
                    Semaine du {latest.week_start}
                    {latest.email_sent_at ? " · mail récap envoyé" : " · mail non envoyé"}
                  </p>
                ) : null}
              </div>
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
              <p className={cn("mt-4 text-sm", QUALIOPI_MUTED)}>
                Pas encore de synthèse. Cliquez « Lancer une recherche » (ou attendez le lundi matin).
              </p>
            ) : (
              <div className="mt-4 space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-white">{latest.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/75">{latest.summary}</p>
                </div>

                {VEILLE_AXES.map((axis) => {
                  const items = itemsByTheme[axis.theme];
                  return (
                    <div key={axis.theme} className="space-y-3">
                      <div className="flex flex-wrap items-baseline gap-2 border-b border-white/10 pb-2">
                        <h4 className="text-sm font-semibold text-white">{axis.title}</h4>
                        <span className="text-[11px] text-white/40">Ind. {axis.indicatorId}</span>
                        <span className="text-[11px] text-white/35">{items.length} info(s)</span>
                      </div>
                      {items.length === 0 ? (
                        <p className={cn("text-sm", QUALIOPI_MUTED)}>
                          Aucun item sur cet axe dans la dernière synthèse — relancez une recherche.
                        </p>
                      ) : (
                        <ul className="space-y-3">
                          {items.map((item) => (
                            <li key={item.id} className={cn(QUALIOPI_CARD_INNER, "p-4")}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 space-y-1.5">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={cn(
                                        "rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide",
                                        item.rag === "rag1"
                                          ? "bg-[#F2C15A]/15 text-[#F2C15A]"
                                          : "bg-white/5 text-white/45",
                                      )}
                                    >
                                      {item.rag === "rag1" ? "Sources prioritaires" : "Web"}
                                    </span>
                                  </div>
                                  <p className="text-sm font-semibold text-white">{item.title}</p>
                                  <p className="text-sm leading-relaxed text-white/65">{item.summary}</p>
                                  {item.url ? (
                                    <a
                                      href={item.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-block text-xs text-[#9BB0FF] hover:underline"
                                    >
                                      Lire la source
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
                      )}
                    </div>
                  );
                })}

                {itemsByTheme.transversal.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="border-b border-white/10 pb-2 text-sm font-semibold text-white">
                      Transversal
                    </h4>
                    <ul className="space-y-3">
                      {itemsByTheme.transversal.map((item) => (
                        <li key={item.id} className={cn(QUALIOPI_CARD_INNER, "p-4")}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 space-y-1.5">
                              <p className="text-sm font-semibold text-white">{item.title}</p>
                              <p className="text-sm leading-relaxed text-white/65">{item.summary}</p>
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
                ) : null}
              </div>
            )}
          </section>

          {digests90.length > 1 ? (
            <section className={cn(QUALIOPI_CARD, "p-5")}>
              <h2 className="text-lg font-semibold text-white">Historique 90 jours</h2>
              <p className={cn("mt-1 text-sm", QUALIOPI_MUTED)}>
                Preuve des synthèses hebdomadaires (lundi auto + recherches manuelles).
              </p>
              <ul className="mt-4 divide-y divide-white/8">
                {digests90.map((row) => (
                  <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                    <span className="text-white/85">
                      Semaine du {row.week_start}
                      <span className="ml-2 text-white/40">{row.title}</span>
                    </span>
                    <span className="text-xs text-white/40">
                      {(row.items ?? []).length} info(s)
                      {row.email_sent_at ? " · mail" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className={cn(QUALIOPI_CARD, "overflow-hidden")}>
            <button
              type="button"
              onClick={() => setSourcesOpen((open) => !open)}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
            >
              <div>
                <h2 className="text-base font-semibold text-white">Sources prioritaires</h2>
                <p className={cn("mt-0.5 text-sm", QUALIOPI_MUTED)}>
                  URLs lues en priorité à chaque recherche. Le web complète le reste.
                </p>
              </div>
              <div className="flex items-center gap-2 text-white/50">
                <span className="text-xs">{sources.length}</span>
                <ChevronDown className={cn("h-4 w-4 transition", sourcesOpen && "rotate-180")} />
              </div>
            </button>
            {sourcesOpen ? (
              <div className="space-y-3 border-t border-white/10 px-5 py-4">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Libellé (optionnel)"
                    className="w-full rounded-xl border border-white/10 bg-[#0B1122] px-3 py-2 text-sm text-white outline-none focus:border-[#6E5BFF] sm:max-w-[200px]"
                  />
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
                <ul className="space-y-2">
                  {sources.length === 0 ? (
                    <li className={cn("text-sm", QUALIOPI_MUTED)}>Aucune source prioritaire pour l’instant.</li>
                  ) : (
                    sources.map((source) => (
                      <li key={source.id} className="flex items-center justify-between gap-3 text-sm text-white/70">
                        <span className="min-w-0 truncate">{source.title || source.url}</span>
                        <button
                          type="button"
                          onClick={() => void removeSource(source.id)}
                          className="text-white/35 hover:text-red-300"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            ) : null}
          </section>
        </>
      )}

      <section className={cn(QUALIOPI_CARD, "p-5")}>
        <h2 className="text-lg font-semibold text-white">Informations surlignées</h2>
        <p className={cn("mt-1 text-sm", QUALIOPI_MUTED)}>
          Choisissez l’axe (23 / 24 / 25) et passez en « Traité » pour prouver l’exploitation de la veille.
        </p>
        <ul className="mt-4 space-y-3">
          {highlights.length === 0 ? (
            <li className={cn("text-sm", QUALIOPI_MUTED)}>Rien de surligné pour l’instant.</li>
          ) : (
            highlights.map((row) => (
              <li key={row.id} className={cn(QUALIOPI_CARD_INNER, "space-y-3 p-4")}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white">{row.title}</p>
                    <p className="mt-1 text-sm text-white/65">{row.excerpt}</p>
                    {row.url ? (
                      <a href={row.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-[#9BB0FF] hover:underline">
                        Lire la source
                      </a>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={row.theme ?? "transversal"}
                      onChange={(event) =>
                        void updateHighlight(row.id, {
                          theme: event.target.value as VeilleTheme,
                        })
                      }
                      className="rounded-full border border-white/10 bg-[#0B1122] px-3 py-1.5 text-xs text-white"
                    >
                      {HIGHLIGHT_THEMES.map((theme) => (
                        <option key={theme} value={theme}>
                          {VEILLE_THEME_LABELS[theme]}
                        </option>
                      ))}
                    </select>
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
