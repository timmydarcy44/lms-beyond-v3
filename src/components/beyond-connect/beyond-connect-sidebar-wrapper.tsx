"use client";

import { useState, useEffect } from "react";
import { BeyondConnectSidebarItem } from "./beyond-connect-sidebar-item";

type BeyondConnectSidebarWrapperProps = {
  isOpen: boolean;
  role: "admin" | "formateur" | "apprenant";
};

export function BeyondConnectSidebarWrapper({ isOpen, role }: BeyondConnectSidebarWrapperProps) {
  const [hasAccess, setHasAccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("[beyond-connect-sidebar] Component mounted, role:", role);
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
  }, [role]);

  const checkAccess = async () => {
    try {
      console.log("[beyond-connect-sidebar] Checking access...");
      // Vérifier si l'organisation a accès à Beyond Connect via API
      // Utiliser un timestamp pour éviter le cache
      const response = await fetch(`/api/beyond-connect/check-access?t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
        },
      });
      
      console.log("[beyond-connect-sidebar] Response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("[beyond-connect-sidebar] ✅ Access check result:", data);
        const newHasAccess = data.hasAccess === true;
        const newIsAdmin = data.isAdmin === true;
        console.log("[beyond-connect-sidebar] Setting state - hasAccess:", newHasAccess, "isAdmin:", newIsAdmin, "role:", role);
        setHasAccess(newHasAccess);
        setIsAdmin(newIsAdmin);
        setLoading(false);
      } else {
        const errorText = await response.text();
        console.error("[beyond-connect-sidebar] ❌ API error:", response.status, errorText);
        setHasAccess(false);
        setIsAdmin(false);
        setLoading(false);
      }
    } catch (error) {
      console.error("[beyond-connect-sidebar] Error checking access:", error);
      setHasAccess(false);
      setIsAdmin(false);
      setLoading(false);
    }
  };

  // Pour tous les rôles : afficher si hasAccess
  // Pour les admins/formateurs : afficher si hasAccess OU isAdmin (au cas où l'API retourne isAdmin mais pas hasAccess)
  // Note: hasAccess devrait être true si l'organisation a Beyond Connect activé
  const shouldShow = hasAccess === true || (role === "admin" && isAdmin === true);

  console.log("[beyond-connect-sidebar] shouldShow:", shouldShow, "hasAccess:", hasAccess, "isAdmin:", isAdmin, "role:", role, "loading:", loading);

  if (loading || !shouldShow) {
    if (loading) {
      console.log("[beyond-connect-sidebar] Not showing: loading");
    } else {
      console.log("[beyond-connect-sidebar] Not showing: !shouldShow");
    }
    return null;
  }

  // Déterminer l'URL selon le rôle
  const href = 
    role === "admin" ? "/admin/beyond-connect" :
    "/beyond-connect-app";

  return <BeyondConnectSidebarItem href={href} isOpen={isOpen} role={role} />;
}

