import { redirect } from "next/navigation";

/** Ancien écran Control → nouvel espace /handicap (Lot 2). */
export default function LegacyQualiopiHandicapRedirect() {
  redirect("/handicap");
}
