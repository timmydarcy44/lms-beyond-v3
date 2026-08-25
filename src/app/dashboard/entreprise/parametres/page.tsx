import Link from "next/link";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { ENTREPRISE_H1_CLASS } from "@/lib/entreprise/styles";
import { FileText, Scale, Shield } from "lucide-react";

export default function EntrepriseParametresPage() {
  return (
    <div className="flex min-h-screen bg-[#f7f5fb] text-gray-900">
      <EnterpriseSidebar />
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:pl-[280px]">
        <header className="mb-8 max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-500">
            Paramètres
          </p>
          <h1 className={`mt-2 text-left ${ENTREPRISE_H1_CLASS}`}>Paramètres</h1>
          <p className="mt-2 text-sm text-gray-500">
            Confidentialité, conformité et accès à votre compte.
          </p>
        </header>

        <div className="grid max-w-3xl gap-4">
          {[
            {
              href: "/dashboard/entreprise/compte",
              icon: Shield,
              title: "Mon compte",
              text: "Modifier le profil, export et suppression RGPD",
            },
            {
              href: "/dashboard/entreprise/rgpd/confidentialite",
              icon: FileText,
              title: "Politique de confidentialité",
              text: "Finalités, bases légales et droits des personnes",
            },
            {
              href: "/dashboard/entreprise/rgpd/registre",
              icon: Scale,
              title: "Registre des traitements",
              text: "Inventaire art. 30 RGPD des traitements EDGE Entreprise",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-start gap-4 rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm transition hover:border-violet-200"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50">
                  <Icon className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-950">{item.title}</p>
                  <p className="mt-1 text-sm text-gray-500">{item.text}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
