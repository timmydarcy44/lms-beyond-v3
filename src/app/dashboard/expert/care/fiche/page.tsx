import { redirect } from "next/navigation";

export default function CareFichePage() {
  redirect("/dashboard/expert/profile?edit=1#byound-care");
}
