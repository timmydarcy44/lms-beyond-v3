import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function EntrepriseFormationsIndexPage() {
  redirect("/dashboard/entreprise/formations/catalogue");
}
