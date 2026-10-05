import { redirect } from "next/navigation";

/** Ancienne URL marketing — redirige vers le tunnel Byound unifié. */
export default function EdgeOrientationLegacyPage() {
  redirect("/votre-orientation");
}
