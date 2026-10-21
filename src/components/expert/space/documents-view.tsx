"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";

import { saveExpertDocument, signExpertDocument } from "@/app/dashboard/expert/space-actions";
import { EmptyState, ExpertPageFrame, ExpertPageHeader, ExpertPrimaryButton, StatusPill, TxList, TxRow } from "@/components/expert/expert-ui";
import { documentExpiryLabel, type ExpertDocumentItem } from "@/lib/expert/space-model";

const FOLDERS = [
  { id: "tous", label: "Tous", dot: "bg-[#F4F5F7]" },
  { id: "contrat", label: "Contrats", dot: "bg-[#2FD08A]" },
  { id: "cv", label: "CV", dot: "bg-[#8DB8FF]" },
  { id: "attestation", label: "Attestations", dot: "bg-[#F2CF6B]" },
] as const;

export function DocumentsView({ documents, folder }: { documents: ExpertDocumentItem[]; folder: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const active = FOLDERS.some((item) => item.id === folder) ? folder : "tous";
  const toSign = documents.filter((document) => document.status === "to_sign").sort((a, b) => +new Date(a.uploadedAt) - +new Date(b.uploadedAt));
  const oldest = toSign[0];
  const rows = documents.filter((document) => active === "tous" || document.folder === active);

  const upload = async (file: File) => {
    setPending(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", "expert-docs");
      const response = await fetch("/api/upload", { method: "POST", body });
      const json = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !json.url) throw new Error(json.error ?? "Dépôt impossible");
      const folderId = active === "tous" ? "autre" : active;
      const saved = await saveExpertDocument({ name: file.name, url: json.url, folder: folderId as "contrat" | "cv" | "attestation" | "autre", mime: file.type, size: file.size });
      if (!saved.ok) throw new Error(saved.error);
      toast.success("Document déposé");
      window.dispatchEvent(new Event("expert-nav-refresh"));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Dépôt impossible");
    } finally {
      setPending(false);
    }
  };

  return (
    <ExpertPageFrame>
      <ExpertPageHeader title="Documents" subtitle="Vos contrats, attestations et justificatifs au même endroit" action={<ExpertPrimaryButton onClick={() => inputRef.current?.click()}>{pending ? "Dépôt…" : "Déposer un document"}</ExpertPrimaryButton>} />
      <input ref={inputRef} type="file" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} />
      {oldest ? (
        <article className="rounded-[28px] bg-[#2FD08A] p-5 text-[#04140C]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#04140C] text-[#2FD08A]"><FileText className="h-6 w-6" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{toSign.length} document{toSign.length > 1 ? "s" : ""} à signer</p>
              <h2 className="text-[26px] font-extrabold tracking-[-0.03em]">{oldest.name}</h2>
              <p className="text-sm">Reçu {new Date(oldest.uploadedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} · {oldest.pages ?? 1} page{(oldest.pages ?? 1) > 1 ? "s" : ""} · signature électronique</p>
              {toSign.length > 1 ? <p className="mt-1 text-sm font-bold">+ {toSign.length - 1} autre{toSign.length > 2 ? "s" : ""}</p> : null}
            </div>
            <button type="button" onClick={() => void signExpertDocument(oldest.id).then((result) => { if (!result.ok) { toast.error(result.error ?? "Signature impossible"); return; } toast.success("Document signé"); window.dispatchEvent(new Event("expert-nav-refresh")); router.refresh(); })} className="h-11 rounded-full bg-[#07080B] px-5 text-sm font-extrabold text-[#F4F5F7]">Lire et signer</button>
          </div>
        </article>
      ) : null}
      <div className="mt-4 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
        {FOLDERS.map((item) => {
          const count = item.id === "tous" ? documents.length : documents.filter((document) => document.folder === item.id).length;
          const selected = active === item.id;
          return (
            <button key={item.id} type="button" aria-pressed={selected} onClick={() => router.push(item.id === "tous" ? "/dashboard/expert/documents" : `/dashboard/expert/documents?folder=${item.id}`)} className={`rounded-[24px] bg-[#12141A] p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7EEBB5] ${selected ? "border-2 border-[#F4F5F7]" : "border-2 border-transparent"}`}>
              <span className={`flex h-10 w-10 items-center justify-center rounded-full ${item.dot}`} />
              <p className="mt-4 text-[28px] font-extrabold leading-none">{count}</p>
              <p className="mt-1 text-sm text-[#B5BAC6]">{item.label}</p>
            </button>
          );
        })}
      </div>
      <div className="mt-4">
        {rows.length === 0 ? (
          <EmptyState title="Aucun document dans ce dossier" action={<ExpertPrimaryButton onClick={() => inputRef.current?.click()}>Déposer un document</ExpertPrimaryButton>} />
        ) : (
          <TxList>
            {rows.map((document) => {
              const expiry = documentExpiryLabel(document.expiresAt);
              const when = new Date(document.uploadedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
              return (
                <TxRow
                  key={document.id}
                  leading={<span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1E2130]"><FileText className="h-4 w-4" /></span>}
                  title={document.name}
                  subtitle={`${document.folder === "contrat" ? "Contrat" : document.folder === "cv" ? "CV" : document.folder === "attestation" ? "Attestation" : "Document"} · ${document.status === "signed" ? `signé le ${when}` : document.status === "to_sign" ? `reçu le ${when}` : `déposé le ${when}`}`}
                  trailing={
                    <span className="flex items-center gap-2">
                      {expiry ? <StatusPill tone="alert">{expiry.label}</StatusPill> : <StatusPill tone={document.status === "to_sign" ? "solid" : document.status === "signed" ? "green" : "grey"}>{document.status === "to_sign" ? "À signer" : document.status === "signed" ? "Signé" : "Déposé"}</StatusPill>}
                      {document.url ? <a href={document.url} aria-label={`Télécharger ${document.name}`} className="rounded-full p-2 text-[#DADDE4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7EEBB5]"><Download className="h-4 w-4" /></a> : null}
                    </span>
                  }
                />
              );
            })}
          </TxList>
        )}
      </div>
    </ExpertPageFrame>
  );
}
