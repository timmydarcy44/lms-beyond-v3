"use client";

import { useCallback, useMemo, useRef } from "react";
import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewRendererProps } from "@tiptap/react";
import { Node, mergeAttributes } from "@tiptap/core";
import { ImagePlus, Video } from "lucide-react";
import { cn } from "@/lib/utils";

export type MediaPlaceholderRequest = {
  type: "image" | "video";
  getPos: () => number;
  rect?: DOMRect | null;
};

export type MediaPlaceholderOptions = {
  onRequestMedia?: (request: MediaPlaceholderRequest) => void;
};

type MediaPlaceholderExtension = {
  options: MediaPlaceholderOptions;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mediaPlaceholder: {
      setMediaPlaceholder: () => ReturnType;
      clearMediaPlaceholder: () => ReturnType;
    };
  }
}

const MediaPlaceholderComponent = ({
  node,
  extension,
  getPos,
}: NodeViewRendererProps & { extension: MediaPlaceholderExtension }) => {
  const { type = "image" } = node.attrs as { type?: "image" | "video" };
  const zoneRef = useRef<HTMLDivElement | null>(null);
  const icon = useMemo(() => (type === "video" ? Video : ImagePlus), [type]);
  const Icon = icon;

  const openMediaPicker = useCallback(() => {
    const handler = extension.options.onRequestMedia;
    if (!handler) return;
    const pos = typeof getPos === "function" ? getPos : null;
    if (!pos) return;
    handler({
      type,
      getPos: pos,
      rect: zoneRef.current?.getBoundingClientRect() ?? null,
    });
  }, [extension.options.onRequestMedia, getPos, type]);

  return (
    <NodeViewWrapper data-placeholder-type={type}>
      <div
        ref={zoneRef}
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.preventDefault();
          openMediaPicker();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openMediaPicker();
          }
        }}
        className={cn(
          "rt-media-placeholder flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center text-slate-600 outline-none transition hover:border-slate-400 hover:bg-slate-100/80 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2",
        )}
      >
        <div className="rounded-full bg-white/90 p-3 text-slate-500 shadow-sm ring-1 ring-slate-200/80">
          <Icon className="h-7 w-7" />
        </div>
        <p className="max-w-sm text-sm font-medium text-slate-700">
          Cliquez ici pour insérer une image/vidéo
        </p>
        <NodeViewContent className="hidden" />
      </div>
    </NodeViewWrapper>
  );
};

export const MediaPlaceholder = Node.create<MediaPlaceholderOptions>({
  name: "mediaPlaceholder",

  group: "block",
  atom: true,
  selectable: true,
  allowGapCursor: true,
  draggable: false,
  defining: true,

  addOptions() {
    return {
      onRequestMedia: undefined,
    };
  },

  addAttributes() {
    return {
      type: {
        default: "image",
        parseHTML: (element) => element.getAttribute("data-type") ?? "image",
        renderHTML: (attributes) => ({
          "data-type": attributes.type,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-media-placeholder]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-media-placeholder": "" }), 0];
  },

  addCommands() {
    return {
      setMediaPlaceholder:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
          }),
      clearMediaPlaceholder:
        () =>
        ({ tr, dispatch }) => {
          const { selection } = tr;
          const node =
            selection && "node" in selection
              ? (selection as { node?: { type?: { name?: string } } }).node
              : null;
          if (node?.type?.name === this.name) {
            if (dispatch) {
              tr.delete(selection.from, selection.to);
            }
            return true;
          }
          return false;
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(MediaPlaceholderComponent);
  },
});
