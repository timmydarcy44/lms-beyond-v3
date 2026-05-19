"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type MermaidDiagramProps = {
  code: string;
  className?: string;
  theme?: "dark" | "light";
};

let mermaidInitialized = false;

async function renderMermaid(id: string, code: string, theme: "dark" | "light"): Promise<string> {
  const mermaid = (await import("mermaid")).default;
  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === "light" ? "neutral" : "dark",
      securityLevel: "loose",
      fontFamily: "system-ui, sans-serif",
    });
    mermaidInitialized = true;
  }
  const { svg } = await mermaid.render(id, code.trim());
  return svg;
}

export function MermaidDiagram({ code, className, theme = "dark" }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const renderIdRef = useRef(`mmd-${Math.random().toString(36).slice(2, 11)}`);

  useEffect(() => {
    let cancelled = false;
    const source = code.trim();
    if (!source) return;

    (async () => {
      try {
        setError(null);
        const svg = await renderMermaid(renderIdRef.current, source, theme);
        if (cancelled || !containerRef.current) return;
        containerRef.current.innerHTML = svg;
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Schéma invalide");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code, theme]);

  if (error) {
    return (
      <div
        className={cn(
          "my-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100",
          className,
        )}
      >
        <p className="font-medium">Schéma non affiché</p>
        <pre className="mt-2 overflow-x-auto text-xs opacity-90">{code}</pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "my-4 flex justify-center overflow-x-auto rounded-lg border p-4",
        theme === "light" ? "border-slate-200 bg-white" : "border-white/15 bg-white/[0.04]",
        "[&_svg]:h-auto [&_svg]:max-w-full",
        className,
      )}
      aria-label="Schéma"
    />
  );
}
