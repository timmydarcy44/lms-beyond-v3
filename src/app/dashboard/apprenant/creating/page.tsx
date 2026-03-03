"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CreatingSpacePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dotCount, setDotCount] = useState(1);
  const [pulse, setPulse] = useState(false);
  const [storedFirstName, setStoredFirstName] = useState("");

  const nextPath = useMemo(
    () => searchParams.get("next") || "/portail/apprenant",
    [searchParams]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev % 3) + 1);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setPulse((prev) => !prev);
    }, 600);
    return () => clearInterval(pulseInterval);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace(nextPath);
    }, 1400);
    return () => clearTimeout(timeout);
  }, [nextPath, router]);

  useEffect(() => {
    const value = searchParams.get("firstName") || "";
    if (value) {
      setStoredFirstName(value);
      return;
    }
    try {
      const cached = localStorage.getItem("beyond_firstname") ?? "";
      setStoredFirstName(cached);
    } catch {
      // ignore
    }
  }, [searchParams]);

  const dots = ".".repeat(dotCount);
  const displayName = storedFirstName ? `Bonjour ${storedFirstName}` : "Bonjour";

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-white text-black"
      style={{
        fontFamily:
          '"SF Pro Display","SF Pro Text",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      }}
    >
      <div className="flex flex-col items-center gap-7">
        <div className="text-2xl font-semibold tracking-tight">
          {displayName}
          {dots}
        </div>
        <div className="relative h-14 w-14">
          <span
            className={`absolute inset-0 rounded-full border border-black/10 transition-transform duration-500 ${
              pulse ? "scale-110 opacity-40" : "scale-100 opacity-20"
            }`}
          />
          <span
            className={`absolute inset-2 rounded-full border border-black/20 transition-transform duration-500 ${
              pulse ? "scale-105 opacity-60" : "scale-95 opacity-40"
            }`}
          />
          <span className="absolute inset-[14px] rounded-full bg-black" />
        </div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-black/30 animate-bounce [animation-delay:-0.2s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-black/60 animate-bounce [animation-delay:-0.1s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-black animate-bounce" />
        </div>
      </div>
    </div>
  );
}
