import type { ReactNode } from "react";

/** Rendu inline : **gras** → <strong> */
export function renderInlineMarkdown(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export type MarkdownBlock = {
  title?: string;
  paragraphs: string[];
};

/** Découpe un texte IA type « **Titre** corps… **Autre titre** … » */
export function parseMarkdownBlocks(text: string): MarkdownBlock[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const segments = trimmed.split(/(?=\*\*[^*]+\*\*)/g).filter((s) => s.trim());
  if (segments.length <= 1 && !trimmed.includes("**")) {
    return [{ paragraphs: [trimmed] }];
  }

  return segments.map((segment) => {
    const titleMatch = segment.match(/^\*\*([^*]+)\*\*:?\s*/);
    if (!titleMatch) {
      return { paragraphs: segment.trim().split(/\n+/).filter(Boolean) };
    }
    const title = titleMatch[1].trim();
    const rest = segment.slice(titleMatch[0].length).trim();
    const paragraphs = rest ? rest.split(/\n+/).map((p) => p.trim()).filter(Boolean) : [];
    return { title, paragraphs };
  });
}

export function SimpleMarkdownAnalysis({ content }: { content: string }) {
  const blocks = parseMarkdownBlocks(content);

  return (
    <div className="space-y-5">
      {blocks.map((block, blockIndex) => (
        <div key={blockIndex}>
          {block.title ? (
            <h4 className="text-sm font-semibold tracking-wide text-[#60a5fa]">{block.title}</h4>
          ) : null}
          <div className={block.title ? "mt-2 space-y-2" : "space-y-2"}>
            {block.paragraphs.map((paragraph, pIndex) => (
              <p key={pIndex} className="text-sm leading-relaxed text-white/75">
                {renderInlineMarkdown(paragraph)}
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
