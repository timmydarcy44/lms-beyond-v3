import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";

export default async function EcolesPage() {
  const session = await requireSession();

  if (session.role === "formateur") {
    redirect("/dashboard/formateur");
  }

  if (session.role === "apprenant") {
    redirect("/dashboard/apprenant");
  }

  redirect("/dashboard/directeur");
}
