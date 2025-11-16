"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Plus,
  Trash2,
  Save,
  Settings,
  Image as ImageIcon,
  Video,
  Heading1,
  Heading2,
  FileText,
  Search,
  Eye,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { MediaUploader } from "./media-uploader";
import { RichTextEditor } from "./rich-text-editor";
import { CMSPageRenderer } from "@/components/cms/cms-page-renderer";

type BlockType = "heading1" | "heading2" | "text" | "image" | "video";

type Block = {
  id: string;
  type: BlockType;
  content: string;
  metadata?: {
    alt?: string;
    url?: string;
    width?: number;
    height?: number;
  };
};

type CMSPage = {
  id?: string;
  slug: string;
  title: string;
  meta_title?: string;
  meta_description?: string;
  h1?: string;
  h2?: string;
  content: Block[];
  is_published?: boolean;
};

type PageBuilderClientProps = {
  initialPage?: CMSPage;
};

export function PageBuilderClient({ initialPage }: PageBuilderClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>(
    initialPage?.content || []
  );
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"split" | "full">("split");
  const [pageData, setPageData] = useState({
    slug: initialPage?.slug || "",
    title: initialPage?.title || "",
    meta_title: initialPage?.meta_title || "",
    meta_description: initialPage?.meta_description || "",
    h1: initialPage?.h1 || "",
    h2: initialPage?.h2 || "",
    is_published: initialPage?.is_published || false,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeIndex = blocks.findIndex((b) => b.id === active.id);
    const overIndex = blocks.findIndex((b) => b.id === over.id);

    if (activeIndex === -1 || overIndex === -1) return;

    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(activeIndex, 1);
    newBlocks.splice(overIndex, 0, moved);
    setBlocks(newBlocks);
  };

  const addBlock = (type: BlockType) => {
    const newBlock: Block = {
      id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type,
      content: "",
    };
    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    setSelectedBlockId(newBlock.id);
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks(
      blocks.map((block) =>
        block.id === id ? { ...block, ...updates } : block
      )
    );
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter((block) => block.id !== id));
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }
  };

  const handleSave = async () => {
    if (!pageData.slug || !pageData.title) {
      toast.error("Le slug et le titre sont requis");
      return;
    }

    setSaving(true);
    try {
      const url = initialPage?.id
        ? `/api/cms/pages/${initialPage.id}`
        : "/api/cms/pages";
      const method = initialPage?.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...pageData,
          content: blocks,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde");
      }

      const data = await response.json();
      toast.success("Page sauvegardée avec succès");
      
      if (!initialPage?.id) {
        router.push(`/super/pages/${data.id}/edit`);
      }
    } catch (error) {
      console.error("[page-builder] Error saving:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);

  // Données pour la prévisualisation
  const previewPage = {
    id: initialPage?.id || "preview",
    slug: pageData.slug,
    title: pageData.title,
    h1: pageData.h1,
    h2: pageData.h2,
    content: blocks,
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header Toolbar */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
            {initialPage?.id ? "Modifier la page" : "Créer une nouvelle page"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(previewMode === "split" ? "full" : "split")}
          >
            {previewMode === "split" ? (
              <Maximize2 className="h-4 w-4 mr-2" />
            ) : (
              <Minimize2 className="h-4 w-4 mr-2" />
            )}
            {previewMode === "split" ? "Plein écran" : "Split"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/super/pages")}
          >
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving} size="sm">
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Elements & Settings */}
        <div className={cn(
          "w-80 bg-white border-r border-gray-200 flex flex-col transition-all",
          previewMode === "full" && "hidden"
        )}>
          <Tabs defaultValue="elements" className="flex-1 flex flex-col">
            <TabsList className="w-full rounded-none border-b">
              <TabsTrigger value="elements" className="flex-1">Éléments</TabsTrigger>
              <TabsTrigger value="settings" className="flex-1">
                <Settings className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="seo" className="flex-1">
                <Search className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>

            {/* Tab: Elements */}
            <TabsContent value="elements" className="flex-1 flex flex-col m-0 p-0 overflow-hidden">
              {/* Elements List */}
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                  Éléments
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { type: "heading1" as BlockType, label: "H1", icon: Heading1 },
                      { type: "heading2" as BlockType, label: "H2", icon: Heading2 },
                      { type: "text" as BlockType, label: "Texte", icon: FileText },
                      { type: "image" as BlockType, label: "Image", icon: ImageIcon },
                      { type: "video" as BlockType, label: "Vidéo", icon: Video },
                    ] as const
                  ).map(({ type, label, icon: Icon }) => (
                    <Button
                      key={type}
                      variant="outline"
                      size="sm"
                      className="h-auto flex-col py-3"
                      onClick={() => addBlock(type)}
                    >
                      <Icon className="h-5 w-5 mb-1" />
                      <span className="text-xs">{label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Blocks List */}
              <div className="flex-1 overflow-y-auto p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                  Structure
                </h3>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={blocks.map((b) => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {blocks.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-sm">
                          <p>Aucun élément</p>
                          <p className="text-xs mt-1">Ajoutez des éléments ci-dessus</p>
                        </div>
                      ) : (
                        blocks.map((block) => (
                          <BlockListItem
                            key={block.id}
                            block={block}
                            isSelected={selectedBlockId === block.id}
                            onSelect={() => setSelectedBlockId(block.id)}
                            onRemove={() => removeBlock(block.id)}
                          />
                        ))
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>

              {/* Block Editor Panel */}
              {selectedBlock && (
                <div className="border-t border-gray-200 p-4 bg-gray-50 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                      Éditer l'élément
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedBlockId(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <BlockEditor
                    block={selectedBlock}
                    onUpdate={(updates) => updateBlock(selectedBlock.id, updates)}
                  />
                </div>
              )}
            </TabsContent>

            {/* Tab: Settings */}
            <TabsContent value="settings" className="flex-1 overflow-y-auto p-4 m-0">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre de la page *</Label>
                  <Input
                    id="title"
                    value={pageData.title}
                    onChange={(e) =>
                      setPageData({ ...pageData, title: e.target.value })
                    }
                    placeholder="Titre de la page"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL) *</Label>
                  <Input
                    id="slug"
                    value={pageData.slug}
                    onChange={(e) =>
                      setPageData({
                        ...pageData,
                        slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                      })
                    }
                    placeholder="exemple-de-page"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    /{pageData.slug || "exemple-de-page"}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_published"
                    checked={pageData.is_published}
                    onChange={(e) =>
                      setPageData({
                        ...pageData,
                        is_published: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="is_published">Publier la page</Label>
                </div>
              </div>
            </TabsContent>

            {/* Tab: SEO */}
            <TabsContent value="seo" className="flex-1 overflow-y-auto p-4 m-0">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="meta_title">Meta Title</Label>
                  <Input
                    id="meta_title"
                    value={pageData.meta_title}
                    onChange={(e) =>
                      setPageData({ ...pageData, meta_title: e.target.value })
                    }
                    placeholder="Titre pour les moteurs de recherche (50-60 caractères)"
                    maxLength={60}
                  />
                  <p className="text-xs text-gray-500">
                    {pageData.meta_title.length}/60 caractères
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_description">Meta Description</Label>
                  <Textarea
                    id="meta_description"
                    value={pageData.meta_description}
                    onChange={(e) =>
                      setPageData({
                        ...pageData,
                        meta_description: e.target.value,
                      })
                    }
                    placeholder="Description pour les moteurs de recherche (150-160 caractères)"
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-gray-500">
                    {pageData.meta_description.length}/160 caractères
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="h1">H1 (Titre principal)</Label>
                  <Input
                    id="h1"
                    value={pageData.h1}
                    onChange={(e) =>
                      setPageData({ ...pageData, h1: e.target.value })
                    }
                    placeholder="Titre principal de la page"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="h2">H2 (Sous-titre)</Label>
                  <Input
                    id="h2"
                    value={pageData.h2}
                    onChange={(e) =>
                      setPageData({ ...pageData, h2: e.target.value })
                    }
                    placeholder="Sous-titre de la page"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Center: Live Preview */}
        <div className={cn(
          "flex-1 overflow-y-auto bg-white",
          previewMode === "full" && "w-full"
        )}>
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                Prévisualisation
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`/pages/${pageData.slug || 'preview'}`, '_blank')}
              disabled={!pageData.slug}
            >
              Ouvrir dans un nouvel onglet
            </Button>
          </div>
          <div className="p-8">
            <CMSPageRenderer page={previewPage} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant pour la liste des blocs dans la sidebar
type BlockListItemProps = {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
};

function BlockListItem({ block, isSelected, onSelect, onRemove }: BlockListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const blockIcons = {
    heading1: Heading1,
    heading2: Heading2,
    text: FileText,
    image: ImageIcon,
    video: Video,
  };

  const Icon = blockIcons[block.type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors",
        isSelected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      )}
      onClick={onSelect}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Icon className="h-4 w-4 text-gray-500" />
      <span className="flex-1 text-sm text-gray-700 capitalize" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
        {block.type}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <Trash2 className="h-3 w-3 text-red-500" />
      </Button>
    </div>
  );
}

// Composant pour éditer un bloc
type BlockEditorProps = {
  block: Block;
  onUpdate: (updates: Partial<Block>) => void;
};

function BlockEditor({ block, onUpdate }: BlockEditorProps) {
  switch (block.type) {
    case "heading1":
    case "heading2":
      return (
        <div className="space-y-2">
          <Label>Contenu</Label>
          <Input
            value={block.content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            placeholder={`Titre ${block.type === "heading1" ? "H1" : "H2"}`}
            className={block.type === "heading1" ? "text-2xl font-bold" : "text-xl font-semibold"}
          />
        </div>
      );

    case "text":
      return (
        <div className="space-y-2">
          <Label>Contenu</Label>
          <RichTextEditor
            content={block.content}
            onChange={(content) => onUpdate({ content })}
          />
        </div>
      );

    case "image":
      return (
        <div className="space-y-2">
          <Label>Image</Label>
          <MediaUploader
            type="image"
            value={block.metadata?.url}
            onChange={(url, metadata) =>
              onUpdate({
                content: url,
                metadata: { ...block.metadata, ...metadata, url },
              })
            }
          />
          {block.metadata?.url && (
            <div className="space-y-2 mt-2">
              <Label htmlFor="alt">Texte alternatif</Label>
              <Input
                id="alt"
                value={block.metadata?.alt || ""}
                onChange={(e) =>
                  onUpdate({
                    metadata: { ...block.metadata, alt: e.target.value },
                  })
                }
                placeholder="Description de l'image"
              />
            </div>
          )}
        </div>
      );

    case "video":
      return (
        <div className="space-y-2">
          <Label>Vidéo</Label>
          <MediaUploader
            type="video"
            value={block.metadata?.url}
            onChange={(url, metadata) =>
              onUpdate({
                content: url,
                metadata: { ...block.metadata, ...metadata, url },
              })
            }
          />
        </div>
      );

    default:
      return null;
  }
}
