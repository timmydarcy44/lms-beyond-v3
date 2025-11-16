"use client";

import { useState, useEffect } from "react";
import { BeyondCareSidebarItem } from "./beyond-care-sidebar-item";

type BeyondCareSidebarWrapperProps = {
  isOpen: boolean;
  role: "admin" | "formateur" | "apprenant";
};

export function BeyondCareSidebarWrapper({ isOpen, role }: BeyondCareSidebarWrapperProps) {
  const [hasAccess, setHasAccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Les formateurs n'ont pas accès au module Beyond Care
  if (role === "formateur") {
    return null;
  }

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
      // Vérifier si l'organisation a accès à Beyond Care via API
      // Utiliser un timestamp pour éviter le cache
      const response = await fetch(`/api/beyond-care/check-access?t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log("[beyond-care-sidebar] Access check result:", data);
        const newHasAccess = data.hasAccess === true;
        const newIsAdmin = data.isAdmin === true;
        setHasAccess(newHasAccess);
        setIsAdmin(newIsAdmin);
        if (newHasAccess) {
          setLoading(false);
        }
      } else {
        console.error("[beyond-care-sidebar] API error:", response.status, await response.text());
        setHasAccess(false);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("[beyond-care-sidebar] Error checking access:", error);
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

  const href = 
    role === "admin" ? "/admin/beyond-care" :
    role === "formateur" ? "/dashboard/formateur/beyond-care" :
    "/dashboard/apprenant/beyond-care";

  return <BeyondCareSidebarItem href={href} isOpen={isOpen} role={role} />;
}

