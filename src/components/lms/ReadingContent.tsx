"use client";

import { useMemo } from "react";
import { Callout } from "@/components/lms/Callout";
import { parseReadingBlocks } from "@/lib/lms/reading-transform";

export function ReadingContent({ html }: { html: string }) {
  const blocks = useMemo(() => parseReadingBlocks(html), [html]);
  return (
    <>
      {blocks.map((block, index) => {
        if (block.type === "callout") {
          return (
            <Callout key={`callout-${index}`} variant={block.variant}>
              {block.html ? <div dangerouslySetInnerHTML={{ __html: block.html }} /> : null}
            </Callout>
          );
        }
        if (block.type === "heading") {
          return (
            <h2 key={`heading-${index}`} className="lesson-section-title">
              {block.number ? <span className="lesson-section-title__num">{block.number}</span> : null}
              <span>{block.title}</span>
            </h2>
          );
        }
        return <div key={`html-${index}`} dangerouslySetInnerHTML={{ __html: block.html }} />;
      })}
    </>
  );
}
