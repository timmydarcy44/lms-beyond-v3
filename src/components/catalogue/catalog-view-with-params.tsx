"use client";

import { CatalogViewAppleTV } from "./catalog-view-apple-tv";
import { useEffect, useRef } from "react";

export function CatalogViewWithParams({
  superAdminEmail,
  superAdminId,
}: {
  superAdminEmail: string;
  superAdminId: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Passer les params via data attributes
    if (containerRef.current) {
      containerRef.current.setAttribute('data-super-admin-email', superAdminEmail);
      containerRef.current.setAttribute('data-super-admin-id', superAdminId);
    }
  }, [superAdminEmail, superAdminId]);

  return (
    <div ref={containerRef}>
      <CatalogViewAppleTV />
    </div>
  );
}



