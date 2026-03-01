"use client";

import { useState } from "react";

type LogEntry = {
  author: string;
  date: string;
  sentiment: "Positif" | "Neutre" | "Alerte";
  message: string;
};

const sentimentStyles: Record<LogEntry["sentiment"], string> = {
  Positif: "bg-[#007BFF]/20 text-[#7FB7FF] border border-blue-500/20",
  Neutre: "bg-white/10 text-white/70 border border-white/10",
  Alerte: "bg-red-500/20 text-red-200 border border-red-500/30",
};

export default function TalentLog({ initialEntries }: { initialEntries: LogEntry[] }) {
  const [entries, setEntries] = useState<LogEntry[]>(initialEntries);
  const [author, setAuthor] = useState("Manager");
  const [sentiment, setSentiment] = useState<LogEntry["sentiment"]>("Neutre");
  const [message, setMessage] = useState("");

  const addEntry = () => {
    if (!message.trim()) return;
    setEntries((prev) => [
      {
        author,
        date: new Date().toISOString().slice(0, 10),
        sentiment,
        message: message.trim(),
      },
      ...prev,
    ]);
    setMessage("");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[16px] border border-white/5 bg-[#0B0B0B] p-4">
        <div className="text-[12px] text-white/60">Ajouter une observation</div>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr]">
          <input
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            className="rounded-[12px] border border-white/10 bg-[#050505] px-3 py-2 text-[12px] text-white/80"
            placeholder="Auteur"
          />
          <select
            value={sentiment}
            onChange={(event) => setSentiment(event.target.value as LogEntry["sentiment"])}
            className="rounded-[12px] border border-white/10 bg-[#050505] px-3 py-2 text-[12px] text-white/80"
          >
            <option value="Positif">Positif</option>
            <option value="Neutre">Neutre</option>
            <option value="Alerte">Alerte</option>
          </select>
        </div>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="mt-3 h-[90px] w-full rounded-[12px] border border-white/10 bg-[#050505] p-3 text-[12px] text-white/80"
          placeholder="Observation courte et datée..."
        />
        <button
          onClick={addEntry}
          className="mt-3 rounded-full bg-[#007BFF] px-4 py-2 text-[12px] font-semibold text-black"
        >
          Enregistrer l'observation
        </button>
      </div>

      <div className="space-y-3">
        {entries.map((entry, index) => (
          <div
            key={`${entry.date}-${index}`}
            className="rounded-[16px] border border-white/5 bg-white/5 p-4"
          >
            <div className="flex items-center justify-between text-[12px] text-white/60">
              <span>{entry.author}</span>
              <span>{entry.date}</span>
            </div>
            <div className={`mt-2 inline-flex rounded-full px-3 py-1 text-[11px] ${sentimentStyles[entry.sentiment]}`}>
              {entry.sentiment}
            </div>
            <p className="mt-3 text-[13px] text-white/80">{entry.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
