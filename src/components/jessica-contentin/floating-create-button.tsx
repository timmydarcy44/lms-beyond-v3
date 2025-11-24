"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, BookOpen, FileText, ClipboardList, Route } from "lucide-react";
import { cn } from "@/lib/utils";

export function FloatingCreateButton() {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const menuItems = [
    {
      label: "Créer un module",
      icon: BookOpen,
      href: "/super/studio/modules/new/choose",
      color: "text-[#C6A664]",
    },
    {
      label: "Créer une ressource",
      icon: FileText,
      href: "/super/studio/ressources/new",
      color: "text-[#C6A664]",
    },
    {
      label: "Créer un test",
      icon: ClipboardList,
      href: "/super/studio/tests/new",
      color: "text-[#C6A664]",
    },
    {
      label: "Créer un parcours",
      icon: Route,
      href: "/super/studio/parcours/new",
      color: "text-[#C6A664]",
    },
  ];

  return (
    <div
      className="fixed bottom-8 right-8 z-50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Menu déroulant */}
      {isHovered && (
        <div 
          className="absolute bottom-20 right-0 mb-2 min-w-[200px] rounded-2xl border-2 shadow-2xl transition-all duration-200"
          style={{
            borderColor: "#E6D9C6",
            backgroundColor: "#FFFFFF",
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? "translateY(0)" : "translateY(10px)",
          }}
        >
          <div className="p-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:shadow-md",
                    "text-left",
                    index === menuItems.length - 1 ? "" : "mb-1"
                  )}
                  style={{
                    backgroundColor: isHovered ? "#F8F5F0" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#E6D9C6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#F8F5F0";
                  }}
                >
                  <Icon className={cn("h-5 w-5", item.color)} />
                  <span 
                    className="text-sm font-medium"
                    style={{ color: "#2F2A25" }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bouton principal */}
      <button
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300",
          "hover:scale-110 hover:shadow-xl"
        )}
        style={{
          backgroundColor: "#C6A664",
          color: "white",
        }}
        onClick={() => setIsHovered(!isHovered)}
      >
        <Plus 
          className={cn(
            "h-6 w-6 transition-transform duration-300",
            isHovered && "rotate-45"
          )} 
        />
      </button>
    </div>
  );
}

