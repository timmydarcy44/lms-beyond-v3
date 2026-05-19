"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type TabKey = "manual" | "import";

export type SchoolEcoleOfferCreateModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string | null;
  /** Pré-remplit le nom d'entreprise (ex. depuis prospection ?company=) */
  defaultCompanyName?: string;
  onCreated?: () => void;
};

export function SchoolEcoleOfferCreateModal({
  open,
  onOpenChange,
  schoolId,
  defaultCompanyName = "",
  onCreated,
}: SchoolEcoleOfferCreateModalProps) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("manual");
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const [pasteText, setPasteText] = useState("");
  const [importPdf, setImportPdf] = useState<File | null>(null);
  const [restructureWithAi, setRestructureWithAi] = useState(true);
  const [extractSoftSkillsWithAi, setExtractSoftSkillsWithAi] = useState(true);

  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [salary, setSalary] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [contractType, setContractType] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [companyName, setCompanyName] = useState("");
  const [companyHiddenFromLearner, setCompanyHiddenFromLearner] = useState(false);
  const [softSkillsInput, setSoftSkillsInput] = useState("");

  useEffect(() => {
    if (!open) return;
    if (defaultCompanyName.trim()) {
      setCompanyName((prev) => (prev.trim() ? prev : defaultCompanyName.trim()));
    }
  }, [open, defaultCompanyName]);

  const resetAll = () => {
    setTab("manual");
    setPasteText("");
    setImportPdf(null);
    setRestructureWithAi(true);
    setExtractSoftSkillsWithAi(true);
    setTitle("");
    setCity("");
    setSalary("");
    setSalaryRange("");
    setContractType("");
    setDescription("");
    setStatus("active");
    setCompanyName(defaultCompanyName.trim());
    setCompanyHiddenFromLearner(false);
    setSoftSkillsInput("");
  };

  const parseSoftSkills = () =>
    softSkillsInput
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 24);

  const applyAnalyzePayload = (data: Record<string, unknown>) => {
    if (typeof data.title === "string" && data.title.trim()) setTitle(data.title.trim());
    if (data.city != null) setCity(String(data.city));
    if (data.salary != null) setSalary(String(data.salary));
    if (data.salary_range != null) setSalaryRange(String(data.salary_range));
    if (data.contract_type != null) setContractType(String(data.contract_type));
    if (typeof data.description === "string") setDescription(data.description);
    if (Array.isArray(data.soft_skills) && data.soft_skills.length) {
      setSoftSkillsInput((data.soft_skills as string[]).join(", "));
    }
  };

  const runAnalyze = async () => {
    if (!schoolId) return;
    const text = pasteText.trim();
    if (!text || text.length < 20) {
      toast.error("Collez au moins 20 caractères d'offre, ou déposez un PDF.");
      return;
    }
    setAnalyzing(true);
    try {
      if (importPdf && importPdf.size > 0) {
        const fd = new FormData();
        fd.set("rawText", text);
        fd.set("file", importPdf);
        fd.set("restructureWithAi", restructureWithAi ? "true" : "false");
        fd.set("extractSoftSkillsWithAi", extractSoftSkillsWithAi ? "true" : "false");
        const res = await fetch("/api/dashboard/ecole/job-offers/analyze", { method: "POST", body: fd });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) throw new Error(data?.error || "Analyse impossible");
        applyAnalyzePayload(data);
        toast.success(`Analyse terminée (${data.mode || "ok"}) — vérifiez les champs puis enregistrez.`);
        setTab("manual");
      } else {
        const res = await fetch("/api/dashboard/ecole/job-offers/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rawText: text,
            restructureWithAi,
            extractSoftSkillsWithAi,
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) throw new Error(data?.error || "Analyse impossible");
        applyAnalyzePayload(data);
        toast.success(`Analyse terminée (${data.mode || "ok"}) — vérifiez les champs puis enregistrez.`);
        setTab("manual");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCreate = async () => {
    if (!schoolId || saving) return;
    const t = title.trim();
    if (!t) {
      toast.error("Indiquez un intitulé d'offre.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/ecole/job-offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: t,
          city: city.trim() || null,
          salary: salary.trim() || null,
          salary_range: salaryRange.trim() || null,
          contract_type: contractType.trim() || null,
          description: description.trim() || null,
          status: status.trim() || "active",
          company_name: companyName.trim() || null,
          company_hidden_from_learner: companyHiddenFromLearner,
          target_soft_skills: parseSoftSkills(),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Création impossible");
      }
      toast.success("Offre créée");
      onOpenChange(false);
      resetAll();
      onCreated?.();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) resetAll();
      }}
    >
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto rounded-2xl border border-[#E5E5EA] bg-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nouvelle offre</DialogTitle>
          <DialogDescription>
            Saisie manuelle, ou import texte / PDF avec analyse IA optionnelle. Les champs correspondent à la table
            job_offers.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 border-b border-[#E5E5EA] pb-3 text-sm font-semibold">
          <button
            type="button"
            className={`rounded-full px-3 py-1 ${tab === "manual" ? "bg-[#1D1D1F] text-white" : "text-[#86868B]"}`}
            onClick={() => setTab("manual")}
          >
            Formulaire
          </button>
          <button
            type="button"
            className={`rounded-full px-3 py-1 ${tab === "import" ? "bg-[#1D1D1F] text-white" : "text-[#86868B]"}`}
            onClick={() => setTab("import")}
          >
            Coller / PDF + IA
          </button>
        </div>

        {tab === "import" ? (
          <div className="grid gap-3 text-sm">
            <p className="text-xs text-[#86868B]">
              Collez une offre existante (mail, PDF texte copié, etc.). Optionnel : ajoutez un PDF — son texte sera
              concaténé au collage.
            </p>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={8}
              className="w-full resize-y rounded-xl border border-[#E5E5EA] px-3 py-2 font-mono text-xs"
              placeholder="Collez ici le contenu brut de l'offre…"
            />
            <label className="space-y-1">
              <span className="text-xs font-semibold text-[#86868B]">PDF optionnel</span>
              <input
                type="file"
                accept="application/pdf"
                className="text-xs"
                onChange={(e) => setImportPdf(e.target.files?.[0] ?? null)}
              />
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={restructureWithAi}
                onChange={(e) => setRestructureWithAi(e.target.checked)}
              />
              Restructurer le contenu avec l&apos;IA (sinon extraction légère)
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={extractSoftSkillsWithAi}
                onChange={(e) => setExtractSoftSkillsWithAi(e.target.checked)}
              />
              Proposer des soft skills via l&apos;IA
            </label>
            <button
              type="button"
              disabled={analyzing || !schoolId}
              onClick={() => void runAnalyze()}
              className="rounded-full bg-[#0071E3] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {analyzing ? "Analyse…" : "Analyser et remplir le formulaire"}
            </button>
          </div>
        ) : null}

        <div className="grid gap-3 text-sm">
          <label className="space-y-1">
            <span className="text-xs font-semibold text-[#86868B]">Nom de l&apos;entreprise</span>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full rounded-xl border border-[#E5E5EA] px-3 py-2"
              placeholder="Beyond Group"
            />
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={companyHiddenFromLearner}
              onChange={(e) => setCompanyHiddenFromLearner(e.target.checked)}
            />
            Caché à l&apos;apprenant (le nom n&apos;apparaît pas côté matching / fiches apprenant)
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold text-[#86868B]">Soft skills (manuel, séparés par virgule)</span>
            <input
              value={softSkillsInput}
              onChange={(e) => setSoftSkillsInput(e.target.value)}
              className="w-full rounded-xl border border-[#E5E5EA] px-3 py-2"
              placeholder="Écoute active, prise d'initiative, rigueur…"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold text-[#86868B]">Titre *</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-[#E5E5EA] px-3 py-2"
              placeholder="Alternance — Technico commercial"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-[#86868B]">Ville</span>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-xl border border-[#E5E5EA] px-3 py-2"
              placeholder="Le Havre"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-semibold text-[#86868B]">Rémunération (texte)</span>
              <input
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                className="w-full rounded-xl border border-[#E5E5EA] px-3 py-2"
                placeholder="Selon grille"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold text-[#86868B]">Fourchette</span>
              <input
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                className="w-full rounded-xl border border-[#E5E5EA] px-3 py-2"
                placeholder="1200 € — 1400 €"
              />
            </label>
          </div>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-[#86868B]">Type de contrat</span>
            <input
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
              className="w-full rounded-xl border border-[#E5E5EA] px-3 py-2"
              placeholder="Alternance"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-[#86868B]">Statut</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-[#E5E5EA] px-3 py-2"
            >
              <option value="active">active</option>
              <option value="draft">draft</option>
              <option value="closed">closed</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-[#86868B]">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full resize-y rounded-xl border border-[#E5E5EA] px-3 py-2"
              placeholder="Missions, profil recherché, durée…"
            />
          </label>
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <button
            type="button"
            className="rounded-full border border-[#E5E5EA] px-4 py-2 text-sm font-semibold"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={saving || !schoolId}
            className="rounded-full bg-[#1D1D1F] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            onClick={() => void handleCreate()}
          >
            {saving ? "Enregistrement…" : "Créer l'offre"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
