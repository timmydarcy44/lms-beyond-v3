"use client";

import { HandicapPinGate } from "@/components/beyond-connect/handicap-pin-gate";

export default function HandicapSectionLayout({ children }: { children: React.ReactNode }) {
  return <HandicapPinGate>{children}</HandicapPinGate>;
}
