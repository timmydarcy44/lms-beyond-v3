"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useOptionalEnterpriseOverviewContext } from "@/components/enterprise/enterprise-overview-provider";
import { readFormationOnlySession } from "@/lib/entreprise/formation-intent";
import {
  FORMATION_ONLY_HOME,
  isFormationOnlyAllowedPath,
} from "@/lib/entreprise/formation-only";

/** Redirige les comptes light hors des modules SaaS. */
export function FormationOnlyGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const overview = useOptionalEnterpriseOverviewContext();
  const [sessionOnly, setSessionOnly] = useState(false);

  useEffect(() => {
    setSessionOnly(readFormationOnlySession());
  }, []);

  const formationOnly =
    Boolean(overview?.data?.organisation?.formation_only) || sessionOnly;

  useEffect(() => {
    if (!formationOnly || !pathname) return;
    if (isFormationOnlyAllowedPath(pathname)) return;
    router.replace(FORMATION_ONLY_HOME);
  }, [formationOnly, pathname, router]);

  return <>{children}</>;
}
