import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

/** Ancienne URL patient → fiche CRM unifiée */
export default async function JessicaPatientRedirect({ params }: PageProps) {
  const { id } = await params;
  redirect(`/super/jessica-crm/${id}`);
}
