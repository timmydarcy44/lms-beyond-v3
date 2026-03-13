"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  Trash2,
  Check,
  Pencil,
  MessageCircle,
  Trophy,
} from "lucide-react";
import { DictationModal } from "@/components/beyond-note/dictation-modal";
import { ChatView } from "@/components/beyond-note/chat-view";

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [showUploadToast, setShowUploadToast] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderEmoji, setNewFolderEmoji] = useState("📁");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDictationModal, setShowDictationModal] = useState(false);
  const [accountType, setAccountType] = useState("solo");
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [pendingDocumentId, setPendingDocumentId] = useState<string | null>(null);
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [editingDocumentName, setEditingDocumentName] = useState("");
  const [showFolderChat, setShowFolderChat] = useState(false);
  const [quizStats, setQuizStats] = useState<QuizStats | null>(null);
  const [loadingQuizStats, setLoadingQuizStats] = useState(false);

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
    loadDocuments();
    loadFolders();
  }, []);

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

  const handleFileUpload = async (file: File, sourceType: string) => {
    console.log("handleFileUpload called", file.name);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("source_type", sourceType);

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
      setPendingDocumentId(data.document.id);
      setShowSubjectModal(true);
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
    await handleFileUpload(file, "import");
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
          emoji: newFolderEmoji || "📁",
          color: "#6D28D9",
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
      setShowNewFolder(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur";
      toast.error(message);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
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
    if (sourceType === "dictation") return <Mic className="h-5 w-5 text-violet-400" />;
    if (fileType?.includes("pdf")) return <FileText className="h-5 w-5 text-red-400" />;
    if (fileType?.startsWith("image/")) return <ImageIcon className="h-5 w-5 text-blue-400" />;
    return <FileText className="h-5 w-5 text-white/40" />;
  };

  const subjectOptions =
    accountType === "child" || accountType === "solo"
      ? ["Mathématiques", "Français", "Histoire-Géo", "Sciences", "Anglais", "SVT", "Physique-Chimie", "Autre"]
      : ["Management", "Négociation", "Marketing", "Finance", "Droit", "RH", "Commercial", "Autre"];

  const activeFolder = folders.find((folder) => folder.id === activeFolderId) || null;
  const filteredDocuments = activeFolderId
    ? documents.filter((doc) => doc.folder_id === activeFolderId)
    : documents;
  const folderExtractedText = filteredDocuments
    .map((doc) => doc.extracted_text || "")
    .filter((text) => text.trim().length > 0)
    .join("\n\n---\n\n");

  const handleSelectSubject = async (subject: string | null) => {
    const documentId = pendingDocumentId;
    setShowSubjectModal(false);
    if (!documentId) return;
    if (subject) {
      try {
        await fetch(`/api/beyond-note/documents/${documentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject }),
        });
      } catch {
        toast.error("Impossible de sauvegarder la catégorie");
      }
    }
    router.push(`/beyond-note-app/${documentId}`);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white overflow-x-hidden w-full max-w-[100vw]">
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
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-semibold">Bibliothèque</h1>
              <Button
                onClick={() => setShowNewFolder((prev) => !prev)}
                size="icon"
                className="h-9 w-9 rounded-full bg-white/10 text-white border border-white/20 hover:bg-white/20"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {activeFolder ? (
              <div className="text-white/60 text-sm mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveFolderId(null)}
                  className="text-white/60 hover:text-white"
                >
                  Bibliothèque
                </button>
                <span>›</span>
                <span className="text-white">{activeFolder.name}</span>
              </div>
            ) : (
              <p className="text-white/40 text-sm mt-2">
                Scannez un cours et transformez-le en formats adaptés.
              </p>
            )}
            {activeFolder && (
              <div className="mt-3">
                <Button
                  onClick={() => setShowFolderChat(true)}
                  className="bg-violet-600 hover:bg-violet-500 text-white h-10 px-4 rounded-xl"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Poser une question sur ce dossier
                </Button>
              </div>
            )}
            {activeFolder && (
              <div className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-white/50">Fichiers</p>
                    <p className="text-2xl font-semibold">{filteredDocuments.length}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-white/50">Quiz réalisés</p>
                    <p className="text-2xl font-semibold">{quizStats?.nb_quiz ?? 0}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-white/50">Note moyenne</p>
                    <p className="text-2xl font-semibold">
                      {(quizStats?.average_score ?? 0).toFixed(1)}/20
                    </p>
                  </div>
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                    <div className="flex items-center justify-between text-xs text-amber-200">
                      <span>Dernier quiz</span>
                      <Trophy className="h-4 w-4 text-amber-300" />
                    </div>
                    <p className="text-2xl font-semibold text-amber-100 mt-1">
                      {quizStats?.sessions?.[0]
                        ? `${quizStats.sessions[0].score}/${quizStats.sessions[0].nb_questions || quizStats.sessions[0].max_score || 0}`
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-white/60 mb-3">Évolution des notes</p>
                  <div style={{ width: "100%", height: 200 }}>
                    {loadingQuizStats ? (
                      <div className="h-full flex items-center justify-center text-white/50 text-sm">
                        Chargement...
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={quizStats?.evolution || []}>
                          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                          <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={10} />
                          <YAxis
                            domain={[0, 20]}
                            stroke="rgba(255,255,255,0.4)"
                            fontSize={10}
                          />
                          <RechartsTooltip
                            contentStyle={{
                              background: "#111118",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: "12px",
                              color: "white",
                              fontSize: "12px",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="score"
                            stroke="#8B5CF6"
                            strokeWidth={2}
                            dot={{ r: 3, fill: "#8B5CF6" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            )}
            {showNewFolder && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  value={newFolderEmoji}
                  onChange={(e) => setNewFolderEmoji(e.target.value)}
                  className="w-12 h-10 text-center rounded-xl bg-white/5 border border-white/10 text-white"
                  maxLength={2}
                />
                <input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                  placeholder="Nom du dossier"
                  className="h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white outline-none focus:border-violet-500"
                />
                <Button
                  onClick={handleCreateFolder}
                  size="icon"
                  className="h-10 w-10 rounded-xl bg-violet-600 hover:bg-violet-500 text-white"
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              onClick={handleSelectCamera}
              disabled={uploading}
              className="bg-white/10 text-white border border-white/20 h-11 px-4 rounded-xl sm:hidden"
            >
              <Camera className="h-4 w-4 mr-2" />
              Photo
            </Button>
            <Button
              onClick={handleSelectFile}
              disabled={uploading}
              className="bg-white/10 text-white border border-white/20 h-11 px-4 rounded-xl"
            >
              <FileText className="h-4 w-4 mr-2" />
              Importer un fichier
            </Button>
            <Button
              onClick={() => setShowDictationModal(true)}
              className="bg-white/10 text-white border border-white/20 h-11 px-5 rounded-xl"
            >
              <Mic className="h-4 w-4 mr-2" />
              Dicter
            </Button>
            <Button
              onClick={handleSelectFile}
              disabled={uploading}
              className="bg-[#6D28D9] hover:bg-[#5B21B6] text-white h-11 px-5 rounded-xl"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Upload...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Ajouter un cours
                </>
              )}
            </Button>
          </div>
        </div>

        {folders.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {folders.map((folder) => {
              const count = documents.filter((doc) => doc.folder_id === folder.id).length;
              return (
                <div
                  key={folder.id}
                  onClick={() => setActiveFolderId(folder.id)}
                  className={`rounded-2xl bg-white/5 border border-white/10 p-4 text-left hover:bg-white/10 cursor-pointer transition-all ${
                    activeFolderId === folder.id ? "ring-2 ring-violet-500/60" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-2xl">{folder.emoji || "📁"}</div>
                      <p className="text-white font-medium mt-2">{folder.name}</p>
                      <p className="text-white/40 text-xs mt-1">{count} cours</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(folder.id);
                      }}
                      className="text-white/50 hover:text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center min-h-[260px]">
            <Loader2 className="h-6 w-6 animate-spin text-[#6D28D9]" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
            {error}
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <FileText className="h-10 w-10 mx-auto mb-4 text-white/30" />
            <p className="text-white/80 font-medium mb-2">Aucun document</p>
            <p className="text-white/40 text-sm">
              Commencez par capturer une photo de votre cours.
            </p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-white/80 font-medium mb-2">Aucun document dans ce dossier</p>
            <p className="text-white/40 text-sm">Ajoutez un cours puis déplacez-le ici.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                onClick={() => {
                  if (editingDocumentId === doc.id) return;
                  router.push(`/beyond-note-app/${doc.id}`);
                }}
                role="button"
                tabIndex={0}
                className="text-left rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-white/40 mb-2">
                      {getDocIcon(doc.file_type, doc.source_type)}
                      <span className="text-xs">
                        {doc.source_type === "dictation"
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
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-white outline-none focus:border-violet-500"
                        autoFocus
                      />
                    ) : (
                      <h3 className="text-base font-semibold text-white line-clamp-2">
                        {doc.file_name}
                      </h3>
                    )}
                    {doc.subject && (
                      <p className="text-xs text-violet-300 mt-1">{doc.subject}</p>
                    )}
                    <p className="text-xs text-white/40 mt-2">
                      {doc.extracted_text ? "Texte extrait" : "Extraction en cours"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingDocumentId(doc.id);
                        setEditingDocumentName(doc.file_name);
                      }}
                      className="text-white/50 hover:text-white"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => e.stopPropagation()}
                          className="text-white/50 hover:text-white"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#0A0A0F] text-white border-white/10">
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
                    <ArrowRight className="h-4 w-4 text-white/40" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {showSubjectModal && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-3xl bg-[#0A0A0F] border border-white/10 p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">Choisir une catégorie</h3>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {subjectOptions.map((subject) => (
                <button
                  key={subject}
                  onClick={() => handleSelectSubject(subject)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
                >
                  {subject}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={() => handleSelectSubject(null)}
              className="w-full border-white/20 text-white hover:bg-white/5"
            >
              Passer
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
      <DictationModal
        isOpen={showDictationModal}
        onClose={() => setShowDictationModal(false)}
        onComplete={(documentId) => {
          if (documentId) {
            router.push(`/beyond-note-app/${documentId}`);
          }
        }}
      />
    </div>
  );
}
