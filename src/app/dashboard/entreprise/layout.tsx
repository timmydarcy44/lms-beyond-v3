import type { ReactNode } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isUniversalAdminRole } from "@/lib/auth/is-admin-role";
import { EntrepriseFloatingAssistant } from "@/components/enterprise/entreprise-floating-assistant";
import { EnterpriseSignupProfileGate } from "@/components/enterprise/enterprise-signup-profile-overlay";

async function isSuperAdminPreviewMode() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return false;
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, role_type, company_id")
      .eq("id", user.id)
      .maybeSingle();
    const row = profile as { role?: string | null; role_type?: string | null; company_id?: string | null } | null;
    if (!row) return false;
    const role = String(row.role ?? "").toLowerCase();
    const roleType = String(row.role_type ?? "").toLowerCase();
    const isSuper =
      isUniversalAdminRole(role) || role === "super_admin" || roleType === "super_admin";
    return isSuper && !row.company_id?.trim();
  } catch {
    return false;
  }
}

export default async function EntrepriseDashboardLayout({ children }: { children: ReactNode }) {
  const previewMode = await isSuperAdminPreviewMode();

  return (
    <>
      {previewMode ? (
        <div className="sticky top-0 z-[60] border-b border-violet-200 bg-violet-50/95 px-4 py-2 text-center text-xs font-medium text-violet-800 backdrop-blur-sm">
          Mode aperçu — Vous êtes connecté en tant que super admin
        </div>
      ) : null}
      <EnterpriseSignupProfileGate>{children}</EnterpriseSignupProfileGate>
      <EntrepriseFloatingAssistant />
    </>
  );
}
