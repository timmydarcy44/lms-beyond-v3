import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Beyond LMS - L'apprentissage repensé pour l'esprit, le corps et l'âme",
  description:
    "Une plateforme d'apprentissage qui s'adapte au cerveau humain. Fusion des neurosciences, de la psychologie et du design minimaliste.",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

