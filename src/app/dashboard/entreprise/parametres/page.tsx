import EnterpriseSidebar from "@/components/EnterpriseSidebar";

export default function EntrepriseParametresPage() {
  return (
    <div className="flex min-h-screen bg-[#0f0e1a] text-[#f1f0ff]">
      <EnterpriseSidebar />
      <main className="flex flex-1 items-center justify-center px-6 py-10 pl-[280px]">
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
          <p className="text-2xl font-bold">Bientôt disponible</p>
          <p className="text-[#9896b8]">Cette section arrive prochainement.</p>
        </div>
      </main>
    </div>
  );
}
