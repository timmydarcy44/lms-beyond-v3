"use client";

import { useState, useEffect } from "react";
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
  Layout,
  Columns,
  Type,
  Palette,
  MousePointer2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { MediaUploader } from "./media-uploader";
import { RichTextEditor } from "./rich-text-editor";
import { GridPageRenderer } from "./grid-page-renderer";
import {
  SectionListItem,
  BlockEditor,
  SectionEditor,
  BlockStyleEditor,
  SectionStyleEditor,
} from "./grid-builder-components";
import type { Section, Column, Block, BlockType, ColumnLayout, BlockStyles, CMSContent } from "@/types/cms";

type CMSPage = {
  id?: string;
  slug: string;
  title: string;
  meta_title?: string;
  meta_description?: string;
  h1?: string;
  h2?: string;
  content: CMSContent | any; // Support legacy format
  is_published?: boolean;
};

type GridPageBuilderProps = {
  initialPage?: CMSPage;
};

export function GridPageBuilder({ initialPage }: GridPageBuilderProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  // Gérer le format des données (legacy ou grid)
  const getInitialSections = (): Section[] => {
    if (!initialPage?.content) return [];
    
    // Si c'est déjà un tableau de sections
    if (Array.isArray(initialPage.content) && initialPage.content[0]?.type === "section") {
      return initialPage.content as CMSContent;
    }
    
    // Si c'est un format legacy (tableau de blocs simples), convertir
    if (Array.isArray(initialPage.content) && initialPage.content[0]?.type && !initialPage.content[0]?.type.includes("section")) {
      // Convertir les blocs legacy en une section
      return [{
        id: "section-legacy",
        type: "section",
        layout: "1",
        columns: [{
          id: "column-legacy-1",
          width: "1",
          blocks: initialPage.content as Block[],
        }],
        styles: {
          backgroundColor: "#FFFFFF",
          padding: "py-40",
        },
      }];
    }
    
    return [];
  };
  
  const [sections, setSections] = useState<Section[]>(getInitialSections());
  const [selectedElement, setSelectedElement] = useState<{
    type: "section" | "column" | "block";
    sectionId: string;
    columnId?: string;
    blockId?: string;
  } | null>(null);
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

  // Debug: log initial state
  useEffect(() => {
    console.log("[grid-page-builder] Initial page:", {
      hasInitialPage: !!initialPage,
      title: initialPage?.title,
      content_type: (initialPage as any)?.content_type,
      content: initialPage?.content,
      sections_count: sections.length,
    });
  }, [initialPage, sections.length]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const addSection = (layout: ColumnLayout = "1") => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      type: "section",
      layout,
      columns: layout.split("-").map((width, index) => ({
        id: `column-${Date.now()}-${index}`,
        width: width,
        blocks: [],
      })),
      styles: {
        backgroundColor: "#FFFFFF",
        padding: "py-40",
      },
    };
    setSections([...sections, newSection]);
    setSelectedElement({ type: "section", sectionId: newSection.id });
  };

  const addBlock = (sectionId: string, columnId: string, type: BlockType) => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type,
      content: "",
      styles: {},
    };
    setSections(
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              columns: section.columns.map((col) =>
                col.id === columnId
                  ? { ...col, blocks: [...col.blocks, newBlock] }
                  : col
              ),
            }
          : section
      )
    );
    setSelectedElement({
      type: "block",
      sectionId,
      columnId,
      blockId: newBlock.id,
    });
  };

  const updateBlock = (
    sectionId: string,
    columnId: string,
    blockId: string,
    updates: Partial<Block>
  ) => {
    setSections(
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              columns: section.columns.map((col) =>
                col.id === columnId
                  ? {
                      ...col,
                      blocks: col.blocks.map((block) =>
                        block.id === blockId ? { ...block, ...updates } : block
                      ),
                    }
                  : col
              ),
            }
          : section
      )
    );
  };

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    setSections(
      sections.map((section) =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    );
  };

  const removeSection = (sectionId: string) => {
    setSections(sections.filter((s) => s.id !== sectionId));
    if (selectedElement?.sectionId === sectionId) {
      setSelectedElement(null);
    }
  };

  const removeBlock = (sectionId: string, columnId: string, blockId: string) => {
    setSections(
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              columns: section.columns.map((col) =>
                col.id === columnId
                  ? { ...col, blocks: col.blocks.filter((b) => b.id !== blockId) }
                  : col
              ),
            }
          : section
      )
    );
    if (selectedElement?.blockId === blockId) {
      setSelectedElement(null);
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
          content: sections,
          content_type: "grid",
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
      console.error("[grid-page-builder] Error saving:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const selectedBlock = selectedElement?.blockId
    ? sections
        .find((s) => s.id === selectedElement.sectionId)
        ?.columns.find((c) => c.id === selectedElement.columnId)
        ?.blocks.find((b) => b.id === selectedElement.blockId)
    : null;

  const selectedSection = selectedElement?.type === "section"
    ? sections.find((s) => s.id === selectedElement.sectionId)
    : null;

  // Données pour la prévisualisation
  const previewPage = {
    id: initialPage?.id || "preview",
    slug: pageData.slug,
    title: pageData.title,
    h1: pageData.h1,
    h2: pageData.h2,
    content: sections,
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
        {/* Left Sidebar */}
        <div className={cn(
          "w-80 bg-white border-r border-gray-200 flex flex-col transition-all",
          previewMode === "full" && "hidden"
        )}>
          <Tabs defaultValue="elements" className="flex-1 flex flex-col">
            <TabsList className="w-full rounded-none border-b">
              <TabsTrigger value="elements" className="flex-1">Éléments</TabsTrigger>
              <TabsTrigger value="style" className="flex-1">
                <Palette className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex-1">
                <Settings className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>

            {/* Tab: Elements */}
            <TabsContent value="elements" className="flex-1 flex flex-col m-0 p-0 overflow-hidden">
              {/* Add Section */}
              <div className="p-4 border-b">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                  Sections
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {(["1", "2", "3", "1-2", "2-1"] as ColumnLayout[]).map((layout) => (
                    <Button
                      key={layout}
                      variant="outline"
                      size="sm"
                      className="h-auto flex-col py-2"
                      onClick={() => addSection(layout)}
                    >
                      <Layout className="h-4 w-4 mb-1" />
                      <span className="text-xs">{layout}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Sections List */}
              <div className="flex-1 overflow-y-auto p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                  Structure
                </h3>
                <div className="space-y-2">
                  {sections.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      <p>Aucune section</p>
                      <p className="text-xs mt-1">Ajoutez une section ci-dessus</p>
                    </div>
                  ) : (
                    sections.map((section, sectionIndex) => (
                      <SectionListItem
                        key={section.id}
                        section={section}
                        sectionIndex={sectionIndex}
                        isSelected={selectedElement?.sectionId === section.id}
                        onSelect={() => setSelectedElement({ type: "section", sectionId: section.id })}
                        onRemove={() => removeSection(section.id)}
                        onAddBlock={(columnId, type) => addBlock(section.id, columnId, type)}
                        onBlockSelect={(columnId, blockId) =>
                          setSelectedElement({
                            type: "block",
                            sectionId: section.id,
                            columnId,
                            blockId,
                          })
                        }
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Element Editor Panel */}
              {selectedBlock && (
                <div className="border-t border-gray-200 p-4 bg-gray-50 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                      Éditer l'élément
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedElement(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <BlockEditor
                    block={selectedBlock}
                    onUpdate={(updates) =>
                      updateBlock(
                        selectedElement!.sectionId,
                        selectedElement!.columnId!,
                        selectedElement!.blockId!,
                        updates
                      )
                    }
                  />
                </div>
              )}

              {selectedSection && !selectedBlock && (
                <div className="border-t border-gray-200 p-4 bg-gray-50 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                      Éditer la section
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedElement(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <SectionEditor
                    section={selectedSection}
                    onUpdate={(updates) => updateSection(selectedSection.id, updates)}
                  />
                </div>
              )}
            </TabsContent>

            {/* Tab: Style */}
            <TabsContent value="style" className="flex-1 overflow-y-auto p-4 m-0">
              {selectedBlock ? (
                <BlockStyleEditor
                  block={selectedBlock}
                  onUpdate={(styles) =>
                    updateBlock(
                      selectedElement!.sectionId,
                      selectedElement!.columnId!,
                      selectedElement!.blockId!,
                      { styles }
                    )
                  }
                />
              ) : selectedSection ? (
                <SectionStyleEditor
                  section={selectedSection}
                  onUpdate={(styles) =>
                    updateSection(selectedSection.id, { styles })
                  }
                />
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <p>Sélectionnez un élément pour éditer ses styles</p>
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

                <div className="space-y-2">
                  <Label htmlFor="meta_title">Meta Title</Label>
                  <Input
                    id="meta_title"
                    value={pageData.meta_title}
                    onChange={(e) =>
                      setPageData({ ...pageData, meta_title: e.target.value })
                    }
                    placeholder="Titre SEO (50-60 caractères)"
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
                    placeholder="Description SEO (150-160 caractères)"
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-gray-500">
                    {pageData.meta_description.length}/160 caractères
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
          <div className="min-h-full">
            {sections.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <Layout className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                    Aucune section
                  </h3>
                  <p className="text-gray-600 mb-4" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                    Commencez par ajouter une section depuis la barre latérale.
                  </p>
                  <Button onClick={() => addSection("1")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter une section
                  </Button>
                </div>
              </div>
            ) : (
              <GridPageRenderer 
                page={previewPage} 
                onElementClick={(type, sectionId, columnId?, blockId?) => {
                  setSelectedElement({ type, sectionId, columnId, blockId });
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


