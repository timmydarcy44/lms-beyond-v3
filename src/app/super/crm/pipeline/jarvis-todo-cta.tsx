"use client";

import { Button } from "@/components/ui/button";

export function JarvisTodoCta() {
  return (
    <Button
      type="button"
      variant="default"
      onClick={() => {
        window.dispatchEvent(new CustomEvent("jarvis-open-briefing"));
      }}
    >
      TODO
    </Button>
  );
}

