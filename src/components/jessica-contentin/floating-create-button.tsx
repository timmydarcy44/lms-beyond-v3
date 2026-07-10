"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, BookOpen, FileText, ClipboardList, Route } from "lucide-react";
import { cn } from "@/lib/utils";
import { jessicaSuper } from "@/lib/jessica-contentin/super-theme";

export function FloatingCreateButton() {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const menuItems = [
    { label: "Créer un module", icon: BookOpen, href: "/super/studio/modules/new/choose" },
    { label: "Créer une ressource", icon: FileText, href: "/super/studio/ressources/new" },
    { label: "Créer un test", icon: ClipboardList, href: "/super/studio/tests/new" },
    { label: "Créer un parcours", icon: Route, href: "/super/studio/parcours/new" },
  ];

  return (
    <div
      className="fixed bottom-8 right-8 z-50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered ? (
        <div
          className={cn(
            jessicaSuper.card,
            "absolute bottom-20 right-0 mb-2 min-w-[220px] overflow-hidden p-2 shadow-[0_12px_40px_rgba(0,0,0,0.12)]",
          )}
        >
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => router.push(item.href)}
                className="mb-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-black transition last:mb-0 hover:bg-neutral-50"
              >
                <Icon className="h-5 w-5 text-indigo-600" />
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <button
        type="button"
        className={cn(
          jessicaSuper.cta,
          "h-14 w-14 rounded-full p-0 shadow-[0_8px_28px_rgba(30,27,75,0.35)] hover:scale-105",
        )}
        onClick={() => setIsHovered(!isHovered)}
        aria-label="Créer du contenu"
      >
        <Plus className={cn("h-6 w-6 transition-transform duration-300", isHovered && "rotate-45")} />
      </button>
    </div>
  );
}
