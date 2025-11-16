"use client";

import { useEffect, useState } from "react";
import { BeyondNoteSidebarItem } from "./beyond-note-sidebar-item";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type BeyondNoteSidebarWrapperProps = {
  isOpen: boolean;
  role: "admin" | "formateur" | "apprenant";
};

export function BeyondNoteSidebarWrapper({ isOpen, role }: BeyondNoteSidebarWrapperProps) {
  const [hasAccess, setHasAccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier immédiatement
    checkAccess();
    // Re-vérifier après un court délai pour éviter les problèmes de cache
    const timeout = setTimeout(checkAccess, 1000);
    // Re-vérifier périodiquement au cas où la fonctionnalité serait activée
    const interval = setInterval(checkAccess, 30000); // Toutes les 30 secondes
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const checkAccess = async () => {
    try {
      // Vérifier si l'organisation a accès à Beyond Note via API
      // Utiliser un timestamp pour éviter le cache
      const response = await fetch(`/api/beyond-note/check-access?t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log("[beyond-note-sidebar] Access check result:", data);
        const newHasAccess = data.hasAccess === true;
        const newIsAdmin = data.isAdmin === true;
        setHasAccess(newHasAccess);
        setIsAdmin(newIsAdmin);
        if (newHasAccess) {
          setLoading(false);
        }
      } else {
        console.error("[beyond-note-sidebar] API error:", response.status, await response.text());
        setHasAccess(false);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("[beyond-note-sidebar] Error checking access:", error);
      setHasAccess(false);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  // Pour les apprenants : afficher si hasAccess
  // Pour les admins/formateurs : afficher seulement si isAdmin (car ils doivent voir le dashboard admin)
  const shouldShow = role === "apprenant" 
    ? hasAccess 
    : (hasAccess && isAdmin);

  if (loading || !shouldShow) {
    return null;
  }

  const href = "/beyond-note-app";

  return <BeyondNoteSidebarItem href={href} isOpen={isOpen} />;
}

