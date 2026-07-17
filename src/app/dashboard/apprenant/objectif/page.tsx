import { redirect } from "next/navigation";

/** Redirection — l'objectif et la progression vivent dans Mon évolution. */
export default function ParticulierObjectifRedirectPage() {
  redirect("/dashboard/apprenant");
}
