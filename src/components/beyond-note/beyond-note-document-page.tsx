"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Brain,
  Copy,
  Download,
  Eye,
  FileCheck,
  FileText,
  HelpCircle,
  Printer,
  Trophy,
  Image as ImageIcon,
  Languages,
  Loader2,
  MessageCircle,
  Grid,
  Save,
  Sparkles,
  Timer,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

type AIAction =
  | "revision-sheet"
  | "reformulate"
  | "translate"
  | "diagram"
  | "cleanup"
  | "audio"
  | "generate-image";

interface Document {
  id: string;
  file_name: string;
  file_url: string;
  extracted_text: string | null;
  file_type: string;
  subject?: string | null;
}

const transformations: Array<{
  id: AIAction;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}> = [
  {
    id: "revision-sheet",
    label: "Creer une fiche de revision",
    description: "Genere une fiche de revision structuree",
    icon: <FileText className="h-5 w-5" />,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "reformulate",
    label: "Reformuler",
    description: "Reformule le texte pour ameliorer la clarte",
    icon: <Sparkles className="h-5 w-5" />,
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "translate",
    label: "Traduire",
    description: "Traduit le document dans une autre langue",
    icon: <Languages className="h-5 w-5" />,
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "diagram",
    label: "Schema visuel",
    description: "Genere un schema visuel a partir du contenu",
    icon: <ImageIcon className="h-5 w-5" />,
    color: "from-orange-500 to-red-500",
  },
  {
    id: "cleanup",
    label: "Remettre au propre",
    description: "Nettoie et structure le texte",
    icon: <FileCheck className="h-5 w-5" />,
    color: "from-indigo-500 to-blue-500",
  },
  {
    id: "audio",
    label: "Transformer en audio",
    description: "Convertit le texte en fichier audio",
    icon: <Volume2 className="h-5 w-5" />,
    color: "from-rose-500 to-pink-500",
  },
  {
    id: "generate-image",
    label: "Generer une image",
    description: "Genere un visuel pedagogique",
    icon: <ImageIcon className="h-5 w-5" />,
    color: "from-yellow-500 to-amber-500",
  },
];

interface BeyondNoteDocumentPageProps {
  documentId: string;
}

const renderInline = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`strong-\${index}`} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={`text-\${index}`}>{part}</span>;
  });
};

function renderMarkdown(text: string) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('# ')) {
      return (
        <h1 key={i} className="text-white text-2xl font-bold border-b border-violet-500/50 pb-3 mb-6">
          {line.replace('# ', '')}
        </h1>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <h2 key={i} className="text-violet-400 text-xl font-bold mt-8 mb-4">
          {line.replace('## ', '')}
        </h2>
      );
    }
    if (line.startsWith('### ')) {
      return (
        <h3 key={i} className="text-blue-400 text-lg font-semibold mt-6 mb-3">
          {line.replace('### ', '')}
        </h3>
      );
    }
    if (line.startsWith('---')) return <hr key={i} className="border-white/10 my-6" />;

    if (/\b(Def|Definition|D\u00e9finition)\b/i.test(line)) {
      const contentLine = line.replace(/\*\*(.*?)\*\*/g, '<strong className="text-white font-semibold">$1</strong>');
      return (
        <div
          key={i}
          className="border border-amber-500/50 bg-amber-500/10 rounded-xl p-3 my-2 text-white/90"
          dangerouslySetInnerHTML={{ __html: contentLine }}
        />
      );
    }
    if (/\b(Ex|Exemple)\b/i.test(line)) {
      const contentLine = line.replace(/\*\*(.*?)\*\*/g, '<strong className="text-white font-semibold">$1</strong>');
      return (
        <div
          key={i}
          className="border border-emerald-500/50 bg-emerald-500/10 rounded-xl p-3 my-2 text-emerald-300"
          dangerouslySetInnerHTML={{ __html: contentLine }}
        />
      );
    }

    if (line.startsWith('- ') || line.startsWith('\u2022 ') || line.includes('\u00e2\u20ac\u00a2')) {
      const clean = line
        .replace(/^[-\u2022]\s*/, '')
        .replace(/\u00e2\u20ac\u00a2\s*/g, '')
        .replace(/\*\*(.*?)\*\*/g, '<strong className="text-white font-semibold">$1</strong>');
      return (
        <li key={i} className="text-white/80 ml-4 mb-2 flex gap-2">
          <span className="text-violet-400 mt-1 flex-shrink-0">\u2022</span>
          <span dangerouslySetInnerHTML={{ __html: clean }} />
        </li>
      );
    }

    if (line.trim() === '') return <div key={i} className="h-2" />;

    const contentLine = line.replace(/\*\*(.*?)\*\*/g, '<strong className="text-white font-semibold">$1</strong>');
    return (
      <p
        key={i}
        className="text-white/80 mb-2 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: contentLine }}
      />
    );
  });
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
  const [showChat, setShowChat] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [accountType, setAccountType] = useState("solo");
  const [isSaving, setIsSaving] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [lastQuizSession, setLastQuizSession] = useState<{score: number, nb_questions: number} | null>(null);
  const [audioStatus, setAudioStatus] = useState<"idle" | "playing" | "paused">("idle");
  const [audioRate, setAudioRate] = useState(1);
  const router = useRouter();
  const { isDyslexiaMode } = useDyslexiaMode();
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const diagramData = useMemo(() => {
    if (currentAction !== "diagram" || !result) return null;
    const raw = result.trim();
    const cleaned = raw.replace(/```json|```/g, "").trim();
    let candidate = cleaned;
    if (!cleaned.startsWith("{") && !cleaned.startsWith("[")) {
      const objStart = cleaned.indexOf("{");
      const objEnd = cleaned.lastIndexOf("}");
      const arrStart = cleaned.indexOf("[");
      const arrEnd = cleaned.lastIndexOf("]");
      if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
        candidate = cleaned.slice(objStart, objEnd + 1);
      } else if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
        candidate = cleaned.slice(arrStart, arrEnd + 1);
      }
    }
    try {
      return JSON.parse(candidate);
    } catch {
      return null;
    }
  }, [currentAction, result]);

  useEffect(() => {
    const loadDocument = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/beyond-note/documents`);
        if (response.ok) {
          const data = await response.json();
          const doc = data.documents?.find((d: Document) => d.id === documentId);
          if (doc) {
            setDocument(doc);
          } else {
            toast.error("Document non trouve");
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

    loadDocument();
    loadAccount();
  }, [documentId, router]);

  useEffect(() => {
    if (document?.file_url && document.file_type?.startsWith("image/")) {
      setOriginalImageUrl(document.file_url);
    } else {
      setOriginalImageUrl(null);
    }
  }, [document]);

  useEffect(() => {
    if (result && currentAction !== "diagram" && currentAction !== "generate-image") {
      setCurrentText(result);
    } else if (!result && document?.extracted_text) {
      setCurrentText(document.extracted_text);
    }
  }, [document, result, currentAction]);

  useEffect(() => {
    if (!result || currentAction !== "audio") {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setAudioStatus("idle");
    }
  }, [result, currentAction]);

  const handleTransformation = async (action: AIAction, options?: { style?: string }) => {
    if (!document || !document.extracted_text) {
      toast.error("Aucun texte disponible pour la transformation");
      return;
    }

    if (action === "reformulate" && !options?.style) {
      setShowReformulateOptions(true);
      return;
    }
    if (action === "reformulate" && options?.style) {
      setShowReformulateOptions(false);
    }

    setLoadingAction(action);
    setCurrentAction(action);

    try {
      const textToTransform = document.extracted_text;
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
          subject: document.subject ?? null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erreur lors du traitement IA");
      }

      const data = await response.json();
      setResult(data.result || "");
      toast.success("Transformation terminee avec succes !");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors du traitement IA";
      toast.error(errorMessage);
      console.error("[beyond-note] Error during AI action:", error);
      setCurrentAction(null);
    } finally {
      setLoadingAction(null);
    }
  };

  const fetchLastQuizSession = async () => {
    try {
      const res = await fetch(`/api/beyond-note/quiz-sessions?document_id=${documentId}`);
      if (!res.ok) return;
      const data = await res.json();
      setLastQuizSession(data.stats?.last_session ?? null);
    } catch {
      setLastQuizSession(null);
    }
  };

  const handleResetToOriginal = () => {
    setResult(null);
    setCurrentAction(null);
    setCurrentText(document?.extracted_text || "");
    toast.info("Retour au contenu original");
  };

  const handleSave = async () => {
    if (!document || !currentText) {
      toast.error("Aucun texte a sauvegarder");
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

      setDocument({
        ...document,
        extracted_text: currentText,
      });

      if (result) {
        setResult(currentText);
      }

      toast.success("Document sauvegarde avec succes !");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la sauvegarde";
      toast.error(errorMessage);
      console.error("[beyond-note] Error saving document:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = currentText || result || document?.extracted_text || "";
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    toast.success("Contenu copie");
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([currentText || result], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document?.createElement ? document.createElement("a") : document.createElement("a");
    link.href = url;
    link.download = `${currentAction || "document"}-${document?.file_name || "document"}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSpeak = () => {
    if (!result) return;
    if (!window.speechSynthesis) return;

    if (audioStatus === "playing") {
      window.speechSynthesis.pause();
      setAudioStatus("paused");
      return;
    }

    if (audioStatus === "paused") {
      window.speechSynthesis.resume();
      setAudioStatus("playing");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(result);
    utterance.rate = audioRate;
    utterance.onend = () => setAudioStatus("idle");
    utterance.onerror = () => setAudioStatus("idle");
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setAudioStatus("playing");
  };

  const handleStopSpeak = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setAudioStatus("idle");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0A0F]">
        <Loader2 className="h-8 w-8 animate-spin text-[#6D28D9]" />
      </div>
    );
  }

  if (!document) {
    return null;
  }

  const textAvailable = Boolean(result || document.extracted_text);

  return (
    <TooltipProvider>
      <div className={`h-screen flex flex-col bg-[#0A0A0F] text-white ${isDyslexiaMode ? "dyslexia-mode" : ""}`}>
        {/* Header fixe */}
        <div className="border-b border-white/10 bg-[#0A0A0F] z-20 flex-shrink-0 no-print">
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/beyond-note-app")}
                className="flex items-center gap-2 text-white/70 hover:text-white"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              <h1 className="text-lg font-semibold text-white truncate max-w-md" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                {document.file_name}
              </h1>
            </div>
            {textAvailable && (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowNeuroModal(true)}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden sm:inline">Neuro adapte</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="border-white/20 text-white hover:bg-white/5 flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  <span className="hidden sm:inline">Imprimer</span>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-[#6D28D9] hover:bg-[#5B21B6] text-white"
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
                {result && (
                  <Button variant="outline" size="sm" onClick={handleResetToOriginal}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Original</span>
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="h-4 w-4" />
                </Button>
                {result && (
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Zone centrale */}
        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-8 py-12 print-content">
              {lastQuizSession && (
                <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-100">
                  <Trophy className="h-5 w-5 text-amber-300" />
                  <span className="text-sm font-semibold">Dernier quiz : {lastQuizSession.score}/{lastQuizSession.nb_questions}</span>
                </div>
              )}
              {loadingAction ? (
                <div className="flex items-center justify-center h-full min-h-[60vh]">
                  <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-[#6D28D9] mx-auto mb-4" />
                    <p className="text-white/70 text-lg">Traitement en cours...</p>
                  </div>
                </div>
              ) : result ? (
                <div className="bg-white/5 rounded-2xl shadow-sm border border-white/10 p-8 sm:p-12">
                  <div className="mb-4 pb-4 border-b border-white/10">
                    <p className="text-sm font-medium text-[#6D28D9]">
                      {transformations.find((t) => t.id === currentAction)?.label || "Resultat"}
                    </p>
                  </div>
                  {currentAction === "audio" ? (
                    <div className="space-y-4">
                      {audioSource ? (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <audio controls className="w-full" src={audioSource}>
                            Votre navigateur ne supporte pas la lecture audio.
                          </audio>
                          {audioVoice ? (
                            <p className="mt-2 text-xs text-white/50">Voix : {audioVoice}</p>
                          ) : null}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                          L'audio est en cours de gÃ©nÃ©ration...
                        </div>
                      )}
                    </div>
                  ) : currentAction === "diagram" ? (
                    diagramData ? (
                      <div className="space-y-6">
                        <TimelineTube data={diagramData} />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {renderMarkdown(result)}
                      </div>
                    )
                  ) : currentAction === "generate-image" ? (
                    <img src={result} alt="Visuel gÃ©nÃ©rÃ©" className="w-full rounded-xl" />
                  ) : (
                    <div className="space-y-1">
                      {renderMarkdown(result)}
                    </div>
                  )}
                </div>
              ) : document.extracted_text ? (
                <div className="bg-white/5 rounded-2xl shadow-sm border border-white/10 p-8 sm:p-12">
                  <div className="space-y-1">
                    {renderMarkdown(document.extracted_text)}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                  <FileText className="h-10 w-10 mx-auto mb-4 text-white/30" />
                  <p className="text-white/80 font-medium">Aucun texte extrait</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar gauche */}
          <div className="absolute left-0 top-0 bottom-0 hidden md:flex items-center z-10 pointer-events-none no-print">
            <div className="pointer-events-auto">
              <Button
                onClick={() => setShowLeftPanel((prev) => !prev)}
                variant="outline"
                size="icon"
                className="ml-3 h-14 w-14 rounded-full bg-white/10 text-white border border-white/10 hover:bg-white/20"
              >
                <Brain className="h-6 w-6" />
              </Button>
              {showLeftPanel && (
                <div className="mt-4 bg-white/5 backdrop-blur-sm border-r border-white/10 shadow-xl rounded-r-2xl p-4 flex flex-col gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
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
                        className="h-14 w-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white border-0"
                      >
                        <Eye className="h-6 w-6" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Focus</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => setShowPomodoro(true)}
                        variant="outline"
                        size="icon"
                        className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0"
                      >
                        <Timer className="h-6 w-6" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Pomodoro</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => setShowNeuroModal(true)}
                        variant="outline"
                        size="icon"
                        className="h-14 w-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 text-white border-0"
                      >
                        <Sparkles className="h-6 w-6" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Neuro adapte</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar droite */}
          <div className="absolute right-0 top-0 bottom-0 hidden md:flex items-center z-10 pointer-events-none no-print">
            <div className="bg-white/5 backdrop-blur-sm border-l border-white/10 shadow-xl rounded-l-2xl p-4 pointer-events-auto">
              <div className="flex flex-col gap-3">
                {accountType !== "child" && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => setShowFlashcards(true)}
                        variant="outline"
                        size="icon"
                        className="h-14 w-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white border-0"
                      >
                        <BookOpen className="h-6 w-6" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">Flashcards</TooltipContent>
                  </Tooltip>
                )}
                {accountType !== "child" && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => setShowQuiz(true)}
                        variant="outline"
                        size="icon"
                        className="h-14 w-14 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white border-0"
                      >
                        <HelpCircle className="h-6 w-6" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">Quiz</TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setShowChat(true)}
                      variant="outline"
                      size="icon"
                      className="h-14 w-14 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white border-0"
                    >
                      <MessageCircle className="h-6 w-6" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">Poser une question</TooltipContent>
                </Tooltip>
                {transformations.map((transformation) => (
                  <Tooltip key={transformation.id}>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => handleTransformation(transformation.id)}
                        disabled={loadingAction !== null || !document.extracted_text}
                        variant={currentAction === transformation.id ? "default" : "outline"}
                        size="icon"
                        className={`h-14 w-14 rounded-xl transition-all duration-300 ${
                          currentAction === transformation.id
                            ? `bg-gradient-to-br ${transformation.color} text-white border-0 shadow-lg`
                            : `bg-gradient-to-br ${transformation.color} opacity-90 hover:opacity-100 text-white border-0`
                        }`}
                      >
                        {loadingAction === transformation.id ? (
                          <Loader2 className="h-6 w-6 animate-spin text-white" />
                        ) : (
                          <div className="text-white">{transformation.icon}</div>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">{transformation.label}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* FAB mobile */}
        <div className="fixed bottom-6 right-6 z-40 md:hidden">
          <Button
            onClick={() => setShowMobileMenu(true)}
            size="icon"
            className="h-14 w-14 rounded-full bg-violet-600 text-white shadow-lg"
          >
            <Grid className="h-6 w-6" />
          </Button>
        </div>

        {showMobileMenu && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden"
            onClick={() => setShowMobileMenu(false)}
          >
            <div
              className="absolute bottom-0 left-0 right-0 grid grid-cols-4 gap-4 px-6 pb-12"
              onClick={(e) => e.stopPropagation()}
            >
              {[
                { id: "focus", label: "Focus", color: "from-cyan-500 to-blue-500", onClick: () => setShowFocusMode(true), icon: <Eye className="h-6 w-6 text-white" /> },
                { id: "pomodoro", label: "Pomodoro", color: "from-amber-500 to-orange-500", onClick: () => setShowPomodoro(true), icon: <Timer className="h-6 w-6 text-white" /> },
                { id: "neuro", label: "Neuro", color: "from-violet-500 to-purple-500", onClick: () => setShowNeuroModal(true), icon: <Sparkles className="h-6 w-6 text-white" /> },
                { id: "revision", label: "Fiche", color: "from-blue-500 to-cyan-500", onClick: () => handleTransformation("revision-sheet"), icon: <FileText className="h-6 w-6 text-white" /> },
                { id: "reformulate", label: "Reformuler", color: "from-purple-500 to-pink-500", onClick: () => setShowReformulateOptions(true), icon: <Sparkles className="h-6 w-6 text-white" /> },
                { id: "translate", label: "Traduire", color: "from-green-500 to-emerald-500", onClick: () => handleTransformation("translate"), icon: <Languages className="h-6 w-6 text-white" /> },
                { id: "diagram", label: "SchÃ©ma", color: "from-orange-500 to-red-500", onClick: () => handleTransformation("diagram"), icon: <ImageIcon className="h-6 w-6 text-white" /> },
                { id: "cleanup", label: "Propre", color: "from-indigo-500 to-blue-500", onClick: () => handleTransformation("cleanup"), icon: <FileCheck className="h-6 w-6 text-white" /> },
                { id: "audio", label: "Audio", color: "from-rose-500 to-pink-500", onClick: () => handleTransformation("audio"), icon: <Volume2 className="h-6 w-6 text-white" /> },
                ...(accountType !== "child"
                  ? [
                      { id: "flashcards", label: "Flashcards", color: "from-emerald-500 to-teal-500", onClick: () => setShowFlashcards(true), icon: <BookOpen className="h-6 w-6 text-white" /> },
                      { id: "quiz", label: "Quiz", color: "from-pink-500 to-rose-500", onClick: () => setShowQuiz(true), icon: <HelpCircle className="h-6 w-6 text-white" /> },
                    ]
                  : []),
                { id: "chat", label: "Chat", color: "from-indigo-500 to-blue-600", onClick: () => setShowChat(true), icon: <MessageCircle className="h-6 w-6 text-white" /> },
              ].map((item) => (
                <div key={item.id} className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      item.onClick();
                    }}
                    className={`h-16 w-16 rounded-full bg-gradient-to-br ${item.color} text-white flex items-center justify-center shadow-lg`}
                  >
                    {item.icon}
                  </button>
                  <span className="text-[10px] text-white/80 text-center">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <LearningStrategyModal
        isOpen={showNeuroModal}
        onClose={() => setShowNeuroModal(false)}
        onFocusModeChange={() => {}}
      />
      <ReformulateOptionsModal
        isOpen={showReformulateOptions}
        onClose={() => setShowReformulateOptions(false)}
        onSelect={(style) => {
          setShowReformulateOptions(false);
          handleTransformation("reformulate", { style });
        }}
        disabled={loadingAction !== null}
      />
      {showFocusMode && (
        <FocusMode text={currentText || document?.extracted_text || ""} onClose={() => setShowFocusMode(false)} />
      )}
      {showPomodoro && (
        <PomodoroTimer documentId={documentId} onClose={() => setShowPomodoro(false)} onComplete={() => {}} />
      )}
      {originalImageUrl && result && (
        <div
          className="fixed bottom-6 left-6 z-20 group cursor-pointer"
          onClick={() => window.open(originalImageUrl, "_blank")}
        >
          <img
            src={originalImageUrl}
            alt="Original"
            className="w-16 h-16 rounded-xl object-cover border-2 border-white/20 shadow-lg group-hover:scale-150 transition-transform duration-300 origin-bottom-left"
          />
          <p className="text-white/50 text-xs text-center mt-1">Original</p>
        </div>
      )}
      {showFlashcards && (
        <FlashcardsView documentId={documentId} accountType={accountType} onClose={() => setShowFlashcards(false)} />
      )}
      {showQuiz && (
        <QuizView documentId={documentId} accountType={accountType} onClose={() => { setShowQuiz(false); fetchLastQuizSession(); }} />
      )}
      {showChat && document && (
        <ChatView
          documentId={documentId}
          extractedText={document.extracted_text || ""}
          subject={document.subject}
          onClose={() => setShowChat(false)}
        />
      )}
    </TooltipProvider>
  );
}
