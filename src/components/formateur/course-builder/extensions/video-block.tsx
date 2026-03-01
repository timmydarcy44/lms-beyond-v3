import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewRendererProps } from "@tiptap/react";
import { useMemo } from "react";

type VideoBlockOptions = {
  HTMLAttributes?: Record<string, unknown>;
};

type VideoBlockCommandOptions = {
  src: string;
  provider?: "youtube" | "vimeo" | "file";
  autoplay?: boolean;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    videoBlock: {
      setVideoBlock: (attrs: VideoBlockCommandOptions) => ReturnType;
    };
  }
}

const VideoNodeView = ({ node }: NodeViewRendererProps) => {
  const { src, provider } = node.attrs as { src: string; provider?: string };
  const isIframe = useMemo(() => provider === "youtube" || provider === "vimeo", [provider]);

  if (!src) {
    return (
      <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-center text-sm text-white/50">
        Vidéo indisponible
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_18px_45px_rgba(12,20,31,0.5)]">
      {isIframe ? (
        <iframe
          src={src}
          className="h-full w-full"
          allowFullScreen
          title="Video"
        />
      ) : (
        <video
          src={src}
          controls
          className="h-full w-full"
        />
      )}
    </div>
  );
};

export const VideoBlock = Node.create<VideoBlockOptions>({
  name: "videoBlock",

  group: "block",
  atom: true,
  draggable: false,
  selectable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      provider: {
        default: "file",
      },
      autoplay: {
        default: false,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-video-block]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-video-block": "",
      }),
    ];
  },

  addCommands() {
    return {
      setVideoBlock:
        (attrs: VideoBlockCommandOptions) =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            const node = this.type.create(attrs);
            tr.replaceSelectionWith(node).scrollIntoView();
          }
          return true;
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoNodeView);
  },
});
