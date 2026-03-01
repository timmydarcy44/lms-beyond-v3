"use client";

import { UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BnsPrivateHeader } from "@/components/beyond-no-school/bns-private-header";

export default function BeyondNoSchoolComptePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b0b10] pb-24 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(255,88,61,0.18),transparent_45%),radial-gradient(circle_at_82%_20%,rgba(80,130,255,0.12),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(180deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:2px_2px]" />

      <BnsPrivateHeader />

      <section className="mx-auto max-w-6xl space-y-8 px-6 pb-20 pt-12 sm:px-12 lg:px-24">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">Mon compte</p>
          <h1 className="text-pretty text-4xl font-semibold sm:text-5xl">Profil & préférences</h1>
          <p className="text-lg text-white/70">
            Personnalise ton apprentissage : formats préférés, rythme, et coordonnées.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/50">
            <UserRound className="h-4 w-4" />
            Informations personnelles
          </div>
          <form className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input id="firstName" placeholder="Prénom" className="border-white/20 bg-white/5 text-white" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input id="lastName" placeholder="Nom" className="border-white/20 bg-white/5 text-white" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="email@exemple.com" className="border-white/20 bg-white/5 text-white" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Téléphone (optionnel)</Label>
              <Input id="phone" placeholder="+33 6..." className="border-white/20 bg-white/5 text-white" />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="linkedin">LinkedIn (optionnel)</Label>
              <Input id="linkedin" placeholder="linkedin.com/in/..." className="border-white/20 bg-white/5 text-white" />
            </div>
            <div className="md:col-span-2">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                Préférences d’apprentissage
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Vidéo", "Schéma", "Carte mentale", "Audio", "Texte"].map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-white/15 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-white/60"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </form>
          <Button className="mt-6 rounded-full bg-white px-6 text-xs uppercase tracking-[0.3em] text-black hover:bg-white/90">
            Compléter mon profil (60 sec)
          </Button>
        </div>
      </section>
    </main>
  );
}

