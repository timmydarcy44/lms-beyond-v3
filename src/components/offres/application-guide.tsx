"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DISC_QUESTION_COUNT } from "@/lib/disc/disc-questions";
import { IDMC_QUESTION_COUNT } from "@/lib/idmc/idmc-questions";
import type { HomeApplication } from "@/lib/offres/application-home";
import { SOFT_SKILLS } from "@/lib/soft-skills/questions";

const RETURN = "/offres/candidature";

export function ApplicationGuide({ application }: { application: HomeApplication }) {
  const router = useRouter();
  const [phone, setPhone] = useState(application.phone);
  const [place, setPlace] = useState(application.place);
  const [pitch, setPitch] = useState(application.pitch);
  const [share, setShare] = useState(application.share);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [openOthers, setOpenOthers] = useState(false);
  const done = [application.profileDone, application.tests.soft && application.tests.disc && application.tests.idmc, application.status === "submitted"].filter(Boolean).length;
  const testsDone = application.tests.soft && application.tests.disc && application.tests.idmc;
  const step = application.status === "submitted" ? 3 : !application.profileDone ? 1 : !testsDone ? 2 : 3;

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const body = new FormData(event.currentTarget);
    body.set("id", application.id);
    const response = await fetch("/api/offres/candidature", { method: "POST", body });
    const result = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setError(result.error || "Enregistrement impossible.");
      return;
    }
    router.refresh();
  }

  async function sendApplication() {
    setBusy(true);
    setError("");
    const response = await fetch("/api/offres/candidature/envoyer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: application.id, share }),
    });
    const result = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setError(result.error || "Envoi impossible.");
      return;
    }
    router.refresh();
  }

  if (application.closed && application.status === "draft") {
    return (
      <section className="mb-8 rounded-[32px] bg-[#15171E] p-6 text-white">
        <p className="text-sm text-white/60">Votre candidature à</p>
        <h2 className="mt-2 text-2xl font-extrabold">{application.title}{application.city ? ` · ${application.city}` : ""}</h2>
        <p className="mt-3 text-sm text-white/70">Cette offre n&apos;est plus disponible.</p>
        <Similar offers={application.similar} />
      </section>
    );
  }

  if (application.status === "submitted") {
    const sent = application.submittedAt ? new Date(application.submittedAt) : new Date();
    const date = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(sent);
    const segments = ["Envoyée", "Vue par l'entreprise", "Entretien", "Réponse"];
    const active = application.stage === "retained" ? 3 : application.stage === "interview" ? 2 : 0;
    return (
      <section className="mb-8 space-y-4 text-white">
        <div className="rounded-[32px] bg-[#6E5BFF] p-6">
          <p className="text-2xl font-extrabold">✓ Candidature envoyée</p>
          <p className="mt-2 text-sm text-white/85">{application.title}{application.city ? ` · ${application.city}` : ""} · le {date}. Réponse sous 10 jours, par email et dans votre espace.</p>
          <div className="mt-5 grid grid-cols-4 gap-2 text-xs font-semibold">
            {segments.map((label, index) => (
              <span key={label} className={index <= active ? "text-white" : "text-white/45"}>{label}</span>
            ))}
          </div>
        </div>
        {application.cursus ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[26px] border-2 border-[#6E5BFF] bg-[#15171E] p-5">
            <div>
              <p className="font-extrabold">Admission à Byound School</p>
              <p className="text-sm text-white/60">Obligatoire pour ce poste.</p>
            </div>
            <Link href={application.resumeToken ? `/ecole/candidater?resume=${application.resumeToken}` : "/ecole/candidater"} className="inline-flex h-11 items-center rounded-full bg-[#6E5BFF] px-4 text-sm font-semibold">
              {application.resumeToken ? "Reprendre" : "Commencer le challenge"}
            </Link>
          </div>
        ) : null}
        <Similar offers={application.similar} />
        <Others application={application} open={openOthers} onToggle={() => setOpenOthers((value) => !value)} />
      </section>
    );
  }

  return (
    <section className="mb-8 text-white">
      <div className="rounded-[32px] bg-[#15171E] p-6 shadow-[0_0_80px_rgba(110,91,255,0.2)]">
        <p className="text-sm text-white/55">Bienvenue {application.firstName || ""} · votre candidature à</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.04em]">{application.title}{application.city ? ` · ${application.city}` : ""}</h2>
        <p className="mt-4 text-4xl font-extrabold">{done} <span className="text-lg text-white/50">/ 3 étapes</span></p>
        <div className="mt-3 flex gap-2" aria-hidden>
          {[0, 1, 2].map((index) => <span key={index} className={`h-1.5 flex-1 rounded-full ${index < done ? "bg-[#6E5BFF]" : "bg-white/10"}`} />)}
        </div>
        <p className="mt-4 max-w-2xl text-sm text-white/70">
          Votre profil, puis vos 3 tests : ensuite, vous envoyez votre candidature.
          {application.cursus ? " Ce poste inclut l'admission à Byound School." : ""}
        </p>
        <div className="mt-4 rounded-2xl bg-white/5 px-4 py-3 text-sm">
          <p className="font-semibold">Votre compatibilité avec l&apos;offre</p>
          {application.compatibility.revealed && application.compatibility.matched != null ? (
            <p className="mt-1">{application.compatibility.matched} / {application.compatibility.total} compétences clés</p>
          ) : (
            <p className="mt-1 text-white/60">À découvrir · Se débloque après le test de soft skills (10 min)</p>
          )}
        </div>
      </div>

      <h3 className="mt-8 text-xl font-extrabold">Votre candidature en 3 étapes</h3>
      <div className="mt-4 space-y-3">
        <article className={`rounded-[26px] bg-[#15171E] p-5 ${step === 1 ? "border-2 border-[#6E5BFF]" : ""}`}>
          {application.profileDone ? (
            <p className="font-extrabold">✓ Profil complété</p>
          ) : (
            <form onSubmit={(event) => void saveProfile(event)}>
              <p className="font-extrabold">1 · Compléter mon profil <span className="ml-2 rounded-full bg-[#6E5BFF]/20 px-2 py-0.5 text-xs">2 min</span></p>
              <p className="mt-1 text-sm text-white/60">Votre téléphone et votre ville. Le CV est facultatif.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-sm">Téléphone<input name="phone" required value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1 h-11 w-full rounded-xl bg-[#0E1016] px-3" /></label>
                <label className="text-sm">Ville<input name="city" required value={place} onChange={(event) => setPlace(event.target.value)} className="mt-1 h-11 w-full rounded-xl bg-[#0E1016] px-3" /></label>
              </div>
              <label className="mt-3 block text-sm">CV, facultatif · PDF ou DOCX, 5 Mo maximum<input name="cv" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="mt-2 block text-sm" /></label>
              <label className="mt-3 block text-sm">Un mot pour l&apos;entreprise (facultatif)<input name="pitch" value={pitch} onChange={(event) => setPitch(event.target.value)} placeholder="Pourquoi ce poste vous intéresse, en une phrase" className="mt-1 h-11 w-full rounded-xl bg-[#0E1016] px-3" /></label>
              {error ? <p className="mt-3 text-sm text-[#FDA4AF]">{error}</p> : null}
              <button type="submit" disabled={busy} className="mt-4 h-11 rounded-full bg-[#6E5BFF] px-4 text-sm font-semibold disabled:opacity-60">{busy ? "Enregistrement…" : "Enregistrer et passer aux tests"}</button>
            </form>
          )}
        </article>

        <article className={`rounded-[26px] bg-[#15171E] p-5 ${step === 2 ? "border-2 border-[#6E5BFF]" : ""}`} aria-disabled={!application.profileDone}>
          <p className="font-extrabold">2 · Passer mes 3 tests <span className="ml-2 text-xs text-[#6EE7B7]">{[application.tests.soft, application.tests.disc, application.tests.idmc].filter(Boolean).length} / 3 · 25 min</span></p>
          {application.profileDone ? (
            <>
              <ul className="mt-4 space-y-3 text-sm">
                <TestRow name="Soft skills" detail={`${SOFT_SKILLS.length * 3} questions · 10 min`} done={application.tests.soft} href={`/soft-skills/test?retour=${RETURN}`} next={!application.tests.soft} />
                <TestRow name="Profil comportemental" detail={`${DISC_QUESTION_COUNT} questions · 8 min`} done={application.tests.disc} href={`/dashboard/apprenant/disc/test?retour=${RETURN}`} next={application.tests.soft && !application.tests.disc} />
                <TestRow name="Maîtrise cognitive" detail={`${IDMC_QUESTION_COUNT} questions · 7 min`} done={application.tests.idmc} href={`/dashboard/apprenant/idmc/test?retour=${RETURN}`} next={application.tests.soft && application.tests.disc && !application.tests.idmc} />
              </ul>
              <p className="mt-3 text-xs text-white/50">Chaque test s&apos;ouvre à part. Vous revenez ici ensuite, et vous pouvez vous arrêter pour reprendre plus tard.</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-white/55">Disponibles dès que votre profil est complété.</p>
          )}
        </article>

        <article className={`rounded-[26px] bg-[#15171E] p-5 ${step === 3 && application.profileDone && testsDone ? "border-2 border-[#6E5BFF]" : ""}`} aria-disabled={!testsDone}>
          <p className="font-extrabold">3 · Envoyer ma candidature</p>
          {testsDone ? (
            <>
              <p className="mt-3 text-sm font-semibold">L&apos;entreprise recevra</p>
              <div className="mt-3 space-y-2 text-sm">
                <Switch label="Soft skills" checked={share.soft} onChange={(value) => setShare({ ...share, soft: value })} />
                <Switch label="Profil comportemental" checked={share.disc} onChange={(value) => setShare({ ...share, disc: value })} />
                <Switch label="Maîtrise cognitive" checked={share.idmc} onChange={(value) => setShare({ ...share, idmc: value })} />
              </div>
              <p className="mt-3 text-xs text-white/55">Votre profil part toujours. Le CV aussi, seulement s&apos;il est déposé. Les résultats de tests, seulement ceux que vous activez.</p>
              {error && application.profileDone ? <p className="mt-3 text-sm text-[#FDA4AF]">{error}</p> : null}
              <button type="button" disabled={busy} onClick={() => void sendApplication()} className="mt-4 h-11 rounded-full bg-[#6E5BFF] px-4 text-sm font-semibold disabled:opacity-60">
                {busy ? "Envoi…" : "Envoyer ma candidature"}
              </button>
            </>
          ) : (
            <p className="mt-2 text-sm text-white/55">Se débloque quand vos 3 tests sont terminés.</p>
          )}
        </article>
      </div>
      <Others application={application} open={openOthers} onToggle={() => setOpenOthers((value) => !value)} />
    </section>
  );
}

function TestRow({ name, detail, done, href, next }: { name: string; detail: string; done: boolean; href: string; next: boolean }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span>
        <span className="block font-semibold">{done ? "✓ " : ""}{name}</span>
        <span className="text-white/55">{done ? "Terminé · résultat dans Mes bilans" : detail}</span>
      </span>
      {done ? null : next ? <Link href={href} className="inline-flex h-10 items-center rounded-full bg-[#6E5BFF] px-3 text-xs font-semibold">Commencer</Link> : <Link href={href} className="text-xs font-semibold text-white/70">Ouvrir</Link>}
    </li>
  );
}

function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`h-7 w-12 rounded-full p-1 ${checked ? "bg-[#6E5BFF]" : "bg-white/15"}`}>
        <span className={`block h-5 w-5 rounded-full bg-white transition ${checked ? "translate-x-5" : ""}`} />
      </button>
    </label>
  );
}

function Similar({ offers }: { offers: HomeApplication["similar"] }) {
  if (!offers.length) return null;
  return (
    <div>
      <h3 className="text-lg font-extrabold">D&apos;autres offres pour vous</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {offers.map((offer) => (
          <Link key={offer.slug} href={`/offres/${offer.slug}`} className="rounded-[26px] bg-[#15171E] p-4">
            <p className="text-xs text-white/50">Entreprise partenaire · {offer.sector}{offer.city ? ` · ${offer.city}` : ""}</p>
            <p className="mt-2 font-extrabold">{offer.title}</p>
            {offer.cursus ? <p className="mt-2 text-xs text-[#C9C2FF]">✦ {offer.cursus}</p> : null}
          </Link>
        ))}
      </div>
    </div>
  );
}

function Others({ application, open, onToggle }: { application: HomeApplication; open: boolean; onToggle: () => void }) {
  if (!application.others.length) return null;
  return (
    <div className="mt-4">
      <button type="button" onClick={onToggle} className="text-sm font-semibold text-white/70">
        {application.others.length} autre{application.others.length > 1 ? "s" : ""} candidature{application.others.length > 1 ? "s" : ""} en cours
      </button>
      {open ? (
        <ul className="mt-2 space-y-1 text-sm text-white/70">
          {application.others.map((item) => <li key={item.id}>{item.title}{item.city ? ` · ${item.city}` : ""}</li>)}
        </ul>
      ) : null}
    </div>
  );
}
