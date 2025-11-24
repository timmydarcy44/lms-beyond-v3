"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Save,
  Send,
  Sparkles,
  Upload,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FontSize } from "@/components/formateur/course-builder/extensions/font-size";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SEOIndicator } from "@/components/blog/seo-indicator";
import { calculateSEOScore, getSEORecommendations } from "@/lib/seo/calculate-seo-score";
import { useMemo } from "react";

const bgColor = "#F8F5F0";
const textColor = "#2F2A25";
const primaryColor = "#C6A664";
const secondaryColor = "#E6D9C6";

export function BlogEditor() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverImageAlt, setCoverImageAlt] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSEORecommendations, setShowSEORecommendations] = useState(false);

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
          class: "text-blue-600 underline cursor-pointer",
        },
      }),
      Underline,
    ],
    content: "",
    immediatelyRender: false, // Évite les problèmes d'hydratation SSR
    editorProps: {
      attributes: {
        class: cn(
          "prose max-w-none focus:outline-none min-h-[400px] p-6",
          "prose-headings:text-[#2F2A25] prose-p:text-[#2F2A25] prose-strong:text-[#2F2A25]",
          "prose-a:text-blue-600 prose-img:rounded-lg prose-img:max-w-full",
        ),
      },
    },
  });

  // Calcul du score SEO (après la déclaration de editor)
  const seoScore = useMemo(() => {
    if (!editor) return 0;
    return calculateSEOScore({
      title,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || excerpt,
      excerpt,
      content: editor.getHTML(),
      coverImageUrl,
      coverImageAlt,
    });
  }, [title, metaTitle, metaDescription, excerpt, coverImageUrl, coverImageAlt, editor]);

  const seoRecommendations = useMemo(() => {
    if (!editor) return [];
    return getSEORecommendations({
      title,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || excerpt,
      excerpt,
      content: editor.getHTML(),
      coverImageUrl,
      coverImageAlt,
    });
  }, [title, metaTitle, metaDescription, excerpt, coverImageUrl, coverImageAlt, editor]);

  const handleSave = async (publish: boolean = false) => {
    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    if (!editor) {
      toast.error("L'éditeur n'est pas prêt");
      return;
    }

    const content = editor.getHTML();
    if (!content.trim() || content === "<p></p>") {
      toast.error("Le contenu est requis");
      return;
    }

    if (publish) {
      setIsPublishing(true);
    } else {
      setIsSaving(true);
    }

    try {
      const response = await fetch("/api/blog/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          metaTitle: metaTitle || title,
          metaDescription: metaDescription || excerpt,
          excerpt,
          content,
          coverImageUrl: coverImageUrl || null,
          coverImageAlt: coverImageAlt || null,
          isPublished: publish,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la sauvegarde");
      }

      toast.success(publish ? "Article publié avec succès !" : "Article sauvegardé en brouillon");
      router.push(`/super/blog/${data.id}/edit`);
    } catch (error: any) {
      console.error("[BlogEditor] Error saving:", error);
      toast.error(error.message || "Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
      setIsPublishing(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Veuillez entrer un prompt");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/generate-blog-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la génération");
      }

      // Insérer le contenu généré dans l'éditeur
      if (editor && data.content) {
        editor.commands.setContent(data.content);
        if (data.title && !title) {
          setTitle(data.title);
        }
        if (data.excerpt && !excerpt) {
          setExcerpt(data.excerpt);
        }
        toast.success("Contenu généré avec succès !");
        setShowAIModal(false);
        setAiPrompt("");
      }
    } catch (error: any) {
      console.error("[BlogEditor] Error generating:", error);
      toast.error(error.message || "Erreur lors de la génération");
    } finally {
      setIsGenerating(false);
    }
  };

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

  if (!editor) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: bgColor }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  const currentFontSize = editor.getAttributes('textStyle').fontSize || '16';

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 
              className="text-4xl font-bold mb-2"
              style={{ color: textColor }}
            >
              Créer un article de blog
            </h1>
            <p 
              className="text-lg"
              style={{ color: textColor, opacity: 0.7 }}
            >
              Rédigez et publiez votre article
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <SEOIndicator score={seoScore} />
            {seoRecommendations.length > 0 && (
              <button
                type="button"
                onClick={() => setShowSEORecommendations(!showSEORecommendations)}
                className="text-xs underline"
                style={{ color: primaryColor }}
              >
                {showSEORecommendations ? "Masquer" : "Voir"} les recommandations
              </button>
            )}
          </div>
        </div>

        {/* Recommandations SEO */}
        {showSEORecommendations && seoRecommendations.length > 0 && (
          <div className="mb-6 rounded-lg border-2 p-4" style={{ borderColor: secondaryColor, backgroundColor: "#FFFFFF" }}>
            <h3 className="font-semibold mb-2" style={{ color: textColor }}>
              Recommandations SEO
            </h3>
            <ul className="space-y-1">
              {seoRecommendations.map((rec, index) => (
                <li key={index} className="text-sm flex items-start gap-2" style={{ color: textColor, opacity: 0.8 }}>
                  <span style={{ color: primaryColor }}>•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Form */}
        <div className="space-y-6">
          {/* Titre */}
          <div>
            <Label htmlFor="title" style={{ color: textColor }}>
              Titre *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de l'article"
              className="mt-2"
              style={{ backgroundColor: "#FFFFFF", color: textColor }}
            />
            <p className="text-xs mt-1" style={{ color: textColor, opacity: 0.6 }}>
              {title.length} caractères (recommandé: 30-70)
            </p>
          </div>

          {/* Meta Title */}
          <div>
            <Label htmlFor="metaTitle" style={{ color: textColor }}>
              Meta Title (SEO) *
            </Label>
            <Input
              id="metaTitle"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder={title || "Titre pour les moteurs de recherche"}
              className="mt-2"
              style={{ 
                backgroundColor: "#FFFFFF", 
                color: textColor,
                borderColor: (metaTitle || title).length >= 50 && (metaTitle || title).length <= 60 
                  ? "#22C55E" 
                  : (metaTitle || title).length > 0 && ((metaTitle || title).length < 50 || (metaTitle || title).length > 60)
                  ? "#F97316"
                  : undefined
              }}
            />
            <p className="text-xs mt-1" style={{ 
              color: (metaTitle || title).length >= 50 && (metaTitle || title).length <= 60 
                ? "#22C55E" 
                : (metaTitle || title).length > 0
                ? "#F97316"
                : textColor,
              opacity: 0.8
            }}>
              {(metaTitle || title).length} caractères (idéal: 50-60)
            </p>
          </div>

          {/* Meta Description */}
          <div>
            <Label htmlFor="metaDescription" style={{ color: textColor }}>
              Meta Description (SEO) *
            </Label>
            <Textarea
              id="metaDescription"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder={excerpt || "Description pour les moteurs de recherche"}
              rows={3}
              className="mt-2"
              style={{ 
                backgroundColor: "#FFFFFF", 
                color: textColor,
                borderColor: (metaDescription || excerpt).length >= 150 && (metaDescription || excerpt).length <= 160 
                  ? "#22C55E" 
                  : (metaDescription || excerpt).length > 0 && ((metaDescription || excerpt).length < 150 || (metaDescription || excerpt).length > 160)
                  ? "#F97316"
                  : undefined
              }}
            />
            <p className="text-xs mt-1" style={{ 
              color: (metaDescription || excerpt).length >= 150 && (metaDescription || excerpt).length <= 160 
                ? "#22C55E" 
                : (metaDescription || excerpt).length > 0
                ? "#F97316"
                : textColor,
              opacity: 0.8
            }}>
              {(metaDescription || excerpt).length} caractères (idéal: 150-160)
            </p>
          </div>

          {/* Extrait */}
          <div>
            <Label htmlFor="excerpt" style={{ color: textColor }}>
              Extrait
            </Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Court résumé de l'article"
              rows={3}
              className="mt-2"
              style={{ backgroundColor: "#FFFFFF", color: textColor }}
            />
          </div>

          {/* Image de couverture */}
          <div>
            <Label htmlFor="coverImage" style={{ color: textColor }}>
              Image de couverture (URL) *
            </Label>
            <Input
              id="coverImage"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="mt-2"
              style={{ backgroundColor: "#FFFFFF", color: textColor }}
            />
            {coverImageUrl && (
              <img
                src={coverImageUrl}
                alt={coverImageAlt || "Image de couverture"}
                className="mt-4 rounded-lg max-w-md"
                onError={() => {
                  toast.error("Impossible de charger l'image");
                  setCoverImageUrl("");
                }}
              />
            )}
          </div>

          {/* Balise Alt de l'image */}
          <div>
            <Label htmlFor="coverImageAlt" style={{ color: textColor }}>
              Balise Alt de l'image (SEO) *
            </Label>
            <Input
              id="coverImageAlt"
              value={coverImageAlt}
              onChange={(e) => setCoverImageAlt(e.target.value)}
              placeholder="Description de l'image pour l'accessibilité et le SEO"
              className="mt-2"
              style={{ 
                backgroundColor: "#FFFFFF", 
                color: textColor,
                borderColor: coverImageAlt.length >= 10 && coverImageAlt.length <= 125 
                  ? "#22C55E" 
                  : coverImageAlt.length > 0
                  ? "#F97316"
                  : undefined
              }}
            />
            <p className="text-xs mt-1" style={{ 
              color: coverImageAlt.length >= 10 && coverImageAlt.length <= 125 
                ? "#22C55E" 
                : coverImageAlt.length > 0
                ? "#F97316"
                : textColor,
              opacity: 0.8
            }}>
              {coverImageAlt.length} caractères (idéal: 10-125)
            </p>
          </div>

          {/* Éditeur */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label style={{ color: textColor }}>Contenu *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAIModal(true)}
                className="gap-2"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                <Sparkles className="h-4 w-4" />
                Créer avec l'IA
              </Button>
            </div>
            <div className="rounded-lg border-2" style={{ borderColor: secondaryColor, backgroundColor: "#FFFFFF" }}>
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-1 border-b p-2" style={{ borderColor: secondaryColor }}>
                {/* Formatage de base */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={cn(
                    "h-8 w-8 p-0",
                    editor.isActive("bold") && "bg-opacity-20"
                  )}
                  style={{
                    color: editor.isActive("bold") ? primaryColor : textColor,
                    backgroundColor: editor.isActive("bold") ? `${primaryColor}20` : "transparent",
                  }}
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={cn(
                    "h-8 w-8 p-0",
                    editor.isActive("italic") && "bg-opacity-20"
                  )}
                  style={{
                    color: editor.isActive("italic") ? primaryColor : textColor,
                    backgroundColor: editor.isActive("italic") ? `${primaryColor}20` : "transparent",
                  }}
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  className={cn(
                    "h-8 w-8 p-0",
                    editor.isActive("underline") && "bg-opacity-20"
                  )}
                  style={{
                    color: editor.isActive("underline") ? primaryColor : textColor,
                    backgroundColor: editor.isActive("underline") ? `${primaryColor}20` : "transparent",
                  }}
                >
                  <UnderlineIcon className="h-4 w-4" />
                </Button>

                <div className="h-6 w-px mx-1" style={{ backgroundColor: secondaryColor }} />

                {/* Titres */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  className={cn(
                    "h-8 px-2 text-xs",
                    editor.isActive("heading", { level: 1 }) && "bg-opacity-20"
                  )}
                  style={{
                    color: editor.isActive("heading", { level: 1 }) ? primaryColor : textColor,
                    backgroundColor: editor.isActive("heading", { level: 1 }) ? `${primaryColor}20` : "transparent",
                  }}
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
                    "h-8 px-2 text-xs",
                    editor.isActive("heading", { level: 2 }) && "bg-opacity-20"
                  )}
                  style={{
                    color: editor.isActive("heading", { level: 2 }) ? primaryColor : textColor,
                    backgroundColor: editor.isActive("heading", { level: 2 }) ? `${primaryColor}20` : "transparent",
                  }}
                >
                  H2
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                  className={cn(
                    "h-8 px-2 text-xs",
                    editor.isActive("heading", { level: 3 }) && "bg-opacity-20"
                  )}
                  style={{
                    color: editor.isActive("heading", { level: 3 }) ? primaryColor : textColor,
                    backgroundColor: editor.isActive("heading", { level: 3 }) ? `${primaryColor}20` : "transparent",
                  }}
                >
                  H3
                </Button>

                <div className="h-6 w-px mx-1" style={{ backgroundColor: secondaryColor }} />

                {/* Alignement */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().setTextAlign("left").run()}
                  className={cn(
                    "h-8 w-8 p-0",
                    editor.isActive({ textAlign: "left" }) && "bg-opacity-20"
                  )}
                  style={{
                    color: editor.isActive({ textAlign: "left" }) ? primaryColor : textColor,
                    backgroundColor: editor.isActive({ textAlign: "left" }) ? `${primaryColor}20` : "transparent",
                  }}
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().setTextAlign("center").run()}
                  className={cn(
                    "h-8 w-8 p-0",
                    editor.isActive({ textAlign: "center" }) && "bg-opacity-20"
                  )}
                  style={{
                    color: editor.isActive({ textAlign: "center" }) ? primaryColor : textColor,
                    backgroundColor: editor.isActive({ textAlign: "center" }) ? `${primaryColor}20` : "transparent",
                  }}
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().setTextAlign("right").run()}
                  className={cn(
                    "h-8 w-8 p-0",
                    editor.isActive({ textAlign: "right" }) && "bg-opacity-20"
                  )}
                  style={{
                    color: editor.isActive({ textAlign: "right" }) ? primaryColor : textColor,
                    backgroundColor: editor.isActive({ textAlign: "right" }) ? `${primaryColor}20` : "transparent",
                  }}
                >
                  <AlignRight className="h-4 w-4" />
                </Button>

                <div className="h-6 w-px mx-1" style={{ backgroundColor: secondaryColor }} />

                {/* Taille de police */}
                <div className="flex items-center gap-1 rounded border px-1" style={{ borderColor: secondaryColor }}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={decreaseFontSize}
                    className="h-7 w-7 p-0"
                    style={{ color: textColor }}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-xs min-w-[28px] text-center" style={{ color: textColor }}>{currentFontSize}px</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={increaseFontSize}
                    className="h-7 w-7 p-0"
                    style={{ color: textColor }}
                  >
                    <PlusIcon className="h-3 w-3" />
                  </Button>
                </div>

                <div className="h-6 w-px mx-1" style={{ backgroundColor: secondaryColor }} />

                {/* Couleurs */}
                <div className="relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className={cn(
                      "h-8 w-8 p-0",
                      showColorPicker && "bg-opacity-20"
                    )}
                    style={{
                      color: showColorPicker ? primaryColor : textColor,
                      backgroundColor: showColorPicker ? `${primaryColor}20` : "transparent",
                    }}
                  >
                    <Palette className="h-4 w-4" />
                  </Button>
                  {showColorPicker && (
                    <div className="absolute left-0 top-full z-50 mt-1 flex flex-wrap gap-1 rounded-lg border-2 p-2 shadow-lg" style={{ borderColor: secondaryColor, backgroundColor: "#FFFFFF" }}>
                      {[
                        { name: "Noir", value: "#2F2A25" },
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
                          className="h-6 w-6 rounded border-2 hover:scale-110 transition-transform"
                          style={{ backgroundColor: color.value, borderColor: secondaryColor }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="h-6 w-px mx-1" style={{ backgroundColor: secondaryColor }} />

                {/* Images et liens */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addImage}
                  className="h-8 w-8 p-0"
                  style={{ color: textColor }}
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addLink}
                  className={cn(
                    "h-8 w-8 p-0",
                    editor.isActive("link") && "bg-opacity-20"
                  )}
                  style={{
                    color: editor.isActive("link") ? primaryColor : textColor,
                    backgroundColor: editor.isActive("link") ? `${primaryColor}20` : "transparent",
                  }}
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </div>

              {/* Éditeur */}
              <div className="p-4">
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={isSaving || isPublishing}
              className="gap-2"
              style={{ borderColor: primaryColor, color: primaryColor }}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Sauvegarder en brouillon
                </>
              )}
            </Button>
            <Button
              type="button"
              onClick={() => handleSave(true)}
              disabled={isSaving || isPublishing}
              className="gap-2 text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publication...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Publier
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal IA */}
      <Dialog open={showAIModal} onOpenChange={setShowAIModal}>
        <DialogContent style={{ backgroundColor: "#FFFFFF", borderColor: secondaryColor }}>
          <DialogHeader>
            <DialogTitle style={{ color: textColor }}>Créer avec l'IA</DialogTitle>
            <DialogDescription style={{ color: textColor, opacity: 0.7 }}>
              Décrivez le sujet de votre article et l'IA générera le contenu pour vous.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ai-prompt" style={{ color: textColor }}>
                Prompt
              </Label>
              <Textarea
                id="ai-prompt"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ex: Écris un article sur la gestion de la colère chez les enfants, avec des conseils pratiques pour les parents..."
                rows={6}
                className="mt-2"
                style={{ backgroundColor: bgColor, color: textColor }}
              />
            </div>
            <div className="flex items-center justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAIModal(false);
                  setAiPrompt("");
                }}
                style={{ borderColor: secondaryColor, color: textColor }}
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={handleAIGenerate}
                disabled={isGenerating || !aiPrompt.trim()}
                className="gap-2 text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Générer
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

