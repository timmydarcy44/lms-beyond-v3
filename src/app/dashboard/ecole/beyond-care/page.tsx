"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const BeyondCareContent = dynamic(() => import("./BeyondCareContent"), { ssr: false });

export default function BeyondCarePage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <BeyondCareContent />
    </Suspense>
  );
}

