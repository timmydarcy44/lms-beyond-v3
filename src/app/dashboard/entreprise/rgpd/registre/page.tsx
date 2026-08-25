import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { ENTREPRISE_H1_CLASS } from "@/lib/entreprise/styles";
import { EDGE_DPO_CONTACT, EDGE_PROCESSING_REGISTER } from "@/lib/entreprise/rgpd-register";

export default function EntrepriseRgpdRegisterPage() {
  return (
    <div className="flex min-h-screen bg-[#f7f5fb] text-gray-900">
      <EnterpriseSidebar />
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:pl-[280px]">
        <header className="mb-8 max-w-4xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-500">
            RGPD · Art. 30
          </p>
          <h1 className={`mt-2 text-left ${ENTREPRISE_H1_CLASS}`}>Registre des traitements</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500">
            Inventaire des traitements opérés dans l’espace entreprise EDGE — finalité, base
            légale, catégories, destinataires et durée de conservation.
          </p>
          <p className="mt-2 text-xs text-gray-400">
            Contact DPO / privacy : {EDGE_DPO_CONTACT.email}
          </p>
        </header>

        <div className="mx-auto max-w-4xl space-y-4">
          {EDGE_PROCESSING_REGISTER.map((item) => (
            <article
              key={item.id}
              className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-500">
                    {item.id}
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-gray-950">{item.name}</h2>
                </div>
                <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                  {item.legalBasisLabel}
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-600">{item.purpose}</p>

              <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Catégories de données
                  </p>
                  <ul className="mt-1 list-disc pl-4 text-gray-700">
                    {item.categories.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Destinataires
                  </p>
                  <ul className="mt-1 list-disc pl-4 text-gray-700">
                    {item.recipients.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Conservation
                  </p>
                  <p className="mt-1 text-gray-700">{item.retention}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Mesures de sécurité
                  </p>
                  <ul className="mt-1 list-disc pl-4 text-gray-700">
                    {item.securityMeasures.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="mt-4 text-xs text-gray-400">
                Transfert hors UE : {item.transfersOutsideEu ? "Oui" : "Non"}
              </p>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
