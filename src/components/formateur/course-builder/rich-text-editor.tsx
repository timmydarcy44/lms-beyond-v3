"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
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
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { FontSize } from "./extensions/font-size";
import { ResizableImage } from "./extensions/resizable-image";
import { VideoBlock } from "./extensions/video-block";
import { MediaPlaceholder } from "./extensions/media-placeholder";
import { TemplatePickerModal, type TemplateDefinition } from "./template-picker-modal";

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
  const [mediaMenu, setMediaMenu] = useState<{
    rect: DOMRect | null;
    getPos: (() => number) | null;
  } | null>(null);
  const [pendingMediaTarget, setPendingMediaTarget] = useState<{
    type: "image" | "video";
    replacePlaceholder: boolean;
    getPos: (() => number) | null;
  } | null>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleMediaPlaceholderRequest = useCallback(
    (payload: any) => {
      setMediaMenu({
        rect: payload?.rect ?? null,
        getPos: payload?.getPos ?? null,
      });
    },
    [],
  );
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TextStyle,
      FontSize,
      Color,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      ResizableImage,
      VideoBlock,
      MediaPlaceholder.configure({
        onRequestMedia: handleMediaPlaceholderRequest,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-indigo-600 underline cursor-pointer hover:text-indigo-700",
        },
      }),
      Underline,
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

  const closeMediaMenu = () => setMediaMenu(null);

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
    const videoType = schema.nodes.videoBlock;
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
    closeMediaMenu();
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
    closeMediaMenu();
  };

  const templateMarkup: Record<string, string> = {
    "single-column": `
      <section class="rt-layout rt-layout-single" data-template="single-column">
        <div class="rt-block rt-text-block">
          <p data-placeholder="Écrivez ici…"><br/></p>
        </div>
        <div class="rt-block rt-media-block">
          <media-placeholder data-role="media" data-template="single-column"></media-placeholder>
        </div>
      </section>
    `,
    "two-columns": `
      <section class="rt-layout columns-2" data-template="two-columns">
        <div class="rt-block rt-text-block">
          <p data-placeholder="Écrivez ici…"><br/></p>
        </div>
        <div class="rt-block rt-media-block">
          <media-placeholder data-role="media" data-template="two-columns"></media-placeholder>
        </div>
      </section>
    `,
    "two-columns-30-70": `
      <section class="rt-layout columns-30-70" data-template="two-columns-30-70">
        <div class="rt-block rt-text-block">
          <p data-placeholder="Écrivez ici…"><br/></p>
        </div>
        <div class="rt-block rt-media-block">
          <media-placeholder data-role="media" data-template="two-columns-30-70"></media-placeholder>
        </div>
      </section>
    `,
    "image-left-text-right": `
      <section class="rt-layout columns-2" data-template="image-left-text-right">
        <div class="rt-block rt-media-block">
          <media-placeholder data-role="media" data-template="image-left-text-right"></media-placeholder>
        </div>
        <div class="rt-block rt-text-block">
          <p data-placeholder="Écrivez ici…"><br/></p>
        </div>
      </section>
    `,
    "image-right-text-left": `
      <section class="rt-layout columns-2" data-template="image-right-text-left">
        <div class="rt-block rt-text-block">
          <p data-placeholder="Écrivez ici…"><br/></p>
        </div>
        <div class="rt-block rt-media-block">
          <media-placeholder data-role="media" data-template="image-right-text-left"></media-placeholder>
        </div>
      </section>
    `,
    hero: `
      <section class="rt-layout rt-layout-hero" data-template="hero">
        <div class="rt-block rt-text-block">
          <h2 data-placeholder="Titre principal…"><br/></h2>
          <p data-placeholder="Développez votre message…"><br/></p>
        </div>
        <div class="rt-block rt-media-block">
          <media-placeholder data-role="media" data-template="hero"></media-placeholder>
        </div>
      </section>
    `,
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
        const selectionStart = editor.state.selection.from;
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

        await new Promise((resolve) => requestAnimationFrame(resolve));

        const { doc } = editor.state;
        const docSize = doc.content.size;
        let targetPos = Math.min(selectionStart + 1, docSize);

        doc.nodesBetween(selectionStart, docSize, (node, pos) => {
          if (node.isTextblock) {
            targetPos = Math.min(pos + 1, docSize);
            return false;
          }
          return true;
        });

        editor.commands.setTextSelection(targetPos);
        editor.commands.focus();

        return true;
      } catch (error) {
        console.error("[Templates] INSERT_ERROR", { templateId, error });
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

  const handleImageUrl = (target?: typeof pendingMediaTarget) => {
    const url = window.prompt("URL de l'image");
    if (!url) return;
    applyImageInsertion(url, target ?? null);
  };

  const handleVideoUrl = (target?: typeof pendingMediaTarget) => {
    const url = window.prompt("URL de la vidéo (YouTube, Vimeo, MP4, ...)");
    if (!url) return;
    const parsed = parseVideoUrl(url);
    applyVideoInsertion(parsed.src, parsed.embed, parsed.provider, target ?? null);
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
    const template = LAYOUT_TEMPLATES.find((tpl) => tpl.id === id);
    if (!template) return;
    editor.chain().focus().insertContent(template.html).run();
  };

  if (!editor) {
    return null;
  }

  const mediaMenuPortal =
    mediaMenu && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[90]"
            onClick={() => {
              closeMediaMenu();
            }}
          >
            <div
              className="absolute w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
              style={{
                top: (mediaMenu.rect?.bottom ?? mediaMenu.rect?.top ?? 0) + window.scrollY + 12,
                left: (mediaMenu.rect?.left ?? 0) + window.scrollX,
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Ajouter un média</p>
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600"
                  onClick={() => {
                    setPendingMediaTarget({
                      type: "image",
                      replacePlaceholder: true,
                      getPos: mediaMenu.getPos,
                    });
                    closeMediaMenu();
                    imageInputRef.current?.click();
                  }}
                >
                  <span>Téléverser une image</span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600"
                  onClick={() =>
                    handleImageUrl({
                      type: "image",
                      replacePlaceholder: true,
                      getPos: mediaMenu.getPos,
                    })
                  }
                >
                  <span>Insérer une image via URL</span>
                </button>
                <div className="h-px w-full bg-slate-200" />
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600"
                  onClick={() => {
                    setPendingMediaTarget({
                      type: "video",
                      replacePlaceholder: true,
                      getPos: mediaMenu.getPos,
                    });
                    closeMediaMenu();
                    videoInputRef.current?.click();
                  }}
                >
                  <span>Téléverser une vidéo</span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600"
                  onClick={() =>
                    handleVideoUrl({
                      type: "video",
                      replacePlaceholder: true,
                      getPos: mediaMenu.getPos,
                    })
                  }
                >
                  <span>Insérer une vidéo via URL</span>
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

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

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 w-8 p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              isImageUploading && "cursor-wait opacity-60",
            )}
            disabled={isImageUploading}
            title="Sélectionner une image"
            onClick={() => {
              setPendingMediaTarget(null);
              imageInputRef.current?.click();
            }}
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <button
            type="button"
            onClick={() => handleImageUrl(null)}
            className="rounded px-2 text-xs font-medium text-indigo-600 transition hover:text-indigo-700"
          >
            URL
          </button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 w-8 p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              isVideoUploading && "cursor-wait opacity-60",
            )}
            disabled={isVideoUploading}
            title="Sélectionner une vidéo"
            onClick={() => {
              setPendingMediaTarget(null);
              videoInputRef.current?.click();
            }}
          >
            <Video className="h-4 w-4" />
          </Button>
          <button
            type="button"
            onClick={() => handleVideoUrl(null)}
            className="rounded px-2 text-xs font-medium text-indigo-600 transition hover:text-indigo-700"
          >
            URL
          </button>
        </div>

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

      {mediaMenuPortal}
    </div>
  );
}
