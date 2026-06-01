import { redirect } from "next/navigation";

export default function PraticienDisponibilitesRedirect() {
  redirect("/dashboard/praticien/agenda");
}
