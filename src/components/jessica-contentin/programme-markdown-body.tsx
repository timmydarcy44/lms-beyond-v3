import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const markdownComponents: Partial<Components> = {
  h1: ({ children }) => (
    <h1 className="mb-4 text-3xl font-bold tracking-tight text-[#2F2A25] md:text-4xl">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-4 mt-12 border-t border-[#E6D9C6] pt-10 text-xl font-semibold tracking-tight text-[#2F2A25] first:mt-0 first:border-t-0 first:pt-0 md:text-2xl">
      {children}
    </h2>
  ),
  h3: ({ children }) => <h3 className="mb-3 mt-8 text-lg font-semibold text-[#2F2A25]">{children}</h3>,
  p: ({ children }) => <p className="mb-4 text-base leading-relaxed text-[#4A4339] md:text-lg">{children}</p>,
  ul: ({ children }) => <ul className="mb-6 list-disc space-y-2 pl-6 text-[#2F2A25]/90">{children}</ul>,
  ol: ({ children }) => <ol className="mb-6 list-decimal space-y-2 pl-6 text-[#2F2A25]/90">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-[#2F2A25]">{children}</strong>,
  hr: () => <hr className="my-10 border-[#E6D9C6]" />,
  blockquote: ({ children }) => (
    <blockquote className="my-6 border-l-4 border-[#C6A664] pl-4 text-[#5C5348]">{children}</blockquote>
  ),
};

export function ProgrammeMarkdownBody({ content }: { content: string }) {
  return (
    <article id="programme-detail" className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </article>
  );
}
