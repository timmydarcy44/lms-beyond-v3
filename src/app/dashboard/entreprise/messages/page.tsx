import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { ENTREPRISE_H1_CLASS } from "@/lib/entreprise/styles";

export default function EntrepriseMessagesPage() {
  return (
    <div className="flex min-h-screen bg-white text-gray-900">
      <EnterpriseSidebar />
      <main className="flex flex-1 flex-col px-4 py-8 sm:px-6 lg:px-10 lg:pl-[280px]">
        <header className="mb-10 text-center">
          <h1 className={ENTREPRISE_H1_CLASS}>Messages</h1>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="text-lg font-semibold text-gray-700">Bientôt disponible</p>
          <p className="text-gray-400">Cette section arrive prochainement.</p>
        </div>
      </main>
    </div>
  );
}
