'use client';

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Loader2 } from "lucide-react";

export default function FormateurTestEditPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params?.id as string;

  useEffect(() => {
    if (testId && testId !== 'new') {
      // Rediriger vers la page de création avec l'ID du test pour le charger
      router.replace(`/dashboard/formateur/tests/new?testId=${testId}`);
    } else {
      router.replace('/dashboard/formateur/tests');
    }
  }, [testId, router]);

  return (
    <DashboardShell
      title="Chargement..."
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/formateur" },
        { label: "Tests", href: "/dashboard/formateur/tests" },
        { label: "Édition" },
      ]}
    >
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-white/60" />
      </div>
    </DashboardShell>
  );
}

