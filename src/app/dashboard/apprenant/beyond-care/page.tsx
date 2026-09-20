import { redirect } from "next/navigation";

/** Alias historique → EDGE Care. */
export default function BeyondCareRedirect() {
  redirect("/dashboard/apprenant/care");
}
