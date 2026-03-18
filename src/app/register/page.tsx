"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [typeProfil, setTypeProfil] = useState<"emploi" | "freelance" | "reconversion" | "alternance">(
    "emploi"
  );
  const [posteActuel, setPosteActuel] = useState("");
  const [entreprise, setEntreprise] = useState("");
  const [typeContrat, setTypeContrat] = useState("");
  const [tjm, setTjm] = useState("");
  const [expertise, setExpertise] = useState("");
  const [stackTechnique, setStackTechnique] = useState("");
  const [disponibilite, setDisponibilite] = useState("");
  const [langues, setLangues] = useState("");
  const [ancienMetier, setAncienMetier] = useState("");
  const [metierVise, setMetierVise] = useState("");
  const [organismeFormation, setOrganismeFormation] = useState("");
  const [echeance, setEcheance] = useState("");
  const [ecole, setEcole] = useState("");
  const [niveauEtude, setNiveauEtude] = useState("");
  const [rythmeAlternance, setRythmeAlternance] = useState("");
  const [dateFinContrat, setDateFinContrat] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!supabase) {
      setError("Supabase n'est pas configuré.");
      setIsSubmitting(false);
      return;
    }

    const nameParts = fullName.trim().split(/\s+/);
    const first_name = nameParts.shift() || "";
    const last_name = nameParts.join(" ") || "";
    const emptyToNull = (value?: string) => {
      const trimmed = String(value ?? "").trim();
      return trimmed ? trimmed : null;
    };

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const isNevo = siteUrl.includes("nevo");
    const emailRedirectTo = isNevo
      ? "https://www.nevo-app.fr/app-landing/complete-profile"
      : null;
    const redirectTo = `${siteUrl}/auth/callback`;
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        ...(emailRedirectTo ? { emailRedirectTo } : { redirectTo }),
        data: {
          full_name: fullName,
          first_name,
          last_name,
          invite_code: inviteCode || null,
          role_type: "particulier",
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsSubmitting(false);
      return;
    }

    if (data.user?.id) {
      await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          email,
          full_name: fullName,
          first_name,
          last_name,
          role_type: "particulier",
          type_profil: typeProfil,
          poste_actuel: typeProfil === "emploi" ? emptyToNull(posteActuel) : null,
          entreprise: typeProfil === "emploi" ? emptyToNull(entreprise) : null,
          type_contrat: typeProfil === "emploi" ? emptyToNull(typeContrat) : null,
          tjm: typeProfil === "freelance" ? emptyToNull(tjm) : null,
          expertise: typeProfil === "freelance" ? emptyToNull(expertise) : null,
          stack_technique: typeProfil === "freelance" ? emptyToNull(stackTechnique) : null,
          disponibilite: typeProfil === "freelance" ? emptyToNull(disponibilite) : null,
          langues: typeProfil === "freelance" ? emptyToNull(langues) : null,
          ancien_metier: typeProfil === "reconversion" ? emptyToNull(ancienMetier) : null,
          metier_vise: typeProfil === "reconversion" ? emptyToNull(metierVise) : null,
          organisme_formation: typeProfil === "reconversion" ? emptyToNull(organismeFormation) : null,
          echeance: typeProfil === "reconversion" ? emptyToNull(echeance) : null,
          ecole: typeProfil === "alternance" ? emptyToNull(ecole) : null,
          niveau_etude: typeProfil === "alternance" ? emptyToNull(niveauEtude) : null,
          rythme_alternance: typeProfil === "alternance" ? emptyToNull(rythmeAlternance) : null,
          date_fin_contrat: typeProfil === "alternance" ? emptyToNull(dateFinContrat) : null,
        },
        { onConflict: "id" }
      );
      try {
        await fetch("/api/bootstrap-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: data.user.id,
            email,
            fullName,
            firstName: first_name,
            lastName: last_name,
            roleType: "particulier",
            typeProfil,
            posteActuel: typeProfil === "emploi" ? emptyToNull(posteActuel) : null,
            entreprise: typeProfil === "emploi" ? emptyToNull(entreprise) : null,
            typeContrat: typeProfil === "emploi" ? emptyToNull(typeContrat) : null,
            tjm: typeProfil === "freelance" ? emptyToNull(tjm) : null,
            expertise: typeProfil === "freelance" ? emptyToNull(expertise) : null,
            stackTechnique: typeProfil === "freelance" ? emptyToNull(stackTechnique) : null,
            disponibilite: typeProfil === "freelance" ? emptyToNull(disponibilite) : null,
            langues: typeProfil === "freelance" ? emptyToNull(langues) : null,
            ancienMetier: typeProfil === "reconversion" ? emptyToNull(ancienMetier) : null,
            metierVise: typeProfil === "reconversion" ? emptyToNull(metierVise) : null,
            organismeFormation: typeProfil === "reconversion" ? emptyToNull(organismeFormation) : null,
            echeance: typeProfil === "reconversion" ? emptyToNull(echeance) : null,
            ecole: typeProfil === "alternance" ? emptyToNull(ecole) : null,
            niveauEtude: typeProfil === "alternance" ? emptyToNull(niveauEtude) : null,
            rythmeAlternance: typeProfil === "alternance" ? emptyToNull(rythmeAlternance) : null,
            dateFinContrat: typeProfil === "alternance" ? emptyToNull(dateFinContrat) : null,
          }),
        });
      } catch {
        // ignore bootstrap errors
      }
    }

    router.push("/dashboard/apprenant/test-comportemental-intro");
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] px-6 py-16 text-white">
      <div className="mx-auto flex w-full max-w-md flex-col gap-8">
        <div className="flex items-center justify-between">
          <div className="text-[14px] font-semibold tracking-[0.3em] text-white">BEYOND</div>
          <Link href="/login" className="text-[12px] text-white/60 hover:text-white">
            Se connecter
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
        >
          <h1 className="text-2xl font-semibold">Créer mon compte</h1>
          <p className="mt-2 text-[13px] text-white/60">
            Rejoignez Beyond pour certifier vos soft skills.
          </p>

          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
            <label className="text-[12px] text-white/70">
              Nom
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#FF6B00]"
                placeholder="Marie Dupont"
                required
              />
            </label>
            <label className="text-[12px] text-white/70">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#FF6B00]"
                placeholder="vous@email.com"
                required
              />
            </label>
            <label className="text-[12px] text-white/70">
              Type de profil
              <select
                value={typeProfil}
                onChange={(event) =>
                  setTypeProfil(event.target.value as "emploi" | "freelance" | "reconversion" | "alternance")
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#FF6B00]"
              >
                <option value="emploi">Emploi</option>
                <option value="freelance">Freelance</option>
                <option value="alternance">Alternance</option>
                <option value="reconversion">Reconversion</option>
              </select>
            </label>
            {typeProfil === "emploi" ? (
              <>
                <label className="text-[12px] text-white/70">
                  Poste actuel
                  <input
                    value={posteActuel}
                    onChange={(event) => setPosteActuel(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#FF6B00]"
                    placeholder="Chargé de projet"
                  />
                </label>
                <label className="text-[12px] text-white/70">
                  Entreprise
                  <input
                    value={entreprise}
                    onChange={(event) => setEntreprise(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#FF6B00]"
                    placeholder="Beyond"
                  />
                </label>
                <label className="text-[12px] text-white/70">
                  Type de contrat
                  <select
                    value={typeContrat}
                    onChange={(event) => setTypeContrat(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#FF6B00]"
                  >
                    <option value="">Choisir</option>
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="Alternance">Alternance</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Interim">Intérim</option>
                  </select>
                </label>
              </>
            ) : null}
            {typeProfil === "freelance" ? (
              <>
                <label className="text-[12px] text-white/70">
                  TJM
                  <input
                    value={tjm}
                    onChange={(event) => setTjm(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#FF6B00]"
                    placeholder="450€"
                  />
                </label>
                <label className="text-[12px] text-white/70">
                  Expertise (tags)
                  <input
                    value={expertise}
                    onChange={(event) => setExpertise(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#FF6B00]"
                    placeholder="Product, UX, Marketing"
                  />
                </label>
                <label className="text-[12px] text-white/70">
                  Stack technique
                  <input
                    value={stackTechnique}
                    onChange={(event) => setStackTechnique(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#FF6B00]"
                    placeholder="React, Node, Figma"
                  />
                </label>
                <label className="text-[12px] text-white/70">
                  Disponibilité
                  <select
                    value={disponibilite}
                    onChange={(event) => setDisponibilite(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#FF6B00]"
                  >
                    <option value="">Choisir</option>
                    <option value="Oui">Oui</option>
                    <option value="Non">Non</option>
                  </select>
                </label>
                <label className="text-[12px] text-white/70">
                  Langues
                  <input
                    value={langues}
                    onChange={(event) => setLangues(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#FF6B00]"
                    placeholder="FR, EN"
                  />
                </label>
              </>
            ) : null}
            {typeProfil === "reconversion" ? (
              <>
                <label className="text-[12px] text-white/70">
                  Ancien métier
                  <input
                    value={ancienMetier}
                    onChange={(event) => setAncienMetier(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#FF6B00]"
                    placeholder="Commercial"
                  />
                </label>
                <label className="text-[12px] text-white/70">
                  Métier visé
                  <input
                    value={metierVise}
                    onChange={(event) => setMetierVise(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#FF6B00]"
                    placeholder="Chef de projet"
                  />
                </label>
                <label className="text-[12px] text-white/70">
                  Organisme de formation
                  <input
                    value={organismeFormation}
                    onChange={(event) => setOrganismeFormation(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#FF6B00]"
                    placeholder="OpenClassrooms"
                  />
                </label>
                <label className="text-[12px] text-white/70">
                  Échéance
                  <input
                    type="date"
                    value={echeance}
                    onChange={(event) => setEcheance(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#FF6B00]"
                  />
                </label>
              </>
            ) : null}
            {typeProfil === "alternance" ? (
              <>
                <label className="text-[12px] text-white/70">
                  École
                  <input
                    value={ecole}
                    onChange={(event) => setEcole(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#FF6B00]"
                    placeholder="ISPN Le Havre"
                  />
                </label>
                <label className="text-[12px] text-white/70">
                  Niveau d'étude
                  <input
                    value={niveauEtude}
                    onChange={(event) => setNiveauEtude(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#FF6B00]"
                    placeholder="Bac +3"
                  />
                </label>
                <label className="text-[12px] text-white/70">
                  Rythme
                  <input
                    value={rythmeAlternance}
                    onChange={(event) => setRythmeAlternance(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#FF6B00]"
                    placeholder="3j / 2j"
                  />
                </label>
                <label className="text-[12px] text-white/70">
                  Date de fin de contrat
                  <input
                    type="date"
                    value={dateFinContrat}
                    onChange={(event) => setDateFinContrat(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#FF6B00]"
                  />
                </label>
              </>
            ) : null}
            <label className="text-[12px] text-white/70">
              Mot de passe
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#FF6B00]"
                placeholder="••••••••"
                required
              />
            </label>
            <label className="text-[12px] text-white/70">
              Code Invitation / École (optionnel)
              <input
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#FF6B00]"
                placeholder="Ex: ALESIA2026"
              />
            </label>

            {error ? <p className="text-[12px] text-red-400">{error}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 rounded-full bg-[#FF6B00] px-4 py-3 text-[13px] font-semibold text-[#111827] shadow-[0_0_25px_rgba(255,107,0,0.35)] transition hover:shadow-[0_0_40px_rgba(255,107,0,0.6)]"
            >
              {isSubmitting ? "Création..." : "Créer mon compte"}
            </button>
          </form>
        </motion.div>

        <div className="text-center text-[12px] text-white/60">
          Déjà inscrit ?{" "}
          <Link href="/login" className="text-white hover:underline">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
