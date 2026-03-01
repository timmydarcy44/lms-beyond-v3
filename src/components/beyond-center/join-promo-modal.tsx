"use client";

import { Button } from "@/components/ui/button";

type JoinPromoModalProps = {
  programName: string;
  programRef: string;
  triggerLabel: string;
};

export function JoinPromoModal({ programName, programRef, triggerLabel }: JoinPromoModalProps) {
  return (
    <Button
      size="lg"
      className="rounded-full px-8 py-6 text-lg font-light"
      onClick={() => {
        if (typeof window === "undefined") return;
        const params = new URLSearchParams({ program: programName, ref: programRef });
        window.location.href = `/beyond-center/contact?${params.toString()}`;
      }}
    >
      {triggerLabel}
    </Button>
  );
}
