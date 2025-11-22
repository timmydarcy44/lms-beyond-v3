import { ReactNode } from 'react';

/**
 * Layout spécifique pour le catalogue No School
 * Pas de sidebar/header du dashboard - interface style Netflix complète
 * Fond noir par défaut, pas de padding/margin blanc
 */
export default function CatalogueLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 overflow-y-auto" style={{ backgroundColor: '#000000' }}>
      {children}
    </div>
  );
}

