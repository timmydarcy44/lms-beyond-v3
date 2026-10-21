"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { TuteurShell } from "@/components/tuteur/tuteur-shell";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Conversation = { id: string; name: string; role: string; kind: string; initials: string; learnerId: string | null; preview: string; at: string; unread: number };
type Message = { id: string; mine: boolean; body: string; at: string; mission: { title: string; meta: string; href: string } | null };
type Peer = { id: string; name: string; kind: string };

const replies: Record<string, string[]> = {
  alternant: ["Bravo !", "Je regarde ça aujourd'hui", "On en parle au prochain point"],
  cfa: ["C'est confirmé", "Pouvez-vous m'appeler ?", "Je reviens vers vous"],
};

export function TutorMessages({ conversationId }: { conversationId?: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [filter, setFilter] = useState("tous");
  const [thread, setThread] = useState<Message[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [draft, setDraft] = useState("");
  const [compose, setCompose] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadList() {
    const res = await fetch("/api/tuteur/messagerie", { cache: "no-store" });
    if (!res.ok) return;
    const json = await res.json();
    setConversations(json.conversations ?? []);
    setPeers(json.peers ?? []);
    setLoading(false);
  }

  useEffect(() => { void loadList(); }, []);

  useEffect(() => {
    if (!conversationId) return;
    void fetch(`/api/tuteur/messagerie/${conversationId}`, { cache: "no-store" }).then(async (res) => {
      if (!res.ok) return;
      const json = await res.json();
      setThread(json.messages ?? []);
      setActive(json.conversation?.name ? json.conversation : conversations.find((item) => item.id === conversationId) ?? json.conversation);
    });
  }, [conversationId, conversations]);

  useEffect(() => {
    if (!conversationId) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "tutor_messages", filter: `conversation_id=eq.${conversationId}` }, () => {
        void fetch(`/api/tuteur/messagerie/${conversationId}`, { cache: "no-store" }).then(async (res) => {
          if (res.ok) setThread((await res.json()).messages ?? []);
        });
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [conversationId]);

  const visible = conversations.filter((item) => filter === "tous" || (filter === "cfa" ? item.kind === "cfa" : item.kind === "alternant"));
  const quick = replies[active?.kind === "cfa" ? "cfa" : "alternant"];

  async function send(text: string) {
    if (!conversationId || !text.trim()) return;
    const optimistic = { id: `tmp-${Date.now()}`, mine: true, body: text.trim(), at: "à l'instant", mission: null };
    setThread((current) => [...current, optimistic]);
    setDraft("");
    await fetch(`/api/tuteur/messagerie/${conversationId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text.trim() }),
    });
  }

  async function openPeer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const peerId = String(new FormData(event.currentTarget).get("peerId") ?? "");
    const res = await fetch("/api/tuteur/messagerie/ouvrir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ peerId }),
    });
    const json = await res.json().catch(() => null);
    if (json?.id) window.location.href = `/dashboard/tuteur/messagerie/${json.id}`;
  }

  return (
    <TuteurShell tutorName="">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Messagerie</h1>
          <p className="mt-2 text-sm text-[var(--tutor-text-3)]">Vos alternants et leurs formateurs référents, au même endroit</p>
        </div>
        <button type="button" className="rounded-full bg-[var(--tutor-accent)] px-4 py-2 text-sm font-bold text-[var(--tutor-on-accent)]" onClick={() => setCompose(true)}>+ Nouveau message</button>
      </div>
      {loading ? <div className="mt-6 h-80 animate-pulse rounded-[26px] bg-[#12141A]" /> : null}
      {!loading && conversations.length === 0 ? (
        <div className="mt-8 rounded-[26px] bg-[#12141A] p-8">
          <p>Aucun message pour l&apos;instant</p>
          <button type="button" className="mt-4 rounded-full bg-[var(--tutor-accent)] px-4 py-2 text-sm font-bold text-[var(--tutor-on-accent)]" onClick={() => setCompose(true)}>Nouveau message</button>
        </div>
      ) : null}
      {!loading && conversations.length > 0 ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.6fr]">
          <section className={`rounded-[26px] bg-[#12141A] p-3 ${conversationId ? "hidden lg:block" : ""}`}>
            <div className="mb-3 flex gap-2" role="tablist">
              {[["tous", "Tous"], ["alternant", "Alternants"], ["cfa", "CFA"]].map(([id, label]) => (
                <button key={id} type="button" role="tab" aria-selected={filter === id} className={`rounded-full px-3 py-1 text-sm font-semibold ${filter === id ? "bg-[#F4F5F7] text-[#07080B]" : "bg-[#1E2130]"}`} onClick={() => setFilter(id)}>{label}</button>
              ))}
            </div>
            {visible.map((item) => (
              <Link key={item.id} href={`/dashboard/tuteur/messagerie/${item.id}`} className={`flex min-h-[72px] items-center gap-3 rounded-2xl px-2 py-2 ${item.id === conversationId ? "bg-[#1E2130]" : ""}`}>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--tutor-accent)] text-xs font-extrabold text-[var(--tutor-on-accent)]">{item.initials}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex justify-between gap-2"><span className="font-bold">{item.name}</span><span className="text-xs text-[#9096A3]">{item.at}</span></span>
                  <span className="block truncate text-sm text-[#9096A3]">{item.preview}</span>
                </span>
                {item.unread ? <span className="rounded-full bg-[var(--tutor-accent)] px-2 py-0.5 text-[11px] font-bold text-[var(--tutor-on-accent)]">{item.unread}</span> : null}
              </Link>
            ))}
          </section>
          <section className={`flex min-h-[480px] flex-col rounded-[26px] bg-[#12141A] p-4 ${conversationId ? "" : "hidden lg:flex"}`}>
            {!conversationId ? <p className="m-auto text-sm text-[var(--tutor-text-3)]">Choisissez une conversation</p> : null}
            {conversationId && active ? (
              <>
                <header className="flex items-center gap-3 border-b border-[#262A36] pb-3">
                  <Link href="/dashboard/tuteur/messagerie" className="lg:hidden" aria-label="Retour aux conversations">←</Link>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--tutor-accent)] text-xs font-extrabold text-[var(--tutor-on-accent)]">{active.initials}</span>
                  <span className="min-w-0 flex-1"><span className="block font-extrabold">{active.name}</span><span className="text-sm text-[#9096A3]">{active.role}</span></span>
                  {active.learnerId ? <Link href={`/dashboard/tuteur/alternants/${active.learnerId}`} className="rounded-full border border-[#262A36] px-3 py-1 text-sm">Voir la fiche</Link> : null}
                </header>
                <div className="flex flex-1 flex-col gap-3 overflow-y-auto py-4">
                  {thread.map((message) => (
                    <div key={message.id} className={message.mine ? "ml-auto max-w-[80%]" : "mr-auto max-w-[80%]"}>
                      {message.mission ? (
                        <Link href={message.mission.href} className="mb-1 block rounded-2xl bg-[#0C0D12] p-3 text-sm">
                          <span className="font-bold">{message.mission.title}</span>
                          <span className="mt-1 block text-xs text-[#FFB085]">{message.mission.meta}</span>
                        </Link>
                      ) : null}
                      <p className={`px-4 py-3 text-sm ${message.mine ? "rounded-[20px_20px_6px_20px] bg-[#FF7A2F] text-[#1A0C04]" : "rounded-[20px_20px_20px_6px] bg-[#1E2130]"}`}>{message.body}</p>
                      <p className="mt-1 text-[11px] text-[#9096A3]">{message.at}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {quick.map((label) => (
                    <button key={label} type="button" className="rounded-full border border-[#262A36] px-3 py-1 text-sm" onClick={() => void send(label)}>{label}</button>
                  ))}
                </div>
                <form className="mt-3 flex items-end gap-2" onSubmit={(event) => { event.preventDefault(); void send(draft); }}>
                  <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(draft); } }} rows={1} placeholder="Écrire un message..." className="max-h-32 min-h-11 flex-1 resize-none rounded-full bg-[#0C0D12] px-4 py-3 text-sm" />
                  <button type="submit" disabled={!draft.trim()} aria-label="Envoyer" className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--tutor-accent)] font-bold text-[var(--tutor-on-accent)] disabled:opacity-40">→</button>
                </form>
              </>
            ) : null}
          </section>
        </div>
      ) : null}
      {compose ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <form onSubmit={openPeer} className="w-full max-w-md space-y-3 rounded-[28px] bg-[#12141A] p-5">
            <h2 className="font-extrabold">Nouveau message</h2>
            {peers.length === 0 && conversations.length > 0 ? (
              <div className="space-y-2">
                {conversations.map((item) => <Link key={item.id} href={`/dashboard/tuteur/messagerie/${item.id}`} className="block rounded-2xl bg-[#0C0D12] px-3 py-2">{item.name}</Link>)}
              </div>
            ) : (
              <select name="peerId" required className="w-full rounded-xl bg-[#07080B] p-2">
                {peers.map((peer) => <option key={peer.id} value={peer.id}>{peer.name}</option>)}
              </select>
            )}
            <div className="flex gap-2">
              {peers.length ? <button className="rounded-full bg-[var(--tutor-accent)] px-4 py-2 text-sm font-bold text-[var(--tutor-on-accent)]" type="submit">Ouvrir</button> : null}
              <button className="rounded-full bg-[#1E2130] px-4 py-2 text-sm" type="button" onClick={() => setCompose(false)}>Fermer</button>
            </div>
          </form>
        </div>
      ) : null}
    </TuteurShell>
  );
}
