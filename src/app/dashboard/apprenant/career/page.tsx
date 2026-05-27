import { redirect } from "next/navigation";

/** Ancienne page « Ma carrière » — le profil public reste sur /p/[slug] */
export default function ApprenantCareerRedirectPage() {
  redirect("/dashboard/apprenant/profil");
}
