"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Alert = { id: string; title: string; message: string };

export function ExpertAppleInbox() {
  const router = useRouter();
  const [alert, setAlert] = useState<Alert | null>(null);
  const seen = useRef(new Set<string>());

  useEffect(() => {
    let cancelled = false;
    const pull = async () => {
      const res = await fetch("/api/expert/care/alerts", { cache: "no-store" });
      const json = (await res.json().catch(() => ({}))) as { alerts?: Alert[] };
      const next = json.alerts?.[0];
      if (!next || cancelled || seen.current.has(next.id)) return;
      seen.current.add(next.id);
      setAlert(next);
    };
    void pull();
    const timer = window.setInterval(() => void pull(), 2500);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  if (!alert) return null;

  const dismiss = (goAgenda: boolean) => {
    void fetch("/api/expert/care/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: alert.id }),
    });
    setAlert(null);
    if (goAgenda) router.push("/dashboard/expert/agenda");
  };

  return (
    <button
      type="button"
      className="expert-apple-banner"
      onClick={() => dismiss(true)}
    >
      <span className="expert-apple-banner-icon">B</span>
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold tracking-tight text-slate-900">{alert.title}</span>
        <span className="mt-0.5 block text-[13px] leading-snug text-slate-500">{alert.message}</span>
      </span>
    </button>
  );
}
