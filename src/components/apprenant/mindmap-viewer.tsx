'use client';

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CustomNodeElementProps, RawNodeDatum } from "react-d3-tree";

const Tree = dynamic(() => import("react-d3-tree").then((mod) => mod.Tree), {
  ssr: false,
});

const TITLE_CASE_WORD = /^[A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ'’\-]*$/;

const wrapLabel = (label: string, maxLength = 26) => {
  const clean = (label || "").trim();
  if (clean.length <= maxLength) return clean;

  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    if ((current + " " + word).trim().length > maxLength && current) {
      lines.push(current.trim());
      current = word;
    } else {
      current = `${current} ${word}`;
    }
  });

  if (current) {
    lines.push(current.trim());
  }

  return lines.join("\n");
};

const normalizeSentenceCase = (value?: string | null) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";

  const words = trimmed.split(/\s+/);
  const shouldConvert =
    words.length > 1 &&
    words.every((word) => TITLE_CASE_WORD.test(word)) &&
    words.some((word) => word.length > 2);

  if (!shouldConvert) {
    return trimmed;
  }

  const lower = trimmed.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

function buildNode(label: string, children: any[] = []): RawNodeDatum {
  const normalizedLabel = wrapLabel(normalizeSentenceCase(label || "Idée"));
  const hasChildren = Array.isArray(children) && children.length > 0;

  return {
    name: normalizedLabel,
    children: hasChildren
      ? children.map((child) => buildNode(child.label, child.children || []))
      : undefined,
  } satisfies RawNodeDatum;
}

function convertMindMapData(data: any): RawNodeDatum {
  if (!data) {
    return {
      name: "Carte mentale",
      children: [],
    } satisfies RawNodeDatum;
  }

  return {
    name: wrapLabel(normalizeSentenceCase(data.centralTheme || "Carte mentale")),
    children: (data.mainBranches || []).map((branch: any) => buildNode(branch.label, branch.children || [])),
  } satisfies RawNodeDatum;
}

const renderNode = ({ nodeDatum }: CustomNodeElementProps) => (
  <g>
    <foreignObject x={-110} y={-26} width={220} height={64}>
      <div className="flex h-full items-center justify-center rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2 text-center text-sm font-medium text-slate-100 shadow-md backdrop-blur">
        {nodeDatum.name}
      </div>
    </foreignObject>
  </g>
);

export function MindmapViewer({ data }: { data: any }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const graphData = useMemo(() => convertMindMapData(data), [data]);
  const [dimensions, setDimensions] = useState({ width: 800, height: 420 });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateSize = () => {
      if (!containerRef.current) return;
      setDimensions({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    return () => {
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  if (typeof window === "undefined") {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="h-[480px] w-full rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 shadow-2xl"
    >
      {dimensions.width > 0 ? (
        <Tree
          data={graphData}
          orientation="horizontal"
          translate={{ x: Math.max(dimensions.width * 0.2, 160), y: dimensions.height / 2 }}
          pathFunc="step"
          separation={{ siblings: 1.4, nonSiblings: 1.8 }}
          nodeSize={{ x: 260, y: 150 }}
          zoomable
          collapsible={false}
          enableLegacyTransitions
          allowForeignObjects
          renderCustomNodeElement={renderNode}
          styles={{
            links: {
              stroke: "rgba(148, 163, 184, 0.55)",
              strokeWidth: 1.4,
            },
          }}
        />
      ) : null}
    </div>
  );
}
