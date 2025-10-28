import { Folder } from "lucide-react";

export default async function RessourcesPage() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-8">
        <Folder className="w-8 h-8 text-[#5B7CFF]" />
        <h1 className="text-3xl font-extrabold text-white">Ressources</h1>
      </div>

      <div className="flex items-center justify-center h-80 bg-[#0F1522] rounded-2xl border border-white/5">
        <div className="text-center">
          <h2 className="text-xl font-extrabold mb-4 text-white">Aucune ressource</h2>
          <p className="text-[#E6E6E6]/60 mb-6">Ajoutez votre première ressource</p>
          <button className="h-12 px-6 rounded-xl bg-gradient-to-r from-[#5B7CFF] to-[#B15BFF] text-white font-semibold hover:opacity-90 transition-opacity">
            Ajouter une ressource
          </button>
        </div>
      </div>
    </div>
  );
}
