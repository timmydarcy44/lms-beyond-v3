"use client";

import { useEffect } from "react";

/** Active le scroll fluide pour les ancres (#) sur la fenêtre (scroll-behavior sur le conteneur racine). */
export function FormationPageSmoothScroll() {
  useEffect(() => {
    const el = document.documentElement;
    const prev = el.style.scrollBehavior;
    el.style.scrollBehavior = "smooth";
    return () => {
      el.style.scrollBehavior = prev;
    };
  }, []);
  return null;
}
