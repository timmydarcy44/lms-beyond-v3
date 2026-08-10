import { redirect } from "next/navigation";
import Link from "next/link";
import { Library } from "lucide-react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveSalarieOrgEdgeOffer } from "@/lib/salarie/org-edge-offer";
import {
  SALARIE_CARD,
  SALARIE_PAGE_KICKER,
  SALARIE_PAGE_LEAD,
  SALARIE_PAGE_SHELL,
  SALARIE_PAGE_TITLE,
} from "@/lib/salarie/connect-nav";

export const dynamic = "force-dynamic";

export default async function SalarieBibliothequePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect("/login");
  }

  const { hasLibraryAccess, offer } = await resolveSalarieOrgEdgeOffer(user.id, supabase);

  if (hasLibraryAccess) {
    redirect("/edgeonline");
  }

  return (
    <div className={SALARIE_PAGE_SHELL}>
      <p className={SALARIE_PAGE_KICKER}>Bibliothèque</p>
      <h1 className={SALARIE_PAGE_TITLE}>Bibliothèque de formations</h1>
      <p className={SALARIE_PAGE_LEAD}>
        Accédez aux micro-formations EDGE prêtes à l’emploi — disponibles avec l’offre{" "}
        <span className="text-white/80">EDGE Learning+</span> de votre entreprise.
      </p>

      <div className={`${SALARIE_CARD} mt-8 max-w-2xl`}>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3D7BFF]/15 text-[#3D7BFF]">
          <Library className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <h2 className="mt-5 text-lg font-semibold text-white">Accès non activé</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/55">
          {offer
            ? `Votre entreprise est actuellement sur l’offre EDGE ${
                offer === "learning-plus"
                  ? "Learning+"
                  : offer === "learning"
                    ? "Learning"
                    : "Skills"
              }. La bibliothèque complète se débloque avec EDGE Learning+.`
            : "Votre entreprise n’a pas encore activé EDGE Learning+. Demandez à votre RH d’évoluer vers cette offre pour débloquer la bibliothèque."}
        </p>
        <Link
          href="/dashboard/salarie/formations"
          className="mt-6 inline-flex text-sm font-semibold text-[#3D7BFF] transition hover:text-white"
        >
          Voir mes formations recommandées →
        </Link>
      </div>
    </div>
  );
}
