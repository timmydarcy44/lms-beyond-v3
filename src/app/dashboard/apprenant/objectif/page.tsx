import { redirect } from "next/navigation";

/** Redirection — l'objectif est géré dans Mon Profil EDGE. */
export default function ParticulierObjectifRedirectPage() {
  redirect("/dashboard/apprenant/profil-comportemental");
}
