"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Eraser,
  Heading2,
  Heading3,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Paintbrush,
  Quote,
  Redo,
  Strikethrough,
  Type as TypeIcon,
  Underline,
  Undo,
  Video,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDriveDocuments } from "@/hooks/use-drive-documents";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const DEFAULT_CONTENT = "<p>Commencez votre document avec une accroche percutante…</p>";

type FormattingCommand = {
  icon: JSX.Element;
  label: string;
  action: () => void;
};

export default function DriveEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addDocument = useDriveDocuments((state) => state.addDocument);

  const consigneId = searchParams.get("consigne");
  const messageId = searchParams.get("message");
  const [isLoadingConsigne, setIsLoadingConsigne] = useState(!!consigneId);
  const [consigneData, setConsigneData] = useState<{ title: string; content: string } | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState("Note sans titre");
  const [share, setShare] = useState(false);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(null);
  const [availableInstructors, setAvailableInstructors] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [textColor, setTextColor] = useState("#ffffff");
  const [highlightColor, setHighlightColor] = useState("#FF512F");

  // Charger les formateurs disponibles
  useEffect(() => {
    fetch("/api/drive/instructors")
      .then((res) => {
        console.log("[DriveEditor] API response status:", res.status, res.statusText);
        return res.json();
      })
      .then((data) => {
        console.log("[DriveEditor] Instructors loaded - full response:", JSON.stringify(data, null, 2));
        console.log("[DriveEditor] Instructors array:", data.instructors);
        console.log("[DriveEditor] Instructors count:", data.instructors?.length || 0);
        if (data.instructors && Array.isArray(data.instructors) && data.instructors.length > 0) {
          console.log("[DriveEditor] Setting instructors:", data.instructors);
          setAvailableInstructors(data.instructors);
          // Pré-sélectionner le premier formateur par défaut
          if (!selectedInstructorId && data.instructors.length > 0) {
            setSelectedInstructorId(data.instructors[0].id);
            console.log("[DriveEditor] Pre-selected instructor:", data.instructors[0]);
          }
        } else {
          console.warn("[DriveEditor] No instructors found for learner - response:", data);
          console.warn("[DriveEditor] Instructors is:", data.instructors);
          console.warn("[DriveEditor] Is array:", Array.isArray(data.instructors));
          console.warn("[DriveEditor] Length:", data.instructors?.length);
        }
      })
      .catch((err) => {
        console.error("[DriveEditor] Error loading instructors:", err);
      });
  }, []);

  // Charger les données de la consigne si présente
  useEffect(() => {
    if (consigneId && messageId && isLoadingConsigne) {
      fetch(`/api/messages/${messageId}`)
        .then(res => res.json())
        .then(data => {
          if (data.message) {
            const msg = data.message;
            const consigneTitle = msg.subject || msg.metadata?.title || "Réponse à la consigne";
            const consigneContent = msg.content || msg.body || "";
            
            // Extraire le titre si présent dans le contenu (format markdown)
            const titleMatch = consigneContent.match(/\*\*(.+?)\*\*/);
            const extractedTitle = titleMatch ? titleMatch[1] : consigneTitle;
            
            setTitle(`Réponse: ${extractedTitle}`);
            setConsigneData({ title: extractedTitle, content: consigneContent });
            
            // Pré-remplir avec un template de réponse
            const template = `<h2>Réponse à: ${extractedTitle}</h2>\n\n<p>---</p>\n\n<p>[Votre réponse ici...]</p>\n\n<p>---</p>\n\n<blockquote>${consigneContent.replace(/\*\*/g, '').replace(/\n/g, '<br />')}</blockquote>`;
            setContent(template);
            if (editorRef.current) {
              editorRef.current.innerHTML = template;
            }
            setIsLoadingConsigne(false);
          }
        })
        .catch(err => {
          console.error("[DriveEditor] Error loading consigne:", err);
          setIsLoadingConsigne(false);
        });
    }
  }, [consigneId, messageId, isLoadingConsigne]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = DEFAULT_CONTENT;
    }
  }, []);

  const exec = (command: string, value?: string) => {
    if (typeof document === "undefined") return;
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    setContent(editorRef.current?.innerHTML ?? "");
  };

  const handleHeading = (tagName: "P" | "H2" | "H3") => {
    const block = `<${tagName}>`;
    exec("formatBlock", block);
  };

  const handleLink = () => {
    const url = prompt("URL du lien ?");
    if (!url) return;
    exec("createLink", url);
  };

  const handleImage = () => {
    const url = prompt("Lien de l'image à intégrer ?");
    if (!url) return;
    const sanitized = url.replace(/"/g, "&quot;");
    exec("insertImage", sanitized);
  };

  const handleVideo = () => {
    const url = prompt("Lien vidéo (YouTube embed, Vimeo ou MP4) ?");
    if (!url) return;
    const sanitized = url.replace(/"/g, "&quot;");
    if (typeof document === "undefined") return;
    editorRef.current?.focus();
    document.execCommand(
      "insertHTML",
      false,
      `<div class="mt-6 aspect-video overflow-hidden rounded-3xl border border-white/10 shadow-lg"><iframe src="${sanitized}" class="h-full w-full" allowfullscreen loading="lazy"></iframe></div>`,
    );
    setContent(editorRef.current?.innerHTML ?? "");
  };

  const handleInput = () => {
    setContent(editorRef.current?.innerHTML ?? "");
  };

  const clearFormatting = () => {
    exec("removeFormat");
  };

  const plainText = useMemo(() => {
    if (!editorRef.current) return "";
    return editorRef.current.innerText.replace(/\s+/g, " ").trim();
  }, [content]);

  const handleSave = async ({ shareOverride }: { shareOverride?: boolean } = {}) => {
    const effectiveShare = shareOverride ?? share;
    const currentContent = editorRef.current?.innerHTML ?? DEFAULT_CONTENT;
    const currentText = editorRef.current?.innerText.replace(/\s+/g, " ").trim() ?? "";

    if (!currentText) {
      toast.error("Rédigez un minimum de contenu avant de sauvegarder.");
      return;
    }

    // Si c'est une réponse à une consigne, créer ou utiliser le dossier de consigne
    let folderId: string | null = null;
    if (consigneId && messageId) {
      try {
        // Créer ou récupérer le dossier pour cette consigne
        const folderResponse = await fetch("/api/drive/folders/consigne", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            consigneId,
            messageId,
            title: consigneData?.title || title,
          }),
        });
        
        if (folderResponse.ok) {
          const folderData = await folderResponse.json();
          folderId = folderData.folderId;
        }
      } catch (error) {
        console.error("[DriveEditor] Error creating consigne folder:", error);
      }
    }

    // Sauvegarder le document dans la base de données
    try {
      const response = await fetch("/api/drive/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim() || "Note sans titre",
          content: currentContent,
          status: effectiveShare ? "shared" : "draft",
          folderId: folderId || null,
          consigneId: consigneId || null,
          instructorId: effectiveShare ? (selectedInstructorId || null) : null,
        }),
      });

      // Vérifier d'abord si la réponse est OK
      if (!response.ok) {
        // Si erreur, récupérer le texte brut pour debug
        let errorData: any = {};
        const contentType = response.headers.get("content-type");
        
        try {
          if (contentType?.includes("application/json")) {
            errorData = await response.json();
          } else {
            const text = await response.text();
            errorData = { rawText: text };
            // Essayer de parser comme JSON si possible
            try {
              errorData = JSON.parse(text);
            } catch {
              // Garder le texte brut
            }
          }
        } catch (parseError) {
          console.error("[DriveEditor] Failed to parse error response:", parseError);
          errorData = { parseError: String(parseError) };
        }

        const errorMessage = errorData?.details || errorData?.error || errorData?.message || `Erreur serveur (${response.status})`;
        console.error("[DriveEditor] Server error:", {
          status: response.status,
          statusText: response.statusText,
          contentType,
          errorData: errorData,
          error: errorData?.error,
          details: errorData?.details,
          code: errorData?.code,
          hint: errorData?.hint,
          type: errorData?.type,
        });
        throw new Error(errorMessage);
      }

      // Si OK, parser la réponse JSON normalement
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("[DriveEditor] Failed to parse success response:", parseError);
        throw new Error(`Réponse invalide du serveur: ${response.status}`);
      }

      // Ajouter aussi au store local pour l'affichage immédiat
      addDocument({
        id: data.documentId || `doc-${Date.now()}`,
        title: title.trim() || "Note sans titre",
        content: currentContent,
        updatedAt: new Date(),
        status: effectiveShare ? "shared" : "draft",
        sharedWithInstructor: effectiveShare,
        folderId: folderId || undefined,
        consigneId: consigneId || undefined,
      });

      setShare(effectiveShare);
      
      if (effectiveShare) {
        const instructorName = availableInstructors.find(i => i.id === selectedInstructorId)?.name || "le formateur";
        toast.success(`Document partagé avec ${instructorName}.`);
      } else {
        toast.success("Document sauvegardé en brouillon.");
      }
      
      // Délai avant redirection pour voir le message de confirmation
      setTimeout(() => {
        router.push("/dashboard/drive");
      }, 1500);
    } catch (error) {
      console.error("[DriveEditor] Error saving document:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la sauvegarde du document");
    }
  };

  const formattingCommands: FormattingCommand[] = [
    { icon: <Bold className="h-4 w-4" />, label: "Gras", action: () => exec("bold") },
    { icon: <Italic className="h-4 w-4" />, label: "Italique", action: () => exec("italic") },
    { icon: <Underline className="h-4 w-4" />, label: "Souligner", action: () => exec("underline") },
    { icon: <Strikethrough className="h-4 w-4" />, label: "Barré", action: () => exec("strikeThrough") },
    { icon: <Heading2 className="h-4 w-4" />, label: "Titre", action: () => handleHeading("H2") },
    { icon: <Heading3 className="h-4 w-4" />, label: "Sous-titre", action: () => handleHeading("H3") },
    { icon: <TypeIcon className="h-4 w-4" />, label: "Paragraphe", action: () => handleHeading("P") },
    { icon: <List className="h-4 w-4" />, label: "Liste", action: () => exec("insertUnorderedList") },
    { icon: <ListOrdered className="h-4 w-4" />, label: "Liste numérotée", action: () => exec("insertOrderedList") },
    { icon: <Quote className="h-4 w-4" />, label: "Citation", action: () => exec("formatBlock", "<BLOCKQUOTE>") },
    { icon: <AlignLeft className="h-4 w-4" />, label: "Aligner à gauche", action: () => exec("justifyLeft") },
    { icon: <AlignCenter className="h-4 w-4" />, label: "Centrer", action: () => exec("justifyCenter") },
    { icon: <AlignRight className="h-4 w-4" />, label: "Aligner à droite", action: () => exec("justifyRight") },
    { icon: <LinkIcon className="h-4 w-4" />, label: "Lien", action: handleLink },
    { icon: <ImageIcon className="h-4 w-4" />, label: "Image", action: handleImage },
    { icon: <Video className="h-4 w-4" />, label: "Vidéo", action: handleVideo },
    { icon: <Undo className="h-4 w-4" />, label: "Annuler", action: () => exec("undo") },
    { icon: <Redo className="h-4 w-4" />, label: "Rétablir", action: () => exec("redo") },
    { icon: <Eraser className="h-4 w-4" />, label: "Effacer le style", action: clearFormatting },
  ];

  return (
    <div className="space-y-8">
      <Card className="border-white/10 bg-gradient-to-br from-[#161616] via-[#0C0C0C] to-[#050505] text-white">
        <CardHeader className="space-y-3">
          <CardTitle className="text-3xl font-semibold">Studio de création</CardTitle>
          <p className="max-w-2xl text-sm text-white/60">
            Créez vos fiches, scripts ou plans d&apos;animation directement depuis Beyond LMS. Formatez votre texte, intégrez des visuels,
            ajoutez des vidéos et partagez le document final avec votre formateur lorsque vous êtes prêt.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1fr,auto] lg:items-center">
            <div className="space-y-2">
              <Label htmlFor="drive-new-title">Titre du document</Label>
              <Input
                id="drive-new-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="border-white/10 bg-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">Partager avec mon formateur</p>
                  <p className="text-xs text-white/50">
                    Gardez-le en brouillon le temps de vos itérations, puis activez le partage dès que c&apos;est prêt.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={cn("rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]", share ? "bg-emerald-500/20 text-emerald-200" : "bg-white/10 text-white/60")}>
                    {share ? "Partagé" : "Brouillon"}
                  </Badge>
                  <Switch id="drive-new-share" checked={share} onCheckedChange={setShare} />
                </div>
              </div>
              {share && (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 space-y-2">
                  <Label htmlFor="instructor-select" className="text-xs font-medium text-white/80">
                    Sélectionner le formateur
                  </Label>
                  {availableInstructors.length > 0 ? (
                    <Select
                      value={selectedInstructorId || undefined}
                      onValueChange={(value) => {
                        setSelectedInstructorId(value);
                        console.log("[DriveEditor] Selected instructor:", value);
                      }}
                    >
                      <SelectTrigger id="instructor-select" className="bg-white/10 border-white/20 text-white h-10">
                        <SelectValue placeholder="Choisir un formateur" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableInstructors.map((instructor) => (
                          <SelectItem key={instructor.id} value={instructor.id}>
                            {instructor.name} ({instructor.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200">
                      Aucun formateur disponible dans votre organisation. Contactez votre administrateur.
                    </div>
                  )}
                  {share && selectedInstructorId && (
                    <p className="text-xs text-emerald-400">
                      ✓ Document sera partagé avec le formateur sélectionné
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/40">
            <Badge variant="secondary" className="rounded-full bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-white/60">
              Sauvegarde instantanée
            </Badge>
            <Badge variant="secondary" className="rounded-full bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-white/60">
              Rich media
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-[#0B0B0B] text-white">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            {formattingCommands.map((command) => (
              <ToolbarButton key={command.label} onClick={command.action} label={command.label}>
                {command.icon}
              </ToolbarButton>
            ))}
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
              <Paintbrush className="h-4 w-4 text-white/60" />
              <input
                aria-label="Couleur du texte"
                type="color"
                value={textColor}
                onChange={(event) => {
                  setTextColor(event.target.value);
                  exec("foreColor", event.target.value);
                }}
                className="h-5 w-5 cursor-pointer appearance-none rounded-full border-0 bg-transparent p-0"
              />
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
              <Highlighter className="h-4 w-4 text-white/60" />
              <input
                aria-label="Surlignage"
                type="color"
                value={highlightColor}
                onChange={(event) => {
                  setHighlightColor(event.target.value);
                  exec("hiliteColor", event.target.value);
                }}
                className="h-5 w-5 cursor-pointer appearance-none rounded-full border-0 bg-transparent p-0"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            ref={editorRef}
            onInput={handleInput}
            contentEditable
            suppressContentEditableWarning
            className="min-h-[500px] rounded-3xl border border-white/10 bg-gradient-to-br from-[#111111] via-[#090909] to-[#050505] p-8 text-base leading-7 text-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] focus:outline-none focus:ring-2 focus:ring-white/30 [&_a]:text-sky-300 [&_blockquote]:border-l-4 [&_blockquote]:border-white/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-white [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-white [&_img]:mx-auto [&_img]:rounded-2xl [&_img]:shadow-lg"
          />
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5 text-white">
        <CardContent className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-white/80">Statut actuel</p>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">
              {share ? "Prêt à partager" : "Brouillon privé"} · {plainText.length} caractères
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="ghost"
              className="rounded-full border border-white/20 px-6 py-2.5 text-xs uppercase tracking-[0.2em] text-white/70"
              onClick={() => router.back()}
            >
              Annuler
            </Button>
            <Button
              onClick={() => handleSave({ shareOverride: false })}
              className="rounded-full bg-gradient-to-r from-[#303030] to-[#1a1a1a] px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:opacity-90"
            >
              Enregistrer en brouillon
            </Button>
            <Button
              onClick={() => {
                setShare(true);
                handleSave({ shareOverride: true });
              }}
              className="rounded-full bg-gradient-to-r from-[#FF512F] to-[#DD2476] px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:opacity-90"
            >
              Partager au formateur
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ToolbarButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:border-white/30 hover:text-white"
    >
      {children}
    </button>
  );
}

