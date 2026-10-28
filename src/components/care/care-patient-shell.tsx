"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";

const NAV = [
  { href: "/dashboard/patient", label: "Accueil" },
  { href: "/dashboard/patient/rendez-vous", label: "Rendez-vous" },
  { href: "/care/praticiens", label: "Praticiens" },
  { href: "/dashboard/patient/compte", label: "Compte" },
];

export function CarePatientShell({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useSupabase();

  return (
    <div className="care-root care-patient-shell">
      <div className="care-wrap">
        <div className="care-patient-nav" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/care" className="care-logo" style={{ fontWeight: 800, color: "var(--care-navy)" }}>
            Byound Care
          </Link>
          <button
            type="button"
            className="care-pill care-pill--ink"
            onClick={() => {
              void supabase.auth.signOut().then(() => router.push("/care"));
            }}
          >
            Déconnexion
          </button>
        </div>
        <p className="care-muted" style={{ margin: "8px 0 0" }}>
          Bonjour{name ? ` ${name}` : ""}
        </p>
        <nav className="care-patient-nav" aria-label="Espace patient">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={pathname === item.href ? "is-on" : ""}>
              {item.label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </div>
  );
}
