"use client";

import { useCallback, useMemo, useState } from "react";
import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewRendererProps } from "@tiptap/react";
import { Node, mergeAttributes } from "@tiptap/core";
import { ImagePlus, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type MediaPlaceholderRequest =
  | { type: "image" }
  | { type: "video" };

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
}: NodeViewRendererProps & { extension: MediaPlaceholderExtension }) => {
  const { type = "image" } = node.attrs as { type?: "image" | "video" };
  const [hovered, setHovered] = useState(false);
  const icon = useMemo(() => (type === "video" ? Video : ImagePlus), [type]);
  const Icon = icon;

  const requestMedia = useCallback(
    (requestType: "image" | "video") => {
      const handler = extension.options.onRequestMedia;
      if (!handler) return;
      handler({ type: requestType });
    },
    [extension.options.onRequestMedia],
  );

  return (
    <NodeViewWrapper
      className={cn(
        "rt-media-placeholder relative flex min-h-[160px] items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-center text-white/70 transition",
        hovered ? "border-white/35 bg-white/10 shadow-[0_18px_45px_rgba(12,20,31,0.4)]" : "",
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-placeholder-type={type}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-full bg-white/10 p-3 text-white">
          <Icon className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-white/85">
            {type === "video" ? "Ajoutez une vidéo" : "Ajoutez une image"}
          </p>
          <p className="text-xs text-white/60">
            Glissez-déposez un fichier ou utilisez les actions ci-dessous.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full border border-white/15 bg-white/10 px-4 text-xs text-white/80 hover:border-white/25 hover:text-white"
            onClick={() => requestMedia("image")}
          >
            Insérer une image
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full border border-white/15 bg-white/10 px-4 text-xs text-white/80 hover:border-white/25 hover:text-white"
            onClick={() => requestMedia("video")}
          >
            Insérer une vidéo
          </Button>
        </div>
      </div>
      <NodeViewContent className="hidden" />
    </NodeViewWrapper>
  );
};

export const MediaPlaceholder = Node.create<MediaPlaceholderOptions>({
  name: "mediaPlaceholder",

  group: "block",
  atom: true,
  selectable: true,
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
