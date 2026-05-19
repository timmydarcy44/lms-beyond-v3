"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type EvalType =
  | "qcm"
  | "case_study"
  | "audio_presentation"
  | "audio_negotiation"
  | "file_upload"
  | "video_presentation";

type BadgeConfig = {
  id?: string;
  course_id: string;
  label: string;
  level?: string | null;
  objectives?: string[];
  modalities?: string | null;
  evaluation_type?: string | null;
  quiz_test_id?: string | null;
  case_prompt?: string | null;
  audio_scenario?: string | null;
  video_presentation_url?: string | null;
  technical_deliverable_url?: string | null;
  active?: boolean;
};

type SnapshotTest = { id?: string; title?: string; type?: string; url?: string };

const EVAL_OPTIONS: Array<{
  id: EvalType;
  title: string;
  subtitle: string;
}> = [
  { id: "qcm", title: "QCM", subtitle: "Lien vers une évaluation de la table tests." },
  { id: "case_study", title: "Étude de cas", subtitle: "Énoncé long — champ case_prompt." },
  { id: "audio_presentation", title: "Présentation audio", subtitle: "Scénario pédagogique (audio_scenario)." },
  { id: "audio_negotiation", title: "Négociation audio", subtitle: "Scénario complexe IA (audio_scenario)." },
  { id: "file_upload", title: "Upload d’un fichier", subtitle: "Consignes de dépôt (texte / URL)." },
  { id: "video_presentation", title: "Vidéo", subtitle: "Lien Loom ou URL d’upload." },
];

const LEGACY_EVAL_MAP: Record<string, EvalType> = {
  audio_ia: "audio_negotiation",
  audio_interview: "audio_negotiation",
  technical_deliverable: "file_upload",
};

function normalizeEvalType(raw: string): EvalType {
  const t = String(raw || "").trim();
  if (LEGACY_EVAL_MAP[t]) return LEGACY_EVAL_MAP[t];
  if (EVAL_OPTIONS.some((o) => o.id === t)) return t as EvalType;
  return "qcm";
}

export default function CertificationPage() {
  const params = useParams<{ id: string }>();
  const courseId = String((params as any)?.id ?? "");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tests, setTests] = useState<SnapshotTest[]>([]);

  const [active, setActive] = useState(false);
  const [label, setLabel] = useState("");
  const [level, setLevel] = useState<string>("Intermédiaire");
  const [objectivesText, setObjectivesText] = useState("");
  const [modalities, setModalities] = useState("");
  const [evaluationType, setEvaluationType] = useState<EvalType>("qcm");
  const [quizTestId, setQuizTestId] = useState<string>("");
  const [casePrompt, setCasePrompt] = useState("");
  const [audioPresentationScenario, setAudioPresentationScenario] = useState("");
  const [audioNegotiationScenario, setAudioNegotiationScenario] = useState("");
  const [videoPresentationUrl, setVideoPresentationUrl] = useState("");
  const [fileUploadInstructions, setFileUploadInstructions] = useState("");

  const objectives = useMemo(
    () =>
      objectivesText
        .split("\n")
        .map((x) => x.replace(/^[-•]\s*/, "").trim())
        .filter(Boolean),
    [objectivesText],
  );

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/formateur/certification/badge?courseId=${encodeURIComponent(courseId)}`);
        const json = await res.json();
        if (!ignore && res.ok && json?.badge) {
          const b = json.badge as BadgeConfig;
          setActive(Boolean(b.active));
          setLabel(String(b.label ?? ""));
          setLevel(String(b.level ?? "Intermédiaire"));
          setObjectivesText(Array.isArray(b.objectives) ? b.objectives.join("\n") : "");
          setModalities(String(b.modalities ?? ""));
          const rawEt = String(b.evaluation_type ?? "qcm");
          const mapped = normalizeEvalType(rawEt);
          setEvaluationType(mapped);
          setQuizTestId(String((b as any).quiz_test_id ?? ""));
          setCasePrompt(String((b as any).case_prompt ?? ""));
          const audio = String((b as any).audio_scenario ?? "");
          if (mapped === "audio_presentation") {
            setAudioPresentationScenario(audio);
            setAudioNegotiationScenario("");
          } else if (mapped === "audio_negotiation") {
            setAudioNegotiationScenario(audio);
            setAudioPresentationScenario("");
          } else {
            setAudioPresentationScenario("");
            setAudioNegotiationScenario("");
          }
          setVideoPresentationUrl(String((b as any).video_presentation_url ?? ""));
          setFileUploadInstructions(String((b as any).technical_deliverable_url ?? ""));
        }

        const courseRes = await fetch(`/api/courses/${encodeURIComponent(courseId)}`);
        if (courseRes.ok) {
          const payload = await courseRes.json();
          const snap = payload?.course?.builder_snapshot ?? payload?.builder_snapshot ?? null;
          const snapTests = Array.isArray(snap?.tests) ? snap.tests : [];
          if (!ignore) setTests(snapTests);
        }
      } catch (e) {
        console.warn("[certification] load failed", e);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, [courseId]);

  const handleSave = async () => {
    if (!label.trim()) {
      toast.error("Nom du badge requis");
      return;
    }
    if (!courseId || courseId === "undefined" || courseId === "null") {
      toast.error("CourseId manquant dans l'URL", {
        description: "Impossible de lier la certification à une formation sans identifiant.",
      });
      return;
    }
    setSaving(true);
    try {
      const audioScenarioOut =
        evaluationType === "audio_presentation"
          ? audioPresentationScenario.trim() || null
          : evaluationType === "audio_negotiation"
            ? audioNegotiationScenario.trim() || null
            : null;

      const body: Record<string, unknown> = {
        course_id: courseId,
        label: label.trim(),
        level,
        objectives,
        modalities: modalities.trim() || null,
        evaluation_type: evaluationType,
        quiz_test_id: evaluationType === "qcm" ? (quizTestId || null) : null,
        case_prompt: evaluationType === "case_study" ? (casePrompt.trim() || null) : null,
        audio_scenario: audioScenarioOut,
        video_presentation_url: evaluationType === "video_presentation" ? (videoPresentationUrl.trim() || null) : null,
        technical_deliverable_url: evaluationType === "file_upload" ? (fileUploadInstructions.trim() || null) : null,
        active,
      };

      const res = await fetch("/api/formateur/certification/badge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Sauvegarde impossible");
      toast.success("Configuration enregistrée");
    } catch (e) {
      toast.error("Erreur de sauvegarde", { description: e instanceof Error ? e.message : "Erreur inconnue" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-6" style={{ fontFamily: '"SF Pro Display","SF Pro Text",-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,Arial,sans-serif' }}>
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">Configuration de la Certification</h1>
            <p className="text-sm text-slate-600">Configurez le badge et le mode d’évaluation associé à cette formation.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">Activer le badge</span>
              <Switch checked={active} onCheckedChange={(v) => setActive(Boolean(v))} />
            </div>
            <Button onClick={handleSave} disabled={saving || loading} className="rounded-full bg-slate-900 px-5 text-white">
              {saving ? "Sauvegarde…" : "Enregistrer"}
            </Button>
          </div>
        </div>

        <Card className="border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Fabrique à Badges</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nom du badge</Label>
                <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex : Expert en IA" />
              </div>
              <div className="space-y-2">
                <Label>Niveau</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Débutant", "Intermédiaire", "Spécialiste", "Expert"].map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Objectifs (une ligne = une puce)</Label>
              <Textarea value={objectivesText} onChange={(e) => setObjectivesText(e.target.value)} placeholder="- Objectif 1\n- Objectif 2" className="min-h-[120px]" />
            </div>

            <div className="space-y-2">
              <Label>Modalités d’obtention</Label>
              <Textarea value={modalities} onChange={(e) => setModalities(e.target.value)} placeholder="Ex : Score minimum 70%, 1 tentative, preuve écrite, ..." className="min-h-[100px]" />
            </div>

            <div className="space-y-3">
              <Label>Type d’évaluation</Label>
              <p className="text-xs text-slate-600">Sélectionnez une carte — les champs adaptés s’affichent en dessous.</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {EVAL_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setEvaluationType(opt.id)}
                    className={cn(
                      "rounded-2xl border-2 p-4 text-left transition hover:border-indigo-300 hover:shadow-md",
                      evaluationType === opt.id
                        ? "border-indigo-600 bg-indigo-50/90 shadow-sm ring-1 ring-indigo-600/20"
                        : "border-slate-200 bg-white",
                    )}
                  >
                    <div className="text-sm font-bold text-slate-900">{opt.title}</div>
                    <div className="mt-1 text-xs font-medium text-slate-700">{opt.subtitle}</div>
                  </button>
                ))}
              </div>
            </div>

            {evaluationType === "qcm" ? (
              <div className="space-y-2 rounded-2xl border-2 border-slate-200 bg-slate-50 p-4">
                <Label>Quiz (table tests)</Label>
                <Select value={quizTestId} onValueChange={setQuizTestId}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder={tests.length ? "Choisir un quiz" : "Aucun quiz trouvé dans le builder"} />
                  </SelectTrigger>
                  <SelectContent>
                    {tests.map((t, idx) => {
                      const id = String(t.id ?? "");
                      const title = String(t.title ?? `Quiz ${idx + 1}`);
                      return (
                        <SelectItem key={id || String(idx)} value={id}>
                          {title}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs font-medium text-slate-800">Générez un quiz dans « Ressources & tests associés », puis revenez ici.</p>
              </div>
            ) : null}

            {evaluationType === "case_study" ? (
              <div className="space-y-2 rounded-2xl border-2 border-slate-200 bg-slate-50 p-4">
                <Label>Étude de cas — case_prompt</Label>
                <Textarea
                  value={casePrompt}
                  onChange={(e) => setCasePrompt(e.target.value)}
                  className="min-h-[160px] bg-white"
                  placeholder="Décrivez la problématique et les attentes de restitution."
                />
              </div>
            ) : null}

            {evaluationType === "audio_presentation" ? (
              <div className="space-y-2 rounded-2xl border-2 border-slate-200 bg-slate-50 p-4">
                <Label>Présentation audio — audio_scenario</Label>
                <Textarea
                  value={audioPresentationScenario}
                  onChange={(e) => setAudioPresentationScenario(e.target.value)}
                  className="min-h-[160px] bg-white"
                  placeholder="Durée, ton, structure attendue, critères d’écoute…"
                />
              </div>
            ) : null}

            {evaluationType === "audio_negotiation" ? (
              <div className="space-y-2 rounded-2xl border-2 border-slate-200 bg-slate-50 p-4">
                <Label>Négociation audio (IA) — audio_scenario</Label>
                <Textarea
                  value={audioNegotiationScenario}
                  onChange={(e) => setAudioNegotiationScenario(e.target.value)}
                  className="min-h-[180px] bg-white"
                  placeholder="Rôle de l’IA, enjeux, contraintes, objectifs pédagogiques du scénario…"
                />
              </div>
            ) : null}

            {evaluationType === "file_upload" ? (
              <div className="space-y-3 rounded-2xl border-2 border-slate-200 bg-slate-50 p-4">
                <Label>Consignes de dépôt</Label>
                <Textarea
                  value={fileUploadInstructions}
                  onChange={(e) => setFileUploadInstructions(e.target.value)}
                  className="min-h-[140px] bg-white"
                  placeholder="Formats acceptés, taille max, lien modèle, ou URL vers une consigne PDF…"
                />
                <p className="text-xs font-medium text-slate-800">
                  Stocké dans technical_deliverable_url (texte ou URL). L’apprenant utilisera l’overlay certification pour déposer sa preuve.
                </p>
              </div>
            ) : null}

            {evaluationType === "video_presentation" ? (
              <div className="space-y-3 rounded-2xl border-2 border-slate-200 bg-slate-50 p-4">
                <Label>Vidéo — Loom ou URL</Label>
                <Input
                  value={videoPresentationUrl}
                  onChange={(e) => setVideoPresentationUrl(e.target.value)}
                  placeholder="https://www.loom.com/share/… ou URL de fichier / consigne vidéo"
                  className="bg-white"
                />
                <p className="text-xs font-medium text-slate-800">Les apprenants verront ce lien comme référence dans l’overlay.</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
