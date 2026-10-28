"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AppleSuccessOverlay } from "@/components/expert/apple-success-overlay";

type Payload = { title: string; subtitle?: string };

export function AppleActionConfirmHost() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const close = useCallback(() => setPayload(null), []);

  useEffect(() => {
    const original = toast.success.bind(toast);
    toast.success = ((message: unknown, data?: { description?: unknown }) => {
      const title = typeof message === "string" && message.trim() ? message.trim() : "C’est fait";
      const subtitle = typeof data?.description === "string" ? data.description : undefined;
      setPayload({ title, subtitle });
      return { unwrap: async () => true };
    }) as typeof toast.success;
    const onEvent = (event: Event) => {
      const detail = (event as CustomEvent<Payload>).detail;
      if (detail?.title) setPayload(detail);
    };
    window.addEventListener("lms:apple-success", onEvent);
    return () => {
      toast.success = original;
      window.removeEventListener("lms:apple-success", onEvent);
    };
  }, []);

  return (
    <AppleSuccessOverlay
      open={Boolean(payload)}
      title={payload?.title ?? ""}
      subtitle={payload?.subtitle}
      onClose={close}
    />
  );
}
