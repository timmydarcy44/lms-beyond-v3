"use client";

import { TestResultsViewer } from "@/components/catalogue/test-results-viewer";

type UserTestResultsSectionProps = {
  userId: string;
};

export function UserTestResultsSection({ userId }: UserTestResultsSectionProps) {
  // Couleurs Apple-style pour le Super Admin (blanc/beige pour contentin.cabinet@gmail.com)
  // Ces couleurs peuvent être adaptées selon le branding
  const colors = {
    primary: '#8B6F47',      // Marron chaud
    secondary: '#D4C4A8',    // Beige doux
    accent: '#D4AF37',       // Doré élégant
    text: '#5D4037',         // Marron foncé pour le texte
    textSecondary: '#8B6F47', // Marron moyen
    surface: '#F5F0E8',      // Beige clair
    background: '#F5F0E8',   // Beige clair
  };

  return (
    <div className="w-full">
      <TestResultsViewer 
        userId={userId} 
        colors={colors}
        showHeader={true}
      />
    </div>
  );
}









