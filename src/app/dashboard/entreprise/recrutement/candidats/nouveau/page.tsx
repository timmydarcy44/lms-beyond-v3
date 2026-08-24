"use client";

import { useState } from "react";
import { Copy, Loader2, MailPlus, UserPlus } from "lucide-react";

import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ENTREPRISE_H1_CLASS } from "@/lib/entreprise/styles";

type InviteResult = {
  email: string;
  inviteLink: string | null;
  message: string;
};

export default function EntrepriseNewCandidatePage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InviteResult | null>(null);

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/beyond-connect/signup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          returnLink: true,
          context: "entreprise_recruitment",
          metadata: {
            targetRole,
            notes,
          },
        }),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        error?: string;
        message?: string;
        confirmationLink?: string | null;
      };

      if (!response.ok) throw new Error(payload.error || "Invitation impossible");

      setResult({
        email,
        inviteLink: payload.confirmationLink ?? null,
        message: payload.message || "Invitation creee.",
      });

      setFirstName("");
      setLastName("");
      setEmail("");
      setTargetRole("");
      setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invitation impossible");
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.inviteLink) return;
    await navigator.clipboard.writeText(result.inviteLink);
  };

  return (
    <div className="flex min-h-screen bg-white text-gray-900">
      <EnterpriseSidebar />
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:pl-[280px]">
        <header className="mb-8">
          <h1 className={ENTREPRISE_H1_CLASS}>Nouveau candidat</h1>
          <p className="mt-2 text-center text-sm text-gray-500">
            Creez une fiche de candidat distincte des salaries et envoyez-lui un lien pour creer son profil.
          </p>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700">Prenom</span>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Alex" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700">Nom</span>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Martin" />
              </label>
            </div>

            <label className="mt-4 block space-y-2">
              <span className="text-sm font-medium text-gray-700">Email</span>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@exemple.fr"
              />
            </label>

            <label className="mt-4 block space-y-2">
              <span className="text-sm font-medium text-gray-700">Poste vise</span>
              <Input
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="Ex. Account Manager"
              />
            </label>

            <label className="mt-4 block space-y-2">
              <span className="text-sm font-medium text-gray-700">Notes RH</span>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contexte du candidat, source, points d'attention..."
                className="min-h-[140px]"
              />
            </label>

            {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

            <div className="mt-6">
              <Button
                type="button"
                className="rounded-full bg-violet-600 px-5 text-white hover:bg-violet-700"
                onClick={() => void handleSubmit()}
                disabled={saving || !email.trim()}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailPlus className="h-4 w-4" />}
                Creer la fiche et envoyer le lien
              </Button>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-[28px] border border-gray-100 bg-[#fafafa] p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-white">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Flux candidat</h2>
                  <p className="text-sm text-gray-500">Hors liste salaries</p>
                </div>
              </div>
              <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm text-gray-600">
                <li>Le RH cree une fiche candidat.</li>
                <li>Le candidat recoit un lien de creation de profil Beyond Connect.</li>
                <li>Il complete ses tests, son profil et ses badges.</li>
              </ol>
            </div>

            {result ? (
              <div className="rounded-[28px] border border-violet-200 bg-violet-50 p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-500">
                  Invitation creee
                </p>
                <p className="mt-2 text-sm font-semibold text-gray-900">{result.email}</p>
                <p className="mt-2 text-sm text-gray-600">{result.message}</p>
                {result.inviteLink ? (
                  <>
                    <Textarea readOnly value={result.inviteLink} className="mt-4 min-h-[120px] bg-white" />
                    <Button type="button" variant="outline" className="mt-3 rounded-full" onClick={() => void handleCopy()}>
                      <Copy className="h-4 w-4" />
                      Copier le lien
                    </Button>
                  </>
                ) : null}
              </div>
            ) : null}
          </aside>
        </div>
      </main>
    </div>
  );
}
