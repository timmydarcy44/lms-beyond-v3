import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Espace Entreprises - Beyond Connect",
  description: "Gérez vos offres d'emploi, votre CVthèque et vos matchings",
};

export default async function BeyondConnectCompaniesPage() {
  redirect("/dashboard/entreprise");
}

