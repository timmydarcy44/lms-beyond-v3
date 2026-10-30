"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SeoOverview, type SeoGscCard, type SeoOverviewPage, type SeoTemplateCard } from "@/components/super-admin/seo/seo-overview";
import { SeoEditor } from "@/components/super-admin/seo/seo-editor";
import type { SeoCheckResult } from "@/lib/seo/score";
import type { SeoPageRecord } from "@/lib/seo/byound-seo";

type SeoApiPage = SeoPageRecord & SeoOverviewPage & { issues: string[]; checks: SeoCheckResult[] };

type View = "overview" | "edit";

export function SeoWorkspace() {
  const [pages, setPages] = useState<SeoApiPage[]>([]);
  const [templates, setTemplates] = useState<SeoTemplateCard[]>([]);
  const [gsc, setGsc] = useState<SeoGscCard | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("overview");
  const [path, setPath] = useState("/");
  const [batchBusy, setBatchBusy] = useState(false);
  const [batchNote, setBatchNote] = useState<string | null>(null);
  const [batch, setBatch] = useState<{ id: string; paths: string[]; index: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/super-admin/seo", { cache: "no-store" });
    const json = await res.json();
    setPages(json.pages ?? []);
    setTemplates(json.templates ?? []);
    setGsc(json.gsc ?? null);
    setHint(json.error ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openEditor = (nextPath: string) => {
    setPath(nextPath);
    setView("edit");
  };

  const proposeBatch = async (paths: string[]) => {
    if (!paths.length) return;
    setBatchBusy(true);
    setBatchNote(null);
    const id = crypto.randomUUID();
    let ok = 0;
    for (const item of paths) {
      const res = await fetch("/api/super-admin/seo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: item, batch_id: id }),
      });
      if (res.ok) ok += 1;
    }
    setBatchBusy(false);
    setBatch({ id, paths, index: 0 });
    setPath(paths[0]);
    setView("edit");
    setBatchNote(`${ok} page${ok > 1 ? "s" : ""} en file — acceptez page par page, puis publiez.`);
    toast.success("File de propositions prête. Rien n’est publié automatiquement.");
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-[#EEF1F8]" style={{ fontFamily: "var(--font-seo), Manrope, sans-serif" }}>
      <div className="mx-auto max-w-[1280px] px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[32px] font-semibold tracking-tight text-[#EEF1F8]">SEO et indexation IA</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#AEB6CC]">
              Titres, descriptions et données structurées des pages publiques. Alimente aussi /sitemap.xml, /robots.txt et /llms.txt.
            </p>
          </div>
          <div className="flex rounded-full border border-[#1A2340] bg-[#111831] p-1" role="tablist" aria-label="Vue SEO">
            <button
              type="button"
              role="tab"
              aria-selected={view === "overview"}
              className={`h-9 rounded-full px-4 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#6E5BFF] ${
                view === "overview" ? "bg-[#6E5BFF] text-white" : "text-[#AEB6CC]"
              }`}
              onClick={() => setView("overview")}
            >
              Vue d’ensemble
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "edit"}
              className={`h-9 rounded-full px-4 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#6E5BFF] ${
                view === "edit" ? "bg-[#6E5BFF] text-white" : "text-[#AEB6CC]"
              }`}
              onClick={() => setView("edit")}
            >
              Éditer une page
            </button>
          </div>
        </div>

        {hint ? <p className="mb-4 rounded-2xl border border-[#3A2A0E] bg-[#3A2A0E] px-4 py-3 text-sm text-[#E7A92C]">{hint}</p> : null}
        {batchNote ? <p className="mb-4 rounded-2xl border border-[#6E5BFF]/40 bg-[#161B3A] px-4 py-3 text-sm text-[#AEB6CC]">{batchNote}</p> : null}

        {loading ? (
          <p className="flex items-center gap-2 text-sm text-[#AEB6CC]">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
          </p>
        ) : view === "overview" ? (
          <SeoOverview
            pages={pages}
            templates={templates}
            gsc={gsc}
            onEditPage={openEditor}
            onSaveTemplate={async (item) => {
              const res = await fetch("/api/super-admin/seo/templates", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  type: item.type,
                  title_template: item.title_template,
                  description_template: item.description_template,
                  jsonld_type: item.jsonld_type,
                  og_image_url: item.og_image_url,
                }),
              });
              const json = await res.json().catch(() => ({}));
              if (!res.ok) {
                toast.error(typeof json.error === "string" ? json.error : "Modèle non enregistré");
                return;
              }
              toast.success("Modèle enregistré. Les pages générées l’utilisent sauf réglage propre à la page.");
              await load();
            }}
            onBatchPropose={(paths) => void proposeBatch(paths)}
            onConnectGsc={() => {
              if (gsc?.configured) {
                toast.message("Synchronisation Search Console…");
                void fetch("/api/super-admin/seo/gsc/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
                  .then(async (res) => {
                    const json = await res.json();
                    if (!res.ok) throw new Error(json.error ?? "Sync impossible");
                    toast.success("Search Console synchronisée");
                    await load();
                  })
                  .catch((error) => toast.error(error instanceof Error ? error.message : "Sync impossible"));
                return;
              }
              toast.message(
                "Compte de service : GSC_PROPERTY=sc-domain:byound.fr, GSC_CLIENT_EMAIL et GSC_PRIVATE_KEY. Invitez ce compte sur la propriété de domaine byound.fr. Rien n’est stocké en base.",
              );
            }}
            batchBusy={batchBusy}
          />
        ) : (
          <SeoEditor
            pages={pages}
            path={path}
            onPath={(next) => {
              setPath(next);
              if (batch) {
                const index = batch.paths.indexOf(next);
                if (index >= 0) setBatch({ ...batch, index });
              }
            }}
            onSaved={() => void load()}
            batch={
              batch
                ? {
                    index: batch.index,
                    total: batch.paths.length,
                    onNext: () => {
                      const nextIndex = batch.index + 1;
                      if (nextIndex >= batch.paths.length) {
                        setBatch(null);
                        setView("overview");
                        toast.success("File terminée. Publiez chaque page dont le brouillon vous convient.");
                        return;
                      }
                      setBatch({ ...batch, index: nextIndex });
                      setPath(batch.paths[nextIndex]);
                    },
                  }
                : null
            }
          />
        )}
      </div>
    </div>
  );
}
