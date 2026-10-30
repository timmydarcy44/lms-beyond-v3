"use client";

import { useState } from "react";
import { CARE_HOME } from "@/lib/care/home-copy";

export function CareDemoDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");

  if (!open) return null;

  return (
    <div className="care-dialog" role="dialog" aria-modal="true" aria-labelledby="care-demo-title">
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const body = Object.fromEntries(new FormData(form).entries());
          setStatus("sending");
          const res = await fetch("/api/care/demo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          setStatus(res.ok ? "ok" : "err");
          if (res.ok) form.reset();
        }}
      >
        <h2 id="care-demo-title" className="care-h2" style={{ fontSize: 32 }}>
          {CARE_HOME.demo.title}
        </h2>
        <label htmlFor="care-demo-name">{CARE_HOME.demo.fields.name}</label>
        <input id="care-demo-name" name="name" required autoComplete="name" />
        <label htmlFor="care-demo-company">{CARE_HOME.demo.fields.company}</label>
        <input id="care-demo-company" name="company" required autoComplete="organization" />
        <label htmlFor="care-demo-email">{CARE_HOME.demo.fields.email}</label>
        <input id="care-demo-email" name="email" type="email" required autoComplete="email" />
        <label htmlFor="care-demo-headcount">{CARE_HOME.demo.fields.headcount}</label>
        <select id="care-demo-headcount" name="headcount" required defaultValue="">
          <option value="" disabled>
            —
          </option>
          <option value="1-20">1–20</option>
          <option value="21-100">21–100</option>
          <option value="101-500">101–500</option>
          <option value="500+">500+</option>
        </select>
        <label htmlFor="care-demo-message">{CARE_HOME.demo.fields.message}</label>
        <textarea id="care-demo-message" name="message" rows={4} required />
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button type="submit" className="care-pill care-pill--accent" disabled={status === "sending"}>
            {CARE_HOME.demo.submit}
          </button>
          <button type="button" className="care-pill care-pill--ink" onClick={onClose}>
            Fermer
          </button>
        </div>
        {status === "ok" ? <p>{CARE_HOME.demo.success}</p> : null}
        {status === "err" ? <p>Envoi impossible pour le moment.</p> : null}
      </form>
    </div>
  );
}
