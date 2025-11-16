"use client";

export type Block = {
  id: string;
  type: "heading1" | "heading2" | "text" | "image" | "video";
  content: string;
  metadata?: {
    alt?: string;
    url?: string;
    width?: number;
    height?: number;
  };
};

type CMSBlockRendererProps = {
  block: Block;
};

export function CMSBlockRenderer({ block }: CMSBlockRendererProps) {
  switch (block.type) {
    case "heading1":
      return (
        <h1 className="text-4xl md:text-6xl font-semibold text-gray-900 mb-6 leading-tight" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
          {block.content}
        </h1>
      );

    case "heading2":
      return (
        <h2 className="text-3xl md:text-5xl font-medium text-gray-800 mb-6 leading-tight" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
          {block.content}
        </h2>
      );

    case "text":
      return (
        <div
          className="text-lg text-gray-700 leading-relaxed mb-6 prose prose-lg max-w-none"
          style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
          dangerouslySetInnerHTML={{ __html: block.content }}
        />
      );

    case "image":
      if (!block.content && !block.metadata?.url) {
        return null;
      }
      const imageUrl = block.metadata?.url || block.content;
      return (
        <div className="my-8">
          <img
            src={imageUrl}
            alt={block.metadata?.alt || "Image"}
            className="w-full h-auto rounded-lg shadow-lg"
            style={{ maxHeight: "600px", objectFit: "contain" }}
          />
        </div>
      );

    case "video":
      if (!block.content && !block.metadata?.url) {
        return null;
      }
      const videoUrl = block.metadata?.url || block.content;
      return (
        <div className="my-8">
          <video
            src={videoUrl}
            controls
            className="w-full h-auto rounded-lg shadow-lg"
            style={{ maxHeight: "600px" }}
          >
            Votre navigateur ne supporte pas la lecture de vidéos.
          </video>
        </div>
      );

    default:
      return null;
  }
}

