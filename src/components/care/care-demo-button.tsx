"use client";

import { useState } from "react";
import { CareDemoDialog } from "@/components/care/care-demo-dialog";

export function CareDemoButton({ label, className }: { label: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {label}
      </button>
      <CareDemoDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
