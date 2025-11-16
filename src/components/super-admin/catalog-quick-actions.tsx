"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, BookOpen, Route, FileText, ClipboardList, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddCatalogItemModal } from "./add-catalog-item-modal";

type QuickAction = {
  id: string;
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
  image: string;
};

export function CatalogQuickActions() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItemType, setSelectedItemType] = useState<"module" | "parcours" | "ressource" | "test" | null>(null);

  const actions: QuickAction[] = [
    {
      id: "module",
      title: "Créer un module",
      description: "Développez un nouveau module de formation complet",
      href: "/super/studio/modules/new",
      image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80",
    },
    {
      id: "add-module",
      title: "Ajouter un module",
      description: "Ajoutez un module existant au catalogue",
      onClick: () => {
        setSelectedItemType("module");
        setShowAddModal(true);
      },
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
    },
    {
      id: "modify-module",
      title: "Modifier un module",
      description: "Reprenez et modifiez un module existant",
      href: "/super/studio/modules",
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
    },
    {
      id: "parcours",
      title: "Créer un parcours",
      description: "Assemblez plusieurs formations en parcours",
      href: "/super/studio/parcours/new",
      image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80",
    },
    {
      id: "add-parcours",
      title: "Ajouter un parcours",
      description: "Ajoutez un parcours existant au catalogue",
      onClick: () => {
        setSelectedItemType("parcours");
        setShowAddModal(true);
      },
      image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80",
    },
    {
      id: "ressource",
      title: "Créer une ressource",
      description: "Ajoutez des ressources pédagogiques",
      href: "/super/studio/ressources/new",
      image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80",
    },
    {
      id: "add-ressource",
      title: "Ajouter une ressource",
      description: "Ajoutez une ressource existante au catalogue",
      onClick: () => {
        setSelectedItemType("ressource");
        setShowAddModal(true);
      },
      image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80",
    },
    {
      id: "test",
      title: "Créer un test",
      description: "Concevez des évaluations et quiz",
      href: "/super/studio/tests/new",
      image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80",
    },
    {
      id: "add-test",
      title: "Ajouter un test",
      description: "Ajoutez un test existant au catalogue",
      onClick: () => {
        setSelectedItemType("test");
        setShowAddModal(true);
      },
      image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80",
    },
  ];

  return (
    <div className="mb-12 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
          Actions rapides
        </h2>
        <p className="text-sm text-gray-600">Créez rapidement du nouveau contenu pour le catalogue</p>
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        {actions.map((action) => {
          const Component = action.href ? Link : 'div';
          const props = action.href 
            ? { href: action.href, className: "group relative h-[400px] overflow-hidden rounded-2xl cursor-pointer transition-transform duration-300 hover:scale-[1.02] border border-gray-200 shadow-sm" }
            : { 
                onClick: action.onClick,
                className: "group relative h-[400px] overflow-hidden rounded-2xl cursor-pointer transition-transform duration-300 hover:scale-[1.02] border border-gray-200 shadow-sm"
              };
          
          return (
            <Component
              key={action.id}
              {...props}
            >
              {/* Image de fond */}
              <div className="absolute inset-0">
                <Image
                  src={action.image}
                  alt={action.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Overlay sombre pour la lisibilité du texte */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
              </div>

              {/* Contenu texte superposé - style Apple */}
              <div className="absolute inset-0 z-10 flex flex-col justify-end p-6">
                {/* Badge discret en haut */}
                <div className="mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-white/70">
                    {action.id === "module" ? "Formation" : action.id === "modify-module" ? "Modification" : action.id === "parcours" ? "Parcours" : action.id === "ressource" ? "Ressource" : "Évaluation"}
                  </span>
                </div>
                {/* Titre principal - style Apple */}
                <h3 className="text-2xl font-bold text-white mb-2 leading-tight">
                  {action.title}
                </h3>
                {/* Description - style Apple */}
                <p className="text-sm text-white/90 leading-relaxed mb-4">
                  {action.description}
                </p>
                {/* Bouton + style Apple */}
                <div className="flex items-center justify-end">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-all group-hover:bg-black/60">
                    {action.id === "modify-module" ? (
                      <Edit className="h-5 w-5 text-white" />
                    ) : (
                      <Plus className="h-5 w-5 text-white" />
                    )}
                  </div>
                </div>
              </div>
            </Component>
          );
        })}
      </div>

      {/* Modal d'ajout */}
      {showAddModal && selectedItemType && (
        <AddCatalogItemModal
          open={showAddModal}
          onOpenChange={setShowAddModal}
          itemType={selectedItemType}
        />
      )}
    </div>
  );
}
