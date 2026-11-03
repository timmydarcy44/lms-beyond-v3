"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Atkinson_Hyperlegible, Manrope } from "next/font/google";
import { useDyslexiaMode } from "@/components/apprenant/dyslexia-mode-provider";
import { cn } from "@/lib/utils";
import "./lms-screens.css";

const manrope = Manrope({ subsets: ["latin"] });
const atkinson = Atkinson_Hyperlegible({ subsets: ["latin"], weight: "400" });

export function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduce(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);
  return reduce;
}

export function LmsScreen({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { isDyslexiaMode } = useDyslexiaMode();
  return (
    <div
      className={cn("lms-screen", manrope.className, isDyslexiaMode && "lms-screen--dys", className)}
      style={{ ["--font-dys" as string]: atkinson.style.fontFamily } as CSSProperties}
    >
      {children}
    </div>
  );
}
