"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  FileText, 
  Sparkles, 
  Languages, 
  Image as ImageIcon, 
  FileCheck, 
  Volume2,
  Loader2,
  ArrowLeft,
  Copy,
  Download,
  Save,
  Eye,
  Timer,
  BookOpen,
  HelpCircle,
  Printer,
  History,
  MoreVertical,
  Camera,
  Upload,
  Mic,
  PenLine,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useDyslexiaMode } from "@/components/apprenant/dyslexia-mode-provider";
import { LearningStrategyModal } from "@/components/apprenant/learning-strategy-modal";
import { TimelineTube } from "@/components/apprenant/timeline-tube";
import { FocusMode } from "@/components/beyond-note/focus-mode";
import { PomodoroTimer } from "@/components/beyond-note/pomodoro-timer";
import { FlashcardsView } from "@/components/beyond-note/flashcards-view";
import { QuizView } from "@/components/beyond-note/quiz-view";
import { ReformulateOptionsModal } from "@/components/beyond-note/reformulate-options-modal";
import { ChatView } from "@/components/beyond-note/chat-view";
import { DictationModal } from "@/components/beyond-note/dictation-modal";
import { LoadingOverlay, SuccessOverlay } from "@/components/beyond-note/loading-overlay";
import { NeoBubble } from "@/components/beyond-note/jarvis-bubble";
import { OnboardingOverlay } from "@/components/beyond-note/onboarding-overlay";

type AIAction = 
  | "revision-sheet"
  | "reformulate"
  | "simple"
  | "explain"
  | "translate"
  | "diagram"
  | "cleanup"
  | "audio";

interface Document {
  id: string;
  file_name: string;
  file_url: string;
  extracted_text: string | null;
  file_type: string;
  source_type?: string | null;
  pages?: Array<{ id: string; content: string; page_number: number }>;
}

const transformations: Array<{
  id: AIAction;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  iconColor: string;
}> = [
  {
    id: "revision-sheet",
    label: "Créer une fiche de révision",
    description: "Génère une fiche de révision structurée",
    icon: <FileText className="h-5 w-5" />,
    color: "from-blue-500 to-cyan-500",
    iconColor: "text-blue-600",
  },
  {
    id: "reformulate",
    label: "Reformuler",
    description: "Reformule le texte pour améliorer la clarté",
    icon: <Sparkles className="h-5 w-5" />,
    color: "from-purple-500 to-pink-500",
    iconColor: "text-pink-600",
  },
  {
    id: "translate",
    label: "Traduire",
    description: "Traduit le document dans une autre langue",
    icon: <Languages className="h-5 w-5" />,
    color: "from-green-500 to-emerald-500",
    iconColor: "text-emerald-600",
  },
  {
    id: "diagram",
    label: "Créer un schéma",
    description: "Génère un schéma visuel à partir du contenu",
    icon: <ImageIcon className="h-5 w-5" />,
    color: "from-orange-500 to-red-500",
    iconColor: "text-orange-600",
  },
  {
    id: "cleanup",
    label: "Remettre au propre",
    description: "Nettoie et structure le texte",
    icon: <FileCheck className="h-5 w-5" />,
    color: "from-indigo-500 to-blue-500",
    iconColor: "text-indigo-600",
  },
  {
    id: "audio",
    label: "Transformer en audio",
    description: "Convertit le texte en fichier audio",
    icon: <Volume2 className="h-5 w-5" />,
    color: "from-rose-500 to-pink-500",
    iconColor: "text-rose-600",
  },
];

interface BeyondNoteDocumentPageProps {
  documentId: string;
}

export function BeyondNoteDocumentPage({ documentId }: BeyondNoteDocumentPageProps) {
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState<AIAction | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<AIAction | null>(null);
  const [showNeuroModal, setShowNeuroModal] = useState(false);
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showReformulateOptions, setShowReformulateOptions] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [accountType, setAccountType] = useState("solo");
  const [isSaving, setIsSaving] = useState(false);
  const [currentText, setCurrentText] = useState<string>("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [audioSource, setAudioSource] = useState<string | null>(null);
  const [audioVoice, setAudioVoice] = useState<string | null>(null);
  const [schemaLayout, setSchemaLayout] = useState<"tube" | "pyramid" | "timeline">("tube");
  const [showAddPage, setShowAddPage] = useState(false);
  const [addingPage, setAddingPage] = useState(false);
  const [addPageText, setAddPageText] = useState("");
  const [showDictationModal, setShowDictationModal] = useState(false);
  const [pages, setPages] = useState<{ id: string; content: string; page_number: number }[]>([]);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [isAddingPage, setIsAddingPage] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectionToolbar, setSelectionToolbar] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);
  const [transformationsHistory, setTransformationsHistory] = useState<{ id: string; action: string; result: string; created_at: string }[]>([]);
  const [showWallet, setShowWallet] = useState(false);
  const [selectionReformulateOpen, setSelectionReformulateOpen] = useState(false);
  const [chatExtractedText, setChatExtractedText] = useState<string | null>(null);
  const [allDocuments, setAllDocuments] = useState<{ id: string; file_name: string; extracted_text?: string | null }[]>([]);
  const [onboardingStep, setOnboardingStep] = useState(() => {
    if (typeof window !== "undefined") {
      return parseInt(localStorage.getItem("nevo_onboarding_step") || "0");
    }
    return 0;
  });
  const addPageCameraRef = useRef<HTMLInputElement>(null);
  const addPageFileRef = useRef<HTMLInputElement>(null);
  const selectionToolbarRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const { isDyslexiaMode } = useDyslexiaMode();

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  useEffect(() => {
    const loadAccount = async () => {
      try {
        const response = await fetch("/api/beyond-note/account");
        if (!response.ok) return;
        const data = await response.json();
        if (data?.account_type) {
          setAccountType(data.account_type);
        }
      } catch {
        setAccountType("solo");
      }
    };
    loadAccount();
  }, []);

  const handleSkipOnboarding = async () => {
    setOnboardingStep(0);
    if (typeof window !== "undefined") {
      localStorage.removeItem("nevo_onboarding_step");
    }
    await fetch("/api/beyond-note/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboarding_completed: true }),
    });
  };

  useEffect(() => {
    fetch("/api/beyond-note/documents")
      .then((r) => r.json())
      .then((data) => setAllDocuments(data.documents || []));
  }, []);

  useEffect(() => {
    // Mettre à jour le texte actuel quand le document ou le résultat change
    if (result && currentAction !== "diagram") {
      setCurrentText(result);
    } else if (document?.extracted_text) {
      setCurrentText(document.extracted_text);
    }
  }, [document, result, currentAction]);

  useEffect(() => {
    const handleClickOutside = () => setSelectionToolbar(null);
    const handleClick = (event: MouseEvent) => {
      if (selectionToolbarRef.current?.contains(event.target as Node)) return;
      handleClickOutside();
      setSelectionReformulateOpen(false);
    };
    globalThis.document?.addEventListener("mousedown", handleClick);
    return () => globalThis.document?.removeEventListener("mousedown", handleClick);
  }, []);

  const actionItems = [
    { id: "revision-sheet", label: "Fiche", icon: FileText, onClick: () => handleTransformation("revision-sheet"), active: currentAction === "revision-sheet", requiresText: true },
    { id: "reformulate", label: "Reformuler", icon: Sparkles, onClick: () => setShowReformulateOptions(true), active: currentAction === "reformulate", requiresText: true },
    { id: "translate", label: "Traduire", icon: Languages, onClick: () => handleTransformation("translate"), active: currentAction === "translate", requiresText: true },
    { id: "diagram", label: "Schéma", icon: ImageIcon, onClick: () => handleTransformation("diagram"), active: currentAction === "diagram", requiresText: true },
    { id: "cleanup", label: "Propre", icon: FileCheck, onClick: () => handleTransformation("cleanup"), active: currentAction === "cleanup", requiresText: true },
    { id: "audio", label: "Audio", icon: Volume2, onClick: () => handleTransformation("audio"), active: currentAction === "audio", requiresText: true },
    ...(accountType !== "child"
      ? [
          { id: "flashcards", label: "Flashcards", icon: BookOpen, onClick: () => setShowFlashcards(true), active: false, requiresText: true },
          { id: "quiz", label: "Quiz", icon: HelpCircle, onClick: () => setShowQuiz(true), active: false, requiresText: true },
        ]
      : []),
  ];
  const iconGradients = [
    "linear-gradient(135deg, #be1354, #F97316)",
    "linear-gradient(135deg, #6D28D9, #be1354)",
    "linear-gradient(135deg, #0EA5E9, #6D28D9)",
    "linear-gradient(135deg, #F97316, #be1354)",
  ];

  useEffect(() => {
    if (document?.file_name) {
      setTitleDraft(document.file_name);
    }
  }, [document?.file_name]);

  const diagramData = useMemo(() => {
    if (currentAction !== "diagram" || !result) return null;
    const raw = result.trim();
    const cleaned = raw.replace(/```json|```/g, "").trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }, [currentAction, result]);

  const loadDocument = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/beyond-note/documents`);
      if (response.ok) {
        const data = await response.json();
        const doc = data.documents?.find((d: Document) => d.id === documentId);
        if (doc) {
          setDocument(doc);
          if (doc.pages && doc.pages.length > 0) {
            setPages(doc.pages);
          } else if (doc.extracted_text) {
            const firstPage = { id: crypto.randomUUID(), content: doc.extracted_text, page_number: 1 };
            setPages([firstPage]);
          }
          const transRes = await fetch(`/api/beyond-note/transformations?document_id=${documentId}`);
          const transData = await transRes.json();
          setTransformationsHistory(transData.transformations || []);
        } else {
          toast.error("Document non trouvé");
          router.push("/beyond-note-app");
        }
      }
    } catch (error) {
      console.error("Error loading document:", error);
      toast.error("Erreur lors du chargement du document");
    } finally {
      setLoading(false);
    }
  };

  const handleTransformation = async (action: AIAction, textOverride?: string, options?: { style?: string }) => {
    if (!document) {
      toast.error("Document non trouvé");
      return;
    }
    const textToTransform =
      (textOverride ?? currentText).trim() ||
      pages.map((p) => p.content).join("\n\n") ||
      document?.extracted_text ||
      "";
    if (!textToTransform) {
      toast.error("Écrivez quelque chose avant de transformer");
      return;
    }

    setLoadingAction(action);
    setCurrentAction(action);
    if (!currentPageId && pages.length > 0) {
      setCurrentPageId(pages[0]?.id ?? null);
    }
      if (action !== "audio") {
        setAudioSource(null);
        setAudioVoice(null);
      }

    try {
      console.log("[beyond-note] Starting transformation:", action, "Text length:", textToTransform.length);
      
      const response = await fetch("/api/beyond-note/ai-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: document.id,
          action,
          text: textToTransform,
          style: options?.style,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erreur lors du traitement IA");
      }

      const data = await response.json();
      console.log("[beyond-note] Transformation result received, length:", data.result?.length || 0);
      
      setResult(data.result);
      setShowSuccess(true);
      if (action === "audio" && data.audio_base64 && data.audio_mime_type) {
        setAudioSource(`data:${data.audio_mime_type};base64,${data.audio_base64}`);
        setAudioVoice(data.audio_voice ?? null);
      }
      toast.success("Transformation terminée avec succès !");

      // Stocker le résultat
      await fetch("/api/beyond-note/store-result", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: document.id,
          action,
          result: data.result,
        }),
      });

      const saveRes = await fetch("/api/beyond-note/transformations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_id: documentId,
          action,
          input_text: textToTransform.slice(0, 500),
          result: data.result,
          page_id: currentPageId,
        }),
      });
      const saveData = await saveRes.json();
      setTransformationsHistory((prev) => [saveData.transformation, ...prev]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors du traitement IA";
      toast.error(errorMessage);
      console.error("[beyond-note] Error during AI action:", error);
      setCurrentAction(null);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAddPage = async (file: File) => {
    setIsAddingPage(true);
    try {
      // 1. Upload du fichier pour extraire le texte
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/beyond-note/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();

      // 2. Récupérer le texte extrait depuis le document créé
      const newDocId = uploadData.document?.id;
      if (!newDocId) return;

      // Attendre que l'OCR soit terminé (polling)
      let newText = uploadData.document?.extracted_text || "";
      if (!newText) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const docRes = await fetch(`/api/beyond-note/documents?id=${newDocId}`);
        const docData = await docRes.json();
        newText = docData.document?.extracted_text || "";
      }

      if (!newText) {
        toast.error("Impossible d'extraire le texte de cette page");
        return;
      }

      // 3. Supprimer le document temporaire créé par l'upload
      await fetch(`/api/beyond-note/documents/${newDocId}`, { method: "DELETE" });

      // 4. Ajouter comme nouvelle page du document actuel
      const newPage = {
        id: crypto.randomUUID(),
        content: newText,
        page_number: pages.length + 1,
      };
      const updatedPages = [...pages, newPage];
      setPages(updatedPages);

      await fetch(`/api/beyond-note/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pages: updatedPages }),
      });

      setShowSuccess(true);
      toast.success("Page ajoutée !");
    } catch (e) {
      toast.error("Erreur lors de l'ajout de la page");
    } finally {
      setIsAddingPage(false);
    }
  };

  const handleAddPageText = async (newContent: string) => {
    if (!newContent.trim()) return;
    const newPage = {
      id: crypto.randomUUID(),
      content: newContent,
      page_number: pages.length + 1,
    };
    const updatedPages = [...pages, newPage];
    setPages(updatedPages);

    await fetch(`/api/beyond-note/documents/${documentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pages: updatedPages }),
    });
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setSelectionToolbar(null);
      return;
    }
    const text = selection.toString().trim();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setSelectionToolbar({
      text,
      x: rect.left + rect.width / 2,
      y: rect.top + window.scrollY - 60,
    });
  };

  const handleAddPageFile = async (file: File) => {
    if (!document) return;
    setAddingPage(true);
    try {
      await handleAddPage(file);
    } finally {
      setAddingPage(false);
      setShowAddPage(false);
      setAddPageText("");
      if (addPageCameraRef.current) addPageCameraRef.current.value = "";
      if (addPageFileRef.current) addPageFileRef.current.value = "";
    }
  };

  const handleDictationComplete = async (newDocumentId: string) => {
    if (!newDocumentId || !document) return;
    setAddingPage(true);
    try {
      const res = await fetch("/api/beyond-note/documents");
      const data = await res.json();
      const newDoc = data?.documents?.find((doc: Document) => doc.id === newDocumentId);
      const newText = newDoc?.extracted_text || "";
      if (newText.trim()) {
        const patchRes = await fetch(`/api/beyond-note/documents/${document.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            extracted_text: (document.extracted_text || "") + "\n\n---\n\n" + newText,
          }),
        });
        const patchData = await patchRes.json();
        if (patchData.document) {
          setDocument(patchData.document);
          toast.success("Page ajoutée !");
        }
      }
      await fetch(`/api/beyond-note/documents/${newDocumentId}`, { method: "DELETE" });
    } catch {
      toast.error("Impossible d'ajouter la dictée");
    } finally {
      setAddingPage(false);
      setShowAddPage(false);
      setAddPageText("");
      router.replace(`/beyond-note-app/${document.id}`);
    }
  };

  const handleResetToOriginal = () => {
    setResult(null);
    setCurrentAction(null);
    setCurrentText(document?.extracted_text || "");
    toast.info("Retour au contenu original");
  };

  const handleTitleSave = async () => {
    if (!document) return;
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === document.file_name) {
      setTitleDraft(document.file_name);
      setIsEditingTitle(false);
      return;
    }
    try {
      const res = await fetch(`/api/beyond-note/documents/${document.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_name: trimmed }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur renommage");
      }
      setDocument({ ...document, file_name: trimmed });
      setTitleDraft(trimmed);
      toast.success("Titre mis à jour");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur";
      toast.error(message);
      setTitleDraft(document.file_name);
    } finally {
      setIsEditingTitle(false);
    }
  };

  const handleSave = async () => {
    if (!document || !currentText) {
      toast.error("Aucun texte à sauvegarder");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/beyond-note/update-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: document.id,
          modifiedText: currentText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erreur lors de la sauvegarde");
      }

      toast.success("Sauvegardé !");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la sauvegarde";
      toast.error(errorMessage);
      console.error("[beyond-note] Error saving document:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F9FC]">
        <Loader2 className="h-8 w-8 animate-spin text-[#6D28D9]" />
      </div>
    );
  }

  if (!document) {
    return null;
  }

  const textToTransform = currentText.trim() || pages.map((p) => p.content).join("\n\n") || document?.extracted_text || "";
  const isPDF = document.file_type === "application/pdf";
  const isImage = document.file_type?.startsWith("image/");

  return (
    <TooltipProvider>
      <div className={`h-screen flex flex-col bg-[#F8F9FC] text-[#0F1117] ${isDyslexiaMode ? 'dyslexia-mode' : ''}`}>
        {/* Header */}
        <div
          className="border-b border-white/20 z-20 flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
        >
          <div className="relative px-6 py-3 flex items-center">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/beyond-note-app")}
                className="flex items-center gap-2 text-white hover:text-white/90"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-md px-4 flex justify-center">
              {isEditingTitle ? (
                <input
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.currentTarget.blur();
                    }
                    if (e.key === "Escape") {
                      setTitleDraft(document.file_name);
                      setIsEditingTitle(false);
                    }
                  }}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-center outline-none max-w-[160px] md:max-w-md"
                  autoFocus
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingTitle(true)}
                  className="text-sm md:text-lg font-semibold text-white truncate max-w-[160px] md:max-w-md text-center"
                  style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
                >
                {document.file_name}
                </button>
              )}
            </div>
            <div className="ml-auto flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowWallet(true)}
                className="hidden md:flex items-center gap-2 bg-white/10 text-white border border-white/20 hover:bg-white/20"
                size="sm"
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Historique</span>
              </Button>
              {currentText && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="hidden md:flex text-white"
                  style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <span className="hidden sm:inline">Sauvegarde...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Sauvegarder</span>
                    </>
                  )}
                </Button>
              )}
              {(result || document.extracted_text) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const textToCopy = currentText || result || document.extracted_text || "";
                    navigator.clipboard.writeText(textToCopy);
                    toast.success("Contenu copié");
                  }}
                  className="hidden md:flex border border-white/20 text-white hover:bg-white/10"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="hidden md:flex border border-white/20 text-white hover:bg-white/10"
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Imprimer</span>
              </Button>
              {result && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const blob = new Blob([currentText || result], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const link = (document as any).createElement('a');
                    link.href = url;
                    link.download = `${currentAction || 'document'}-${document.file_name}.txt`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="hidden md:flex border border-white/20 text-white hover:bg-white/10"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="flex md:hidden border border-white/20 text-white hover:bg-white/10"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white text-[#0F1117] border-[#E8E9F0]">
                  <DropdownMenuItem onClick={() => setShowNeuroModal(true)}>
                    <Sparkles className="h-4 w-4 mr-2 text-[#be1354]" />
                    Neuro adapté
                  </DropdownMenuItem>
                  {currentText && (
                    <DropdownMenuItem onClick={handleSave}>
                      <Save className="h-4 w-4 mr-2 text-[#be1354]" />
                      Sauvegarder
                    </DropdownMenuItem>
                  )}
                  {(result || document.extracted_text) && (
                    <DropdownMenuItem
                      onClick={() => {
                        const textToCopy = currentText || result || document.extracted_text || "";
                        navigator.clipboard.writeText(textToCopy);
                        toast.success("Contenu copié");
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2 text-[#be1354]" />
                      Copier
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => window.print()}>
                    <Printer className="h-4 w-4 mr-2 text-[#be1354]" />
                    Imprimer
                  </DropdownMenuItem>
                  {isImage && document.file_url && (
                    <DropdownMenuItem onClick={() => window.open(document.file_url, "_blank")}>
                      <ImageIcon className="h-4 w-4 mr-2 text-[#be1354]" />
                      Voir l'original
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {/* FAB mobile */}
          <div className="fixed bottom-6 right-6 z-40 flex lg:hidden">
            <button
              type="button"
              onClick={() => setShowMobileActions(true)}
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
            >
              <Sparkles className="h-6 w-6 text-white" />
            </button>
          </div>

          {showMobileActions && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="absolute inset-0 bg-black/10 backdrop-blur-md"
                onClick={() => setShowMobileActions(false)}
              />
              <div className="absolute inset-0 bg-white/30 backdrop-blur-xl border-t border-white/40 rounded-none shadow-2xl relative">
                <div className="relative">
                  <div className="w-10 h-1 bg-[#E8E9F0] rounded-full mx-auto mt-3 mb-2" />
                  <button
                    type="button"
                    onClick={() => setShowMobileActions(false)}
                    className="absolute right-4 top-2 w-8 h-8 rounded-full bg-[#F3F4F8] text-[#6B7280] flex items-center justify-center"
                  >
                    ✕
                  </button>
                  <p className="text-xl font-bold text-[#0F1117] px-6 pt-6 pb-4">Que voulez-vous faire ?</p>
                </div>
                <div className="grid grid-cols-2 gap-4 px-6 pb-32">
                  {[
                    { id: "revision-sheet", label: "Fiche", icon: FileText, onClick: () => handleTransformation("revision-sheet"), requiresText: true, gradient: "linear-gradient(135deg, #be1354, #F97316)" },
                    { id: "reformulate", label: "Reformuler", icon: Sparkles, onClick: () => setShowReformulateOptions(true), requiresText: true, gradient: "linear-gradient(135deg, #6D28D9, #be1354)" },
                    { id: "translate", label: "Traduire", icon: Languages, onClick: () => handleTransformation("translate"), requiresText: true, gradient: "linear-gradient(135deg, #0EA5E9, #6D28D9)" },
                    { id: "diagram", label: "Schéma", icon: ImageIcon, onClick: () => handleTransformation("diagram"), requiresText: true, gradient: "linear-gradient(135deg, #F97316, #be1354)" },
                    { id: "cleanup", label: "Propre", icon: FileCheck, onClick: () => handleTransformation("cleanup"), requiresText: true, gradient: "linear-gradient(135deg, #be1354, #6D28D9)" },
                    { id: "audio", label: "Audio", icon: Volume2, onClick: () => handleTransformation("audio"), requiresText: true, gradient: "linear-gradient(135deg, #F97316, #F59E0B)" },
                    { id: "flashcards", label: "Flashcards", icon: BookOpen, onClick: () => setShowFlashcards(true), requiresText: true, gradient: "linear-gradient(135deg, #0EA5E9, #be1354)", hidden: accountType === "child" },
                    { id: "quiz", label: "Quiz", icon: HelpCircle, onClick: () => setShowQuiz(true), requiresText: true, gradient: "linear-gradient(135deg, #6D28D9, #F97316)", hidden: accountType === "child" },
                  ]
                    .filter((item) => !item.hidden)
                    .map((item) => {
                      const Icon = item.icon;
                      const disabled = item.requiresText && (!document.extracted_text || loadingAction !== null);
                      return (
                        <button
                          key={`mobile-main-${item.id}`}
                          type="button"
                          onClick={() => {
                            if (disabled) return;
                            item.onClick();
                            setShowMobileActions(false);
                          }}
                          disabled={disabled}
                        className={`flex flex-col items-center gap-3 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <div
                          className="w-14 h-14 rounded-2xl shadow-md flex items-center justify-center"
                            style={{ background: item.gradient }}
                          >
                          <Icon className="h-6 w-6 text-white" />
                          </div>
                        <span className="text-xs font-medium text-[#0F1117] text-center">{item.label}</span>
                        </button>
                      );
                    })}
                </div>
                <div className="border-t border-white/40 mx-6 my-4 mb-8" />
                <div className="grid grid-cols-3 gap-4 px-6 absolute bottom-8 left-0 right-0">
                  {[
                    { id: "focus", label: "Focus", icon: Eye, onClick: () => setShowFocusMode(true), requiresText: true, gradient: "linear-gradient(135deg, #0EA5E9, #6D28D9)" },
                    { id: "pomodoro", label: "Pomodoro", icon: Timer, onClick: () => setShowPomodoro(true), requiresText: false, gradient: "linear-gradient(135deg, #F97316, #be1354)" },
                    { id: "neuro", label: "Neuro", icon: Sparkles, onClick: () => setShowNeuroModal(true), requiresText: false, gradient: "linear-gradient(135deg, #6D28D9, #be1354)" },
                  ].map((item) => {
                    const Icon = item.icon;
                    const disabled = item.requiresText && (!document.extracted_text || loadingAction !== null);
                    return (
                      <button
                        key={`mobile-tools-${item.id}`}
                        type="button"
                        onClick={() => {
                          if (disabled) return;
                          item.onClick();
                          setShowMobileActions(false);
                        }}
                        disabled={disabled}
                        className={`flex flex-col items-center gap-3 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <div
                          className="w-12 h-12 rounded-xl shadow-md flex items-center justify-center"
                          style={{ background: item.gradient }}
                        >
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xs font-medium text-[#0F1117] text-center">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contenu principal : plein écran */}
        <div className="flex-1 relative overflow-hidden">
          <LoadingOverlay
            isVisible={!!loadingAction}
            type="transformation"
            action={loadingAction || undefined}
          />
          <LoadingOverlay isVisible={isAddingPage} type="upload" action="upload" />
          <SuccessOverlay isVisible={showSuccess} onDismiss={() => setShowSuccess(false)} />
          {/* Zone de texte principale - plein écran */}
          <div className="absolute inset-0 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-8 py-12">
              {document?.source_type === "note" && (
                <textarea
                  defaultValue={document?.extracted_text || ""}
                  onChange={(e) => setCurrentText(e.target.value)}
                  placeholder="Commencez à écrire vos notes..."
                  className="w-full min-h-[400px] text-[#0F1117] text-base leading-relaxed outline-none resize-none bg-transparent mb-8"
                  style={{
                    fontFamily: "'Georgia', serif",
                    fontSize: "17px",
                    lineHeight: "2",
                  }}
                />
              )}
              {result ? (
                <div className="bg-white rounded-2xl shadow-sm border border-[#E8E9F0] p-8 sm:p-12">
                  {result && currentAction && (
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide">
                        {currentAction}
                      </span>
                      <button
                        onClick={handleResetToOriginal}
                        className="text-xs text-[#be1354] hover:underline flex items-center gap-1"
                      >
                        ← Revenir à l'original
                      </button>
                    </div>
                  )}
                  <div className="mb-4 pb-4 border-b border-[#E8E9F0]">
                    <p className="text-sm font-medium text-[#6D28D9]" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                      {transformations.find(t => t.id === currentAction)?.label || 'Résultat'}
                    </p>
                  </div>
                  {currentAction === "audio" ? (
                    <div className="space-y-4">
                      {audioSource ? (
                        <div className="rounded-2xl border border-[#E8E9F0] bg-white shadow-sm p-4">
                          <audio controls className="w-full" src={audioSource}>
                            Votre navigateur ne supporte pas la lecture audio.
                          </audio>
                          {audioVoice ? (
                            <p className="mt-2 text-xs text-[#9CA3AF]">Voix : {audioVoice}</p>
                          ) : null}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-[#E8E9F0] bg-white shadow-sm p-4 text-sm text-[#6B7280]">
                          L'audio est en cours de génération...
                        </div>
                      )}
                    </div>
                  ) : currentAction === "diagram" && diagramData ? (
                    <div className="space-y-6">
                      <div className="flex flex-wrap items-center gap-2">
                        {[
                          { id: "tube", label: "Tubes" },
                          { id: "pyramid", label: "Pyramide" },
                          { id: "timeline", label: "Timeline horizontale" },
                        ].map((option) => (
                          <Button
                            key={option.id}
                            variant={schemaLayout === option.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSchemaLayout(option.id as typeof schemaLayout)}
                            className={
                              schemaLayout === option.id
                                ? "bg-[#6D28D9] hover:bg-[#5B21B6] text-white"
                                : "border border-[#E8E9F0] text-[#0F1117] hover:bg-[#F3F4F8]"
                            }
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                      {schemaLayout === "tube" && <TimelineTube data={diagramData} />}
                      {schemaLayout === "pyramid" && <PyramidSchema data={diagramData} />}
                      {schemaLayout === "timeline" && <HorizontalTimeline data={diagramData} />}
                    </div>
                  ) : (
                    <div
                      className="space-y-8"
                      onMouseUp={handleTextSelection}
                      onTouchEnd={handleTextSelection}
                    >
                      {pages.map((page, index) => {
                        const actionToUse: AIAction = currentAction ?? "revision-sheet";
                        return (
                          <div key={page.id}>
                            {index > 0 && (
                              <div className="flex items-center gap-3 my-6">
                                <div className="flex-1 border-t border-dashed border-[#E8E9F0]" />
                                <span className="text-xs text-[#9CA3AF] font-medium">Page {index + 1}</span>
                                <div className="flex-1 border-t border-dashed border-[#E8E9F0]" />
                              </div>
                            )}
                            <div className="flex justify-end mb-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setCurrentPageId(page.id);
                                  handleTransformation(actionToUse, page.content);
                                }}
                                disabled={loadingAction !== null}
                                className="text-xs text-[#6B7280] hover:text-[#be1354] transition-colors"
                              >
                                Transformer cette page
                              </button>
                            </div>
                            <div className="text-[#374151] leading-relaxed">
                              {result && currentAction && currentPageId === page.id
                                ? renderMarkdown(result)
                                : renderMarkdown(page.content)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : document.extracted_text ? (
                <div className="bg-white rounded-2xl shadow-sm border border-[#E8E9F0] p-8 sm:p-12">
                  <div
                    className="space-y-8"
                    onMouseUp={handleTextSelection}
                    onTouchEnd={handleTextSelection}
                  >
                    {pages.map((page, index) => {
                      const actionToUse: AIAction = currentAction ?? "revision-sheet";
                      return (
                        <div key={page.id}>
                          {index > 0 && (
                            <div className="flex items-center gap-3 my-6">
                              <div className="flex-1 border-t border-dashed border-[#E8E9F0]" />
                              <span className="text-xs text-[#9CA3AF] font-medium">Page {index + 1}</span>
                              <div className="flex-1 border-t border-dashed border-[#E8E9F0]" />
                            </div>
                          )}
                          <div className="flex justify-end mb-2">
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentPageId(page.id);
                                handleTransformation(actionToUse, page.content);
                              }}
                              disabled={loadingAction !== null}
                              className="text-xs text-[#6B7280] hover:text-[#be1354] transition-colors"
                            >
                              Transformer cette page
                            </button>
                          </div>
                          <div className="text-[#374151] leading-relaxed">
                            {result && currentAction && currentPageId === page.id
                              ? renderMarkdown(result)
                              : renderMarkdown(page.content)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-12 text-gray-900">
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <p className="text-sm font-medium text-[#6D28D9]" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                      Extraction en cours
                    </p>
                  </div>
                  <div 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => setCurrentText(e.currentTarget.textContent || "")}
                    className="text-gray-900 leading-relaxed whitespace-pre-wrap focus:outline-none focus:ring-2 focus:ring-violet-200 rounded p-2 -m-2 min-h-[200px]"
                    style={{ 
                      fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif',
                      fontSize: '16px',
                      lineHeight: '1.8',
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-4">
                    Vous pouvez déjà saisir ou corriger le texte ici.
                  </p>
                </div>
              )}
              <div className="mt-8 flex justify-center">
                <Button
                  type="button"
                  onClick={() => setShowAddPage(true)}
                  className="bg-[#be1354] hover:bg-[#a80f4a] text-white rounded-2xl px-6 py-3"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une page
                </Button>
              </div>
            </div>
          </div>

          {/* CTAs flottants - stratégies d'apprentissage à gauche */}
          <div className="absolute left-0 top-0 bottom-0 hidden lg:flex items-center z-10 pointer-events-none">
            <div className="bg-white border border-[#E8E9F0] shadow-sm rounded-r-2xl p-4 pointer-events-auto">
              <div className="flex flex-col gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="group relative">
                      <Button
                        onClick={() => {
                          if (!currentText) {
                            toast.error("Aucun texte disponible");
                            return;
                          }
                          setShowFocusMode(true);
                        }}
                        variant="outline"
                        size="icon"
                        className="h-14 w-14 rounded-xl transition-all duration-300 group-hover:scale-125 bg-gradient-to-br from-cyan-500 to-blue-500 opacity-90 hover:opacity-100 text-[#0F1117] border-0"
                      >
                        <Eye className="h-6 w-6 text-[#0F1117]" />
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="font-semibold" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                      Mode focus
                    </p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="group relative">
                      <Button
                        onClick={() => setShowPomodoro(true)}
                        variant="outline"
                        size="icon"
                        className="h-14 w-14 rounded-xl transition-all duration-300 group-hover:scale-125 bg-gradient-to-br from-amber-500 to-orange-500 opacity-90 hover:opacity-100 text-[#0F1117] border-0"
                      >
                        <Timer className="h-6 w-6 text-[#0F1117]" />
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="font-semibold" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                      Pomodoro
                    </p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="group relative">
                      <Button
                        onClick={() => setShowNeuroModal(true)}
                        variant="outline"
                        size="icon"
                        className="h-14 w-14 rounded-xl transition-all duration-300 group-hover:scale-125 bg-gradient-to-br from-violet-500 to-purple-500 opacity-90 hover:opacity-100 text-[#0F1117] border-0"
                      >
                        <Sparkles className="h-6 w-6 text-[#0F1117]" />
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="font-semibold" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                      Mode neuro adapté
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Sidebar droite desktop */}
          <div className="absolute right-0 top-0 bottom-0 hidden lg:flex items-center z-10 pointer-events-none">
            <div className="w-64 bg-[#F8F9FC] border-l border-[#E8E9F0] p-4 pointer-events-auto">
              <div className="grid grid-cols-2 gap-3">
                {actionItems.map((item, index) => {
                  const Icon = item.icon;
                  const disabled = item.requiresText && (!document.extracted_text || loadingAction !== null);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => !disabled && item.onClick()}
                      disabled={disabled}
                      className={`rounded-2xl p-3 bg-white border border-[#E8E9F0] hover:shadow-md transition-all cursor-pointer flex flex-col items-center gap-2 ${
                        item.active ? "border-[#be1354] bg-rose-50" : ""
                      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: iconGradients[index % iconGradients.length] }}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-[#0F1117] text-xs font-medium text-center">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal neuro adapté */}
      <LearningStrategyModal
        isOpen={showNeuroModal}
        onClose={() => setShowNeuroModal(false)}
        onFocusModeChange={() => {}}
      />
      {showAddPage && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-3xl bg-[#F8F9FC] border border-[#E8E9F0] p-6 text-[#0F1117]">
            <h3 className="text-lg font-semibold mb-4">Ajouter une page</h3>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                type="button"
                onClick={() => addPageCameraRef.current?.click()}
                disabled={addingPage}
                className="rounded-xl border border-[#E8E9F0] bg-white shadow-sm px-3 py-3 text-sm text-[#0F1117] hover:bg-white/10 flex items-center gap-2"
              >
                <Camera className="h-4 w-4 text-[#be1354]" />
                Photo
              </button>
              <button
                type="button"
                onClick={() => addPageFileRef.current?.click()}
                disabled={addingPage}
                className="rounded-xl border border-[#E8E9F0] bg-white shadow-sm px-3 py-3 text-sm text-[#0F1117] hover:bg-white/10 flex items-center gap-2"
              >
                <Upload className="h-4 w-4 text-[#6D28D9]" />
                Fichier
              </button>
              <button
                type="button"
                onClick={() => setShowDictationModal(true)}
                disabled={addingPage}
                className="rounded-xl border border-[#E8E9F0] bg-white shadow-sm px-3 py-3 text-sm text-[#0F1117] hover:bg-white/10 flex items-center gap-2"
              >
                <Mic className="h-4 w-4 text-[#0EA5E9]" />
                Dicter
              </button>
              <button
                type="button"
                onClick={() => {
                  const el = globalThis.document?.getElementById("add-page-textarea");
                  if (el) el.focus();
                }}
                disabled={addingPage}
                className="rounded-xl border border-[#E8E9F0] bg-white shadow-sm px-3 py-3 text-sm text-[#0F1117] hover:bg-white/10 flex items-center gap-2"
              >
                <PenLine className="h-4 w-4 text-[#F97316]" />
                Texte
              </button>
            </div>
            <textarea
              id="add-page-textarea"
              value={addPageText}
              onChange={(e) => setAddPageText(e.target.value)}
              placeholder="Saisissez vos notes..."
              className="w-full min-h-[120px] rounded-2xl border border-[#E8E9F0] bg-white p-3 text-sm text-[#0F1117] outline-none focus:border-[#be1354] mb-4"
            />
            <div className="flex items-center justify-between gap-3">
              <Button variant="ghost" onClick={() => setShowAddPage(false)}>
                Annuler
              </Button>
              <Button
                onClick={() => handleAddPageText(addPageText)}
                disabled={addingPage || !addPageText.trim()}
                className="bg-[#be1354] hover:bg-[#a80f4a] text-white"
              >
                {addingPage ? "Ajout..." : "Ajouter"}
              </Button>
            </div>
            <input
              ref={addPageCameraRef}
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAddPageFile(file);
              }}
            />
            <input
              ref={addPageFileRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAddPageFile(file);
              }}
            />
          </div>
        </div>
      )}
              <ReformulateOptionsModal
                isOpen={showReformulateOptions}
                onClose={() => setShowReformulateOptions(false)}
                onSelect={(style) => {
                  setShowReformulateOptions(false);
                  handleTransformation("reformulate", undefined, { style });
                }}
                disabled={loadingAction !== null}
              />
      {showFocusMode && (
        <FocusMode
          text={currentText || document?.extracted_text || ""}
          onClose={() => setShowFocusMode(false)}
        />
      )}
      {showPomodoro && (
        <PomodoroTimer
          documentId={documentId}
          onClose={() => setShowPomodoro(false)}
          onComplete={() => {}}
        />
      )}
      {selectionToolbar && (
        <div
          ref={selectionToolbarRef}
          className="fixed z-50 flex items-center gap-1 bg-[#0F1117] rounded-2xl px-3 py-2 shadow-xl"
          style={{
            left: selectionToolbar.x,
            top: selectionToolbar.y,
            transform: "translateX(-50%)",
          }}
        >
          <span className="text-white/50 text-xs mr-2">Transformer :</span>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              setChatExtractedText(selectionToolbar.text);
              setShowChat(true);
              setSelectionToolbar(null);
              setSelectionReformulateOpen(false);
              window.getSelection()?.removeAllRanges();
            }}
            className="text-white text-xs px-3 py-1.5 rounded-xl hover:bg-white/20 transition-all font-medium"
          >
            Question
          </button>
          <div className="relative">
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                setSelectionReformulateOpen((prev) => !prev);
              }}
              className="text-white text-xs px-3 py-1.5 rounded-xl hover:bg-white/20 transition-all font-medium"
            >
              Reformuler
            </button>
            {selectionReformulateOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-[#0F1117] border border-white/10 rounded-xl shadow-xl p-1 min-w-[200px]">
                {[
                  { label: "Avec un exemple", style: "examples" },
                  { label: "Avec une métaphore", style: "metaphore" },
                  { label: "Comme un enfant", style: "enfant" },
                ].map(({ label, style }) => (
                  <button
                    key={style}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      handleTransformation("reformulate", selectionToolbar.text, { style });
                      setSelectionToolbar(null);
                      setSelectionReformulateOpen(false);
                      window.getSelection()?.removeAllRanges();
                    }}
                    className="w-full text-left text-white text-xs px-3 py-2 rounded-lg hover:bg-white/10 transition-all font-medium"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {[
            { label: "Simplifier", action: "simple" },
            { label: "Expliquer", action: "explain" },
          ].map(({ label, action }) => (
            <button
              key={action}
              onPointerDown={(e) => {
                e.preventDefault();
                handleTransformation(action as AIAction, selectionToolbar.text);
                setSelectionToolbar(null);
                setSelectionReformulateOpen(false);
                window.getSelection()?.removeAllRanges();
              }}
              className="text-white text-xs px-3 py-1.5 rounded-xl hover:bg-white/20 transition-all font-medium"
            >
              {label}
            </button>
          ))}
          <button
            onPointerDown={() => {
              setSelectionToolbar(null);
              setSelectionReformulateOpen(false);
            }}
            className="text-white/40 hover:text-white ml-1 text-xs"
          >
            ✕
          </button>
        </div>
      )}
      {showWallet && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={() => setShowWallet(false)} />
          <div className="w-80 bg-white h-full shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E9F0]">
              <p className="font-bold text-[#0F1117]">Mes transformations</p>
              <button
                onClick={() => setShowWallet(false)}
                className="text-[#9CA3AF] hover:text-[#0F1117]"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {transformationsHistory.length === 0 && (
                <p className="text-[#9CA3AF] text-sm text-center mt-8">
                  Aucune transformation encore
                </p>
              )}
              {transformationsHistory.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setResult(t.result);
                    setCurrentAction(t.action as AIAction);
                    setCurrentPageId((t as { page_id?: string | null }).page_id || null);
                    setShowWallet(false);
                  }}
                  className="w-full text-left p-4 rounded-2xl bg-[#F8F9FC] hover:bg-[#F3F4F8] border border-[#E8E9F0] transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#be1354] uppercase tracking-wide">
                      {t.action}
                    </span>
                    <span className="text-xs text-[#9CA3AF]">
                      {new Date(t.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <p className="text-[#374151] text-xs line-clamp-3">
                    {t.result.slice(0, 150)}...
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {showFlashcards && (
        <FlashcardsView
          documentId={documentId}
          accountType={accountType}
          onClose={() => setShowFlashcards(false)}
        />
      )}
      {showQuiz && (
        <QuizView
          documentId={documentId}
          accountType={accountType}
          onClose={() => setShowQuiz(false)}
        />
      )}
      {showChat && (
        <ChatView
          documentId={documentId}
          extractedText={chatExtractedText ?? document?.extracted_text ?? ""}
          onClose={() => {
            setShowChat(false);
            setChatExtractedText(null);
          }}
        />
      )}
      <NeoBubble
        extractedText={pages.map((p) => p.content).join("\n\n") || document?.extracted_text || ""}
        documentTitle={document?.file_name}
        documents={allDocuments.map((d) => ({
          id: d.id,
          file_name: d.file_name,
          extracted_text: d.extracted_text?.slice(0, 300) || "",
        }))}
        onOpenDocument={(id) => router.push(`/beyond-note-app/${id}`)}
        context="document"
        onAction={(action: "quiz" | "revision-sheet" | "reformulate" | "diagram" | "translate" | "flashcards" | "audio") =>
          handleTransformation(action as AIAction, textToTransform)
        }
      />
      {onboardingStep === 2 && (
        <OnboardingOverlay
          step={2}
          onNext={() => {
            setOnboardingStep(3);
            if (typeof window !== "undefined") {
              localStorage.setItem("nevo_onboarding_step", "3");
            }
          }}
          onSkip={handleSkipOnboarding}
          onComplete={() => {}}
          onTriggerTransformation={() => handleTransformation("revision-sheet", textToTransform)}
        />
      )}
      {onboardingStep === 3 && (
        <OnboardingOverlay
          step={3}
          onNext={() => {
            setOnboardingStep(0);
            if (typeof window !== "undefined") {
              localStorage.removeItem("nevo_onboarding_step");
            }
            router.push("/beyond-note-app?onboarding=4");
          }}
          onSkip={handleSkipOnboarding}
          onComplete={() => {}}
          onTriggerNeo={() => setShowChat(true)}
        />
      )}
      <LoadingOverlay isVisible={isAddingPage} type="upload" />
      <DictationModal
        isOpen={showDictationModal}
        onClose={() => setShowDictationModal(false)}
        onComplete={handleDictationComplete}
      />
    </TooltipProvider>
  );
}

function renderMarkdown(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const bold = (s: string) => s.replace(/\*\*(.*?)\*\*/g, (_: string, m: string) => '<strong>' + m + '</strong>');
    if (line.startsWith('# ')) return <h1 key={i} className="text-[#0F1117] text-xl font-bold mt-6 mb-3 border-b-2 border-[#be1354] pb-2">{line.slice(2)}</h1>;
    if (line.startsWith('## ')) return <h2 key={i} className="text-[#0F1117] text-lg font-bold mt-5 mb-2">{line.slice(3)}</h2>;
    if (line.startsWith('### ')) return <h3 key={i} className="text-[#374151] text-base font-semibold mt-4 mb-2">{line.slice(4)}</h3>;
    if (line.startsWith('---')) return <hr key={i} className="border-[#E8E9F0] my-4" />;
    if (/d[eé]finition/i.test(line) || /^def\s*:/i.test(line)) {
      return <div key={i} className="border-l-4 border-[#be1354] bg-red-50 rounded-r-xl px-4 py-3 my-3" dangerouslySetInnerHTML={{__html: bold(line)}} />;
    }
    if (/exemple/i.test(line) || /^ex\s*:/i.test(line)) {
      return <div key={i} className="border-l-4 border-emerald-500 bg-emerald-50 rounded-r-xl px-4 py-3 my-3 text-emerald-800" dangerouslySetInnerHTML={{__html: bold(line)}} />;
    }
    if (line.startsWith('- ') || line.startsWith('\u2022 ')) {
      return <li key={i} className="text-[#374151] ml-4 mb-2 flex gap-2"><span className="text-[#be1354] mt-1 flex-shrink-0">•</span><span dangerouslySetInnerHTML={{__html: bold(line.slice(2))}} /></li>;
    }
    if (line.trim() === '') return <div key={i} className="h-2" />;
    return <p key={i} className="text-[#374151] mb-2 leading-relaxed" dangerouslySetInnerHTML={{__html: bold(line)}} />;
  });
}
function PyramidSchema({ data }: { data: { title?: string; subtitle?: string; steps?: Array<{ title?: string; description?: string }> } }) {
  const steps = Array.isArray(data?.steps) ? data.steps : [];
  if (!steps.length) {
    return (
      <div className="rounded-2xl border border-[#E8E9F0] bg-white shadow-sm p-6 text-sm text-[#6B7280]">
        Impossible d'afficher la pyramide pour ce schéma.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-[#9CA3AF]">Pyramide</p>
        <h3 className="text-xl font-semibold text-[#0F1117]">{data.title || "Schéma en pyramide"}</h3>
        {data.subtitle ? <p className="text-sm text-[#6B7280]">{data.subtitle}</p> : null}
      </div>
      <div className="flex flex-col items-center gap-3">
        {steps.map((step, index) => {
          const width = 90 - index * 10;
          return (
            <div
              key={`${step.title ?? "step"}-${index}`}
              className="rounded-2xl border border-[#E8E9F0] bg-white shadow-sm p-4 text-[#0F1117]"
              style={{ width: `${Math.max(width, 40)}%` }}
            >
              <p className="text-xs uppercase tracking-[0.2em] text-[#9CA3AF]">Niveau {index + 1}</p>
              <p className="mt-1 font-semibold text-[#0F1117]">{step.title ?? `Étape ${index + 1}`}</p>
              {step.description ? <p className="mt-2 text-sm text-[#6B7280]">{step.description}</p> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HorizontalTimeline({ data }: { data: { title?: string; subtitle?: string; steps?: Array<{ title?: string; description?: string; takeaway?: string }> } }) {
  const steps = Array.isArray(data?.steps) ? data.steps : [];
  if (!steps.length) {
    return (
      <div className="rounded-2xl border border-[#E8E9F0] bg-white shadow-sm p-6 text-sm text-[#6B7280]">
        Impossible d'afficher la timeline pour ce schéma.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-[#9CA3AF]">Timeline</p>
        <h3 className="text-xl font-semibold text-[#0F1117]">{data.title || "Timeline horizontale"}</h3>
        {data.subtitle ? <p className="text-sm text-[#6B7280]">{data.subtitle}</p> : null}
      </div>
      <div className="relative">
        <div className="absolute left-0 right-0 top-1/2 h-px bg-white/10" />
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={`${step.title ?? "step"}-${index}`} className="relative rounded-2xl border border-[#E8E9F0] bg-white shadow-sm p-4">
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#9CA3AF]">
                <span className="h-2 w-2 rounded-full bg-[#6D28D9]" />
                Étape {index + 1}
              </div>
              <p className="font-semibold text-[#0F1117]">{step.title ?? `Étape ${index + 1}`}</p>
              {step.description ? <p className="mt-2 text-sm text-[#6B7280]">{step.description}</p> : null}
              {step.takeaway ? <p className="mt-3 text-xs text-[#9CA3AF]">À retenir : {step.takeaway}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
