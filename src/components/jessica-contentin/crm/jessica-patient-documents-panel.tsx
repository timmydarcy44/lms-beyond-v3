"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { jessicaSuper } from "@/lib/jessica-contentin/super-theme";
import { cn } from "@/lib/utils";

export type JessicaPatientDocument = {
  id: string;
  patient_id: string | null;
  profile_id: string | null;
  title: string;
  description: string | null;
  file_name: string;
  file_url: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  category: string;
  created_at: string;
};

type PatientOption = {
  id: string;
  label: string;
  profileId?: string | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  ordonnance: "Ordonnance",
  compte_rendu: "Compte-rendu",
  assurance: "Assurance",
  mdph: "MDPH / administratif",
  autre: "Autre",
};

export function JessicaPatientDocumentsPanel({
  patients,
  lockedPatientId = null,
  lockedProfileId = null,
  compact = false,
}: {
  patients?: PatientOption[];
  lockedPatientId?: string | null;
  lockedProfileId?: string | null;
  compact?: boolean;
}) {
  const [docs, setDocs] = useState<JessicaPatientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrationRequired, setMigrationRequired] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [patientId, setPatientId] = useState(lockedPatientId || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("autre");
  const [file, setFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (lockedPatientId) params.set("patientId", lockedPatientId);
      if (lockedProfileId) params.set("profileId", lockedProfileId);
      const res = await fetch(`/api/admin/jessica-patient-documents?${params.toString()}`, {
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Chargement impossible");
      setDocs(Array.isArray(json.documents) ? json.documents : []);
      setMigrationRequired(Boolean(json.migrationRequired));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [lockedPatientId, lockedProfileId]);

  useEffect(() => {
    void load();
  }, [load]);

  const patientById = useMemo(() => {
    const map = new Map<string, PatientOption>();
    for (const p of patients ?? []) map.set(p.id, p);
    return map;
  }, [patients]);

  const upload = () => {
    if (!file || !title.trim()) {
      toast.error("Titre et fichier requis");
      return;
    }
    const selectedPatient = patientId || lockedPatientId;
    if (!selectedPatient && !lockedProfileId) {
      toast.error("Sélectionnez un patient");
      return;
    }
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("file", file);
        fd.set("title", title.trim());
        if (description.trim()) fd.set("description", description.trim());
        fd.set("category", category);
        if (selectedPatient) fd.set("patientId", selectedPatient);
        const profile =
          lockedProfileId ||
          (selectedPatient ? patientById.get(selectedPatient)?.profileId : null);
        if (profile) fd.set("profileId", profile);

        const res = await fetch("/api/admin/jessica-patient-documents", {
          method: "POST",
          body: fd,
          credentials: "include",
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || "Upload impossible");
        toast.success("Document enregistré sur la fiche patient");
        setTitle("");
        setDescription("");
        setFile(null);
        setCategory("autre");
        await load();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erreur d’upload");
      }
    });
  };

  const remove = (id: string) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/jessica-patient-documents?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
          credentials: "include",
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || "Suppression impossible");
        toast.success("Document supprimé");
        setDocs((prev) => prev.filter((d) => d.id !== id));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erreur");
      }
    });
  };

  return (
    <div className="space-y-6">
      {!compact ? (
        <div className={cn(jessicaSuper.card, "space-y-4 p-5")}>
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-[#8B6F47]" />
            <h2 className="text-base font-semibold text-black">Déposer un document patient</h2>
          </div>
          {migrationRequired ? (
            <p className="text-sm text-amber-700">
              Migration SQL requise : <code>20260823160000_jessica_patient_documents.sql</code>
            </p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            {!lockedPatientId ? (
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Patient</Label>
                <Select value={patientId} onValueChange={setPatientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {(patients ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label>Titre</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. Ordonnance juin 2026" />
            </div>
            <div className="space-y-1.5">
              <Label>Catégorie</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Description (optionnel)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Contexte, provenance du document…"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Fichier (PDF, Word, image — 15 Mo max)</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,image/jpeg,image/png,image/webp"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <Button type="button" onClick={upload} disabled={isPending || migrationRequired}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Enregistrer sur la fiche
          </Button>
        </div>
      ) : null}

      <div className={cn(jessicaSuper.card, "p-5")}>
        <h2 className="mb-4 text-base font-semibold text-black">
          {compact ? "Documents administratifs" : "Documents récents"}
        </h2>
        {loading ? (
          <p className="text-sm text-neutral-500">Chargement…</p>
        ) : docs.length === 0 ? (
          <p className="text-sm text-neutral-500">Aucun document pour le moment.</p>
        ) : (
          <ul className="space-y-3">
            {docs.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 px-3 py-3"
              >
                <div className="min-w-0 flex items-start gap-3">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#8B6F47]" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-black">{doc.title}</p>
                    <p className="text-xs text-neutral-500">
                      {CATEGORY_LABELS[doc.category] || doc.category} · {doc.file_name}
                      {doc.patient_id && !lockedPatientId ? (
                        <>
                          {" · "}
                          <Link
                            href={`/super/jessica-crm/${doc.patient_id}`}
                            className="underline underline-offset-2"
                          >
                            Voir la fiche
                          </Link>
                        </>
                      ) : null}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" size="sm" className="rounded-full">
                    <a href={doc.file_url} target="_blank" rel="noreferrer">
                      Ouvrir
                    </a>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-rose-600"
                    onClick={() => remove(doc.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {compact && !migrationRequired ? (
        <div className={cn(jessicaSuper.card, "space-y-3 p-5")}>
          <h3 className="text-sm font-semibold text-black">Ajouter un document</h3>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre" />
          <Input
            type="file"
            accept=".pdf,.doc,.docx,image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <Button type="button" size="sm" onClick={upload} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Enregistrer
          </Button>
        </div>
      ) : null}
    </div>
  );
}
