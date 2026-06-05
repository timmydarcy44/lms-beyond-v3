import { redirect } from "next/navigation";

/** Soft skills : accès gratuit, redirection directe vers le test. */
export default function ApprenantSoftSkillsEntryPage() {
  redirect("/soft-skills/test");
}
