import Link from "next/link";
import { Manrope } from "next/font/google";
import { loadControlCockpit } from "@/lib/control/load";

const manrope = Manrope({ subsets: ["latin"] });

export const dynamic = "force-dynamic";

export default async function ComparerComptesPage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const { ids } = await searchParams;
  const selected = new Set((ids ?? "").split(",").filter(Boolean));
  const data = await loadControlCockpit();
  const accounts = data.accounts.filter((account) => selected.has(account.id));
  return (
    <div className={`${manrope.className} mx-auto max-w-[1100px] px-6 py-8`} style={{ background: "#0A0F1E", color: "#F4F7FF", minHeight: "100vh" }}>
      <Link href="/super/organisations" className="text-sm text-[#9AA6C2]">Retour aux comptes</Link>
      <h1 className="mt-3 text-3xl font-extrabold">Comparer</h1>
      <p className="mt-2 max-w-2xl text-sm text-[#C9D2E8]">
        La fusion n'est pas exécutée. Cette comparaison sert à choisir, plus tard, quel compte garder, avec confirmation et sauvegarde.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {accounts.map((account) => (
          <article key={account.id} className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
            <h2 className="text-xl font-bold">{account.name}</h2>
            <p className="mt-1 text-sm text-[#9AA6C2]">{account.slug}</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>Statut : {account.status}</li>
              <li>Type : {account.kind}</li>
              <li>Utilisateurs : {account.activeUsers} / {account.totalUsers}</li>
              <li>Étape : {account.onboardingStep ?? "—"}</li>
              <li>Créé le : {account.createdAt ? new Date(account.createdAt).toLocaleString("fr-FR") : "—"}</li>
            </ul>
            <Link href={`/super/organisations/${account.id}`} className="mt-4 inline-block rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-[#0A0F1E]">Ouvrir</Link>
          </article>
        ))}
      </div>
    </div>
  );
}
