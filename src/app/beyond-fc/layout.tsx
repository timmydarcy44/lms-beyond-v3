"use client";

import { ReactNode } from "react";

import { ImmersiveShell } from "@/components/beyond-fc/ImmersiveShell";
import { GameSessionProvider } from "@/modules/beyond-play/ui/GameSessionContext";

export default function BeyondFCLayer({ children }: { children: ReactNode }) {
  return (
    <GameSessionProvider>
      <ImmersiveShell>{children}</ImmersiveShell>
    </GameSessionProvider>
  );
}

