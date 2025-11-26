import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Beyond Center - Écosystème de développement des compétences",
  description: "Développez vos compétences, certifiez-vous et optimisez votre insertion professionnelle avec Beyond Center.",
};

export default function BeyondCenterAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

