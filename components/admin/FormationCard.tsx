'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  Users, 
  GraduationCap, 
  BookOpen,
  Calendar,
  Tag
} from 'lucide-react';
import { toast } from 'sonner';

interface FormationCardProps {
  formation: {
    id: string;
    title: string;
    cover_url?: string;
    visibility_mode: 'private' | 'catalog_only' | 'public';
    published: boolean;
    updated_at: string;
    theme?: string | null;
  };
}

const themes = {
  business: { label: 'Business', color: 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-600' },
  negociation: { label: 'Négociation', color: 'bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-600' },
  management: { label: 'Management', color: 'bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-600' },
  rh: { label: 'RH', color: 'bg-gradient-to-r from-pink-500/20 to-pink-600/20 text-pink-600' },
  marketing: { label: 'Marketing', color: 'bg-gradient-to-r from-orange-500/20 to-orange-600/20 text-orange-600' },
  vente: { label: 'Vente', color: 'bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-600' },
  // Thèmes iris/blush comme demandé
  iris: { label: 'Iris', color: 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-600' },
  blush: { label: 'Blush', color: 'bg-gradient-to-r from-rose-500/20 to-pink-500/20 text-rose-600' },
};

const getStatusInfo = (published: boolean, updatedAt: string) => {
  const now = new Date();
  const updated = new Date(updatedAt);
  const daysDiff = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
  
  if (published) {
    return { label: 'Publié', color: 'bg-emerald-500/20 text-emerald-400' };
  } else if (daysDiff > 7) {
    return { label: 'Enregistré', color: 'bg-gray-500/20 text-gray-400' };
  } else {
    return { label: 'En cours de création', color: 'bg-yellow-500/20 text-yellow-400' };
  }
};

export default function FormationCard({ formation }: FormationCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  const statusInfo = getStatusInfo(formation.published, formation.updated_at);
  const themeInfo = formation.theme ? themes[formation.theme as keyof typeof themes] : null;

  const handleDelete = async () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette formation ?')) {
      try {
        // TODO: Implémenter la suppression
        toast.success('Formation supprimée');
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleQuickAssign = (type: 'learner' | 'group' | 'pathway') => {
    setShowAssignModal(true);
    // TODO: Ouvrir modal d'assignation rapide
  };

  return (
    <>
      <div className="group glass rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 relative">
        {/* Image de couverture */}
        <div className="aspect-video bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center relative overflow-hidden">
          {/* Badge thème en haut à gauche */}
          {themeInfo && (
            <div className={`absolute top-3 left-3 px-2 py-1 rounded-md text-xs font-medium ${themeInfo.color} backdrop-blur-sm border-0`}>
              <Tag size={12} className="inline mr-1" />
              {themeInfo.label}
            </div>
          )}
          
          {formation.cover_url ? (
            <img 
              src={formation.cover_url} 
              alt={formation.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="text-white/50 text-sm">Image de couverture</div>
          )}
          
          {/* Overlay avec actions rapides */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleQuickAssign('learner');
                }}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
                title="Assigner à des apprenants"
              >
                <Users className="h-4 w-4 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleQuickAssign('group');
                }}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
                title="Assigner à des groupes"
              >
                <GraduationCap className="h-4 w-4 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleQuickAssign('pathway');
                }}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
                title="Assigner à des parcours"
              >
                <BookOpen className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Contenu de la carte */}
        <div className="p-4">
          {/* Badges de statut et thème */}
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            {themeInfo && (
              <span className={`text-xs px-2 py-1 rounded-full ${themeInfo.color}`}>
                {themeInfo.label}
              </span>
            )}
          </div>

          {/* Titre */}
          <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-blue-300 transition-colors">
            {formation.title}
          </h3>

          {/* Date de modification */}
          <div className="flex items-center gap-1 text-xs text-white/50 mb-4">
            <Calendar className="h-3 w-3" />
            Modifié le {new Date(formation.updated_at).toLocaleDateString()}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/formations/${formation.id}`}
                className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-sm rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                <Edit className="h-3 w-3 inline mr-1" />
                Modifier
              </Link>
              
              <Link
                href={`/admin/formations/${formation.id}/preview`}
                className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-sm rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                <Eye className="h-3 w-3 inline mr-1" />
                Prévisualiser
              </Link>
            </div>

            {/* Menu actions */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setShowActions(!showActions);
                }}
                className="p-1.5 text-white/50 hover:text-white/70 hover:bg-white/10 rounded-lg transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {showActions && (
                <div className="absolute right-0 top-full mt-1 bg-gray-800 rounded-lg shadow-xl border border-white/10 py-1 z-10 min-w-[120px]">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete();
                      setShowActions(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="h-3 w-3" />
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'assignation rapide */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Assignation rapide</h3>
            <p className="text-gray-600 mb-4">Assigner "{formation.title}" à :</p>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  // TODO: Ouvrir sélecteur d'apprenants
                  setShowAssignModal(false);
                }}
                className="w-full p-3 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg transition-colors flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Des apprenants
              </button>
              <button
                onClick={() => {
                  // TODO: Ouvrir sélecteur de groupes
                  setShowAssignModal(false);
                }}
                className="w-full p-3 bg-green-50 hover:bg-green-100 text-green-800 rounded-lg transition-colors flex items-center gap-2"
              >
                <GraduationCap className="h-4 w-4" />
                Des groupes
              </button>
              <button
                onClick={() => {
                  // TODO: Ouvrir sélecteur de parcours
                  setShowAssignModal(false);
                }}
                className="w-full p-3 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg transition-colors flex items-center gap-2"
              >
                <BookOpen className="h-4 w-4" />
                Des parcours
              </button>
            </div>
            
            <button
              onClick={() => setShowAssignModal(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </>
  );
}
