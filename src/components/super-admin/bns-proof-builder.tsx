"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowDown,
  ArrowUp,
  Circle,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  GripVertical,
} from "lucide-react";

type Proof = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  sector?: string | null;
  level?: string | null;
  expected_outcome?: string | null;
  expected_proof?: string | null;
};

type Path = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  trigger_label?: string | null;
  final_validation_type?: string | null;
  final_validation_prompt?: string | null;
  final_validation_rules?: Record<string, unknown> | null;
};

type NodeType = "content";

type NodeItem = {
  title: string;
  node_type: NodeType;
  content_type?: string | null;
  description?: string | null;
  config?: Record<string, unknown> | null;
};

type StepItem = {
  id?: string;
  title: string;
  nodes: NodeItem[];
};

type ProofDetail = Proof & {
  steps: StepItem[];
};

const aiPromptPack = {
  system:
    "Tu es un évaluateur strict mais utile. Tu valides des livrables professionnels (opposables, mesurables). Tu ne fais pas de storytelling. Tu suis la grille (rubric) et tu rends un verdict : PASS / NEEDS_WORK / FAIL. Tu donnes : (1) score par critère, (2) points manquants, (3) actions concrètes (max 5), (4) demandes de clarification si nécessaire. Si l’information manque, tu ne l’inventes pas : tu demandes explicitement ce qui manque.",
  user_template:
    "Brique: {{proof_title}}\nObjectif: {{proof_goal}}\nLivrable attendu: {{deliverable_expected}}\nSubmission: {{submission_text}}\nLiens: {{submission_links}}\nRubric (JSON): {{rubric_json}}\nContraintes: Réponds STRICTEMENT au format JSON demandé.",
  output_schema_version: "bns-proof-v1",
};

const finalValidationPromptTemplate = (title: string) =>
  `Tu es un évaluateur de livrables. Analyse la soumission de l’utilisateur pour le parcours ${title}.\n\n1. Résume la soumission en 5 lignes.\n2. Vérifie la recevabilité vs critères (OK/NON) avec justification.\n3. Donne un score 0-100 et 3 raisons principales.\n4. Liste les manques / incohérences.\n5. Propose 3 actions concrètes d’amélioration.\n6. Conclure par "Recevable: Oui/Non".\nReste factuel, sans marketing, sans formulation vague.`;

const emptyStep = (): StepItem => ({
  title: "Bloc principal",
  nodes: [],
});

export function BnsProofBuilder() {
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [paths, setPaths] = useState<Path[]>([]);
  const [selectedProofId, setSelectedProofId] = useState<string | null>(null);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [proofDetail, setProofDetail] = useState<ProofDetail | null>(null);
  const [pathDetail, setPathDetail] = useState<Path & { steps: Proof[] }>({
    id: "",
    title: "",
    slug: "",
    description: "",
    trigger_label: "",
    final_validation_type: "",
    final_validation_prompt: "",
    final_validation_rules: { criteria: ["", "", ""] },
    steps: [],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [contentType, setContentType] = useState<
    "text" | "pdf" | "audio" | "video" | "image" | null
  >(null);
  const [brickTitle, setBrickTitle] = useState("");
  const [brickDescription, setBrickDescription] = useState("");
  const defaultContentMeta = () => ({
    fileName: "",
    url: "",
    caption: "",
    sections: [{ title: "", content: "" }],
    markdown: "",
    textMode: "simple" as "simple" | "lms",
    videoMode: "link" as "link" | "upload",
  });
  const [contentMeta, setContentMeta] = useState(defaultContentMeta);
  const [editingContentIndex, setEditingContentIndex] = useState<number | null>(null);
  const [draggingContentIndex, setDraggingContentIndex] = useState<number | null>(null);

  const [pathPickerOpen, setPathPickerOpen] = useState(false);
  const [pathSearch, setPathSearch] = useState("");
  const [draggingPathIndex, setDraggingPathIndex] = useState<number | null>(null);
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const proofRes = await fetch("/api/bns/admin/proofs");
      const proofJson = await proofRes.json();
      if (proofJson.ok) setProofs(proofJson.proofs ?? []);

      const pathRes = await fetch("/api/bns/admin/paths");
      const pathJson = await pathRes.json();
      if (pathJson.ok) setPaths(pathJson.paths ?? []);
    };
    load();
  }, []);

  const filteredProofs = useMemo(() => {
    return proofs.filter((proof) => {
      const matchesSearch =
        !searchTerm ||
        proof.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proof.slug.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSector = !sectorFilter || proof.sector === sectorFilter;
      return matchesSearch && matchesSector;
    });
  }, [proofs, searchTerm, sectorFilter]);

  const loadProofDetail = async (proofId: string) => {
    const response = await fetch(`/api/bns/admin/proofs/${proofId}`);
    const result = await response.json();
    if (result.ok) {
      const steps = (result.steps ?? []).map((step: any) => ({
        id: step.id,
        title: step.title,
        nodes: (result.nodes ?? [])
          .filter((node: any) => node.proof_step_id === step.id)
          .map((node: any) => ({
            title: node.title ?? "",
            node_type: node.node_type ?? "content",
            content_type: node.content_type ?? "",
            description: node.description ?? "",
            config: node.config ?? null,
          })),
      }));
      setProofDetail({
        id: result.proof.id,
        slug: result.proof.slug,
        title: result.proof.title,
        description: result.proof.description,
        sector: result.proof.sector,
        level: result.proof.level,
        expected_outcome: result.proof.expected_outcome,
        expected_proof: result.proof.expected_proof,
        steps: steps.length ? steps : [emptyStep()],
      });
    }
  };

  const saveProof = async (payload: ProofDetail) => {
    setStatus(null);
    const response = await fetch(`/api/bns/admin/proofs/${payload.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: payload.title,
        slug: payload.slug,
        description: payload.description,
        sector: payload.sector,
        level: payload.level,
        expected_outcome: payload.expected_outcome,
        expected_proof: payload.expected_proof,
        steps: payload.steps.map((step, index) => ({
          title: step.title,
          description: "",
          order: index,
          nodes: step.nodes.map((node, nodeIndex) => ({
            title: node.title,
            description: node.description,
            content_type: node.content_type,
            node_type: node.node_type,
            config: node.config,
            order: nodeIndex,
          })),
        })),
      }),
    });
    const result = await response.json();
    if (!result.ok) {
      setStatus("Impossible d’enregistrer la brique.");
      return false;
    }
    setStatus("Brique enregistrée.");
    return true;
  };

  const handleCreateProof = async () => {
    setStatus(null);
    const response = await fetch("/api/bns/admin/proofs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proofDetail),
    });
    const result = await response.json();
    if (result.ok) {
      setProofs((prev) => [result.proof, ...prev]);
      setSelectedProofId(result.proof.id);
      loadProofDetail(result.proof.id);
    } else {
      setStatus("Impossible de créer la brique.");
    }
  };

  const handleSelectProof = async (proofId: string) => {
    setSelectedProofId(proofId);
    await loadProofDetail(proofId);
  };

  const openContentModal = () => {
    setContentType("text");
    setBrickTitle("");
    setBrickDescription("");
    setContentMeta(defaultContentMeta());
    setEditingContentIndex(null);
    setContentModalOpen(true);
  };

  const addContentNode = async (node: NodeItem) => {
    if (!proofDetail) return;
    const nextSteps = [...proofDetail.steps];
    nextSteps[0] = { ...nextSteps[0], nodes: [...nextSteps[0].nodes, node] };
    const nextDetail = { ...proofDetail, steps: nextSteps };
    setProofDetail(nextDetail);
    await saveProof(nextDetail);
    setContentModalOpen(false);
  };

  const updateContentNode = async (index: number, node: NodeItem) => {
    if (!proofDetail) return;
    const nextSteps = [...proofDetail.steps];
    const nextNodes = [...nextSteps[0].nodes];
    nextNodes[index] = node;
    nextSteps[0] = { ...nextSteps[0], nodes: nextNodes };
    const nextDetail = { ...proofDetail, steps: nextSteps };
    setProofDetail(nextDetail);
    await saveProof(nextDetail);
    setContentModalOpen(false);
    setEditingContentIndex(null);
  };

  const openEditContent = (index: number, node: NodeItem) => {
    setEditingContentIndex(index);
    const resolvedType = node.content_type === "lms" ? "text" : (node.content_type as typeof contentType);
    setContentType(resolvedType ?? "text");
    setBrickTitle(node.title ?? "");
    setBrickDescription(node.description ?? "");
    const config = (node.config as any) ?? {};
    const lmsBlocks =
      node.content_type === "lms" ? config?.lms?.blocks ?? [] : config?.sections ?? [];
    setContentMeta({
      fileName: config?.fileName ?? "",
      url: config?.url ?? "",
      caption: config?.caption ?? "",
      sections: lmsBlocks.length ? lmsBlocks : [{ title: "", content: "" }],
      markdown: config?.markdown ?? "",
      textMode: node.content_type === "lms" ? "lms" : config?.textMode ?? "simple",
      videoMode: config?.videoMode ?? "link",
    });
    setContentModalOpen(true);
  };

  const removeNode = async (index: number) => {
    if (!proofDetail) return;
    const nextSteps = [...proofDetail.steps];
    nextSteps[0].nodes.splice(index, 1);
    const nextDetail = { ...proofDetail, steps: nextSteps };
    setProofDetail(nextDetail);
    await saveProof(nextDetail);
  };

  const moveNode = async (index: number, direction: -1 | 1) => {
    if (!proofDetail) return;
    const nodes = [...proofDetail.steps[0].nodes];
    const target = index + direction;
    if (target < 0 || target >= nodes.length) return;
    [nodes[index], nodes[target]] = [nodes[target], nodes[index]];
    const nextDetail = {
      ...proofDetail,
      steps: [{ ...proofDetail.steps[0], nodes }],
    };
    setProofDetail(nextDetail);
    await saveProof(nextDetail);
  };

  const reorderContentNodes = async (from: number, to: number) => {
    if (!proofDetail) return;
    const nodes = [...proofDetail.steps[0].nodes];
    const [moved] = nodes.splice(from, 1);
    nodes.splice(to, 0, moved);
    const nextDetail = {
      ...proofDetail,
      steps: [{ ...proofDetail.steps[0], nodes }],
    };
    setProofDetail(nextDetail);
    await saveProof(nextDetail);
  };

  const savePath = async () => {
    if (!pathDetail.title || !pathDetail.slug) {
      setStatus("Titre et slug requis pour le parcours.");
      return;
    }
    if (!pathDetail.id) {
      const response = await fetch("/api/bns/admin/paths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pathDetail.title,
          slug: pathDetail.slug,
          description: pathDetail.description,
          trigger_label: pathDetail.trigger_label,
        }),
      });
      const result = await response.json();
      if (result.ok) {
        setPaths((prev) => [result.path, ...prev]);
        setPathDetail((prev) => ({ ...prev, id: result.path.id }));
        setSelectedPathId(result.path.id);
      }
      return;
    }
    await fetch(`/api/bns/admin/paths/${pathDetail.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: pathDetail.title,
        slug: pathDetail.slug,
        description: pathDetail.description,
        trigger_label: pathDetail.trigger_label,
        final_validation_type: pathDetail.final_validation_type,
        final_validation_prompt: pathDetail.final_validation_prompt,
        final_validation_rules: pathDetail.final_validation_rules,
        steps: pathDetail.steps.map((step) => ({ proof_id: step.id })),
      }),
    });
  };

  const loadPath = async (pathId: string) => {
    const response = await fetch(`/api/bns/admin/paths/${pathId}`);
    const result = await response.json();
    if (result.ok) {
      setPathDetail({
        id: result.path.id,
        title: result.path.title,
        slug: result.path.slug,
        description: result.path.description ?? "",
        trigger_label: result.path.trigger_label ?? "",
        final_validation_type: result.path.final_validation_type ?? "",
        final_validation_prompt: result.path.final_validation_prompt ?? "",
        final_validation_rules: result.path.final_validation_rules ?? { criteria: ["", "", ""] },
        steps: (result.steps ?? []).map((step: any) => ({
          id: step.bns_proofs?.id,
          title: step.bns_proofs?.title,
          slug: step.bns_proofs?.slug,
          sector: step.bns_proofs?.sector,
          level: step.bns_proofs?.level,
        })),
      });
    }
  };

  const publishPath = async () => {
    if (!pathDetail.id) return;
    await savePath();
    await fetch(`/api/bns/admin/paths/${pathDetail.id}/publish`, { method: "POST" });
  };

  const addPathStep = (proof: Proof) => {
    setPathDetail((prev) => ({ ...prev, steps: [...prev.steps, proof] }));
    setPathPickerOpen(false);
    setTimeout(() => {
      savePath();
    }, 0);
  };

  const movePathStep = (index: number, direction: -1 | 1) => {
    setPathDetail((prev) => {
      const next = [...prev.steps];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, steps: next };
    });
    setTimeout(() => {
      savePath();
    }, 0);
  };

  const removePathStep = (index: number) => {
    setPathDetail((prev) => {
      const next = [...prev.steps];
      next.splice(index, 1);
      return { ...prev, steps: next };
    });
    setTimeout(() => {
      savePath();
    }, 0);
  };

  const getContentIcon = (type?: string | null) => {
    switch (type) {
      case "pdf":
      case "text":
      case "lms":
        return FileText;
      case "audio":
        return FileAudio;
      case "video":
        return FileVideo;
      case "image":
        return FileImage;
      default:
        return FileText;
    }
  };

  const getContentLabel = (type?: string | null) => {
    switch (type) {
      case "text":
        return "Texte";
      case "lms":
        return "Cours (LMS)";
      case "pdf":
        return "PDF";
      case "audio":
        return "Audio";
      case "video":
        return "Vidéo";
      case "image":
        return "Image / Schéma";
      default:
        return "Contenu";
    }
  };

  const getContentPreview = (node: NodeItem) => {
    const config = (node.config as any) ?? {};
    if (node.content_type === "video" && config.url) return config.url;
    if (config.fileName) return config.fileName;
    if (config.caption) return config.caption;
    if (config.markdown) return config.markdown.slice(0, 80);
    if (config?.lms?.blocks?.length) return `${config.lms.blocks.length} blocs`;
    return "";
  };

  const startNewProof = () => {
    setSelectedProofId(null);
    setProofDetail({
      id: "",
      slug: "",
      title: "",
      description: "",
      sector: "",
      level: "",
      expected_outcome: "",
      expected_proof: "",
      steps: [emptyStep()],
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr_360px]">
      <aside className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
            Bibliothèque de briques
          </p>
          <Button onClick={startNewProof}>
            + Nouvelle brique
          </Button>
        </div>
        <div className="mt-4 space-y-2">
          <Input
            placeholder="Rechercher"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <div className="grid gap-2">
            <Input
              placeholder="Filtrer par secteur"
              value={sectorFilter}
              onChange={(event) => setSectorFilter(event.target.value)}
            />
          </div>
          <div className="mt-3 space-y-2">
            {filteredProofs.map((proof) => (
              <button
                key={proof.id}
                type="button"
                onClick={() => handleSelectProof(proof.id)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                  selectedProofId === proof.id
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 text-gray-700"
                }`}
              >
                <div className="font-medium">{proof.title}</div>
                <div className="text-xs text-gray-500">{proof.sector || "Secteur"}</div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
                Éditeur de brique
              </p>
              <p className="text-sm text-gray-700">
                Brique : {proofDetail?.title || "Nouvelle brique"}
              </p>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
              BNS_BUILDER_RENDERED ✅
            </span>
          </div>
          {proofDetail ? (
            <div className="mt-4 space-y-4">
              <Input
                placeholder="Titre"
                value={proofDetail.title}
                onChange={(event) =>
                  setProofDetail((prev) => (prev ? { ...prev, title: event.target.value } : prev))
                }
              />
              <Input
                placeholder="Slug"
                value={proofDetail.slug}
                onChange={(event) =>
                  setProofDetail((prev) => (prev ? { ...prev, slug: event.target.value } : prev))
                }
              />
              <Textarea
                placeholder="Description courte (impact réel)"
                value={proofDetail.description ?? ""}
                onChange={(event) =>
                  setProofDetail((prev) =>
                    prev ? { ...prev, description: event.target.value } : prev,
                  )
                }
              />
              <Input
                placeholder="Secteur"
                value={proofDetail.sector ?? ""}
                onChange={(event) =>
                  setProofDetail((prev) => (prev ? { ...prev, sector: event.target.value } : prev))
                }
              />
              <Input
                placeholder="Résultat attendu"
                value={proofDetail.expected_outcome ?? ""}
                onChange={(event) =>
                  setProofDetail((prev) =>
                    prev ? { ...prev, expected_outcome: event.target.value } : prev,
                  )
                }
              />
              <Input
                placeholder="Exemple de sortie (indicatif)"
                value={proofDetail.expected_proof ?? ""}
                onChange={(event) =>
                  setProofDetail((prev) =>
                    prev ? { ...prev, expected_proof: event.target.value } : prev,
                  )
                }
              />
              <p className="text-xs text-gray-500">
                Exemple pédagogique, non évalué ici.
              </p>
              <div className="flex gap-2">
                <Button onClick={() => (proofDetail.id ? saveProof(proofDetail) : handleCreateProof())}>
                  {proofDetail.id ? "Enregistrer" : "Créer la brique"}
                </Button>
                <Button
                  variant="outline"
                  onClick={openContentModal}
                  disabled={!proofDetail.id}
                  title={!proofDetail.id ? "Enregistre d’abord la brique" : undefined}
                >
                  Ajouter un contenu
                </Button>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
                  Contenus de la brique
                </p>
                {proofDetail.steps[0].nodes.length ? (
                  proofDetail.steps[0].nodes.map((node, index) => {
                    const Icon = getContentIcon(node.content_type);
                    return (
                      <div
                        key={`${node.title}-${index}`}
                        className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2 text-sm"
                        draggable
                        onDragStart={() => setDraggingContentIndex(index)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => {
                          if (draggingContentIndex === null || draggingContentIndex === index) return;
                          reorderContentNodes(draggingContentIndex, index);
                          setDraggingContentIndex(null);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <GripVertical className="h-4 w-4 text-gray-400" />
                          <Icon className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="font-medium">{node.title}</div>
                            <div className="text-xs text-gray-500">
                              {getContentLabel(node.content_type)}
                            </div>
                            {getContentPreview(node) ? (
                              <div className="text-xs text-gray-400">
                                {getContentPreview(node)}
                              </div>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => openEditContent(index, node)}>
                            Éditer
                          </Button>
                          <Button variant="outline" onClick={() => moveNode(index, -1)}>
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" onClick={() => moveNode(index, 1)}>
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" onClick={() => removeNode(index)}>
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-md border border-dashed border-gray-200 px-3 py-4 text-sm text-gray-500">
                    Aucun contenu. Ajoute un texte, un PDF, un audio, une vidéo ou un schéma.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-md border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Circle className="h-4 w-4" />
                Aucune brique sélectionnée. Crée une nouvelle brique pour commencer.
              </div>
              <Button className="mt-4" onClick={startNewProof}>
                Nouvelle brique
              </Button>
            </div>
          )}
        </div>
      </section>

      <aside className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Constructeur de parcours</p>
        <div className="mt-4 space-y-3">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Parcours</p>
            <select
              value={selectedPathId ?? ""}
              onChange={(event) => {
                const value = event.target.value;
                if (!value) {
                  setSelectedPathId(null);
                  return;
                }
                setSelectedPathId(value);
                loadPath(value);
              }}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">Sélectionner un parcours</option>
              {paths.map((path) => (
                <option key={path.id} value={path.id}>
                  {path.title}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedPathId(null);
                setPathDetail({
                  id: "",
                  title: "",
                  slug: "",
                  description: "",
                  trigger_label: "",
                  final_validation_type: "",
                  final_validation_prompt: finalValidationPromptTemplate(""),
                  final_validation_rules: { criteria: ["", "", ""] },
                  steps: [],
                });
              }}
            >
              Nouveau parcours
            </Button>
          </div>
          <Input
            placeholder="Titre du parcours"
            value={pathDetail.title}
            onChange={(event) => setPathDetail((prev) => ({ ...prev, title: event.target.value }))}
          />
          <Input
            placeholder="Slug"
            value={pathDetail.slug}
            onChange={(event) => setPathDetail((prev) => ({ ...prev, slug: event.target.value }))}
          />
          <Input
            placeholder="Déclencheur (optionnel)"
            value={pathDetail.trigger_label ?? ""}
            onChange={(event) =>
              setPathDetail((prev) => ({ ...prev, trigger_label: event.target.value }))
            }
          />
          <Button onClick={savePath}>Enregistrer le parcours</Button>
          <Button
            variant="outline"
            onClick={() => setPathPickerOpen(true)}
            disabled={!pathDetail.title || !pathDetail.slug}
            title={
              !pathDetail.title || !pathDetail.slug
                ? "Renseigne le titre et le slug du parcours"
                : undefined
            }
          >
            + Ajouter une brique au parcours
          </Button>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Étapes du parcours</p>
            {pathDetail.steps.map((step, index) => (
              <div
                key={`${step.id}-${index}`}
                className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2 text-sm"
                draggable
                onDragStart={() => setDraggingPathIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (draggingPathIndex === null || draggingPathIndex === index) return;
                  const from = draggingPathIndex;
                  const to = index;
                  setDraggingPathIndex(null);
                  setPathDetail((prev) => {
                    const next = [...prev.steps];
                    const [moved] = next.splice(from, 1);
                    next.splice(to, 0, moved);
                    return { ...prev, steps: next };
                  });
                  setTimeout(() => {
                    savePath();
                  }, 0);
                }}
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="font-medium">{step.title}</div>
                    <div className="text-xs text-gray-500">{step.sector}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => movePathStep(index, -1)}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={() => movePathStep(index, 1)}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={() => removePathStep(index)}>
                    Retirer
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-md border border-gray-200 p-3">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Validation finale</p>
            <Button
              variant="outline"
              onClick={() => {
                setValidationError(null);
                if (!pathDetail.final_validation_prompt) {
                  setPathDetail((prev) => ({
                    ...prev,
                    final_validation_prompt: finalValidationPromptTemplate(prev.title || "ce parcours"),
                  }));
                }
                if (!pathDetail.final_validation_rules) {
                  setPathDetail((prev) => ({
                    ...prev,
                    final_validation_rules: { criteria: ["", "", ""] },
                  }));
                }
                setValidationModalOpen(true);
              }}
            >
              Définir la validation
            </Button>
            {pathDetail.final_validation_type ? (
              <div className="mt-3 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                <p>Type : {pathDetail.final_validation_type}</p>
                {((pathDetail.final_validation_rules as any)?.deliverable ?? "") ? (
                  <p>
                    Livrable : {(pathDetail.final_validation_rules as any)?.deliverable}
                  </p>
                ) : null}
                <p>
                  Critères :{" "}
                  {((pathDetail.final_validation_rules as any)?.criteria ?? [])
                    .filter(Boolean)
                    .slice(0, 3)
                    .join(" · ") || "à compléter"}
                </p>
                {pathDetail.final_validation_prompt ? (
                  <p>Prompt IA configuré ✅</p>
                ) : (
                  <p>Prompt IA manquant</p>
                )}
              </div>
            ) : null}
            <Button onClick={publishPath} disabled={!pathDetail.id}>
              Publier le parcours
            </Button>
          </div>
        </div>
      </aside>

      <Dialog open={contentModalOpen} onOpenChange={setContentModalOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogTitle className="sr-only">Ajouter un contenu</DialogTitle>
          <DialogDescription className="sr-only">
            Formulaire d'ajout de contenu au parcours
          </DialogDescription>
          <DialogHeader>
            <DialogTitle>Ajouter un contenu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Texte / Cours", value: "text" },
                { label: "PDF", value: "pdf" },
                { label: "Audio", value: "audio" },
                { label: "Vidéo", value: "video" },
                { label: "Image / Schéma", value: "image" },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={`rounded-full border px-3 py-1 text-xs ${
                    contentType === item.value
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 text-gray-600"
                  }`}
                  onClick={() => setContentType(item.value as typeof contentType)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <Input
              placeholder="Titre (obligatoire)"
              value={brickTitle}
              onChange={(event) => setBrickTitle(event.target.value)}
            />
            <Textarea
              placeholder="Description (optionnel)"
              value={brickDescription}
              onChange={(event) => setBrickDescription(event.target.value)}
            />

            {contentType === "text" ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Texte simple", value: "simple" },
                    { label: "Créer un cours (LMS)", value: "lms" },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      className={`rounded-full border px-3 py-1 text-xs ${
                        contentMeta.textMode === item.value
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 text-gray-600"
                      }`}
                      onClick={() =>
                        setContentMeta((prev) => ({
                          ...prev,
                          textMode: item.value as "simple" | "lms",
                        }))
                      }
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                {contentMeta.textMode === "simple" ? (
                  <Textarea
                    placeholder="Contenu (markdown)"
                    value={contentMeta.markdown}
                    onChange={(event) =>
                      setContentMeta((prev) => ({ ...prev, markdown: event.target.value }))
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    {contentMeta.sections.map((section, index) => (
                      <div key={`section-${index}`} className="space-y-2">
                        <Input
                          placeholder="Titre de bloc"
                          value={section.title}
                          onChange={(event) => {
                            const next = [...contentMeta.sections];
                            next[index] = { ...next[index], title: event.target.value };
                            setContentMeta((prev) => ({ ...prev, sections: next }));
                          }}
                        />
                        <Textarea
                          placeholder="Contenu du bloc"
                          value={section.content}
                          onChange={(event) => {
                            const next = [...contentMeta.sections];
                            next[index] = { ...next[index], content: event.target.value };
                            setContentMeta((prev) => ({ ...prev, sections: next }));
                          }}
                        />
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() =>
                        setContentMeta((prev) => ({
                          ...prev,
                          sections: [...prev.sections, { title: "", content: "" }],
                        }))
                      }
                    >
                      Ajouter un bloc
                    </Button>
                  </div>
                )}
              </div>
            ) : null}

            {contentType === "pdf" || contentType === "audio" || contentType === "image" ? (
              <div className="space-y-2">
                <Input
                  type="file"
                  onChange={(event) =>
                    setContentMeta((prev) => ({
                      ...prev,
                      fileName: event.target.files?.[0]?.name ?? prev.fileName,
                    }))
                  }
                />
                <Input
                  placeholder="Légende"
                  value={contentMeta.caption}
                  onChange={(event) =>
                    setContentMeta((prev) => ({ ...prev, caption: event.target.value }))
                  }
                />
              </div>
            ) : null}

            {contentType === "video" ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Lien", value: "link" },
                    { label: "Upload", value: "upload" },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      className={`rounded-full border px-3 py-1 text-xs ${
                        contentMeta.videoMode === item.value
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 text-gray-600"
                      }`}
                      onClick={() =>
                        setContentMeta((prev) => ({
                          ...prev,
                          videoMode: item.value as "link" | "upload",
                        }))
                      }
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                {contentMeta.videoMode === "link" ? (
                  <Input
                    placeholder="URL vidéo (YouTube/Vimeo)"
                    value={contentMeta.url}
                    onChange={(event) =>
                      setContentMeta((prev) => ({ ...prev, url: event.target.value }))
                    }
                  />
                ) : (
                  <Input
                    type="file"
                    onChange={(event) =>
                      setContentMeta((prev) => ({
                        ...prev,
                        fileName: event.target.files?.[0]?.name ?? prev.fileName,
                      }))
                    }
                  />
                )}
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3">
              <Button variant="outline" onClick={() => setContentModalOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={() => {
                  if (!contentType || !brickTitle.trim()) return;
                  const resolvedContentType =
                    contentType === "text" && contentMeta.textMode === "lms"
                      ? "lms"
                      : contentType;
                  const resolvedConfig =
                    contentType === "text" && contentMeta.textMode === "lms"
                      ? {
                          type: "lms",
                          textMode: "lms",
                          lms: {
                            version: "v1",
                            blocks: contentMeta.sections,
                          },
                        }
                      : {
                          ...contentMeta,
                          type: contentType,
                        };
                  const payload: NodeItem = {
                    title: brickTitle,
                    node_type: "content",
                    content_type: resolvedContentType,
                    description: brickDescription,
                    config: resolvedConfig,
                  };
                  if (editingContentIndex !== null) {
                    updateContentNode(editingContentIndex, payload);
                  } else {
                    addContentNode(payload);
                  }
                  setBrickTitle("");
                  setBrickDescription("");
                  setContentType("text");
                }}
              >
                {editingContentIndex !== null ? "Mettre à jour" : "Ajouter"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={pathPickerOpen} onOpenChange={setPathPickerOpen}>
        <DialogContent>
          <DialogTitle className="sr-only">Ajouter une brique</DialogTitle>
          <DialogDescription className="sr-only">
            Sélection d'une brique à ajouter au parcours
          </DialogDescription>
          <DialogHeader>
            <DialogTitle>Ajouter une brique au parcours</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Rechercher une brique"
              value={pathSearch}
              onChange={(event) => setPathSearch(event.target.value)}
            />
            <div className="space-y-2">
              {proofs
                .filter((proof) =>
                  proof.title.toLowerCase().includes(pathSearch.toLowerCase()),
                )
                .map((proof) => (
                  <button
                    key={proof.id}
                    type="button"
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-left text-sm"
                    onClick={() => addPathStep(proof)}
                  >
                    <div className="font-medium">{proof.title}</div>
                    <div className="text-xs text-gray-500">{proof.sector}</div>
                  </button>
                ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={validationModalOpen} onOpenChange={setValidationModalOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogTitle className="sr-only">Mode de validation</DialogTitle>
          <DialogDescription className="sr-only">
            Configuration du mode de validation du parcours
          </DialogDescription>
          <DialogHeader>
            <DialogTitle>Mode de validation</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {(() => {
              const rules =
                (pathDetail.final_validation_rules as {
                  criteria?: string[];
                  scoring?: string;
                  accepted_examples?: string;
                  rejected_examples?: string;
                  deliverable?: string;
                }) ?? {};
              const criteria = rules.criteria ?? ["", "", ""];
              return (
                <>
            <select
              value={pathDetail.final_validation_type ?? ""}
              onChange={(event) =>
                setPathDetail((prev) => ({ ...prev, final_validation_type: event.target.value }))
              }
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">Choisir un mode</option>
              <option value="pdf">Dépôt PDF</option>
              <option value="video">Dépôt vidéo</option>
              <option value="file">Dépôt fichier</option>
              <option value="quiz">QCM</option>
              <option value="link">Lien</option>
              <option value="mix">Mixte</option>
            </select>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
                Critères de recevabilité
              </p>
              {criteria.map((item, index) => (
                <Input
                  key={`criteria-${index}`}
                  placeholder={`Critère ${index + 1}`}
                  value={item}
                  onChange={(event) => {
                    const next = [...criteria];
                    next[index] = event.target.value;
                    setPathDetail((prev) => ({
                      ...prev,
                      final_validation_rules: { ...rules, criteria: next },
                    }));
                  }}
                />
              ))}
              <Button
                variant="outline"
                onClick={() => {
                  const next = [...criteria, ""];
                  setPathDetail((prev) => ({
                    ...prev,
                    final_validation_rules: { ...rules, criteria: next },
                  }));
                }}
              >
                Ajouter un critère
              </Button>
            </div>
            <Input
              placeholder="Livrable final attendu (phrase)"
              value={rules.deliverable ?? ""}
              onChange={(event) =>
                setPathDetail((prev) => ({
                  ...prev,
                  final_validation_rules: { ...rules, deliverable: event.target.value },
                }))
              }
            />
            <Input
              placeholder="Barème / scoring (optionnel)"
              value={rules.scoring ?? ""}
              onChange={(event) =>
                setPathDetail((prev) => ({
                  ...prev,
                  final_validation_rules: { ...rules, scoring: event.target.value },
                }))
              }
            />
            <Textarea
              placeholder="Exemples acceptés (optionnel)"
              value={rules.accepted_examples ?? ""}
              onChange={(event) =>
                setPathDetail((prev) => ({
                  ...prev,
                  final_validation_rules: { ...rules, accepted_examples: event.target.value },
                }))
              }
            />
            <Textarea
              placeholder="Exemples refusés (optionnel)"
              value={rules.rejected_examples ?? ""}
              onChange={(event) =>
                setPathDetail((prev) => ({
                  ...prev,
                  final_validation_rules: { ...rules, rejected_examples: event.target.value },
                }))
              }
            />
            <Textarea
              placeholder="Prompt IA d’analyse (obligatoire)"
              value={
                pathDetail.final_validation_prompt ||
                finalValidationPromptTemplate(pathDetail.title || "ce parcours")
              }
              onChange={(event) =>
                setPathDetail((prev) => ({ ...prev, final_validation_prompt: event.target.value }))
              }
            />
            <Button
              onClick={() => {
                const deliverableValue = (rules.deliverable ?? "").trim();
                const promptValue =
                  pathDetail.final_validation_prompt ||
                  finalValidationPromptTemplate(pathDetail.title || "ce parcours");
                if (!deliverableValue) {
                  setValidationError("Le livrable final attendu est obligatoire.");
                  return;
                }
                if (!promptValue.trim()) {
                  setValidationError("Le prompt IA est obligatoire.");
                  return;
                }
                setValidationError(null);
                if (!pathDetail.final_validation_prompt) {
                  setPathDetail((prev) => ({
                    ...prev,
                    final_validation_prompt: finalValidationPromptTemplate(
                      prev.title || "ce parcours",
                    ),
                  }));
                }
                setValidationModalOpen(false);
                savePath();
              }}
            >
              Enregistrer
            </Button>
            {validationError ? (
              <p className="text-sm text-red-500">{validationError}</p>
            ) : null}
            </>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

