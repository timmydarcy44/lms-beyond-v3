import { SuperAdminShell } from "@/components/super-admin/super-admin-shell";
import { BnsProofBuilder } from "@/components/super-admin/bns-proof-builder";

export default function SuperAdminNoSchoolProofsPage() {
  return (
    <SuperAdminShell
      title="Constructeur de parcours"
      breadcrumbs={[
        { label: "Super Admin", href: "/super" },
        { label: "No School", href: "/super/catalogue" },
        { label: "Briques & parcours" },
      ]}
    >
      <BnsProofBuilder />
    </SuperAdminShell>
  );
}

