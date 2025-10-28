import Link from "next/link";
import Image from "next/image";
import { Users, UserPlus, Layers, Wrench } from "lucide-react";

type Props = {
  id: string;
  title: string;
  description?: string | null;
  cover_url?: string | null;
  stats?: { formations: number; resources: number; tests: number; };
};

export function PathwayCard({ id, title, description, cover_url, stats }: Props) {
  return (
    <div className="group rounded-2xl border border-white/5 bg-[#0E0E0E] overflow-hidden hover:border-white/10 transition-all duration-300 hover:shadow-lg hover:shadow-black/20">
      <div className="relative aspect-[16/9] bg-white/[0.02]">
        {cover_url ? (
          <Image 
            src={cover_url} 
            alt={title} 
            fill 
            className="object-cover group-hover:scale-105 transition-transform duration-300" 
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-white/30 text-sm">
            Pas de cover
          </div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-white/60 line-clamp-2">
            {description}
          </p>
        )}
        <div className="flex items-center gap-3 text-xs text-white/60">
          <span>{stats?.formations ?? 0} formations</span>
          <span>·</span>
          <span>{stats?.resources ?? 0} ressources</span>
          <span>·</span>
          <span>{stats?.tests ?? 0} tests</span>
        </div>
      </div>

      <div className="px-4 pb-4 flex items-center justify-between">
        {/* Actions sans bordure */}
        <div className="flex items-center gap-4 text-sm">
          <button className="inline-flex items-center gap-1.5 text-white/70 hover:text-white transition-colors">
            <UserPlus className="w-4 h-4" /> 
            <span className="hidden sm:inline">Assign. apprenant</span>
          </button>
          <button className="inline-flex items-center gap-1.5 text-white/70 hover:text-white transition-colors">
            <Users className="w-4 h-4" /> 
            <span className="hidden sm:inline">Assign. groupe</span>
          </button>
          <button className="inline-flex items-center gap-1.5 text-white/70 hover:text-white transition-colors">
            <Layers className="w-4 h-4" /> 
            <span className="hidden sm:inline">Assign. parcours</span>
          </button>
        </div>

        {/* Ouvrir le builder */}
        <Link 
          href={`/formations/${id}/builder`} 
          className="inline-flex items-center gap-1.5 btn-gradient-sm"
        >
          <Wrench className="w-4 h-4" /> 
          <span className="hidden sm:inline">Ouvrir le constructeur</span>
        </Link>
      </div>
    </div>
  );
}



