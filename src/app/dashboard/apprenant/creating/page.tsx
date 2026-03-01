"use client";

import { useEffect, useState } from "react";

export default function CreatingSpacePage() {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev % 3) + 1);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const dots = ".".repeat(dotCount);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white text-black">
      <div className="flex flex-col items-center gap-6">
        <div className="text-2xl font-semibold">
          {typeof window !== "undefined" && localStorage.getItem("beyond_firstname")
            ? `${localStorage.getItem("beyond_firstname")}, nous créons votre espace`
            : "Nous créons votre espace"}
          {dots}
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-black/30 animate-bounce [animation-delay:-0.2s]" />
          <span className="h-2 w-2 rounded-full bg-black/60 animate-bounce [animation-delay:-0.1s]" />
          <span className="h-2 w-2 rounded-full bg-black animate-bounce" />
        </div>
      </div>
    </div>
  );
}
