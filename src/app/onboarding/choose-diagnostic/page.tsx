import { redirect } from "next/navigation";

/** Aligné sur le tunnel Beyond Center (étape diagnostic) */
export default function OnboardingChooseDiagnosticRedirectPage() {
  redirect("/beyond-center/onboarding/choose-diagnostic");
}
