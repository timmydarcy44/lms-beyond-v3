"use client";

import { useEffect, useState } from "react";

export function useSurface(storageKey: string, selector: string, className: string) {
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(window.localStorage.getItem(storageKey) === "light");
  }, [storageKey]);

  useEffect(() => {
    document.querySelector(selector)?.classList.toggle(className, light);
  }, [light, selector, className]);

  const toggle = () => {
    setLight((current) => {
      const next = !current;
      window.localStorage.setItem(storageKey, next ? "light" : "dark");
      return next;
    });
  };

  return { light, toggle };
}

export function SurfaceButton({ light, onClick }: { light: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={light}
      className="rounded-full border px-3 py-1.5 text-xs font-extrabold"
      style={
        light
          ? { background: "#12141C", color: "#FFFFFF", borderColor: "#12141C" }
          : { background: "transparent", color: "#F4F5F7", borderColor: "rgba(255,255,255,0.28)" }
      }
    >
      {light ? "Fond sombre" : "Fond blanc"}
    </button>
  );
}

export function SurfaceToggle({
  storageKey,
  selector,
  className,
}: {
  storageKey: string;
  selector: string;
  className: string;
}) {
  const surface = useSurface(storageKey, selector, className);
  return <SurfaceButton light={surface.light} onClick={surface.toggle} />;
}
