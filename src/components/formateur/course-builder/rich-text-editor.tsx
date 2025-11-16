"use client";

import { useState, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  Link as LinkIcon,
  Palette,
  Type,
  Minus,
  Plus as PlusIcon,
  Layout,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FontSize } from "./extensions/font-size";
import { TemplateImageModal } from "./template-image-modal";

type RichTextEditorProps = {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
};

export function RichTextEditor({ content, onChange, placeholder, className }: RichTextEditorProps) {
  // Tous les Hooks doivent être appelés avant tout return conditionnel
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
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
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-400 underline cursor-pointer",
        },
      }),
      Underline,
    ],
    content,
    immediatelyRender: false, // Évite les problèmes d'hydratation SSR
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-invert max-w-none focus:outline-none min-h-[260px] p-4",
          "prose-headings:text-white prose-p:text-white/90 prose-strong:text-white",
          "prose-a:text-blue-400 prose-img:rounded-lg prose-img:max-w-full",
          className
        ),
      },
    },
  });

  const addImage = () => {
    if (!editor) return;
    const url = window.prompt("URL de l'image:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL du lien:", previousUrl);

    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const setColor = (color: string) => {
    if (!editor) return;
    editor.chain().focus().setColor(color).run();
    setShowColorPicker(false);
  };

  const setFontSize = (size: number) => {
    if (!editor) return;
    editor.chain().focus().setFontSize(size.toString()).run();
  };

  const decreaseFontSize = () => {
    if (!editor) return;
    const currentSize = editor.getAttributes('textStyle').fontSize;
    const newSize = currentSize ? Math.max(8, parseInt(currentSize) - 2) : 14;
    setFontSize(newSize);
  };

  const increaseFontSize = () => {
    if (!editor) return;
    const currentSize = editor.getAttributes('textStyle').fontSize;
    const newSize = currentSize ? Math.min(72, parseInt(currentSize) + 2) : 16;
    setFontSize(newSize);
  };

  const insertTemplate = (finalTemplate: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(finalTemplate).run();
    setShowTemplates(false);
    setSelectedTemplate(null);
  };

  const openTemplateDialog = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  // Fermer les dropdowns en cliquant à l'extérieur
  // Tous les hooks doivent être appelés avant tout return conditionnel
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const templatesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
      if (templatesRef.current && !templatesRef.current.contains(event.target as Node)) {
        setShowTemplates(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!editor) {
    return null;
  }

  const currentFontSize = editor.getAttributes('textStyle').fontSize || '16';

  return (
    <div className="space-y-2 rounded-lg border border-white/10 bg-black/40">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-white/10 p-2">
        {/* Formatage de base */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10",
            editor.isActive("bold") && "bg-white/20 text-white"
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
            "h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10",
            editor.isActive("italic") && "bg-white/20 text-white"
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
            "h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10",
            editor.isActive("underline") && "bg-white/20 text-white"
          )}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 bg-white/20" />

        {/* Titres */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn(
            "h-8 px-2 text-xs text-white/70 hover:text-white hover:bg-white/10",
            editor.isActive("heading", { level: 1 }) && "bg-white/20 text-white"
          )}
        >
          <Type className="h-4 w-4 mr-1" />
          H1
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            "h-8 px-2 text-xs text-white/70 hover:text-white hover:bg-white/10",
            editor.isActive("heading", { level: 2 }) && "bg-white/20 text-white"
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
            "h-8 px-2 text-xs text-white/70 hover:text-white hover:bg-white/10",
            editor.isActive("heading", { level: 3 }) && "bg-white/20 text-white"
          )}
        >
          H3
        </Button>

        <Separator orientation="vertical" className="h-6 bg-white/20" />

        {/* Alignement */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={cn(
            "h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10",
            editor.isActive({ textAlign: "left" }) && "bg-white/20 text-white"
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
            "h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10",
            editor.isActive({ textAlign: "center" }) && "bg-white/20 text-white"
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
            "h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10",
            editor.isActive({ textAlign: "right" }) && "bg-white/20 text-white"
          )}
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 bg-white/20" />

        {/* Taille de police */}
        <div className="flex items-center gap-1 rounded border border-white/20 bg-white/5 px-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={decreaseFontSize}
            className="h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-white/10"
            title="Réduire la taille"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="text-xs text-white/70 min-w-[28px] text-center">{currentFontSize}px</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={increaseFontSize}
            className="h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-white/10"
            title="Augmenter la taille"
          >
            <PlusIcon className="h-3 w-3" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 bg-white/20" />

        {/* Couleurs */}
        <div className="relative" ref={colorPickerRef}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className={cn(
              "h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10",
              showColorPicker && "bg-white/20 text-white"
            )}
          >
            <Palette className="h-4 w-4" />
          </Button>
          {showColorPicker && (
            <div className="absolute left-0 top-full z-50 mt-1 flex flex-wrap gap-1 rounded-lg border border-white/20 bg-black/95 p-2 shadow-lg">
              {[
                { name: "Blanc", value: "#FFFFFF" },
                { name: "Rouge", value: "#EF4444" },
                { name: "Orange", value: "#F97316" },
                { name: "Jaune", value: "#EAB308" },
                { name: "Vert", value: "#22C55E" },
                { name: "Bleu", value: "#3B82F6" },
                { name: "Violet", value: "#A855F7" },
                { name: "Rose", value: "#EC4899" },
              ].map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setColor(color.value)}
                  className="h-6 w-6 rounded border border-white/20 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          )}
        </div>

        <Separator orientation="vertical" className="h-6 bg-white/20" />

        {/* Templates de mise en page */}
        <div className="relative" ref={templatesRef}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowTemplates(!showTemplates)}
            className={cn(
              "h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10",
              showTemplates && "bg-white/20 text-white"
            )}
            title="Templates de mise en page"
          >
            <Layout className="h-4 w-4" />
          </Button>
          {showTemplates && (
            <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-white/20 bg-black/95 p-3 shadow-lg">
              <p className="mb-2 text-xs font-semibold text-white/80">Templates de mise en page</p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => openTemplateDialog("text-left-image-right")}
                  className="w-full rounded border border-white/20 bg-white/5 p-2 text-left text-xs text-white/70 hover:bg-white/10 hover:text-white transition"
                >
                  <strong className="block text-white">Texte à gauche, Image à droite</strong>
                  <span className="text-white/60">Paragraphe avec image alignée</span>
                </button>
                <button
                  type="button"
                  onClick={() => openTemplateDialog("image-left-text-right")}
                  className="w-full rounded border border-white/20 bg-white/5 p-2 text-left text-xs text-white/70 hover:bg-white/10 hover:text-white transition"
                >
                  <strong className="block text-white">Image à gauche, Texte à droite</strong>
                  <span className="text-white/60">Paragraphe avec image alignée</span>
                </button>
                <button
                  type="button"
                  onClick={() => openTemplateDialog("image-centered")}
                  className="w-full rounded border border-white/20 bg-white/5 p-2 text-left text-xs text-white/70 hover:bg-white/10 hover:text-white transition"
                >
                  <strong className="block text-white">Image centrée avec texte</strong>
                  <span className="text-white/60">Image large au-dessus du texte</span>
                </button>
                <button
                  type="button"
                  onClick={() => openTemplateDialog("two-columns")}
                  className="w-full rounded border border-white/20 bg-white/5 p-2 text-left text-xs text-white/70 hover:bg-white/10 hover:text-white transition"
                >
                  <strong className="block text-white">Deux colonnes avec images</strong>
                  <span className="text-white/60">Grille 2 colonnes</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <Separator orientation="vertical" className="h-6 bg-white/20" />

        {/* Images et liens */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addImage}
          className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addLink}
          className={cn(
            "h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10",
            editor.isActive("link") && "bg-white/20 text-white"
          )}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Éditeur */}
      <div className="relative">
        {placeholder && !editor.getText() && (
          <div className="absolute left-4 top-4 pointer-events-none text-sm text-white/30">
            {placeholder}
          </div>
        )}
        <EditorContent editor={editor} className="text-white/90" />
      </div>

      {/* Modal pour upload d'images dans les templates */}
      {selectedTemplate && (() => {
        const templates: { [key: string]: { html: string; imageKeys: string[] } } = {
          "text-left-image-right": {
            html: `
              <div style="display: flex; gap: 1rem; align-items: flex-start; margin: 1rem 0;">
                <div style="flex: 1;">
                  <p>Votre contenu texte ici...</p>
                </div>
                <div style="flex: 1;">
                  <img src="{{image1}}" alt="Image" style="width: 100%; border-radius: 0.5rem;" />
                </div>
              </div>
            `,
            imageKeys: ["image1"],
          },
          "image-left-text-right": {
            html: `
              <div style="display: flex; gap: 1rem; align-items: flex-start; margin: 1rem 0;">
                <div style="flex: 1;">
                  <img src="{{image1}}" alt="Image" style="width: 100%; border-radius: 0.5rem;" />
                </div>
                <div style="flex: 1;">
                  <p>Votre contenu texte ici...</p>
                </div>
              </div>
            `,
            imageKeys: ["image1"],
          },
          "image-centered": {
            html: `
              <div style="text-align: center; margin: 1rem 0;">
                <img src="{{image1}}" alt="Image" style="width: 100%; max-width: 800px; margin: 0 auto; border-radius: 0.5rem; display: block;" />
                <p style="margin-top: 1rem;">Votre contenu texte ici...</p>
              </div>
            `,
            imageKeys: ["image1"],
          },
          "two-columns": {
            html: `
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1rem 0;">
                <div>
                  <img src="{{image1}}" alt="Image 1" style="width: 100%; border-radius: 0.5rem;" />
                  <p style="margin-top: 0.5rem; font-size: 0.875rem;">Description image 1</p>
                </div>
                <div>
                  <img src="{{image2}}" alt="Image 2" style="width: 100%; border-radius: 0.5rem;" />
                  <p style="margin-top: 0.5rem; font-size: 0.875rem;">Description image 2</p>
                </div>
              </div>
            `,
            imageKeys: ["image1", "image2"],
          },
        };

        const templateData = templates[selectedTemplate];
        if (!templateData) return null;

        return (
          <TemplateImageModal
            templateId={selectedTemplate}
            templateHtml={templateData.html}
            imageKeys={templateData.imageKeys}
            onInsert={insertTemplate}
            onClose={() => {
              setSelectedTemplate(null);
            }}
          />
        );
      })()}
    </div>
  );
}

