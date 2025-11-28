import { redirect } from "next/navigation";

export default function AdminBeyondConnectPage() {
  // Rediriger vers l'interface Beyond Connect pour les entreprises
  // La vérification d'accès est faite dans le layout
  redirect("/beyond-connect-app/companies");
}

