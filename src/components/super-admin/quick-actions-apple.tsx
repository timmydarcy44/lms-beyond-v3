"use client";

import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type QuickAction = {
  id: string;
  title: string;
  description: string;
  href: string;
  image: string;
  gradient: string;
};

type QuickActionsAppleProps = {
  actions: QuickAction[];
  className?: string;
};

export function QuickActionsApple({ actions, className }: QuickActionsAppleProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <h2 className="text-2xl font-semibold text-gray-900">Actions rapides</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            className="group relative h-[400px] overflow-hidden rounded-2xl cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
          >
            {/* Image de fond */}
            <div className="absolute inset-0">
              <Image
                src={action.image}
                alt={action.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {/* Gradient overlay */}
              <div className={cn("absolute inset-0 bg-gradient-to-br", action.gradient)} />
              {/* Overlay sombre pour la lisibilité du texte */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
            </div>

            {/* Contenu */}
            <div className="relative z-10 flex h-full flex-col justify-end p-6">
              {/* Badge "Innovation", "Caméras", etc. */}
              <div className="mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-white/70">
                  {action.id === "create-org" ? "Organisation" : action.id === "create-admin" ? "Administration" : "Utilisateurs"}
                </span>
              </div>

              {/* Titre principal */}
              <h3 className="text-2xl font-bold text-white mb-2">
                {action.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-white/90 mb-4 line-clamp-2">
                {action.description}
              </p>

              {/* Bouton + */}
              <div className="flex items-center justify-end">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-all group-hover:bg-black/60">
                  <Plus className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}




