"use client";

import { CMSBlockRenderer, type Block } from "./cms-block-renderer";
import { cn } from "@/lib/utils";

type CMSPage = {
  id: string;
  slug: string;
  title: string;
  h1?: string;
  h2?: string;
  content: Block[];
};

type CMSPageRendererProps = {
  page: CMSPage;
};

export function CMSPageRenderer({ page }: CMSPageRendererProps) {
  // Si c'est la landing page, utiliser le style de la landing
  const isLanding = page.slug === "landing";
  
  return (
    <div className={cn(
      "min-h-screen",
      isLanding ? "bg-[#F8F9FB]" : "bg-white"
    )}>
      <article className="max-w-7xl mx-auto px-6 py-16">
        {/* H1 si défini */}
        {page.h1 && (
          <h1 className="text-5xl md:text-7xl font-semibold text-gray-900 mb-8 leading-tight" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
            {page.h1}
          </h1>
        )}

        {/* H2 si défini */}
        {page.h2 && (
          <h2 className="text-3xl md:text-5xl font-medium text-gray-700 mb-12 leading-tight" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
            {page.h2}
          </h2>
        )}

        {/* Contenu des blocs */}
        <div className="space-y-8">
          {page.content && Array.isArray(page.content) && page.content.length > 0 ? (
            page.content.map((block) => (
              <CMSBlockRenderer key={block.id} block={block} />
            ))
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                Aucun contenu disponible.
              </p>
              <p className="text-gray-300 text-sm mt-2" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                Ajoutez des éléments depuis la barre latérale
              </p>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}

