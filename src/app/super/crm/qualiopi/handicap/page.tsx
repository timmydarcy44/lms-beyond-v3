import { redirect } from "next/navigation";

/** Ancien écran Control → nouvel espace /handicap. */
export default function LegacyQualiopiHandicapRedirect() {
  redirect("/handicap");
}
