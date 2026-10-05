import { redirect } from "next/navigation";

/** Alias historique → Byound Care. */
export default function BeyondCareRedirect() {
  redirect("/dashboard/apprenant/care");
}
