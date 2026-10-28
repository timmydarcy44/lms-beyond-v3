"use client";

import { useState } from "react";
import { saveCareAvailability } from "@/lib/care/expert-actions";
import type { CareAvailabilityExceptionRow, CareAvailabilityRuleRow } from "@/lib/care/expert-workspace";

const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const field = "rounded-xl border border-[#1E2130] bg-[#0B0C10] px-3 py-2 text-sm";

export function CareAvailabilityEditor({
  rules: initialRules,
  exceptions: initialExceptions,
}: {
  rules: CareAvailabilityRuleRow[];
  exceptions: CareAvailabilityExceptionRow[];
}) {
  const [rules, setRules] = useState(initialRules);
  const [exceptions, setExceptions] = useState(initialExceptions);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSave() {
    setPending(true);
    const result = await saveCareAvailability({
      rules: rules.map((item) => ({
        weekday: item.weekday,
        start_time: item.start_time,
        end_time: item.end_time,
        format: item.format,
      })),
      exceptions: exceptions.map((item) => ({
        date: item.date,
        is_closed: item.is_closed,
        start_time: item.start_time,
        end_time: item.end_time,
      })),
    });
    setPending(false);
    setMessage(result.ok ? "Disponibilités enregistrées." : result.message);
  }

  return (
    <div className="grid gap-8">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Règles hebdomadaires</h2>
          <button
            type="button"
            className="text-sm font-semibold text-[#FFB4B8]"
            onClick={() =>
              setRules([
                ...rules,
                { id: `new-${rules.length}`, weekday: 1, start_time: "09:00", end_time: "12:00", format: "visio" },
              ])
            }
          >
            Ajouter
          </button>
        </div>
        <div className="grid gap-3">
          {rules.map((item, index) => (
            <div key={`${item.id}-${index}`} className="grid gap-2 rounded-2xl bg-[#12141A] p-4 md:grid-cols-5">
              <select className={field} value={item.weekday} onChange={(event) => setRules(rules.map((row, i) => (i === index ? { ...row, weekday: Number(event.target.value) } : row)))}>
                {DAYS.map((label, day) => (
                  <option key={label} value={day}>
                    {label}
                  </option>
                ))}
              </select>
              <input className={field} type="time" value={item.start_time} onChange={(event) => setRules(rules.map((row, i) => (i === index ? { ...row, start_time: event.target.value } : row)))} />
              <input className={field} type="time" value={item.end_time} onChange={(event) => setRules(rules.map((row, i) => (i === index ? { ...row, end_time: event.target.value } : row)))} />
              <select className={field} value={item.format} onChange={(event) => setRules(rules.map((row, i) => (i === index ? { ...row, format: event.target.value as CareAvailabilityRuleRow["format"] } : row)))}>
                <option value="visio">Visio</option>
                <option value="cabinet">Cabinet</option>
                <option value="both">Les deux</option>
              </select>
              <button type="button" className="text-sm text-[#FF4B4B]" onClick={() => setRules(rules.filter((_, i) => i !== index))}>
                Retirer
              </button>
            </div>
          ))}
        </div>
      </section>
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Exceptions</h2>
          <button
            type="button"
            className="text-sm font-semibold text-[#FFB4B8]"
            onClick={() =>
              setExceptions([
                ...exceptions,
                { id: `ex-${exceptions.length}`, date: new Date().toISOString().slice(0, 10), is_closed: true, start_time: null, end_time: null },
              ])
            }
          >
            Ajouter
          </button>
        </div>
        <div className="grid gap-3">
          {exceptions.map((item, index) => (
            <div key={`${item.id}-${index}`} className="grid gap-2 rounded-2xl bg-[#12141A] p-4 md:grid-cols-5">
              <input className={field} type="date" value={item.date} onChange={(event) => setExceptions(exceptions.map((row, i) => (i === index ? { ...row, date: event.target.value } : row)))} />
              <select
                className={field}
                value={item.is_closed ? "closed" : "open"}
                onChange={(event) =>
                  setExceptions(
                    exceptions.map((row, i) =>
                      i === index ? { ...row, is_closed: event.target.value === "closed" } : row,
                    ),
                  )
                }
              >
                <option value="closed">Congé / fermé</option>
                <option value="open">Ouverture ponctuelle</option>
              </select>
              <input className={field} type="time" disabled={item.is_closed} value={item.start_time ?? ""} onChange={(event) => setExceptions(exceptions.map((row, i) => (i === index ? { ...row, start_time: event.target.value } : row)))} />
              <input className={field} type="time" disabled={item.is_closed} value={item.end_time ?? ""} onChange={(event) => setExceptions(exceptions.map((row, i) => (i === index ? { ...row, end_time: event.target.value } : row)))} />
              <button type="button" className="text-sm text-[#FF4B4B]" onClick={() => setExceptions(exceptions.filter((_, i) => i !== index))}>
                Retirer
              </button>
            </div>
          ))}
        </div>
      </section>
      {message ? <p role="alert">{message}</p> : null}
      <button type="button" disabled={pending} className="h-11 w-fit rounded-full bg-[#F4F5F7] px-5 font-extrabold text-[#07080B]" onClick={() => void onSave()}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </div>
  );
}
