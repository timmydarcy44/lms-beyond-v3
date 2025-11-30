"use client";

import Link from "next/link";
import { INTERNAL_LINKING } from "@/lib/seo/jessica-contentin-seo";

interface InternalLinksProps {
  currentPage: keyof typeof INTERNAL_LINKING;
  className?: string;
}

export function InternalLinks({ currentPage, className = "" }: InternalLinksProps) {
  const links = INTERNAL_LINKING[currentPage] || [];

  if (links.length === 0) return null;

  return (
    <nav 
      className={`py-8 border-t border-[#E6D9C6] ${className}`}
      aria-label="Navigation interne"
    >
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-lg font-semibold text-[#2F2A25] mb-4">
          Pages connexes
        </h2>
        <ul className="flex flex-wrap gap-4">
          {links.map((link, index) => (
            <li key={index}>
              <Link
                href={link.url}
                className="text-[#C6A664] hover:text-[#B88A44] underline text-sm transition-colors"
                title={link.context}
              >
                {link.anchor}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

