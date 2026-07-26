import Link from "next/link";
import { redirect } from "next/navigation";
import { FileCheck2 } from "lucide-react";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";
import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";
import { JessicaSuperPage } from "@/components/jessica-contentin/super/jessica-super-ui";
import { jessicaSuper } from "@/lib/jessica-contentin/super-theme";
import { cn } from "@/lib/utils";

export const revalidate = 0;

const MENU = [
  {
    href: "/super/jessica-administratif/attestation-presence",
    title: "Attestation de présence",
    description: "Créer, prévisualiser et envoyer une attestation de présence à une consultation.",
    icon: FileCheck2,
  },
] as const;

export default async function JessicaAdministratifPage() {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) redirect("/dashboard");

  const supabase = await getServerClient();
  if (!supabase) redirect("/dashboard");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.email !== JESSICA_CONTENTIN_EMAIL) redirect("/super");

  return (
    <JessicaSuperPage
      title="Administratif"
      subtitle="Documents et attestations du cabinet"
      narrow
    >
      <div className="space-y-3">
        {MENU.map(({ href, title, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              jessicaSuper.card,
              "flex items-start gap-4 p-5 transition hover:border-[#8B6F47]/40 hover:shadow-sm",
            )}
          >
            <div className={jessicaSuper.iconBox}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold text-black">{title}</p>
              <p className="mt-1 text-sm text-neutral-500">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </JessicaSuperPage>
  );
}
