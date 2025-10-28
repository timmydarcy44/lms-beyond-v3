import Link from "next/link";
import Image from "next/image";
import { Users, UserPlus, Layers, Wrench, BookOpen, MoreVertical } from "lucide-react";
import { UploadCover } from "@/components/UploadCover";
import { AssignModal } from "@/components/AssignModal";
import { useState } from "react";

type Props = {
  id: string;
  title: string;
  description?: string | null;
  cover_url?: string | null;
  stats?: { sections: number; chapters: number; subchapters: number; };
  updated_at?: string;
};

export function FormationCard({ id, title, description, cover_url, stats, updated_at }: Props) {
  const [currentCover, setCurrentCover] = useState(cover_url);
  const [assignModal, setAssignModal] = useState<{ isOpen: boolean; kind: "user" | "group" | "pathway" }>({ 
    isOpen: false, 
    kind: "user" 
  });
  const initials = title?.split(' ').map((word: string) => word[0]).join('').slice(0, 2) || '??';
  
  return (
    <div className="group rounded-2xl border border-white/5 bg-[#0E0E0E] overflow-hidden hover:border-white/10 transition-all duration-300 hover:shadow-lg hover:shadow-black/20">
      <div className="relative aspect-[16/9] bg-white/[0.02]">
        {currentCover ? (
          <Image 
            src={currentCover} 
            alt={title} 
            fill 
            className="object-cover group-hover:scale-105 transition-transform duration-300" 
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">{initials}</span>
          </div>
        )}
        
        {/* Menu overlay pour upload */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2">
            <UploadCover 
              formationId={id} 
              onUploaded={(url) => setCurrentCover(url)} 
            />
          </div>
        </div>
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
          <span>{stats?.sections ?? 0} sections</span>
          <span>·</span>
          <span>{stats?.chapters ?? 0} chapitres</span>
          <span>·</span>
          <span>{stats?.subchapters ?? 0} leçons</span>
        </div>
        {updated_at && (
          <div className="text-xs text-white/50">
            Modifié le {new Date(updated_at).toLocaleDateString('fr-FR')}
          </div>
        )}
      </div>

      <div className="px-4 pb-4 flex items-center justify-between">
        {/* Actions sans bordure */}
        <div className="flex items-center gap-4 text-sm">
          <button 
            onClick={() => setAssignModal({ isOpen: true, kind: "user" })}
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white transition-colors"
          >
            <UserPlus className="w-4 h-4" /> 
            <span className="hidden sm:inline">Assign. apprenant</span>
          </button>
          <button 
            onClick={() => setAssignModal({ isOpen: true, kind: "group" })}
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white transition-colors"
          >
            <Users className="w-4 h-4" /> 
            <span className="hidden sm:inline">Assign. groupe</span>
          </button>
          <button 
            onClick={() => setAssignModal({ isOpen: true, kind: "pathway" })}
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white transition-colors"
          >
            <BookOpen className="w-4 h-4" /> 
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

      {/* Modal d'assignation */}
      <AssignModal
        isOpen={assignModal.isOpen}
        onClose={() => setAssignModal({ isOpen: false, kind: "user" })}
        formationId={id}
        kind={assignModal.kind}
      />
    </div>
  );
}
