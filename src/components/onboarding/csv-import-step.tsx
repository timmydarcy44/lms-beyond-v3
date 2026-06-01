"use client";

import { useCallback, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ColumnMapping } from "@/lib/onboarding/column-mapping";

type CsvImportStepProps = {
  organisationId: string;
  onComplete: (stats: { total: number; departments: string[]; sansEmail: number }) => void;
};

export function CsvImportStep({ organisationId, onComplete }: CsvImportStepProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{
    stats: { total: number; departments: string[]; sansEmail: number; skipped: number };
    mapping: ColumnMapping;
    sample: { first_name: string; last_name: string; email: string | null; department: string | null }[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const runPreview = useCallback(
    async (f: File) => {
      setLoading(true);
      try {
        const fd = new FormData();
        fd.append("file", f);
        fd.append("organisation_id", organisationId);
        fd.append("preview", "1");
        const res = await fetch("/api/onboarding/import-csv", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Erreur");
        setPreview({
          stats: json.stats,
          mapping: json.mapping,
          sample: json.sample ?? [],
        });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Aperçu impossible");
        setPreview(null);
      } finally {
        setLoading(false);
      }
    },
    [organisationId],
  );

  const onFile = (f: File | null) => {
    setFile(f);
    setPreview(null);
    if (f) void runPreview(f);
  };

  const importFile = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("organisation_id", organisationId);
      if (preview?.mapping) {
        fd.append("column_mapping", JSON.stringify(preview.mapping));
      }
      const res = await fetch("/api/onboarding/import-csv", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Import impossible");
      toast.success(`${json.employes_importes} collaborateurs importés`);
      onComplete(json.stats ?? { total: json.employes_importes, departments: [], sansEmail: 0 });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">📂 Importez vos collaborateurs</h2>
      <p className="mt-1 text-sm text-gray-500">
        CSV ou Excel (.xlsx) — max 5 Mo. Les équipes sont créées par département.
      </p>

      <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-12 hover:border-indigo-400 hover:bg-indigo-50/50">
        <Upload className="h-10 w-10 text-gray-400" />
        <p className="mt-3 text-sm font-medium text-gray-700">
          Glissez votre fichier ou cliquez pour parcourir
        </p>
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          className="sr-only"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </label>

      <p className="mt-4 text-xs text-gray-500">
        Format attendu : Nom, Prénom, Email, Département, Poste. Export SIRH accepté dans la plupart des cas.
      </p>

      {preview ? (
        <div className="mt-6 space-y-4 rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm">
          <p>✅ {preview.stats.total} collaborateurs détectés</p>
          {preview.stats.departments.length > 0 ? (
            <p>✅ {preview.stats.departments.length} départements : {preview.stats.departments.join(", ")}</p>
          ) : null}
          {preview.stats.sansEmail > 0 ? (
            <p className="text-amber-700">
              ⚠️ {preview.stats.sansEmail} sans email — pas d&apos;invitation auto possible
            </p>
          ) : null}
          {preview.sample.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="p-2">Prénom</th>
                    <th className="p-2">Nom</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Dépt.</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.sample.map((r, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="p-2">{r.first_name}</td>
                      <td className="p-2">{r.last_name}</td>
                      <td className="p-2">{r.email ?? "—"}</td>
                      <td className="p-2">{r.department ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={() => onFile(null)} disabled={loading || !file}>
          Modifier le fichier
        </Button>
        <Button onClick={() => void importFile()} disabled={loading || !file || !preview}>
          {loading ? "Import…" : "Importer et créer les équipes →"}
        </Button>
      </div>
    </section>
  );
}
