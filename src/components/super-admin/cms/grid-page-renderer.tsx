"use client";

import { cn } from "@/lib/utils";
import type { Section, Block, CMSContent } from "@/types/cms";

type CMSPage = {
  id: string;
  slug: string;
  title: string;
  h1?: string;
  h2?: string;
  content: CMSContent;
};

type GridPageRendererProps = {
  page: CMSPage;
  onElementClick?: (
    type: "section" | "column" | "block",
    sectionId: string,
    columnId?: string,
    blockId?: string
  ) => void;
};

export function GridPageRenderer({ page, onElementClick }: GridPageRendererProps) {
  const sections = page.content || [];

  const renderBlock = (block: Block) => {
    const style: React.CSSProperties = {
      fontSize: block.styles?.fontSize,
      fontWeight: block.styles?.fontWeight,
      color: block.styles?.color,
      backgroundColor: block.styles?.backgroundColor,
      textAlign: block.styles?.textAlign,
      padding: block.styles?.padding,
      margin: block.styles?.margin,
      width: block.styles?.width,
      height: block.styles?.height,
      borderRadius: block.styles?.borderRadius,
    };

    switch (block.type) {
      case "heading1":
        return (
          <h1
            style={style}
            className="text-5xl md:text-7xl font-semibold mb-8 leading-tight"
          >
            {block.content}
          </h1>
        );

      case "heading2":
        return (
          <h2
            style={style}
            className="text-3xl md:text-5xl font-medium mb-6 leading-tight"
          >
            {block.content}
          </h2>
        );

      case "text":
        return (
          <div
            style={style}
            className="text-lg leading-relaxed mb-6"
            dangerouslySetInnerHTML={{ __html: block.content }}
          />
        );

      case "image":
        if (!block.content && !block.metadata?.url) return null;
        const imageUrl = block.metadata?.url || block.content;
        return (
          <div className="my-8">
            <img
              src={imageUrl}
              alt={block.metadata?.alt || "Image"}
              className="w-full h-auto rounded-lg"
              style={{ maxHeight: "600px", objectFit: "contain" }}
            />
          </div>
        );

      case "video":
        if (!block.content && !block.metadata?.url) return null;
        const videoUrl = block.metadata?.url || block.content;
        return (
          <div className="my-8">
            <video
              src={videoUrl}
              controls
              className="w-full h-auto rounded-lg"
              style={{ maxHeight: "600px" }}
            >
              Votre navigateur ne supporte pas la lecture de vidéos.
            </video>
          </div>
        );

      default:
        return null;
    }
  };

  const getColumnClasses = (layout: string, index: number) => {
    const layouts: Record<string, string[]> = {
      "1": ["w-full"],
      "2": ["w-1/2", "w-1/2"],
      "3": ["w-1/3", "w-1/3", "w-1/3"],
      "1-2": ["w-1/3", "w-2/3"],
      "2-1": ["w-2/3", "w-1/3"],
    };
    return layouts[layout]?.[index] || "w-full";
  };

  return (
    <div className="min-h-screen">
      {sections.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">
            Aucune section. Ajoutez des sections depuis la barre latérale.
          </p>
        </div>
      ) : (
        sections.map((section) => {
          const sectionStyle: React.CSSProperties = {
            backgroundColor: section.styles?.backgroundColor,
            padding: section.styles?.padding?.replace("py-", "").replace("px-", "") + "px" || undefined,
            minHeight: section.styles?.minHeight,
          };

          // Convertir padding Tailwind en style inline si nécessaire
          const paddingClass = section.styles?.padding;
          const paddingStyle: React.CSSProperties = { ...sectionStyle };
          
          // Retirer padding de sectionStyle car on utilise className
          delete paddingStyle.padding;

          return (
            <section
              key={section.id}
              className={cn(
                "relative overflow-hidden",
                paddingClass || "py-40"
              )}
              style={paddingStyle}
              onClick={() => onElementClick?.("section", section.id)}
            >
              <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div
                  className={cn(
                    "grid gap-8",
                    section.layout === "1" && "grid-cols-1",
                    section.layout === "2" && "grid-cols-1 md:grid-cols-2",
                    section.layout === "3" && "grid-cols-1 md:grid-cols-3",
                    section.layout === "1-2" && "grid-cols-1 md:grid-cols-3",
                    section.layout === "2-1" && "grid-cols-1 md:grid-cols-3"
                  )}
                >
                  {section.columns.map((column, colIndex) => (
                    <div
                      key={column.id}
                      className={cn(
                        getColumnClasses(section.layout, colIndex),
                        section.layout === "1-2" && colIndex === 1 && "md:col-span-2",
                        section.layout === "2-1" && colIndex === 0 && "md:col-span-2"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onElementClick?.("column", section.id, column.id);
                      }}
                    >
                      <div className="space-y-4">
                        {column.blocks.map((block) => (
                          <div
                            key={block.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onElementClick?.(
                                "block",
                                section.id,
                                column.id,
                                block.id
                              );
                            }}
                          >
                            {renderBlock(block)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}

