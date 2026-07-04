import type { Metadata } from "next";
import { CareerProfilesCms } from "@/components/super-admin/career-profiles/career-profiles-cms";

export const metadata: Metadata = {
  title: "Référentiel métiers | Super Admin",
  description: "Gérer les fiches métiers EDGE et générer les compétences avec ChatGPT.",
};

export const dynamic = "force-dynamic";

export default function SuperMetiersPage() {
  return <CareerProfilesCms />;
}
