"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { SeoFaqItem, SeoPageRecord } from "@/lib/seo/byound-seo";

type Row = SeoPageRecord & { label: string; group: string; score: number; issues: string[] };
const field = "w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none";

export function SeoConsole() {
  const [pages, setPages] = useState<Row[]>([]);
  const [path, setPath] = useState("/");
  const [draft, setDraft] = useState<SeoPageRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const selected = pages.find((item) => item.path === path) ?? null;
  const groups = useMemo(() => [...new Set(pages.map((item) => item.group))], [pages]);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/super-admin/seo", { cache: "no-store" });
    const json = await res.json();
    setPages(json.pages ?? []);
    setHint(json.error ?? null);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    if (!selected) return;
    setDraft({ ...selected, faq: selected.faq.length ? selected.faq : [{ question: "", answer: "" }] });
  }, [selected?.path]);

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await fetch("/api/super-admin/seo", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Enregistrement impossible");
      toast.success(json.error ? json.error : "SEO enregistré");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Enregistrement impossible");
    } finally { setSaving(false); }
  };

  const generate = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await fetch("/api/super-admin/seo/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: draft.path }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Génération impossible");
      setDraft((current) => (current ? { ...current, ...json.draft, path: current.path } : current));
      toast.success("Proposition IA prête — vérifiez puis enregistrez.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Génération impossible");
    } finally { setSaving(false); }
  };

  if (loading) return <p className="flex items-center gap-2 text-sm text-neutral-500"><Loader2 className="h-4 w-4 animate-spin" /> Chargement…</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-2xl border border-neutral-200 bg-white p-3">
        {hint ? <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">{hint}</p> : null}
        {groups.map((group) => (
          <div key={group} className="mb-3">
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{group}</p>
            {pages.filter((item) => item.group === group).map((item) => (
              <button key={item.path} type="button" onClick={() => setPath(item.path)} className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm ${path === item.path ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-50"}`}>
                <span className="truncate">{item.label}</span>
                <span className="ml-2 text-[11px] tabular-nums opacity-70">{item.score}</span>
              </button>
            ))}
          </div>
        ))}
      </aside>
      {draft ? (
        <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs text-neutral-400">{draft.path}</p>
              <h2 className="text-xl font-semibold">{selected?.label}</h2>
              <p className="mt-1 text-sm text-neutral-500">Score {selected?.score}/100</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => void generate()} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold"><Sparkles className="h-4 w-4" /> Proposer avec l’IA</button>
              <button type="button" onClick={() => void save()} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-full bg-neutral-900 px-4 text-sm font-semibold text-white"><Save className="h-4 w-4" /> Enregistrer</button>
            </div>
          </div>
          {selected?.issues.length ? <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-500">{selected.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul> : null}
          <label className="block text-sm font-medium">Title <span className="text-neutral-400">{draft.title.length} car.</span><input className={`${field} mt-1`} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
          <label className="block text-sm font-medium">Meta description <span className="text-neutral-400">{draft.meta_description.length} car.</span><textarea className={`${field} mt-1 min-h-[88px]`} value={draft.meta_description} onChange={(e) => setDraft({ ...draft, meta_description: e.target.value })} /></label>
          <label className="block text-sm font-medium">H1<input className={`${field} mt-1`} value={draft.h1} onChange={(e) => setDraft({ ...draft, h1: e.target.value })} /></label>
          <div>
            <p className="text-sm font-medium">H2</p>
            {(draft.h2.length ? draft.h2 : ["", ""]).concat([""]).slice(0, 6).map((item, index) => (
              <input key={index} className={`${field} mt-2`} placeholder={`H2 ${index + 1}`} value={item} onChange={(e) => {
                const h2 = [...draft.h2];
                h2[index] = e.target.value;
                setDraft({ ...draft, h2 });
              }} />
            ))}
          </div>
          <label className="block text-sm font-medium">Résumé pour les IA (llms.txt)<textarea className={`${field} mt-1 min-h-[120px]`} value={draft.ai_summary} onChange={(e) => setDraft({ ...draft, ai_summary: e.target.value })} /></label>
          <div>
            <p className="text-sm font-medium">FAQ</p>
            {(draft.faq.length ? draft.faq : [{ question: "", answer: "" } as SeoFaqItem]).map((item, index) => (
              <div key={index} className="mt-2 grid gap-2">
                <input className={field} placeholder="Question" value={item.question} onChange={(e) => setDraft({ ...draft, faq: draft.faq.map((row, i) => i === index ? { ...row, question: e.target.value } : row) })} />
                <textarea className={`${field} min-h-[64px]`} placeholder="Réponse" value={item.answer} onChange={(e) => setDraft({ ...draft, faq: draft.faq.map((row, i) => i === index ? { ...row, answer: e.target.value } : row) })} />
              </div>
            ))}
            <button type="button" className="mt-2 text-sm font-semibold" onClick={() => setDraft({ ...draft, faq: [...draft.faq, { question: "", answer: "" }] })}>Ajouter une question</button>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.noindex} onChange={(e) => setDraft({ ...draft, noindex: e.target.checked })} /> Ne pas indexer (noindex)</label>
        </section>
      ) : null}
    </div>
  );
}
