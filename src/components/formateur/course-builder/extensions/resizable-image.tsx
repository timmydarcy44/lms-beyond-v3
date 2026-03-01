import { useEffect, useRef, useState } from "react";
import { mergeAttributes } from "@tiptap/core";
import { Image } from "@tiptap/extension-image";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";

type DragState = {
  startX: number;
  startWidth: number;
};

function ResizableImageView(props: NodeViewProps) {
  const { node, updateAttributes, selected } = props;
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<DragState | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const widthAttr = node.attrs.width;
  const heightAttr = node.attrs.height;
  const displayWidth = typeof widthAttr === "number" ? `${widthAttr}px` : widthAttr || "100%";
  const displayHeight = typeof heightAttr === "number" ? `${heightAttr}px` : heightAttr || "auto";

  useEffect(() => {
    if (!imgRef.current) return;
    const image = imgRef.current;

    const handleLoad = () => {
      if (!widthAttr) {
        const naturalWidth = image.naturalWidth;
        const containerWidth = containerRef.current?.getBoundingClientRect().width ?? naturalWidth;
        const initialWidth = Math.min(naturalWidth, containerWidth);
        updateAttributes({
          width: Math.round(initialWidth),
          height: Math.round((initialWidth / naturalWidth) * image.naturalHeight),
        });
      } else if (!heightAttr) {
        updateAttributes({
          height: Math.round((image.naturalHeight / image.naturalWidth) * (typeof widthAttr === "number" ? widthAttr : image.clientWidth)),
        });
      }
    };

    if (image.complete) {
      handleLoad();
    } else {
      image.addEventListener("load", handleLoad);
      return () => {
        image.removeEventListener("load", handleLoad);
      };
    }
  }, [heightAttr, updateAttributes, widthAttr]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!dragState.current || !imgRef.current || !containerRef.current) {
        return;
      }

      const ratio =
        imgRef.current.naturalHeight && imgRef.current.naturalWidth
          ? imgRef.current.naturalHeight / imgRef.current.naturalWidth
          : null;

      const deltaX = event.clientX - dragState.current.startX;
      const newWidth = Math.max(160, dragState.current.startWidth + deltaX);
      let newHeight: number | undefined;

      if (!event.shiftKey && ratio) {
        newHeight = Math.round(newWidth * ratio);
      }

      updateAttributes({
        width: Math.round(newWidth),
        height: newHeight,
      });
    };

    const handleMouseUp = () => {
      dragState.current = null;
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, updateAttributes]);

  const beginDrag = (event: React.MouseEvent) => {
    event.preventDefault();
    if (!imgRef.current) return;

    dragState.current = {
      startX: event.clientX,
      startWidth: imgRef.current.getBoundingClientRect().width,
    };
    setIsDragging(true);
  };

  return (
    <NodeViewWrapper
      ref={containerRef}
      className="rt-image-node group relative inline-flex w-full max-w-full flex-col items-center"
      data-dragging={isDragging}
      data-selected={selected}
      contentEditable={false}
    >
      <div
        className="relative w-full"
        style={{
          width: displayWidth,
          maxWidth: "100%",
        }}
      >
        <img
          ref={imgRef}
          src={node.attrs.src}
          alt={node.attrs.alt || ""}
          title={node.attrs.title || ""}
          className="h-auto max-w-full rounded-xl border border-slate-200 bg-white shadow-sm"
          style={{
            width: "100%",
            height: displayHeight === "auto" ? "auto" : displayHeight,
          }}
          draggable={false}
        />
        <button
          type="button"
          className="pointer-events-auto absolute -bottom-2 -right-2 hidden h-6 w-6 cursor-nwse-resize items-center justify-center rounded-full border border-slate-300 bg-white shadow group-data-[selected=true]:flex group-data-[dragging=true]:flex"
          onMouseDown={beginDrag}
        >
          <span className="h-2 w-2 rotate-45 border-b-2 border-r-2 border-slate-500" />
        </button>
      </div>
      <span className="mt-1 text-[10px] uppercase tracking-[0.25em] text-slate-400">
        {typeof widthAttr === "number" ? `${widthAttr}px` : widthAttr ?? "100%"}
      </span>
    </NodeViewWrapper>
  );
}

export const ResizableImage = Image.extend({
  name: "resizableImage",

  inline: false,
  group: "block",
  draggable: true,

  addAttributes() {
    return {
      ...(Image.config.addAttributes?.call(this) ?? {}),
      width: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-width") || element.style.width || null,
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          return {
            "data-width": attributes.width,
          };
        },
      },
      height: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-height") || element.style.height || null,
        renderHTML: (attributes) => {
          if (!attributes.height) return {};
          return {
            "data-height": attributes.height,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'figure[data-type="resizable-image"]' },
      { tag: 'img[src]' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const width = HTMLAttributes.width || HTMLAttributes["data-width"] || "100%";
    const height = HTMLAttributes.height || HTMLAttributes["data-height"] || null;

    const figureAttributes = mergeAttributes(
      {
        "data-type": "resizable-image",
        class: "rt-image-wrapper",
        style: `width:${typeof width === "number" ? `${width}px` : width}; max-width:100%;`,
      },
    );

    const imageAttributes = mergeAttributes(
      this.options.HTMLAttributes,
      {
        src: HTMLAttributes.src,
        alt: HTMLAttributes.alt,
        title: HTMLAttributes.title,
        style: `width:100%; height:${height ? (typeof height === "number" ? `${height}px` : height) : "auto"};`,
      },
    );

    return ["figure", figureAttributes, ["img", imageAttributes]];
  },

  addCommands() {
    return {
      setResizableImage:
        (options: Record<string, unknown>) =>
        ({ commands }: { commands: { insertContent: (input: { type: string; attrs: Record<string, unknown> }) => boolean } }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              ...options,
              width: options.width ?? null,
              height: options.height ?? null,
            },
          }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});


