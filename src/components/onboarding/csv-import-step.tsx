"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { ColumnMapping } from "@/lib/onboarding/column-mapping";

type Stats = {
  total: number;
  departments: string[];
  departmentCounts?: Array<{ name: string; count: number }>;
  sansEmail: number;
  skipped: number;
};

type Issue = { line: number; reason?: string };

type Props = {
  organisationId: string;
  onBack: () => void;
  onComplete: (stats: { total: number; departments: string[]; sansEmail: number }) => void;
};

function downloadTemplate() {
  const csv = "Nom,Prénom,Email,Département,Poste\nMartin,Jade,jade@limola.com,Ventes,Responsable\n";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "modele-collaborateurs-byound.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function CsvImportStep({ organisationId, onBack, onComplete }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ stats: Stats; mapping: ColumnMapping; issues: Issue[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [manual, setManual] = useState(false);
  const [hand, setHand] = useState({ last_name: "", first_name: "", email: "", department: "", job_title: "" });

  const runPreview = useCallback(
    async (nextFile: File) => {
      setLoading(true);
      try {
        const body = new FormData();
        body.append("file", nextFile);
        body.append("organisation_id", organisationId);
        body.append("preview", "1");
        const res = await fetch("/api/onboarding/import-csv", { method: "POST", body });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Aperçu impossible");
        setPreview({ stats: json.stats, mapping: json.mapping, issues: json.issues ?? [] });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Aperçu impossible");
        setPreview(null);
      } finally {
        setLoading(false);
      }
    },
    [organisationId],
  );

  const onFile = (next: File | null) => {
    setFile(next);
    setPreview(null);
    if (next) void runPreview(next);
  };

  const importFile = async () => {
    if (!file) {
      onComplete({ total: 0, departments: [], sansEmail: 0 });
      return;
    }
    setLoading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("organisation_id", organisationId);
      if (preview?.mapping) body.append("column_mapping", JSON.stringify(preview.mapping));
      const res = await fetch("/api/onboarding/import-csv", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Import impossible");
      onComplete(json.stats ?? { total: json.employes_importes, departments: [], sansEmail: 0 });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import impossible");
    } finally {
      setLoading(false);
    }
  };

  const addByHand = async () => {
    const line = [hand.last_name, hand.first_name, hand.email, hand.department, hand.job_title]
      .map((value) => `"${value.replaceAll('"', '""')}"`)
      .join(",");
    if (!hand.email.includes("@") && !hand.last_name.trim() && !hand.first_name.trim()) {
      toast.error("Renseignez au moins un nom ou un email.");
      return;
    }
    const csv = `Nom,Prénom,Email,Département,Poste\n${line}\n`;
    const nextFile = new File([csv], "ajout-manuel.csv", { type: "text/csv" });
    setManual(false);
    onFile(nextFile);
  };

  const counts = preview?.stats.departmentCounts ?? [];
  const teamCount = counts.length || preview?.stats.departments.length || 0;

  return (
    <div>
      <h1 className="text-[36px] font-extrabold leading-tight tracking-[-1.2px]">Importez vos collaborateurs</h1>
      <p className="mt-3 text-[16px] leading-relaxed text-[#6B6F7A]">
        Un fichier suffit : les équipes sont créées à partir de la colonne Département.
      </p>

      {!preview ? (
        <>
          <label className="mt-8 flex cursor-pointer flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-[#CFCAF9] bg-white px-6 py-12 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#6E5BFF] text-[22px] font-extrabold text-white">
              ↑
            </span>
            <p className="mt-4 text-[16px] font-extrabold">Déposez votre fichier ici</p>
            <p className="mt-1 text-[14px] text-[#6B6F7A]">CSV ou Excel · 5 Mo max · ou cliquez pour parcourir</p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="sr-only"
              onChange={(event) => onFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={downloadTemplate} className="rounded-[20px] border border-[#E3E0D8] bg-white p-4 text-left">
              <p className="text-[15px] font-extrabold">Télécharger le modèle</p>
              <p className="mt-1 text-[13px] text-[#6B6F7A]">Nom, Prénom, Email, Département, Poste</p>
            </button>
            <button type="button" onClick={() => setManual((value) => !value)} className="rounded-[20px] border border-[#E3E0D8] bg-white p-4 text-left">
              <p className="text-[15px] font-extrabold">Ajouter à la main</p>
              <p className="mt-1 text-[13px] text-[#6B6F7A]">Une personne à la fois</p>
            </button>
          </div>
          {manual ? (
            <div className="mt-4 space-y-3 rounded-[20px] border border-[#E3E0D8] bg-white p-4">
              {(["last_name", "first_name", "email", "department", "job_title"] as const).map((key) => (
                <input
                  key={key}
                  value={hand[key]}
                  placeholder={{ last_name: "Nom", first_name: "Prénom", email: "Email", department: "Département", job_title: "Poste" }[key]}
                  onChange={(event) => setHand((prev) => ({ ...prev, [key]: event.target.value }))}
                  className="h-14 w-full rounded-[18px] border border-[#E3E0D8] px-4 text-[16px] outline-none focus:ring-2 focus:ring-[#6E5BFF]"
                />
              ))}
              <button type="button" onClick={() => void addByHand()} className="h-12 rounded-full bg-[#07080B] px-5 text-[14px] font-extrabold text-white">
                Analyser cette personne
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="mt-8 space-y-4">
          <div className="rounded-[24px] bg-[#070C1C] p-6 text-white">
            <p className="text-[14px] text-[#B5BAC6]">{file?.name}</p>
            <p className="mt-2 text-[72px] font-extrabold leading-none tracking-[-2px]">{preview.stats.total}</p>
            <p className="mt-2 text-[15px]">collaborateurs détectés dans {teamCount} équipes</p>
            {counts.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {counts.map((team) => (
                  <span key={team.name} className="rounded-full bg-white/10 px-3 py-1 text-[13px] font-extrabold">
                    {team.name} · {team.count}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          {preview.issues.length > 0 ? (
            <div className="rounded-[20px] bg-[#FFF1E2] p-4 text-[14px]">
              <p className="font-extrabold">{preview.issues.length} lignes à vérifier</p>
              <ul className="mt-2 space-y-1 text-[#3A3D45]">
                {preview.issues.map((issue) => (
                  <li key={`${issue.line}-${issue.reason}`}>
                    Ligne {issue.line} · {issue.reason}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <button type="button" onClick={() => onFile(null)} className="text-[14px] font-extrabold text-[#4B3BD1]">
            Changer de fichier
          </button>
        </div>
      )}

      <div className="mt-8 flex items-center gap-3">
        <button type="button" onClick={onBack} aria-label="Retour" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#E3E0D8] bg-white text-[22px]">
          ‹
        </button>
        <button
          type="button"
          onClick={() => void importFile()}
          disabled={loading}
          className="h-14 flex-1 rounded-full bg-[#6E5BFF] text-[16px] font-extrabold text-white disabled:opacity-60"
        >
          {loading ? "Analyse…" : file && preview ? `Créer les ${teamCount} équipes` : "Continuer sans fichier"}
        </button>
      </div>
    </div>
  );
}
