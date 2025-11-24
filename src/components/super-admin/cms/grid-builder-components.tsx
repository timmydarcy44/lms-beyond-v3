"use client";

import { useState } from "react";
import {
  GripVertical,
  Plus,
  Trash2,
  Heading1,
  Heading2,
  FileText,
  Image as ImageIcon,
  Video,
  Columns,
  Palette,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { MediaUploader } from "./media-uploader";
import { RichTextEditor } from "./rich-text-editor";
import type { Section, Column, Block, BlockType, BlockStyles } from "@/types/cms";

// Section List Item
type SectionListItemProps = {
  section: Section;
  sectionIndex: number;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onAddBlock: (columnId: string, type: BlockType) => void;
  onBlockSelect: (columnId: string, blockId: string) => void;
};

export function SectionListItem({
  section,
  sectionIndex,
  isSelected,
  onSelect,
  onRemove,
  onAddBlock,
  onBlockSelect,
}: SectionListItemProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div
      className={cn(
        "border rounded-lg overflow-hidden",
        isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200"
      )}
    >
      <div
        className="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-50"
        onClick={onSelect}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <Columns className="h-4 w-4 text-gray-500" />
        <span className="flex-1 text-sm font-medium text-gray-700">
          Section {sectionIndex + 1} ({section.layout})
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <Trash2 className="h-3 w-3 text-red-500" />
        </Button>
      </div>
      {expanded && (
        <div className="px-2 pb-2 space-y-2">
          {section.columns.map((column, colIndex) => (
            <div key={column.id} className="pl-4 border-l-2 border-gray-200">
              <div className="flex items-center gap-2 py-1">
                <span className="text-xs text-gray-500">Colonne {colIndex + 1}</span>
              </div>
              <div className="space-y-1">
                {column.blocks.map((block) => (
                  <div
                    key={block.id}
                    className="flex items-center gap-2 p-1 rounded hover:bg-gray-100 cursor-pointer text-xs"
                    onClick={() => onBlockSelect(column.id, block.id)}
                  >
                    {block.type === "heading1" && <Heading1 className="h-3 w-3" />}
                    {block.type === "heading2" && <Heading2 className="h-3 w-3" />}
                    {block.type === "text" && <FileText className="h-3 w-3" />}
                    {block.type === "image" && <ImageIcon className="h-3 w-3" />}
                    {block.type === "video" && <Video className="h-3 w-3" />}
                    <span className="capitalize">{block.type}</span>
                  </div>
                ))}
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => onAddBlock(column.id, "heading1")}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    H1
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => onAddBlock(column.id, "text")}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Texte
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => onAddBlock(column.id, "image")}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Image
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Block Editor
type BlockEditorProps = {
  block: Block;
  onUpdate: (updates: Partial<Block>) => void;
};

export function BlockEditor({ block, onUpdate }: BlockEditorProps) {
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

// Section Editor
type SectionEditorProps = {
  section: Section;
  onUpdate: (updates: Partial<Section>) => void;
};

export function SectionEditor({ section, onUpdate }: SectionEditorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Layout</Label>
        <Select
          value={section.layout}
          onValueChange={(value) => onUpdate({ layout: value as any })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 colonne</SelectItem>
            <SelectItem value="2">2 colonnes</SelectItem>
            <SelectItem value="3">3 colonnes</SelectItem>
            <SelectItem value="1-2">1-2 (1/3 - 2/3)</SelectItem>
            <SelectItem value="2-1">2-1 (2/3 - 1/3)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// Block Style Editor
type BlockStyleEditorProps = {
  block: Block;
  onUpdate: (styles: BlockStyles) => void;
};

export function BlockStyleEditor({ block, onUpdate }: BlockStyleEditorProps) {
  const styles = block.styles || {};

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Taille de police</Label>
        <Input
          type="text"
          value={styles.fontSize || ""}
          onChange={(e) => onUpdate({ ...styles, fontSize: e.target.value })}
          placeholder="ex: 24px, 1.5rem, 2xl"
        />
      </div>

      <div className="space-y-2">
        <Label>Couleur du texte</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={styles.color || "#000000"}
            onChange={(e) => onUpdate({ ...styles, color: e.target.value })}
            className="w-16 h-10"
          />
          <Input
            type="text"
            value={styles.color || ""}
            onChange={(e) => onUpdate({ ...styles, color: e.target.value })}
            placeholder="#000000"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Alignement</Label>
        <Select
          value={styles.textAlign || "left"}
          onValueChange={(value) =>
            onUpdate({ ...styles, textAlign: value as any })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Gauche</SelectItem>
            <SelectItem value="center">Centre</SelectItem>
            <SelectItem value="right">Droite</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Font weight</Label>
        <Select
          value={styles.fontWeight || "normal"}
          onValueChange={(value) => onUpdate({ ...styles, fontWeight: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="semibold">Semibold</SelectItem>
            <SelectItem value="bold">Bold</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// Section Style Editor
type SectionStyleEditorProps = {
  section: Section;
  onUpdate: (styles: Section["styles"]) => void;
};

export function SectionStyleEditor({
  section,
  onUpdate,
}: SectionStyleEditorProps) {
  const styles = section.styles || {};

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Couleur de fond</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={styles.backgroundColor || "#FFFFFF"}
            onChange={(e) =>
              onUpdate({ ...styles, backgroundColor: e.target.value })
            }
            className="w-16 h-10"
          />
          <Input
            type="text"
            value={styles.backgroundColor || ""}
            onChange={(e) =>
              onUpdate({ ...styles, backgroundColor: e.target.value })
            }
            placeholder="#FFFFFF"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Padding</Label>
        <Input
          type="text"
          value={styles.padding || ""}
          onChange={(e) => onUpdate({ ...styles, padding: e.target.value })}
          placeholder="ex: py-40, p-8"
        />
      </div>

      <div className="space-y-2">
        <Label>Hauteur minimale</Label>
        <Input
          type="text"
          value={styles.minHeight || ""}
          onChange={(e) => onUpdate({ ...styles, minHeight: e.target.value })}
          placeholder="ex: min-h-screen, 500px"
        />
      </div>
    </div>
  );
}








