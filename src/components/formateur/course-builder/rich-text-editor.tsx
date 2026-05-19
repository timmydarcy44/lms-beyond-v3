"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Youtube from "@tiptap/extension-youtube";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Image as ImageIcon,
  Italic,
  Layout,
  Link as LinkIcon,
  Minus,
  Palette,
  Plus as PlusIcon,
  Type,
  Underline as UnderlineIcon,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { FontSize } from "./extensions/font-size";
import { ResizableImage } from "./extensions/resizable-image";
import { VideoBlock } from "./extensions/video-block";
import { MediaPlaceholder, type MediaPlaceholderRequest } from "./extensions/media-placeholder";
import { TemplatePickerModal, type TemplateDefinition } from "./template-picker-modal";
import { Callout } from "./extensions/callout";

type RichTextEditorProps = {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
};

const COLOR_SWATCHES = [
  { name: "Noir", value: "#111111" },
  { name: "Blanc", value: "#FFFFFF" },
  { name: "Rouge", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Jaune", value: "#EAB308" },
  { name: "Vert", value: "#22C55E" },
  { name: "Bleu", value: "#3B82F6" },
  { name: "Violet", value: "#A855F7" },
  { name: "Rose", value: "#EC4899" },
];

const LAYOUT_TEMPLATES: Array<TemplateDefinition> = [
  {
    id: "single-column",
    label: "Bloc plein",
    description: "Une colonne, texte fluide",
    previewVariant: "single",
    html: `<p></p>`,
  },
  {
    id: "two-columns",
    label: "2 colonnes (50/50)",
    description: "Deux colonnes équilibrées",
    previewVariant: "two-equal",
    html: `<div class="columns two-equal"><div><p></p></div><div><p></p></div></div>`,
  },
  {
    id: "two-columns-30-70",
    label: "2 colonnes (30/70)",
    description: "Sidebar + contenu principal",
    previewVariant: "two-asym",
    html: `<div class="columns two-asym"><div><p></p></div><div><p></p></div></div>`,
  },
  {
    id: "image-left-text-right",
    label: "Image + texte (gauche)",
    description: "Visuel à gauche, contenu à droite",
    previewVariant: "media-text",
    html: `<div class="media-text"><div data-media="true"></div><div><p></p></div></div>`,
  },
  {
    id: "image-right-text-left",
    label: "Image + texte (droite)",
    description: "Texte à gauche, visuel à droite",
    previewVariant: "text-media",
    html: `<div class="text-media"><div><p></p></div><div data-media="true"></div></div>`,
  },
  {
    id: "hero",
    label: "Hero (Titre + média)",
    description: "Accroche + image ou vidéo",
    previewVariant: "hero",
    html: `<section class="hero"><h2></h2><p></p></section>`,
  },
];

function parseVideoUrl(input: string) {
  const trimmed = input.trim();
  const youtubeMatch =
    trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/i) ||
    trimmed.match(/youtube\.com\/embed\/([\w-]+)/i);
  if (youtubeMatch?.[1]) {
    return {
      embed: "iframe" as const,
      provider: "youtube" as const,
      src: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
    };
  }

  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeoMatch?.[1]) {
    return {
      embed: "iframe" as const,
      provider: "vimeo" as const,
      src: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
    };
  }

  return {
    embed: "video" as const,
    provider: "file" as const,
    src: trimmed,
  };
}

export function RichTextEditor({ content, onChange, placeholder, className }: RichTextEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [mediaPicker, setMediaPicker] = useState<{
    mode: "image" | "video";
    replacePlaceholder: boolean;
    getPos: (() => number) | null;
  } | null>(null);
  const [mediaTab, setMediaTab] = useState<"upload" | "link">("upload");
  const [mediaLinkDraft, setMediaLinkDraft] = useState("");
  const [pendingMediaTarget, setPendingMediaTarget] = useState<{
    type: "image" | "video";
    replacePlaceholder: boolean;
    getPos: (() => number) | null;
  } | null>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const onMediaPlaceholderRequestRef = useRef<(payload: MediaPlaceholderRequest) => void>(() => {});
  onMediaPlaceholderRequestRef.current = (payload) => {
    setMediaPicker({
      mode: payload.type,
      replacePlaceholder: true,
      getPos: payload.getPos,
    });
    setMediaTab("upload");
    setMediaLinkDraft("");
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        // Link + Underline + Gapcursor sont déjà fournis par StarterKit : ne pas les redéclarer (doublons).
        link: {
          openOnClick: false,
          HTMLAttributes: {
            class: "text-indigo-600 underline cursor-pointer hover:text-indigo-700",
          },
        },
        gapcursor: {},
      }),
      TextStyle,
      FontSize,
      Color,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Callout,
      ResizableImage,
      Youtube.configure({
        inline: false,
        HTMLAttributes: {
          class: "rounded-xl shadow-lg aspect-video w-full",
        },
      }),
      VideoBlock,
      MediaPlaceholder.configure({
        onRequestMedia: (payload) => onMediaPlaceholderRequestRef.current(payload),
      }),
    ] as any,
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn("rt-editor min-h-[320px] rounded-xl focus:outline-none", className),
        spellcheck: "true",
      },
    },
  });

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const normalize = (html: string) => html.trim().replace(/\s+/g, " ");
    if (normalize(current) !== normalize(content || "")) {
      editor.commands.setContent(content || "", { emitUpdate: false });
    }
  }, [content, editor]);

  useEffect(() => {
    console.info("[Templates] EDITOR_READY", { editorReady: Boolean(editor) });
  }, [editor]);

  const currentFontSize = editor?.getAttributes("textStyle").fontSize || "16";

  const setColor = (hex: string) => {
    editor?.chain().focus().setColor(hex).run();
    setShowColorPicker(false);
  };

  const setFontSize = (size: number) => {
    editor?.chain().focus().setFontSize(size.toString()).run();
  };

  const closeMediaPicker = () => {
    setMediaPicker(null);
    setMediaTab("upload");
    setMediaLinkDraft("");
  };

  useEffect(() => {
    if (!mediaPicker) {
      setPendingMediaTarget(null);
      return;
    }
    setPendingMediaTarget({
      type: mediaPicker.mode,
      replacePlaceholder: mediaPicker.replacePlaceholder,
      getPos: mediaPicker.getPos,
    });
  }, [mediaPicker]);

  const resolvePlaceholderPosition = (getPos: (() => number) | null) => {
    if (getPos) {
      try {
        return getPos();
      } catch {
        return null;
      }
    }
    return null;
  };

  const replacePlaceholderWithImage = (pos: number | null, src: string) => {
    if (!editor || pos === null) return false;
    const schema = editor.view.state.schema;
    const imageType = schema.nodes.resizableImage;
    if (!imageType) return false;
    return editor.commands.command(({ tr, state }) => {
      const node = state.doc.nodeAt(pos);
      if (!node || node.type.name !== "mediaPlaceholder") {
        return false;
      }
      tr.replaceWith(pos, pos + node.nodeSize, imageType.create({ src }));
      return true;
    });
  };

  const replacePlaceholderWithVideo = (
    pos: number | null,
    payload: { src: string; provider: "youtube" | "vimeo" | "file" },
  ) => {
    if (!editor || pos === null) return false;
    const schema = editor.view.state.schema;
    const youtubeType = (schema.nodes as any).youtube;
    const videoType = schema.nodes.videoBlock;
    if (payload.provider === "youtube" && youtubeType) {
      return editor.commands.command(({ tr, state }) => {
        const node = state.doc.nodeAt(pos);
        if (!node || node.type.name !== "mediaPlaceholder") {
          return false;
        }
        tr.replaceWith(pos, pos + node.nodeSize, youtubeType.create({ src: payload.src }));
        return true;
      });
    }
    if (!videoType) return false;
    return editor.commands.command(({ tr, state }) => {
      const node = state.doc.nodeAt(pos);
      if (!node || node.type.name !== "mediaPlaceholder") {
        return false;
      }
      tr.replaceWith(pos, pos + node.nodeSize, videoType.create({ src: payload.src, provider: payload.provider }));
      return true;
    });
  };

  const insertImage = (src: string) => {
    if (!editor) return;
    editor.chain().focus().setResizableImage({ src }).run();
  };

  const insertVideo = (src: string, embed: "iframe" | "video", provider: "youtube" | "vimeo" | "file") => {
    if (!editor) return;
    if (provider === "youtube") {
      editor.chain().focus().setYoutubeVideo({ src }).run();
      return;
    }
    editor
      .chain()
      .focus()
      .setVideoBlock({
        src,
        provider,
      })
      .run();
  };

  const applyImageInsertion = (src: string, target: typeof pendingMediaTarget) => {
    const replaced =
      target?.replacePlaceholder && replacePlaceholderWithImage(resolvePlaceholderPosition(target.getPos), src);
    if (!replaced) {
      insertImage(src);
    } else {
      const pos = resolvePlaceholderPosition(target?.getPos);
      if (pos !== null) {
        editor?.commands.focus(pos);
      }
    }
    setPendingMediaTarget(null);
    closeMediaPicker();
  };

  const applyVideoInsertion = (
    src: string,
    embed: "iframe" | "video",
    provider: "youtube" | "vimeo" | "file",
    target: typeof pendingMediaTarget,
  ) => {
    const replaced =
      target?.replacePlaceholder &&
      replacePlaceholderWithVideo(resolvePlaceholderPosition(target.getPos), { src, provider });

    if (!replaced) {
      insertVideo(src, embed, provider);
    } else {
      const pos = resolvePlaceholderPosition(target?.getPos);
      if (pos !== null) {
        editor?.commands.focus(pos);
      }
    }
    setPendingMediaTarget(null);
    closeMediaPicker();
  };

  /** HTML plat : pas de wrappers `div` non supportés par le schéma TipTap. */
  const SIMPLE_IMAGE_TEMPLATE =
    '<p>---</p><div data-media-placeholder data-type="image"></div><p>Saisissez votre texte ici...</p><p>---</p>';
  const SIMPLE_VIDEO_TEMPLATE =
    '<p>---</p><div data-media-placeholder data-type="video"></div><p>Saisissez votre texte ici...</p><p>---</p>';

  const templateMarkup: Record<string, string> = {
    "single-column": SIMPLE_IMAGE_TEMPLATE,
    "two-columns": SIMPLE_IMAGE_TEMPLATE,
    "two-columns-30-70": SIMPLE_IMAGE_TEMPLATE,
    "image-left-text-right": SIMPLE_IMAGE_TEMPLATE,
    "image-right-text-left": SIMPLE_IMAGE_TEMPLATE,
    hero: SIMPLE_VIDEO_TEMPLATE,
  };

  const insertTemplateLayout = useCallback(
    async (templateId: string, attempt = 1): Promise<boolean> => {
      console.info("[Templates] INSERT_START", { templateId, attempt, editorReady: Boolean(editor) });
      if (!editor) {
        if (attempt >= 3) {
          console.error("[Templates] INSERT_ERROR", { templateId, reason: "editor-unavailable" });
          toast.error("Éditeur non prêt, réessayez.");
          return false;
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
        return insertTemplateLayout(templateId, attempt + 1);
      }

      const html = templateMarkup[templateId];
      if (!html) {
        console.error("[Templates] INSERT_ERROR", { templateId, reason: "missing-template" });
        toast.error("Ce modèle n'est plus disponible.");
        return false;
      }

      try {
        const inserted = editor.chain().focus().insertContent(html).run();
        if (!inserted) {
          console.error("[Templates] INSERT_ERROR", { templateId, reason: "command-rejected" });
          toast.error("Impossible d'insérer le modèle.");
          return false;
        }

        console.info("[Templates] INSERT_DONE", {
          templateId,
          docSize: JSON.stringify(editor.getJSON()).length,
        });

        return true;
      } catch (error) {
        console.error("[Templates] INSERT_ERROR", { templateId });
        console.dir(error);
        toast.error("Impossible d'insérer le modèle.");
        return false;
      }
    },
    [editor],
  );

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Upload impossible");
      }
      const data = await response.json();
      applyImageInsertion(data.url, pendingMediaTarget);
      toast.success("Image ajoutée");
    } catch (error) {
      console.error("[editor] image upload error", error);
      toast.error("Impossible d'ajouter l'image");
    } finally {
      setIsImageUploading(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsVideoUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload-video", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Upload impossible");
      }
      const data = await response.json();
      applyVideoInsertion(data.url, "video", "file", pendingMediaTarget);
      toast.success("Vidéo ajoutée");
    } catch (error) {
      console.error("[editor] video upload error", error);
      toast.error("Impossible d'ajouter la vidéo");
    } finally {
      setIsVideoUploading(false);
      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }
    }
  };

  const handleLink = () => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href;
    const url = window.prompt("URL du lien", previous);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const insertLayout = (id: string) => {
    if (!editor) return;
    const html = templateMarkup[id];
    if (!html) return;
    try {
      editor.chain().focus().insertContent(html).run();
    } catch (error) {
      console.error("[Templates] INSERT_ERROR", { templateId: id, via: "insertLayout" });
      console.dir(error);
      toast.error("Impossible d'insérer le modèle.");
    }
  };

  if (!editor) {
    return null;
  }

  const openMediaPickerFromToolbar = (mode: "image" | "video") => {
    setMediaPicker({ mode, replacePlaceholder: false, getPos: null });
    setMediaTab("upload");
    setMediaLinkDraft("");
  };

  const submitMediaLink = () => {
    if (!mediaPicker) return;
    const url = mediaLinkDraft.trim();
    if (!url) {
      toast.error("Collez un lien valide");
      return;
    }
    const target = {
      type: mediaPicker.mode,
      replacePlaceholder: mediaPicker.replacePlaceholder,
      getPos: mediaPicker.getPos,
    };
    if (mediaPicker.mode === "image") {
      applyImageInsertion(url, target);
      toast.success("Image ajoutée");
    } else {
      const parsed = parseVideoUrl(url);
      applyVideoInsertion(parsed.src, parsed.embed, parsed.provider, target);
      toast.success("Vidéo ajoutée");
    }
  };

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-white shadow-sm">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleVideoUpload}
      />

      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50/70 p-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "h-8 w-8 p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            editor.isActive("bold") && "bg-slate-200 text-slate-900",
          )}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "h-8 w-8 p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            editor.isActive("italic") && "bg-slate-200 text-slate-900",
          )}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn(
            "h-8 w-8 p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            editor.isActive("underline") && "bg-slate-200 text-slate-900",
          )}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 bg-slate-200" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn(
            "h-8 px-2 text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            editor.isActive("heading", { level: 1 }) && "bg-slate-200 text-slate-900",
          )}
        >
          <Type className="mr-1 h-4 w-4" />
          H1
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            "h-8 px-2 text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            editor.isActive("heading", { level: 2 }) && "bg-slate-200 text-slate-900",
          )}
        >
          H2
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn(
            "h-8 px-2 text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            editor.isActive("heading", { level: 3 }) && "bg-slate-200 text-slate-900",
          )}
        >
          H3
        </Button>

        <Separator orientation="vertical" className="h-6 bg-slate-200" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={cn(
            "h-8 w-8 p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            editor.isActive({ textAlign: "left" }) && "bg-slate-200 text-slate-900",
          )}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={cn(
            "h-8 w-8 p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            editor.isActive({ textAlign: "center" }) && "bg-slate-200 text-slate-900",
          )}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={cn(
            "h-8 w-8 p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            editor.isActive({ textAlign: "right" }) && "bg-slate-200 text-slate-900",
          )}
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 bg-slate-200" />

        <div className="flex items-center gap-1 rounded border border-slate-200 bg-white px-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setFontSize(Math.max(8, parseInt(currentFontSize) - 2))}
            className="h-7 w-7 p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            title="Réduire la taille"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="min-w-[32px] text-center text-xs font-medium text-slate-600">{currentFontSize}px</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setFontSize(Math.min(72, parseInt(currentFontSize) + 2))}
            className="h-7 w-7 p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            title="Augmenter la taille"
          >
            <PlusIcon className="h-3 w-3" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 bg-slate-200" />

        <div className="relative" ref={colorPickerRef}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowColorPicker((prev) => !prev)}
            className={cn(
              "h-8 w-8 p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              showColorPicker && "bg-slate-200 text-slate-900",
            )}
          >
            <Palette className="h-4 w-4" />
          </Button>
          {showColorPicker && (
            <div className="absolute left-0 top-full z-50 mt-1 flex flex-col gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Couleurs</p>
              <div className="flex flex-wrap gap-1">
                {COLOR_SWATCHES.map((swatch) => (
                <button
                    key={swatch.value}
                  type="button"
                    onClick={() => setColor(swatch.value)}
                    className="flex h-7 w-16 items-center gap-2 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-slate-300"
                      style={{ backgroundColor: swatch.value }}
                    />
                    {swatch.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <Separator orientation="vertical" className="h-6 bg-slate-200" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-8 p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            isImageUploading && "cursor-wait opacity-60",
          )}
          disabled={isImageUploading}
          title="Image"
          onClick={() => openMediaPickerFromToolbar("image")}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-8 p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            isVideoUploading && "cursor-wait opacity-60",
          )}
          disabled={isVideoUploading}
          title="Vidéo"
          onClick={() => openMediaPickerFromToolbar("video")}
        >
          <Video className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          title="Modèles de mise en page"
          onClick={() => setTemplateModalOpen(true)}
        >
          <Layout className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 bg-slate-200" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleLink}
          className={cn(
            "h-8 w-8 p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            editor.isActive("link") && "bg-slate-200 text-slate-900",
          )}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative rounded-lg border border-slate-200 bg-white">
        {placeholder && !editor.getText() && (
          <div className="pointer-events-none absolute left-4 top-4 text-sm text-slate-400">{placeholder}</div>
        )}
        <EditorContent editor={editor} className="text-slate-900" />
      </div>

      <TemplatePickerModal
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        templates={LAYOUT_TEMPLATES}
        onSelect={(template) => insertTemplateLayout(template.id)}
      />

      <Dialog
        open={Boolean(mediaPicker)}
        onOpenChange={(open) => {
          if (!open) closeMediaPicker();
        }}
      >
        <DialogContent className="max-w-md rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl sm:max-w-md">
          <DialogHeader className="space-y-1 border-b border-slate-100 px-6 pb-4 pt-6 text-left">
            <DialogTitle className="text-lg font-semibold text-slate-900">
              {mediaPicker?.mode === "video" ? "Insérer une vidéo" : "Insérer une image"}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Téléversez un fichier ou collez un lien (YouTube, Vimeo, image ou fichier vidéo).
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6 pt-2">
            <Tabs value={mediaTab} onValueChange={(v) => setMediaTab(v as "upload" | "link")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-xl bg-slate-100 p-1">
                <TabsTrigger value="upload" className="rounded-lg text-sm font-medium">
                  Uploader
                </TabsTrigger>
                <TabsTrigger value="link" className="rounded-lg text-sm font-medium">
                  Lien externe
                </TabsTrigger>
              </TabsList>
              <TabsContent value="upload" className="mt-4 space-y-3">
                <p className="text-sm text-slate-600">
                  {mediaPicker?.mode === "video"
                    ? "Choisissez un fichier vidéo sur votre appareil."
                    : "Choisissez une image sur votre appareil."}
                </p>
                <Button
                  type="button"
                  className="w-full rounded-xl bg-slate-900 py-5 text-sm font-semibold text-white hover:bg-slate-800"
                  disabled={mediaPicker?.mode === "video" ? isVideoUploading : isImageUploading}
                  onClick={() => {
                    if (mediaPicker?.mode === "video") {
                      videoInputRef.current?.click();
                    } else {
                      imageInputRef.current?.click();
                    }
                  }}
                >
                  {mediaPicker?.mode === "video"
                    ? isVideoUploading
                      ? "Téléversement…"
                      : "Choisir un fichier vidéo"
                    : isImageUploading
                      ? "Téléversement…"
                      : "Choisir un fichier image"}
                </Button>
              </TabsContent>
              <TabsContent value="link" className="mt-4 space-y-3">
                <Input
                  value={mediaLinkDraft}
                  onChange={(e) => setMediaLinkDraft(e.target.value)}
                  placeholder={
                    mediaPicker?.mode === "video"
                      ? "https://youtube.com/… ou URL directe"
                      : "https://… (URL de l’image)"
                  }
                  className="rounded-xl border-slate-200 bg-slate-50"
                />
                <Button
                  type="button"
                  className="w-full rounded-xl bg-slate-900 py-5 text-sm font-semibold text-white hover:bg-slate-800"
                  onClick={submitMediaLink}
                >
                  Insérer depuis le lien
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
