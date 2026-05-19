import { redirect } from "next/navigation";

/** Ancienne page profil : tout est centralisé sur le tableau de bord apprenant. */
export default function DashboardProfilRedirectPage() {
  redirect("/dashboard/apprenant");
}
