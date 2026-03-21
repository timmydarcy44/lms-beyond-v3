"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Camera,
  FileText,
  Loader2,
  ArrowRight,
  Mic,
  Image as ImageIcon,
  Plus,
  MoreHorizontal,
  Check,
  Pencil,
  MessageCircle,
  Trophy,
  Folder,
  Search,
  Upload,
  PenLine,
  FolderOpen,
  User,
  Home,
  BookOpen,
  FlaskConical,
  Calculator,
  Globe,
  Music,
  Palette,
  Code,
  Dumbbell,
  Microscope,
  Languages,
  BarChart,
  Landmark,
  Leaf,
  Star,
  LogOut,
} from "lucide-react";
import { DictationModal } from "@/components/beyond-note/dictation-modal";
import { LoadingOverlay } from "@/components/beyond-note/loading-overlay";
import { NeoBubble } from "@/components/beyond-note/jarvis-bubble";
import { OnboardingOverlay } from "@/components/beyond-note/onboarding-overlay";
import { ChatView } from "@/components/beyond-note/chat-view";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface Document {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  extracted_text: string | null;
  created_at?: string;
  source_type?: string | null;
  subject?: string | null;
  folder_id?: string | null;
}

interface Folder {
  id: string;
  name: string;
  emoji: string | null;
  color: string | null;
  created_at?: string;
}

interface QuizStats {
  nb_quiz: number;
  average_score: number;
  evolution: Array<{ date: string; score: number }>;
  sessions?: Array<{ score: number; nb_questions?: number; max_score?: number }>;
}

export function BeyondNoteHomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [showUploadToast, setShowUploadToast] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderEmoji, setNewFolderEmoji] = useState("📁");
  const [newFolderIconId, setNewFolderIconId] = useState("book");
  const [newFolderColor, setNewFolderColor] = useState("linear-gradient(135deg, #be1354, #F97316)");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDictationModal, setShowDictationModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null);
  const [pendingUploadSourceType, setPendingUploadSourceType] = useState<string | null>(null);
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [editingDocumentName, setEditingDocumentName] = useState("");
  const [showFolderChat, setShowFolderChat] = useState(false);
  const [quizStats, setQuizStats] = useState<QuizStats | null>(null);
  const [loadingQuizStats, setLoadingQuizStats] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeNav, setActiveNav] = useState<"home" | "folders" | "search" | "profile">("home");
  const [showFoldersOnly, setShowFoldersOnly] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const foldersSectionRef = useRef<HTMLDivElement | null>(null);

  const scrollToFolders = () => {
    setShowFoldersOnly(true);
    setActiveNav("folders");
    if (foldersSectionRef.current) {
      foldersSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      window.location.href = "/app-landing/login";
    } catch {
      toast.error("Erreur lors de la déconnexion");
    } finally {
      setIsLoggingOut(false);
    }
  };
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/beyond-note/documents");
      if (!res.ok) {
        throw new Error("Erreur lors du chargement");
      }
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      const res = await fetch("/api/beyond-note/folders");
      if (!res.ok) return;
      const data = await res.json();
      setFolders(data.folders || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const syncSessionFromHash = async () => {
      if (!window.location.hash) return;
      const hash = window.location.hash.replace(/^#/, "");
      if (!hash) return;
      const params = new URLSearchParams(hash);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      if (access_token && refresh_token) {
        const supabase = createSupabaseBrowserClient();
        if (!supabase) return;
        await supabase.auth.setSession({ access_token, refresh_token });
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      }
    };
    syncSessionFromHash();
  }, []);

  useEffect(() => {
    loadDocuments();
    loadFolders();
  }, []);

  useEffect(() => {
    const loadPasswordStatus = async () => {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      const meta = data?.user?.user_metadata ?? {};
      setHasPassword(Boolean((meta as { has_password?: boolean }).has_password));
    };
    loadPasswordStatus();
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        window.location.href = "https://nevo-app.fr/reset-password";
        return;
      }
      if (event === "USER_UPDATED" && session?.user) {
        const meta = session.user.user_metadata ?? {};
        setHasPassword(Boolean((meta as { has_password?: boolean }).has_password));
      }
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const folderParam = searchParams.get("folder");
    if (folderParam) {
      setActiveFolderId(folderParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const onboardingParam = searchParams.get("onboarding");
    if (onboardingParam === "4") {
      setOnboardingStep(4);
      return;
    }
    const loadAccount = async () => {
      try {
        const response = await fetch("/api/beyond-note/account");
        if (!response.ok) return;
        const data = await response.json();
        if (!data?.account?.onboarding_completed) {
          setOnboardingStep(1);
        }
      } catch {
        // ignore
      }
    };
    loadAccount();
  }, [searchParams]);

  const handleSkipOnboarding = async () => {
    setOnboardingStep(0);
    await fetch("/api/beyond-note/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboarding_completed: true }),
    });
  };

  const handleCompleteOnboarding = async () => {
    setOnboardingStep(0);
    await fetch("/api/beyond-note/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboarding_completed: true, onboarding_step: 4 }),
    });
  };

  useEffect(() => {
    const loadQuizStats = async () => {
      if (!activeFolderId) {
        setQuizStats(null);
        return;
      }
      setLoadingQuizStats(true);
      try {
        const res = await fetch(`/api/beyond-note/quiz-sessions?folder_id=${activeFolderId}`);
        if (!res.ok) throw new Error("Erreur lors du chargement des stats");
        const data = await res.json();
        setQuizStats(
          data.stats
            ? {
                ...data.stats,
                sessions: data.sessions || [],
              }
            : null
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur serveur";
        toast.error(message);
      } finally {
        setLoadingQuizStats(false);
      }
    };
    loadQuizStats();
  }, [activeFolderId]);

  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  const handleSelectCamera = () => {
    cameraInputRef.current?.click();
  };

  const handleFileUpload = async (file: File, sourceType: string, folderId?: string | null) => {
    console.log("handleFileUpload called", file.name);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("source_type", sourceType);
      if (folderId) {
        formData.append("folder_id", folderId);
      }

      const res = await fetch("/api/beyond-note/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur upload");
      }
      const data = await res.json();
      setShowUploadToast(true);
      setTimeout(() => setShowUploadToast(false), 2500);
      router.push(`/note-app/${data.document.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur";
      toast.error(message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (folders.length > 0) {
      setPendingUploadFile(file);
      setPendingUploadSourceType("import");
      setShowFolderModal(true);
      return;
    }
    await handleFileUpload(file, "import", null);
  };

  const handleCreateNote = async () => {
    console.log("[handleCreateNote] start");
    try {
      const res = await fetch("/api/beyond-note/upload-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "",
          title: `Note du ${new Date().toLocaleDateString("fr-FR")}`,
          source_type: "note",
        }),
      });
      console.log("[handleCreateNote] res status:", res.status);
      const data = await res.json();
      console.log("[handleCreateNote] data:", data);
      if (data.document?.id) {
        router.push(`/note-app/${data.document.id}`);
      }
    } catch (e) {
      console.error("[handleCreateNote] error:", e);
    }
  };

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    try {
      const res = await fetch("/api/beyond-note/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          emoji: newFolderIconId || newFolderEmoji || "📁",
          color: newFolderColor || "#6D28D9",
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur création dossier");
      }
      const data = await res.json();
      setFolders((prev) => [...prev, data.folder]);
      setNewFolderName("");
      setNewFolderEmoji("📁");
      setNewFolderIconId("book");
      setNewFolderColor("linear-gradient(135deg, #be1354, #F97316)");
      setShowNewFolder(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur";
      toast.error(message);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    const confirmed = window.confirm("Supprimer ce dossier ? Cette action est définitive.");
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/beyond-note/folders?id=${folderId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur suppression");
      }
      setFolders((prev) => prev.filter((folder) => folder.id !== folderId));
      if (activeFolderId === folderId) {
        setActiveFolderId(null);
      }
      setDocuments((prev) =>
        prev.map((doc) => (doc.folder_id === folderId ? { ...doc, folder_id: null } : doc))
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur";
      toast.error(message);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    const confirmed = window.confirm("Supprimer ce document ? Cette action est définitive.");
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/beyond-note/documents/${documentId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur suppression");
      }
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur";
      toast.error(message);
    }
  };

  const handleMoveDocument = async (documentId: string, folderId: string | null) => {
    try {
      const res = await fetch(`/api/beyond-note/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder_id: folderId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur déplacement");
      }
      setDocuments((prev) =>
        prev.map((doc) => (doc.id === documentId ? { ...doc, folder_id: folderId } : doc))
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur";
      toast.error(message);
    }
  };

  const handleRenameDocument = async (documentId: string) => {
    const newName = editingDocumentName.trim();
    if (!newName) {
      setEditingDocumentId(null);
      return;
    }
    try {
      const res = await fetch(`/api/beyond-note/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_name: newName }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur renommage");
      }
      setDocuments((prev) =>
        prev.map((doc) => (doc.id === documentId ? { ...doc, file_name: newName } : doc))
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur";
      toast.error(message);
    } finally {
      setEditingDocumentId(null);
    }
  };

  const getDocIcon = (fileType: string, sourceType?: string | null) => {
    if (sourceType === "note") return <PenLine className="h-5 w-5 text-[#F97316]" />;
    if (sourceType === "dictation") return <Mic className="h-5 w-5 text-violet-400" />;
    if (fileType?.includes("pdf")) return <FileText className="h-5 w-5 text-red-400" />;
    if (fileType?.startsWith("image/")) return <ImageIcon className="h-5 w-5 text-blue-400" />;
    return <FileText className="h-5 w-5 text-[#9CA3AF]" />;
  };

  const iconOptions = [
    { id: "book", label: "Book", color: "#be1354", icon: BookOpen },
    { id: "flask", label: "Flask", color: "linear-gradient(135deg, #be1354, #F97316)", icon: FlaskConical },
    { id: "calc", label: "Calculator", color: "#6D28D9", icon: Calculator },
    { id: "globe", label: "Globe", color: "linear-gradient(135deg, #6D28D9, #be1354)", icon: Globe },
    { id: "music", label: "Music", color: "#0EA5E9", icon: Music },
    { id: "palette", label: "Palette", color: "#be1354", icon: Palette },
    { id: "code", label: "Code", color: "linear-gradient(135deg, #be1354, #F97316)", icon: Code },
    { id: "trophy", label: "Trophy", color: "#6D28D9", icon: Trophy },
    { id: "dumbbell", label: "Dumbbell", color: "linear-gradient(135deg, #6D28D9, #be1354)", icon: Dumbbell },
    { id: "microscope", label: "Microscope", color: "#0EA5E9", icon: Microscope },
    { id: "languages", label: "Languages", color: "#be1354", icon: Languages },
    { id: "barchart", label: "BarChart", color: "linear-gradient(135deg, #be1354, #F97316)", icon: BarChart },
    { id: "landmark", label: "Landmark", color: "#6D28D9", icon: Landmark },
    { id: "leaf", label: "Leaf", color: "linear-gradient(135deg, #6D28D9, #be1354)", icon: Leaf },
    { id: "star", label: "Star", color: "#0EA5E9", icon: Star },
  ];

  const uniqueFolders = folders.reduce((acc, folder) => {
    const key = (folder.name || "").trim().toLowerCase();
    const existingIndex = acc.findIndex((item) => (item.name || "").trim().toLowerCase() === key);
    if (existingIndex === -1) {
      acc.push(folder);
      return acc;
    }
    const existing = acc[existingIndex];
    const existingHasIcon = iconOptions.some((item) => item.id === existing.emoji);
    const newHasIcon = iconOptions.some((item) => item.id === folder.emoji);
    if (newHasIcon && !existingHasIcon) {
      acc[existingIndex] = folder;
    }
    return acc;
  }, [] as Folder[]);

  const renderFolderIcon = (folder: Folder) => {
    const option = iconOptions.find((item) => item.id === folder.emoji);
    if (!option) {
      return <span className="text-base">{folder.emoji || "📁"}</span>;
    }
    const Icon = option.icon;
    return (
      <span
        className="h-8 w-8 rounded-2xl flex items-center justify-center"
        style={{ background: folder.color || option.color }}
      >
        <Icon className="h-4 w-4 text-white" />
      </span>
    );
  };

  const activeFolder = folders.find((folder) => folder.id === activeFolderId) || null;
  const filteredDocuments = (activeFolderId
    ? documents.filter((doc) => doc.folder_id === activeFolderId)
    : documents
  ).filter((doc) => {
    if (showFoldersOnly && !activeFolderId) return false;
    if (!searchQuery.trim()) return true;
    return doc.file_name.toLowerCase().includes(searchQuery.trim().toLowerCase());
  });
  const folderExtractedText = filteredDocuments
    .map((doc) => doc.extracted_text || "")
    .filter((text) => text.trim().length > 0)
    .join("\n\n---\n\n");

  const handleSelectFolderForUpload = async (folderId: string | null) => {
    setShowFolderModal(false);
    if (!pendingUploadFile || !pendingUploadSourceType) return;
    const file = pendingUploadFile;
    const sourceType = pendingUploadSourceType;
    setPendingUploadFile(null);
    setPendingUploadSourceType(null);
    await handleFileUpload(file, sourceType, folderId);
  };

  return (
    <div className="h-screen flex bg-[#be1354] md:bg-[#F8F9FC] text-white md:text-[#0F1117] overflow-hidden">
      <LoadingOverlay isVisible={uploading} type="upload" action="upload" />
      {showUploadToast && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="rounded-3xl bg-white text-black shadow-2xl px-8 py-6 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 text-xl">
              ✓
            </div>
            <div className="text-lg font-semibold">
              Bravo, votre cours est maintenant modifiable
            </div>
          </div>
        </div>
      )}

      {/* Sidebar dossiers */}
      <aside className="hidden md:flex w-64 bg-[#be1354] text-white flex-col">
        <div className="px-6 py-6">
          <img
            src="https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/nevo./Nevo_logo.png"
            alt="Nevo"
            className="h-14 object-contain"
          />
        </div>
        <div className="px-4 space-y-2 mb-4">
          <button
            type="button"
            onClick={() => router.push("/note-app/profile")}
            className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left transition-all hover:bg-white/10"
          >
            <User className="h-4 w-4 text-white" />
            <span className="text-sm">Mon Profil</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left transition-all hover:bg-white/10 text-white/90"
          >
            <LogOut className="h-4 w-4 text-white" />
            <span className="text-sm">{isLoggingOut ? "Déconnexion..." : "Déconnexion"}</span>
          </button>
        </div>
        <div className="px-6 text-sm uppercase tracking-[0.2em] text-white/70 mb-3">
          Mes dossiers
        </div>
        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          <button
            type="button"
            onClick={() => setActiveFolderId(null)}
            className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left transition-all ${
              !activeFolderId ? "bg-white/20" : "hover:bg-white/10"
            }`}
          >
            <Folder className="h-4 w-4 text-white" />
            <span className="text-sm">Bibliothèque</span>
          </button>
          {uniqueFolders.map((folder) => (
            <div
              key={folder.id}
              role="button"
              tabIndex={0}
              onClick={() => setActiveFolderId(folder.id)}
              className={`group w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left transition-all ${
                activeFolderId === folder.id ? "bg-white/20" : "hover:bg-white/10"
              }`}
            >
              {renderFolderIcon(folder)}
              <span className="text-sm flex-1">{folder.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFolder(folder.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-white/80 hover:text-white"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
        <div className="p-4">
          <Button
            onClick={() => setShowNewFolder((prev) => !prev)}
            className="w-full bg-white/10 text-white border border-white/20 hover:bg-white/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau dossier
          </Button>
        </div>
      </aside>

      {/* Zone centrale */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto pb-24 md:pb-10">
          <div className="bg-[#be1354] md:bg-transparent pb-8 rounded-b-3xl md:rounded-none">
            <div className="bg-transparent md:bg-white border-b border-white/20 md:border-[#E8E9F0] px-6 py-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold md:text-[#0F1117]">
                    {activeFolder ? activeFolder.name : "Bibliothèque"}
                  </h1>
                  <p className="text-sm text-white/80 md:text-[#6B7280]">
                    {activeFolder
                      ? `${filteredDocuments.length} documents`
                      : "Scannez un cours et transformez-le en formats adaptés."}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                    <input
                      ref={searchInputRef}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher un document"
                      className="w-full h-10 rounded-xl border border-white/30 bg-white/20 backdrop-blur-md px-9 text-sm text-white placeholder-white/60 outline-none md:border-[#E8E9F0] md:bg-white md:text-[#0F1117] md:placeholder-[#9CA3AF] md:backdrop-blur-none md:focus:border-[#be1354]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen((open) => !open)}
                    className="md:hidden h-10 w-10 rounded-full border border-white/30 text-white flex items-center justify-center"
                  >
                    ☰
                  </button>
                </div>
              </div>
            </div>

            {mobileMenuOpen && (
              <div className="md:hidden px-6 pt-4">
                <div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/70">Menu</p>
                    <button
                      type="button"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-white/70"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        scrollToFolders();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full rounded-xl border border-white/20 px-4 py-2 text-left text-sm"
                    >
                      Dossiers
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        router.push("/note-app/profile");
                      }}
                      className="w-full rounded-xl border border-white/20 px-4 py-2 text-left text-sm"
                    >
                      Profil
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full rounded-xl border border-white/20 px-4 py-2 text-left text-sm text-white/90"
                    >
                      {isLoggingOut ? "Déconnexion..." : "Déconnexion"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="px-6 pt-6 space-y-6">
              {hasPassword === false ? (
                <div className="rounded-3xl border border-white/20 bg-white/10 md:bg-white md:border-[#E8E9F0] p-4 md:p-5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white md:text-[#0F1117]">
                        Sécurisez votre compte
                      </p>
                      <p className="text-xs text-white/80 md:text-[#6B7280]">
                        Définissez un mot de passe pour pouvoir vous reconnecter facilement.
                      </p>
                    </div>
                    <Button
                      onClick={() => router.push("/note-app/profile")}
                      className="bg-white text-[#be1354] hover:bg-white/90 md:bg-[#be1354] md:text-white md:hover:bg-[#a40f47]"
                    >
                      Définir mon mot de passe
                    </Button>
                  </div>
                </div>
              ) : null}

              <div ref={foldersSectionRef} className="md:hidden rounded-3xl border border-white/20 bg-white/10 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-white">Dossiers</p>
                  <button
                    type="button"
                    onClick={() => setShowFoldersOnly(false)}
                    className="text-xs text-white/70"
                  >
                    Tout voir
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveFolderId(null);
                      setShowFoldersOnly(false);
                      setActiveNav("home");
                    }}
                    className={`px-3 py-2 rounded-full text-xs ${
                      !activeFolderId ? "bg-white text-[#be1354]" : "bg-white/10 text-white"
                    }`}
                  >
                    Bibliothèque
                  </button>
                  {uniqueFolders.map((folder) => (
                    <button
                      key={folder.id}
                      type="button"
                      onClick={() => {
                        setActiveFolderId(folder.id);
                        setShowFoldersOnly(false);
                        setActiveNav("home");
                      }}
                      className={`px-3 py-2 rounded-full text-xs ${
                        activeFolderId === folder.id ? "bg-white text-[#be1354]" : "bg-white/10 text-white"
                      }`}
                    >
                      {folder.name}
                    </button>
                  ))}
                </div>
              </div>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="bg-white/10 md:bg-gradient-to-br md:from-pink-50 md:to-violet-50 rounded-3xl p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={handleSelectCamera}
                disabled={uploading}
                className="text-left rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(190,19,84,0.16)] border-white/30 bg-white/20 backdrop-blur-md md:border-[#E8E9F0] md:bg-white md:backdrop-blur-none"
                style={{
                  boxShadow: "0 4px 24px rgba(190,19,84,0.08), 0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                <div className="p-5">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
                  >
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  <p className="font-semibold text-white md:text-[#0F1117]">Prendre une photo</p>
                  <p className="text-sm text-white/80 md:text-[#6B7280]">Scannez ou importez un cours</p>
                </div>
              </button>
              <button
                type="button"
                onClick={handleSelectFile}
                disabled={uploading}
                className="text-left rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(190,19,84,0.16)] border-white/30 bg-white/20 backdrop-blur-md md:border-[#E8E9F0] md:bg-white md:backdrop-blur-none"
                style={{
                  boxShadow: "0 4px 24px rgba(190,19,84,0.08), 0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                <div className="p-5">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: "linear-gradient(135deg, #6D28D9, #be1354)" }}
                  >
                    <Upload className="h-6 w-6 text-white" />
                  </div>
                  <p className="font-semibold text-white md:text-[#0F1117]">Importer un fichier</p>
                  <p className="text-sm text-white/80 md:text-[#6B7280]">PDF, image, document</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setShowDictationModal(true)}
                className="text-left rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(190,19,84,0.16)] border-white/30 bg-white/20 backdrop-blur-md md:border-[#E8E9F0] md:bg-white md:backdrop-blur-none"
                style={{
                  boxShadow: "0 4px 24px rgba(190,19,84,0.08), 0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                <div className="p-5">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: "linear-gradient(135deg, #0EA5E9, #6D28D9)" }}
                  >
                    <Mic className="h-6 w-6 text-white" />
                  </div>
                  <p className="font-semibold text-white md:text-[#0F1117]">Dicter</p>
                  <p className="text-sm text-white/80 md:text-[#6B7280]">Enregistrez votre voix</p>
                </div>
              </button>
              <button
                type="button"
                onClick={handleCreateNote}
                className="text-left rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(190,19,84,0.16)] border-white/30 bg-white/20 backdrop-blur-md md:border-[#E8E9F0] md:bg-white md:backdrop-blur-none"
                style={{
                  boxShadow: "0 4px 24px rgba(190,19,84,0.08), 0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                <div className="p-5">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: "linear-gradient(135deg, #F97316, #be1354)" }}
                  >
                    <PenLine className="h-6 w-6 text-white" />
                  </div>
                  <p className="font-semibold text-white md:text-[#0F1117]">Note</p>
                  <p className="text-sm text-white/80 md:text-[#6B7280]">Prenez des notes pendant vos cours</p>
                </div>
              </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white text-[#0F1117] rounded-t-3xl md:rounded-none px-6 py-6 space-y-8">
            {activeFolder && (
              <div>
                <Button
                  onClick={() => setShowFolderChat(true)}
                  className="bg-[#6D28D9] hover:bg-[#5B21B6] text-white h-10 px-4 rounded-xl"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Poser une question sur ce dossier
                </Button>
              </div>
            )}

          {activeFolder && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-2xl border border-[#E8E9F0] bg-white shadow-sm p-4">
                  <p className="text-xs text-[#9CA3AF]">Fichiers</p>
                  <p className="text-2xl font-semibold">{filteredDocuments.length}</p>
                </div>
                <div className="rounded-2xl border border-[#E8E9F0] bg-white shadow-sm p-4">
                  <p className="text-xs text-[#9CA3AF]">Quiz réalisés</p>
                  <p className="text-2xl font-semibold">{quizStats?.nb_quiz ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-[#E8E9F0] bg-white shadow-sm p-4">
                  <p className="text-xs text-[#9CA3AF]">Note moyenne</p>
                  <p className="text-2xl font-semibold">
                    {(quizStats?.average_score ?? 0).toFixed(1)}/20
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                  <div className="flex items-center justify-between text-xs text-amber-700">
                    <span>Dernier quiz</span>
                    <Trophy className="h-4 w-4 text-amber-600" />
                  </div>
                  <p className="text-2xl font-semibold text-amber-700 mt-1">
                    {quizStats?.sessions?.[0]
                      ? `${quizStats.sessions[0].score}/${quizStats.sessions[0].nb_questions || quizStats.sessions[0].max_score || 0}`
                      : "—"}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-[#E8E9F0] bg-white shadow-sm p-4">
                <p className="text-sm text-[#6B7280] mb-3">Évolution des notes</p>
                <div style={{ width: "100%", height: 200 }}>
                  {loadingQuizStats ? (
                    <div className="h-full flex items-center justify-center text-[#9CA3AF] text-sm">
                      Chargement...
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={quizStats?.evolution || []}>
                        <CartesianGrid stroke="rgba(15,17,23,0.06)" vertical={false} />
                        <XAxis dataKey="date" stroke="rgba(107,114,128,0.7)" fontSize={10} />
                        <YAxis domain={[0, 20]} stroke="rgba(107,114,128,0.7)" fontSize={10} />
                        <RechartsTooltip
                          contentStyle={{
                            background: "#ffffff",
                            border: "1px solid #E8E9F0",
                            borderRadius: "12px",
                            color: "#0F1117",
                            fontSize: "12px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#6D28D9"
                          strokeWidth={2}
                          dot={{ r: 3, fill: "#6D28D9" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center min-h-[260px]">
              <Loader2 className="h-6 w-6 animate-spin text-[#6D28D9]" />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-[#E8E9F0] bg-white shadow-sm p-6 text-[#0F1117]">
              {error}
            </div>
          ) : documents.length === 0 ? (
            <div className="rounded-2xl border border-[#E8E9F0] bg-white shadow-sm p-8 text-center">
              <FileText className="h-10 w-10 mx-auto mb-4 text-[#9CA3AF]" />
              <p className="text-[#0F1117] font-medium mb-2">Aucun document</p>
              <p className="text-[#9CA3AF] text-sm">
                Commencez par capturer une photo de votre cours.
              </p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="rounded-2xl border border-[#E8E9F0] bg-white shadow-sm p-8 text-center">
              <p className="text-[#0F1117] font-medium mb-2">Aucun document dans ce dossier</p>
              <p className="text-[#9CA3AF] text-sm">Ajoutez un cours puis déplacez-le ici.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => {
                    if (editingDocumentId === doc.id) return;
                    router.push(`/note-app/${doc.id}`);
                  }}
                  role="button"
                  tabIndex={0}
                  className="group text-left rounded-2xl border border-[#E8E9F0] bg-white shadow-sm p-5 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-[#6B7280] mb-2">
                        {getDocIcon(doc.file_type, doc.source_type)}
                        <span className="text-xs">
                          {doc.source_type === "note"
                            ? "Note"
                            : doc.source_type === "dictation"
                              ? "Dictée"
                              : doc.file_type?.includes("pdf")
                                ? "PDF"
                                : "Image"}
                        </span>
                      </div>
                      {editingDocumentId === doc.id ? (
                        <input
                          value={editingDocumentName}
                          onChange={(e) => setEditingDocumentName(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.key === "Enter" && handleRenameDocument(doc.id)}
                          onBlur={() => handleRenameDocument(doc.id)}
                          className="w-full bg-white border border-[#E8E9F0] rounded-lg px-2 py-1 text-sm text-[#0F1117] outline-none focus:border-violet-500"
                          autoFocus
                        />
                      ) : (
                        <h3 className="text-base font-semibold text-[#0F1117] line-clamp-2">
                          {doc.file_name}
                        </h3>
                      )}
                      {doc.subject && (
                        <p className="text-xs text-violet-600 mt-1">{doc.subject}</p>
                      )}
                      <p className="text-xs text-[#6B7280] mt-2">
                        {doc.extracted_text ? "Texte extrait" : "Extraction en cours"}
                      </p>
                    </div>
                    <div className="flex items-center justify-end gap-5 pl-4 min-w-[112px] shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleDeleteDocument(doc.id);
                        }}
                        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-[#9CA3AF] hover:text-[#be1354] pointer-events-auto shrink-0 h-10 w-10"
                      >
                        🗑️
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingDocumentId(doc.id);
                          setEditingDocumentName(doc.file_name);
                        }}
                        className="text-[#9CA3AF] hover:text-[#0F1117]"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[#9CA3AF] hover:text-[#0F1117]"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white text-[#0F1117] border-[#E8E9F0]">
                          <DropdownMenuLabel>Déplacer vers...</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {folders.length === 0 && (
                            <DropdownMenuItem disabled>Aucun dossier</DropdownMenuItem>
                          )}
                          {folders.map((folder) => (
                            <DropdownMenuItem
                              key={folder.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveDocument(doc.id, folder.id);
                              }}
                            >
                              <span className="mr-2">{folder.emoji || "📁"}</span>
                              {folder.name}
                            </DropdownMenuItem>
                          ))}
                          {doc.folder_id && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveDocument(doc.id, null);
                                }}
                              >
                                Retirer du dossier
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <ArrowRight className="h-4 w-4 text-[#9CA3AF]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </main>

      {/* Navigation mobile */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-white/80 backdrop-blur-2xl rounded-full px-6 py-3 flex items-center gap-6 shadow-[0_8px_32px_rgba(0,0,0,0.15)] border border-white/60">
          <button
            type="button"
            onClick={() => setActiveNav("home")}
            className="flex flex-col items-center justify-center"
          >
            <Home className={`h-6 w-6 ${activeNav === "home" ? "text-[#be1354]" : "text-[#9CA3AF]"}`} />
            <span className={`text-[10px] font-medium ${activeNav === "home" ? "text-[#be1354]" : "text-[#9CA3AF]"}`}>
              Maison
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              scrollToFolders();
            }}
            className="flex flex-col items-center justify-center"
          >
            <FolderOpen className={`h-6 w-6 ${activeNav === "folders" ? "text-[#be1354]" : "text-[#9CA3AF]"}`} />
            <span className={`text-[10px] font-medium ${activeNav === "folders" ? "text-[#be1354]" : "text-[#9CA3AF]"}`}>
              Dossiers
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveNav("search");
              searchInputRef.current?.focus();
            }}
            className="flex flex-col items-center justify-center"
          >
            <Search className={`h-6 w-6 ${activeNav === "search" ? "text-[#be1354]" : "text-[#9CA3AF]"}`} />
            <span className={`text-[10px] font-medium ${activeNav === "search" ? "text-[#be1354]" : "text-[#9CA3AF]"}`}>
              Recherche
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveNav("profile");
              router.push("/note-app/profile");
            }}
            className="flex flex-col items-center justify-center"
          >
            <User className={`h-6 w-6 ${activeNav === "profile" ? "text-[#be1354]" : "text-[#9CA3AF]"}`} />
            <span className={`text-[10px] font-medium ${activeNav === "profile" ? "text-[#be1354]" : "text-[#9CA3AF]"}`}>
              Profil
            </span>
          </button>
        </div>
      </div>
      {showNewFolder && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-[#E8E9F0] p-6 text-[#0F1117]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Créer un dossier</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowNewFolder(false)}>
                ✕
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[#6B7280] mb-2">Nom du dossier</p>
                <input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                  placeholder="Ex: Révisions, Sciences..."
                  className="w-full h-11 rounded-xl border border-[#E8E9F0] bg-white px-4 text-sm outline-none focus:border-[#be1354]"
                />
              </div>
              <div>
                <p className="text-sm text-[#6B7280] mb-3">Choisir une icône</p>
                <div className="grid grid-cols-5 gap-2">
                  {iconOptions.map((item) => {
                    const Icon = item.icon;
                    const selected = newFolderIconId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setNewFolderIconId(item.id);
                          setNewFolderColor(item.color);
                        }}
                        className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
                          selected ? "ring-2 ring-[#be1354] scale-105" : "hover:scale-105"
                        }`}
                        style={{ background: item.color }}
                      >
                        <Icon className="h-4 w-4 text-white" />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowNewFolder(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateFolder} className="bg-[#be1354] hover:bg-[#a80f4a] text-white">
                  Créer le dossier
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showFolderModal && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-3xl bg-[#F8F9FC] border border-[#E8E9F0] p-6 text-[#0F1117]">
            <h3 className="text-lg font-semibold mb-4">Dans quel dossier ?</h3>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {uniqueFolders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => handleSelectFolderForUpload(folder.id)}
                  className="rounded-xl border border-[#E8E9F0] bg-white shadow-sm px-3 py-2 text-sm text-[#0F1117] hover:bg-white/10 flex items-center gap-2"
                >
                  {renderFolderIcon(folder)}
                  <span className="truncate">{folder.name}</span>
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={() => handleSelectFolderForUpload(null)}
              className="w-full border-white/20 text-[#0F1117] hover:bg-white shadow-sm border border-[#E8E9F0]"
            >
              Sans dossier
            </Button>
          </div>
        </div>
      )}
      {showFolderChat && activeFolder && (
        <ChatView
          documentId={activeFolder.id}
          extractedText={folderExtractedText || "Aucun contenu."}
          folderName={activeFolder.name}
          folderDocCount={filteredDocuments.length}
          onClose={() => setShowFolderChat(false)}
        />
      )}
      <NeoBubble
        extractedText={folderExtractedText}
        documentTitle="Bibliothèque"
        documents={documents.map((d) => ({
          id: d.id,
          file_name: d.file_name,
          extracted_text: d.extracted_text?.slice(0, 300) || "",
        }))}
        onOpenDocument={(id) => router.push(`/note-app/${id}`)}
        context="library"
      />
      {onboardingStep === 1 && (
        <OnboardingOverlay
          step={1}
          onNext={() => {
            setOnboardingStep(0);
            if (typeof window !== "undefined") {
              localStorage.setItem("nevo_onboarding_step", "2");
            }
          }}
          onSkip={handleSkipOnboarding}
          onComplete={handleCompleteOnboarding}
          onTriggerUpload={() => cameraInputRef.current?.click()}
        />
      )}
      {onboardingStep === 4 && (
        <OnboardingOverlay
          step={4}
          onNext={() => {}}
          onSkip={() => {}}
          onComplete={handleCompleteOnboarding}
        />
      )}
      <DictationModal
        isOpen={showDictationModal}
        onClose={() => setShowDictationModal(false)}
        onComplete={(documentId) => {
          if (documentId) {
            router.push(`/note-app/${documentId}`);
          }
        }}
      />
    </div>
  );
}
