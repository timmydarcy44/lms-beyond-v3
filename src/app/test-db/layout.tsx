import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Test Supabase (profil)",
  description: "Vérification de la connexion à la base et de la table profiles",
};

export default function TestDbLayout({ children }: { children: React.ReactNode }) {
  return children;
}
