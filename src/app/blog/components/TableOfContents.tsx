"use client";

import Link from "next/link";

type TocItem = {
  id: string;
  title: string;
};

export function TableOfContents({ items }: { items: TocItem[] }) {
  if (!items.length) return null;

  return (
    <aside className="hidden lg:block sticky top-24 self-start">
      <div className="rounded-2xl border border-[#E8E9F0] bg-white/80 backdrop-blur px-5 py-4 shadow-sm">
        <p className="text-xs uppercase tracking-[0.25em] text-[#be1354] font-semibold mb-4">Sommaire</p>
        <nav className="space-y-3 text-sm text-[#1A1A1A]">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`#${item.id}`}
              className="block hover:text-[#be1354] transition-colors"
            >
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
