import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const SF_PRO =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif';

export function JessicaBlogProse({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn("jessica-blog-prose mx-auto max-w-3xl", className)}
      style={{ fontFamily: SF_PRO }}
    >
      {children}
    </div>
  );
}

export function BlogH2({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="mb-4 mt-14 scroll-mt-28 border-t border-[#E6D9C6] pt-10 text-2xl font-semibold tracking-tight text-[#2F2A25] first:mt-0 first:border-t-0 first:pt-0 md:text-[1.65rem]"
    >
      {children}
    </h2>
  );
}

export function BlogH3({ children }: { children: ReactNode }) {
  return <h3 className="mb-3 mt-8 text-lg font-semibold text-[#2F2A25] md:text-xl">{children}</h3>;
}

export function BlogP({ children }: { children: ReactNode }) {
  return <p className="mb-5 text-base leading-[1.75] text-[#4A4339] md:text-[1.05rem]">{children}</p>;
}

export function BlogUl({ children }: { children: ReactNode }) {
  return <ul className="mb-6 list-disc space-y-2.5 pl-6 text-[#4A4339]">{children}</ul>;
}

export function BlogOl({ children }: { children: ReactNode }) {
  return <ol className="mb-6 list-decimal space-y-2.5 pl-6 text-[#4A4339]">{children}</ol>;
}

export function BlogLi({ children }: { children: ReactNode }) {
  return <li className="leading-[1.7]">{children}</li>;
}

export function BlogBlockquote({ children, cite }: { children: ReactNode; cite?: string }) {
  return (
    <blockquote
      cite={cite}
      className="my-8 rounded-2xl border border-[#E6D9C6] bg-[#FFFCF9] px-6 py-5 text-[#5C5348]"
    >
      <div className="border-l-4 border-[#C6A664] pl-5 text-base leading-relaxed italic md:text-lg">
        {children}
      </div>
    </blockquote>
  );
}

export function BlogTable({ children }: { children: ReactNode }) {
  return (
    <div className="my-8 overflow-x-auto rounded-2xl border border-[#E6D9C6]">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm md:text-base">{children}</table>
    </div>
  );
}

export function BlogCta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <div className="mt-10 rounded-2xl border border-[#C6A664]/40 bg-gradient-to-br from-[#FFFCF9] to-[#F3E8D8] p-8 text-center">
      <p className="mb-6 text-lg leading-relaxed text-[#2F2A25] md:text-xl">{children}</p>
      <a
        href={href}
        className="inline-flex items-center justify-center rounded-full bg-[#C6A664] px-8 py-4 text-base font-semibold text-white shadow-md transition hover:bg-[#B88A44]"
      >
        Prendre contact avec le cabinet
      </a>
    </div>
  );
}
