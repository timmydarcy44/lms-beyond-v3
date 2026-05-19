import { redirect } from "next/navigation";

/** Alias court vers l’étape invitation du tunnel */
export default function OnboardingInvitePage() {
  redirect("/onboarding/invite-collaborators");
}
