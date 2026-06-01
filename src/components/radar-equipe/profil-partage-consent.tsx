"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

type ProfilPartageConsentProps = {
  managerId: string;
};

export function ProfilPartageConsent({ managerId }: ProfilPartageConsentProps) {
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mention, setMention] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/radar-equipe/partage");
        const json = (await res.json()) as {
          consentement?: boolean;
          mention?: string;
        };
        setConsent(Boolean(json.consentement));
        setMention(json.mention ?? "");
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = async (next: boolean) => {
    setSaving(true);
    try {
      const res = await fetch("/api/radar-equipe/partage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerId, consent: next }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      setConsent(next);
      toast.success(next ? "Partage activé" : "Partage révoqué");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-white">Partager mon profil avec mon responsable</p>
          <p className="mt-1 text-xs text-white/55">
            {mention ||
              "Vos données personnelles ne sont jamais communiquées à votre employeur sans votre accord explicite."}
          </p>
        </div>
        <Switch
          checked={consent}
          disabled={saving}
          onCheckedChange={(v) => void toggle(v)}
          aria-label="Consentement partage profil"
        />
      </div>
      {consent ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-3 text-xs text-white/60"
          disabled={saving}
          onClick={() => void toggle(false)}
        >
          Révoquer le partage
        </Button>
      ) : null}
    </div>
  );
}
