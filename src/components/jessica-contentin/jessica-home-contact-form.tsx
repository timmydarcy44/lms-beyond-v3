"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ConsultFor = "moi" | "tiers";
type Affiliation = "mon fils" | "ma fille" | "autre" | "";

const FIELD =
  "h-11 rounded-xl border-[#E6D9C6] bg-white text-[#2F2A25] placeholder:text-[#2F2A25]/35 focus-visible:ring-[#C6A664]/40";

/** Formulaire de contact en bas de l’accueil — remplace la preuve sociale répétée. */
export function JessicaHomeContactForm() {
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consultFor, setConsultFor] = useState<ConsultFor>("moi");
  const [affiliation, setAffiliation] = useState<Affiliation>("");
  const [childFullName, setChildFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (consultFor === "tiers" && (!affiliation || !childFullName.trim())) {
      toast.error("Indiquez le lien et le nom de l’enfant.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/jessica-contentin/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lastName: lastName.trim(),
          firstName: firstName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          consultFor,
          affiliation: consultFor === "tiers" ? affiliation : null,
          childFullName: consultFor === "tiers" ? childFullName.trim() : null,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Envoi impossible");
      setSent(true);
      toast.success("Message envoyé. Jessica vous recontactera rapidement.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Envoi impossible");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      className="scroll-mt-24 border-t border-[#E6D9C6]/70 bg-[#F8F5F0] py-16 md:py-20"
      aria-labelledby="contact-title"
    >
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55 }}
        className="mx-auto max-w-xl px-4 md:px-8"
      >
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9A7B52]">Contact</p>
          <h2
            id="contact-title"
            className="mt-3 text-3xl font-semibold tracking-tight text-[#2F2A25] md:text-4xl"
          >
            Demander un accompagnement
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[#5C5348]">
            Laissez vos coordonnées : Jessica vous répond sous 48&nbsp;h ouvrées.
          </p>
        </div>

        {sent ? (
          <div className="mt-10 rounded-2xl border border-[#E6D9C6] bg-white px-6 py-10 text-center">
            <p className="text-lg font-semibold text-[#2F2A25]">Merci</p>
            <p className="mt-2 text-sm text-[#5C5348]">
              Votre demande a bien été transmise au cabinet.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-10 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact-lastname" className="text-[#2F2A25]">
                  Nom
                </Label>
                <Input
                  id="contact-lastname"
                  required
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={FIELD}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-firstname" className="text-[#2F2A25]">
                  Prénom
                </Label>
                <Input
                  id="contact-firstname"
                  required
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={FIELD}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-email" className="text-[#2F2A25]">
                Adresse email
              </Label>
              <Input
                id="contact-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={FIELD}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-phone" className="text-[#2F2A25]">
                Numéro de téléphone
              </Label>
              <Input
                id="contact-phone"
                type="tel"
                required
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={FIELD}
              />
            </div>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-[#2F2A25]">Vous consultez…</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    { value: "moi" as const, label: "Je consulte pour moi" },
                    { value: "tiers" as const, label: "Je consulte pour une tierce personne" },
                  ] as const
                ).map((opt) => (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition",
                      consultFor === opt.value
                        ? "border-[#C4704B] bg-white text-[#2F2A25] shadow-sm"
                        : "border-[#E6D9C6] bg-white/70 text-[#5C5348] hover:border-[#C6A664]/60",
                    )}
                  >
                    <input
                      type="radio"
                      name="consultFor"
                      value={opt.value}
                      checked={consultFor === opt.value}
                      onChange={() => setConsultFor(opt.value)}
                      className="accent-[#C4704B]"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </fieldset>

            {consultFor === "tiers" ? (
              <div className="space-y-5 rounded-2xl border border-[#E6D9C6] bg-white/80 p-4 sm:p-5">
                <div className="space-y-2">
                  <Label htmlFor="contact-affiliation" className="text-[#2F2A25]">
                    Lien d&apos;affiliation
                  </Label>
                  <select
                    id="contact-affiliation"
                    required
                    value={affiliation}
                    onChange={(e) => setAffiliation(e.target.value as Affiliation)}
                    className={cn(
                      FIELD,
                      "flex w-full px-3 text-sm outline-none focus-visible:ring-2",
                    )}
                  >
                    <option value="" disabled>
                      Choisir…
                    </option>
                    <option value="mon fils">Mon fils</option>
                    <option value="ma fille">Ma fille</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-child" className="text-[#2F2A25]">
                    Nom et prénom de l&apos;enfant
                  </Label>
                  <Input
                    id="contact-child"
                    required
                    value={childFullName}
                    onChange={(e) => setChildFullName(e.target.value)}
                    className={FIELD}
                    placeholder="Nom et prénom"
                  />
                </div>
              </div>
            ) : null}

            <div className="pt-2">
              <Button
                type="submit"
                disabled={submitting}
                size="lg"
                className="w-full rounded-full bg-[#C4704B] px-8 py-6 text-base text-white shadow-[0_12px_32px_-12px_rgba(196,112,75,0.55)] hover:bg-[#A85A38] md:text-lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi…
                  </>
                ) : (
                  "Envoyer"
                )}
              </Button>
            </div>
          </form>
        )}
      </motion.div>
    </section>
  );
}
