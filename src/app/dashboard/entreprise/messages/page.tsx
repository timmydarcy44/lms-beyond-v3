"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import type { EntrepriseHrMessage, EntrepriseHrThread } from "@/lib/entreprise/hr-messages";
import { cn } from "@/lib/utils";

type EmployeeLite = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  job_title?: string | null;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function EntrepriseMessagesPage() {
  const [threads, setThreads] = useState<EntrepriseHrThread[]>([]);
  const [employees, setEmployees] = useState<EmployeeLite[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<EntrepriseHrMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(
    () => threads.find((t) => t.employee_id === selectedId) ?? null,
    [threads, selectedId],
  );

  const filteredThreads = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter(
      (t) =>
        t.employee_name.toLowerCase().includes(q) ||
        (t.employee_job_title ?? "").toLowerCase().includes(q),
    );
  }, [threads, query]);

  const loadThreads = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/entreprise/messages");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(String(data.error ?? "Impossible de charger les messages."));
        return;
      }
      const nextThreads = (data.threads ?? []) as EntrepriseHrThread[];
      setThreads(nextThreads);
      setEmployees((data.employees ?? []) as EmployeeLite[]);
      setSelectedId((prev) => {
        if (prev && nextThreads.some((t) => t.employee_id === prev)) return prev;
        const withActivity = nextThreads.find((t) => t.last_at);
        return withActivity?.employee_id ?? nextThreads[0]?.employee_id ?? null;
      });
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (employeeId: string) => {
    try {
      const res = await fetch(
        `/api/dashboard/entreprise/messages?employee_id=${encodeURIComponent(employeeId)}`,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      setMessages((data.messages ?? []) as EntrepriseHrMessage[]);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    void loadThreads();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    void loadConversation(selectedId);
  }, [selectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedId]);

  const startConversation = (employee: EmployeeLite) => {
    const name =
      [employee.first_name, employee.last_name].filter(Boolean).join(" ").trim() || "Collaborateur";
    setThreads((prev) => {
      if (prev.some((t) => t.employee_id === employee.id)) return prev;
      return [
        {
          employee_id: employee.id,
          employee_name: name,
          employee_job_title: employee.job_title ?? null,
          last_message: null,
          last_at: null,
          unread_from_employee: 0,
        },
        ...prev,
      ];
    });
    setSelectedId(employee.id);
    setQuery("");
  };

  const employeesWithoutThread = useMemo(() => {
    const open = new Set(threads.map((t) => t.employee_id));
    return employees.filter((e) => !open.has(e.id));
  }, [employees, threads]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected || !draft.trim() || sending) return;
    setSending(true);
    setError(null);
    const content = draft.trim();
    setDraft("");
    try {
      const res = await fetch("/api/dashboard/entreprise/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: selected.employee_id,
          employee_name: selected.employee_name,
          employee_job_title: selected.employee_job_title,
          sender_role: "rh",
          content,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(String(data.error ?? "Envoi impossible."));
        setDraft(content);
        return;
      }
      const message = data.message as EntrepriseHrMessage;
      setMessages((prev) => [...prev, message]);
      setThreads((prev) =>
        buildSortedThreads(
          prev.map((t) =>
            t.employee_id === selected.employee_id
              ? {
                  ...t,
                  last_message: message.content,
                  last_at: message.created_at,
                  unread_from_employee: 0,
                }
              : t,
          ),
        ),
      );
    } catch {
      setError("Erreur réseau.");
      setDraft(content);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f2f2f7] text-gray-900">
      <EnterpriseSidebar />
      <main className="flex min-h-screen flex-1 flex-col lg:pl-[280px]">
        <div className="mx-auto flex h-[100dvh] w-full max-w-6xl flex-col px-3 py-4 sm:px-6 lg:h-screen lg:py-6">
          <header className="mb-4 shrink-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-500">
              Communication interne
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-gray-950">Messages</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Échanges rapides entre un collaborateur et le service RH — sans email, comme iMessage.
            </p>
          </header>

          <div className="flex min-h-0 flex-1 overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
            {/* Liste conversations */}
            <aside className="flex w-full max-w-[340px] flex-col border-r border-black/5 bg-[#f9f9fb]">
              <div className="border-b border-black/5 p-3">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher un collaborateur"
                  className="w-full rounded-2xl border-0 bg-black/5 px-3 py-2.5 text-sm outline-none placeholder:text-gray-400 focus:bg-black/[0.07]"
                />
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {loading ? (
                  <p className="p-4 text-sm text-gray-400">Chargement…</p>
                ) : filteredThreads.length === 0 ? (
                  <p className="p-4 text-sm text-gray-400">Aucune conversation.</p>
                ) : (
                  filteredThreads.map((thread) => {
                    const active = thread.employee_id === selectedId;
                    return (
                      <button
                        key={thread.employee_id}
                        type="button"
                        onClick={() => setSelectedId(thread.employee_id)}
                        className={cn(
                          "flex w-full items-start gap-3 border-b border-black/[0.04] px-3 py-3 text-left transition",
                          active ? "bg-white" : "hover:bg-white/70",
                        )}
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-xs font-bold text-white">
                          {initials(thread.employee_name)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-semibold text-gray-900">
                              {thread.employee_name}
                            </span>
                            <span className="shrink-0 text-[11px] text-gray-400">
                              {formatTime(thread.last_at)}
                            </span>
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-gray-500">
                            {thread.last_message ?? thread.employee_job_title ?? "Nouvelle conversation"}
                          </span>
                        </span>
                        {thread.unread_from_employee > 0 ? (
                          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#007AFF]" />
                        ) : null}
                      </button>
                    );
                  })
                )}

                {employeesWithoutThread.length > 0 ? (
                  <div className="border-t border-black/5 p-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                      Démarrer une conversation
                    </p>
                    <div className="space-y-1">
                      {employeesWithoutThread.slice(0, 8).map((emp) => {
                        const name =
                          [emp.first_name, emp.last_name].filter(Boolean).join(" ").trim() ||
                          "Collaborateur";
                        return (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() => startConversation(emp)}
                            className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm text-gray-700 hover:bg-white"
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600">
                              {initials(name)}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate font-medium">{name}</span>
                              <span className="block truncate text-xs text-gray-400">
                                {emp.job_title ?? "Collaborateur"}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </aside>

            {/* Fil de discussion */}
            <section className="flex min-w-0 flex-1 flex-col bg-[#ffffff]">
              {selected ? (
                <>
                  <div className="flex items-center gap-3 border-b border-black/5 px-5 py-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-xs font-bold text-white">
                      {initials(selected.employee_name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {selected.employee_name}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {selected.employee_job_title ?? "Collaborateur"} · Service RH
                      </p>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-[radial-gradient(circle_at_top,_#f8f7ff_0%,_#ffffff_45%)] px-4 py-5">
                    {messages.length === 0 ? (
                      <p className="py-16 text-center text-sm text-gray-400">
                        Aucun message. Écrivez pour démarrer l’échange.
                      </p>
                    ) : (
                      messages.map((msg) => {
                        const mine = msg.sender_role === "rh";
                        return (
                          <div
                            key={msg.id}
                            className={cn("flex", mine ? "justify-end" : "justify-start")}
                          >
                            <div
                              className={cn(
                                "max-w-[75%] rounded-[20px] px-3.5 py-2 text-[15px] leading-snug shadow-sm",
                                mine
                                  ? "rounded-br-md bg-[#007AFF] text-white"
                                  : "rounded-bl-md bg-[#E9E9EB] text-gray-900",
                              )}
                            >
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                              <p
                                className={cn(
                                  "mt-1 text-[10px]",
                                  mine ? "text-white/70" : "text-gray-500",
                                )}
                              >
                                {formatTime(msg.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={bottomRef} />
                  </div>

                  {error ? (
                    <p className="px-4 pb-1 text-sm text-red-600">{error}</p>
                  ) : null}

                  <form
                    onSubmit={send}
                    className="flex items-end gap-2 border-t border-black/5 bg-white px-3 py-3"
                  >
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void send(e);
                        }
                      }}
                      rows={1}
                      placeholder="iMessage"
                      className="max-h-32 min-h-[44px] flex-1 resize-none rounded-[22px] border border-black/10 bg-[#f2f2f7] px-4 py-3 text-[15px] outline-none focus:border-[#007AFF]/60"
                    />
                    <button
                      type="submit"
                      disabled={sending || !draft.trim()}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#007AFF] text-white transition enabled:hover:bg-[#0066d6] disabled:opacity-40"
                      aria-label="Envoyer"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3.4 20.4 21 12 3.4 3.6 3 10.2l11.2 1.8L3 13.8z" />
                      </svg>
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-gray-400">
                  Sélectionnez un collaborateur pour ouvrir la conversation.
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function buildSortedThreads(threads: EntrepriseHrThread[]) {
  return [...threads].sort((a, b) => {
    const ta = a.last_at ? new Date(a.last_at).getTime() : 0;
    const tb = b.last_at ? new Date(b.last_at).getTime() : 0;
    return tb - ta;
  });
}
