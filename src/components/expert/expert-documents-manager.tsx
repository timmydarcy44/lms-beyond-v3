"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Download, Eye, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { EdgeExpertPageShell } from "@/components/edge-ui/edge-expert-page-shell";
import { EdgeCard } from "@/components/edge-ui/edge-card";
import { useExpertAccess } from "@/components/expert/expert-access-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import {
  mergeRegistrationMeta,
  parseRegistrationMeta,
  type ExpertDocumentMeta,
} from "@/lib/expert/expert-registration-meta";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "cv", label: "CV" },
  { id: "diplomas", label: "Diplômes" },
  { id: "certificates", label: "Attestations" },
  { id: "badges", label: "Open Badges" },
  { id: "portfolio", label: "Portfolio" },
  { id: "cases", label: "Cas clients" },
  { id: "photos", label: "Photos" },
  { id: "admin", label: "Pièces administratives" },
] as const;

function newDocId() {
  return `doc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function ExpertDocumentsManager() {
  const { expert, isApproved } = useExpertAccess();
  const supabase = useSupabase();
  const [documents, setDocuments] = useState<ExpertDocumentMeta[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("cv");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const meta = parseRegistrationMeta(expert.references);
    setDocuments(meta?.documents ?? []);
  }, [expert.references]);

  const persistDocuments = useCallback(
    async (nextDocs: ExpertDocumentMeta[]) => {
      const refs = mergeRegistrationMeta(expert.references, { documents: nextDocs });
      const { error } = await supabase.from("experts").update({ references: refs }).eq("id", expert.id);
      if (error) throw error;
      setDocuments(nextDocs);
    },
    [expert.id, expert.references, supabase],
  );

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    setUploading(true);
    try {
      const uploaded: ExpertDocumentMeta[] = [];
      for (const file of list) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", `expert-docs/${expert.id}`);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
        if (!res.ok || !data?.url) {
          throw new Error(data?.error ?? "Upload impossible");
        }
        uploaded.push({
          id: newDocId(),
          name: file.name,
          category: activeCategory,
          url: data.url,
          mime_type: file.type,
          size: file.size,
          uploaded_at: new Date().toISOString(),
          version: 1,
        });
      }
      await persistDocuments([...uploaded, ...documents]);
      toast.success(uploaded.length > 1 ? "Documents ajoutés." : "Document ajouté.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de l'upload.");
    } finally {
      setUploading(false);
    }
  };

  const removeDoc = async (id: string) => {
    try {
      await persistDocuments(documents.filter((d) => d.id !== id));
      toast.success("Document supprimé.");
    } catch {
      toast.error("Impossible de supprimer le document.");
    }
  };

  const filtered = useMemo(
    () => documents.filter((d) => d.category === activeCategory),
    [documents, activeCategory],
  );

  return (
    <EdgeExpertPageShell
      restricted={!isApproved}
      eyebrow="Documents"
      title="Gestionnaire documentaire"
      subtitle="CV, diplômes, attestations, portfolio — centralisez tout votre dossier formateur."
    >
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <EdgeCard padding="sm" className="h-fit">
          <p className="px-1 text-xs font-semibold uppercase tracking-wider text-[#050505]/40">Catégories</p>
          <div className="mt-3 space-y-1">
            {CATEGORIES.map((cat) => {
              const count = documents.filter((d) => d.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition",
                    activeCategory === cat.id
                      ? "bg-[#635BFF]/10 font-medium text-[#635BFF]"
                      : "text-[#050505]/65 hover:bg-[#F7F7F5]",
                  )}
                >
                  {cat.label}
                  {count > 0 ? (
                    <span className="rounded-full bg-[#050505]/6 px-2 py-0.5 text-[10px] font-semibold">{count}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </EdgeCard>

        <div className="space-y-4">
          <div
            className={cn(
              "rounded-[28px] border border-dashed border-[#050505]/12 bg-white p-8 shadow-[0_1px_2px_rgba(5,5,5,0.04),0_8px_32px_rgba(5,5,5,0.06)] transition",
              dragOver && "border-[#635BFF]/40 bg-[#635BFF]/[0.04]",
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              void uploadFiles(e.dataTransfer.files);
            }}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && void uploadFiles(e.target.files)}
            />
            <div className="flex flex-col items-center text-center sm:flex-row sm:text-left">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#635BFF]/10 text-[#635BFF]">
                {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
              </div>
              <div className="mt-4 sm:ml-5 sm:mt-0 sm:flex-1">
                <p className="text-sm font-semibold">Glissez-déposez vos fichiers ici</p>
                <p className="mt-1 text-sm text-[#050505]/50">PDF, images, documents Office — 20 Mo max par fichier</p>
              </div>
              <button
                type="button"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
                className="mt-4 rounded-2xl bg-[#635BFF] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#7B74FF] disabled:opacity-60 sm:mt-0"
              >
                Parcourir
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EdgeCard padding="md" className="text-center text-sm text-[#050505]/45">
              Aucun document dans cette catégorie.
            </EdgeCard>
          ) : (
            <div className="grid gap-3">
              {filtered.map((doc) => (
                <EdgeCard key={doc.id} padding="sm" className="flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#635BFF]/8 text-[#635BFF]">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{doc.name}</p>
                    <p className="text-xs text-[#050505]/45">
                      {new Date(doc.uploaded_at).toLocaleDateString("fr-FR")}
                      {doc.size ? ` · ${Math.round(doc.size / 1024)} Ko` : ""}
                      {doc.version ? ` · v${doc.version}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl p-2 text-[#050505]/45 transition hover:bg-[#F7F7F5] hover:text-[#635BFF]"
                      title="Prévisualiser"
                    >
                      <Eye className="h-4 w-4" />
                    </a>
                    <a
                      href={doc.url}
                      download={doc.name}
                      className="rounded-xl p-2 text-[#050505]/45 transition hover:bg-[#F7F7F5] hover:text-[#635BFF]"
                      title="Télécharger"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => void removeDoc(doc.id)}
                      className="rounded-xl p-2 text-[#050505]/45 transition hover:bg-[#F7F7F5] hover:text-[#E25555]"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </EdgeCard>
              ))}
            </div>
          )}

          <p className="text-xs text-[#050505]/40">
            Besoin d'aide ?{" "}
            <Link href="/dashboard/expert/support" className="font-medium text-[#635BFF] hover:underline">
              Contactez le support EDGE
            </Link>
          </p>
        </div>
      </div>
    </EdgeExpertPageShell>
  );
}
