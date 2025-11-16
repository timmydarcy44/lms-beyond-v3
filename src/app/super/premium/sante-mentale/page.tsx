import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { SuperAdminShell } from "@/components/super-admin/super-admin-shell";
import { BeyondCareList } from "@/components/super-admin/beyond-care-list";

export default async function SanteMentalePage() {
  const hasAccess = await isSuperAdmin();
  
  if (!hasAccess) {
    redirect("/dashboard");
  }

  // Rediriger vers la nouvelle route
  redirect("/super/premium/beyond-care");
}

