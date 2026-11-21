import { redirect } from "next/navigation";

/** Lot 4 créera Opportunités — pour l’instant matching / recrutement. */
export default function OpportunitesRedirectPage() {
  redirect("/dashboard/apprenant/matching");
}
