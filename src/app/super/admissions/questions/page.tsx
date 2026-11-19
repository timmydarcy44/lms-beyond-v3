import { redirect } from "next/navigation";

import { AdmissionQuestionsAdmin } from "@/components/super-admin/admission-questions-admin";
import { getSession } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export const metadata = {
  title: "Questions candidature — Admissions",
};

export default async function Page() {
  const session = await getSession();
  if (!session) redirect("/login");
  const ok = await isSuperAdmin();
  if (!ok) redirect("/unauthorized");
  return <AdmissionQuestionsAdmin />;
}
