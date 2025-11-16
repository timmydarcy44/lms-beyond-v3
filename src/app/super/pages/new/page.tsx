import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { GridPageBuilder } from "@/components/super-admin/cms/grid-page-builder";

export default async function NewPagePage() {
  const hasAccess = await isSuperAdmin();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  return <GridPageBuilder />;
}

