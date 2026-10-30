import { redirect } from "next/navigation";

export default function ExpertRendezVousRedirect() {
  redirect("/dashboard/expert/agenda");
}
