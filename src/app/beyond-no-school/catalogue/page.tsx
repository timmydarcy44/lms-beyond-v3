import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { BeyondNoSchoolPage } from "@/components/beyond-no-school/beyond-no-school-page";

export default async function BeyondNoSchoolCataloguePage() {
  const session = await getSession();
  if (!session) {
    redirect("/beyond-no-school");
  }
  return <BeyondNoSchoolPage />;
}
