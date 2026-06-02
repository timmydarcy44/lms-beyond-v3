"use client";

import { useSearchParams } from "next/navigation";

export function SuperAdminEntrepriseNotice() {
  const params = useSearchParams();
  if (params.get("notice") !== "super_admin_entreprise") return null;

  return (
    <div className="mb-6 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
      Vous êtes connecté en <strong>super admin</strong>. Pour administrer Beyond, utilisez cet espace{" "}
      <strong>/super</strong>. Le dashboard entreprise est réservé aux responsables RH liés à une organisation.
    </div>
  );
}
