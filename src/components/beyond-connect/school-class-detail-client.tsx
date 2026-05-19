"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

type StudentRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  contract_type?: string | null;
};

type ReferentialModule = {
  titre?: string;
  objectifs?: string[];
  cours?: Array<{ titre?: string; duree_estimee?: string; contenu_resume?: string }>;
};

type ReferentialMission = {
  titre?: string;
  description?: string;
  duree_estimee?: string;
  competences?: string[];
};

type ReferentialShape = {
  titre_cursus?: string;
  modules?: ReferentialModule[];
  missions_entreprise?: ReferentialMission[];
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asReferential(v: unknown): ReferentialShape | null {
  if (!isRecord(v)) return null;
  return v as ReferentialShape;
}

type SchoolClassDetailClientProps = {
  classId: string;
  className: string;
  coverImageUrl: string | null;
  students: StudentRow[];
  initialStructure: unknown;
};

export function SchoolClassDetailClient({
  classId,
  className,
  coverImageUrl,
  students,
  initialStructure,
}: SchoolClassDetailClientProps) {
  const router = useRouter();
  const [structure, setStructure] = useState<ReferentialShape | null>(asReferential(initialStructure));
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | null) => {
    if (!file || uploading) return;
    if (!file.type.toLowerCase().includes("pdf")) {
      toast.error("Merci de déposer un PDF.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("classId", classId);
      fd.set("file", file);
      const res = await fetch("/api/dashboard/ecole/classes/referential", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Échec de l'analyse");
      }
      const next = asReferential(data.structure);
      setStructure(next);
      if (data.persisted === false && typeof data.warning === "string") {
        toast.message("Structure générée (non enregistrée en base)", { description: data.warning });
      } else {
        toast.success(data.mode === "mock" ? "Structure générée (mode démo sans clé IA)" : "Référentiel analysé");
      }
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-3xl border border-[#E5E5EA] bg-white shadow-sm">
        <div className="aspect-[21/9] w-full overflow-hidden bg-[#F5F5F7] md:aspect-[3/1]">
          {coverImageUrl ? (
            <img src={coverImageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full min-h-[140px] items-center justify-center text-sm text-[#86868B]">
              Aucune cover — renseignez une URL lors de la création du cursus ou éditez la classe en base.
            </div>
          )}
        </div>
        <div className="p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#86868B]">Formation</p>
          <h1 className="mt-2 text-2xl font-semibold text-[#1D1D1F] md:text-3xl">{className}</h1>
          <p className="mt-2 text-sm text-[#86868B]">{students.length} apprenant(s) rattaché(s) à ce cursus.</p>
          <div className="mt-4">
            <Link
              href={`/dashboard/ecole/apprenants?add=1&classId=${encodeURIComponent(classId)}`}
              className="inline-flex rounded-full bg-[#1D1D1F] px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
            >
              + Ajouter un apprenant à ce cursus
            </Link>
          </div>
        </div>
      </div>

      <section className="rounded-3xl border border-[#E5E5EA] bg-white p-6 shadow-sm md:p-8">
        <h2 className="text-lg font-semibold text-[#1D1D1F]">Référentiel & IA</h2>
        <p className="mt-2 max-w-2xl text-sm text-[#86868B]">
          Déposez le PDF du référentiel pédagogique. Le texte est extrait puis structuré en modules, cours et missions
          en entreprise (OpenAI si <code className="rounded bg-[#F5F5F7] px-1">OPENAI_API_KEY</code> est définie, sinon
          squelette de démonstration).
        </p>
        <label
          className="mt-6 inline-flex cursor-pointer flex-col gap-2 rounded-2xl border border-dashed border-[#C6A664]/50 bg-[#FFFCF9] px-6 py-8 text-center text-sm text-[#1D1D1F] hover:bg-[#FFF7ED]"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const f = e.dataTransfer.files?.[0];
            void handleFile(f ?? null);
          }}
        >
          <span className="font-semibold">{uploading ? "Analyse en cours…" : "Glisser-déposer ou cliquer pour choisir un PDF"}</span>
          <span className="text-xs text-[#86868B]">Fichier unique, max recommandé 15 Mo</span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </section>

      {structure?.modules?.length ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[#1D1D1F]">Blocs & modules (IA)</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {structure.modules.map((mod, i) => (
              <div key={`m-${i}`} className="rounded-2xl border border-[#E5E5EA] bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-[#1D1D1F]">{mod.titre || `Module ${i + 1}`}</p>
                {mod.objectifs?.length ? (
                  <ul className="mt-2 list-inside list-disc text-xs text-[#86868B]">
                    {mod.objectifs.map((o, j) => (
                      <li key={j}>{o}</li>
                    ))}
                  </ul>
                ) : null}
                {mod.cours?.length ? (
                  <ul className="mt-3 space-y-2 border-t border-[#E5E5EA] pt-3 text-xs">
                    {mod.cours.map((c, j) => (
                      <li key={j} className="text-[#1D1D1F]">
                        <span className="font-medium">{c.titre}</span>
                        {c.duree_estimee ? (
                          <span className="ml-2 text-[#86868B]">({c.duree_estimee})</span>
                        ) : null}
                        {c.contenu_resume ? <p className="mt-1 text-[#86868B]">{c.contenu_resume}</p> : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {structure?.missions_entreprise?.length ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[#1D1D1F]">Missions en entreprise</h2>
          <div className="space-y-3">
            {structure.missions_entreprise.map((m, i) => (
              <div key={`mi-${i}`} className="rounded-2xl border border-[#E5E5EA] bg-white p-5 shadow-sm">
                <p className="font-semibold text-[#1D1D1F]">{m.titre}</p>
                {m.duree_estimee ? <p className="mt-1 text-xs text-[#86868B]">Durée indicative : {m.duree_estimee}</p> : null}
                {m.description ? <p className="mt-2 text-sm text-[#1D1D1F]/85">{m.description}</p> : null}
                {m.competences?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {m.competences.map((c, j) => (
                      <span key={j} className="rounded-full bg-[#F5F5F7] px-2 py-1 text-[10px] font-semibold text-[#1D1D1F]">
                        {c}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-[#E5E5EA] bg-white p-6 shadow-sm md:p-8">
        <h2 className="text-lg font-semibold text-[#1D1D1F]">Apprenants</h2>
        <ul className="mt-4 divide-y divide-[#E5E5EA]">
          {students.length ? (
            students.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-semibold text-[#1D1D1F]">
                    {(s.first_name || "") + " " + (s.last_name || "")}
                  </p>
                  <p className="text-xs text-[#86868B]">{s.email || "—"}</p>
                </div>
                <div className="flex items-center gap-2">
                  {s.contract_type ? (
                    <span className="rounded-full bg-[#F5F5F7] px-2 py-1 text-[10px] font-semibold">{s.contract_type}</span>
                  ) : null}
                  <Link
                    href={`/dashboard/ecole/apprenants/${s.id}`}
                    className="rounded-full bg-[#1D1D1F] px-3 py-2 text-xs font-semibold text-white"
                  >
                    Fiche apprenant
                  </Link>
                </div>
              </li>
            ))
          ) : (
            <li className="py-6 text-sm text-[#86868B]">Aucun apprenant inscrit à ce cursus pour le moment.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
