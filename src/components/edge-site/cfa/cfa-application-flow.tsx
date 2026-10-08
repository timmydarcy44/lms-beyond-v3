"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, CircleStop, Loader2, Mic, Sparkles, Upload, Video } from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  CFA_CHALLENGE_QUESTIONS,
  CFA_SPECIALIZATIONS,
  getCfaSpecializationLabel,
  type CfaApplication,
} from "@/lib/cfa-applications";
import { cn } from "@/lib/utils";
import { COUNTRY_OPTIONS } from "@/lib/country-options";

const TOKEN_KEY = "byound_cfa_application_token";
const NTC_SPECIALIZATIONS = new Set(["ai_business", "sport_business", "real_estate"]);
const control =
  "w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#7770ff]";

export function CfaApplicationFlow() {
  const params = useSearchParams();
  const resume = params.get("resume");
  const requested = params.get("specialization");
  const ntcOnly = params.get("track") === "ntc";
  const specializationOptions = ntcOnly
    ? CFA_SPECIALIZATIONS.filter((item) => NTC_SPECIALIZATIONS.has(item.value))
    : CFA_SPECIALIZATIONS;
  const specializationGroups = [...new Set(specializationOptions.map((item) => item.group))];
  const [app, setApp] = useState<CfaApplication | null>(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cvName, setCvName] = useState("");
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    age: "",
    educationLevel: "",
    specialization: specializationOptions.some((item) => item.value === requested)
      ? requested!
      : "",
  });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [dossier, setDossier] = useState({
    schoolBackground: "",
    experiences: "",
    motivationText: "",
    motivationMediaUrl: "",
    alternanceStatus: "",
  });

  useEffect(() => {
    void (async () => {
      await Promise.resolve();
      const saved = resume || localStorage.getItem(TOKEN_KEY);
      if (!saved) return setLoading(false);
      if (resume) localStorage.setItem(TOKEN_KEY, resume);
      setToken(saved);
      try {
        const response = await fetch(`/api/cfa/applications?token=${encodeURIComponent(saved)}`);
        if (!response.ok) throw new Error();
        const data = await response.json();
        setApp(data.application);
        setAnswers(data.application.challenge_answers ?? {});
        setDossier({
          schoolBackground: data.application.school_background ?? "",
          experiences: data.application.experiences ?? "",
          motivationText: data.application.motivation_text ?? "",
          motivationMediaUrl: data.application.motivation_media_url ?? "",
          alternanceStatus: data.application.alternance_status ?? "",
        });
      } catch {
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        setLoading(false);
      }
    })();
  }, [resume]);

  useEffect(() => {
    const sessionId = params.get("session_id");
    if (!token || params.get("payment") !== "success" || !sessionId) return;
    void fetch("/api/cfa/registration-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action: "confirm", sessionId }),
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        setApp(result.application);
      })
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : "Paiement non confirmé."),
      );
  }, [params, token]);

  async function send(method: "POST" | "PATCH", payload: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/cfa/applications", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setApp(result.application);
      if (result.application.resume_token) {
        const next = String(result.application.resume_token);
        setToken(next);
        localStorage.setItem(TOKEN_KEY, next);
      }
      scrollTo({ top: 0, behavior: "smooth" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  async function upload(
    file: File,
    kind: "cv" | "motivation" | "identity" | "social_security" | "diploma",
  ) {
    setBusy(true);
    const body = new FormData();
    body.set("token", token);
    body.set("kind", kind);
    body.set("file", file);
    try {
      const response = await fetch("/api/cfa/applications/upload", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (kind === "cv") setCvName(file.name);
      return String(result.path);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Téléversement impossible.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="flex min-h-[70vh] items-center justify-center bg-[#070b1f]"><Loader2 className="h-7 w-7 animate-spin text-[#7770ff]" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#070b1f] px-5 pb-24 pt-28 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8c86ff]">Byound School · Admissions</p>
        <h1 className="mt-4 text-[clamp(2.7rem,6vw,5rem)] font-semibold leading-[.93] tracking-[-.055em]">Build what&apos;s next.</h1>
        <p className="mt-4 text-white/50">Votre potentiel d’abord. L’entreprise et le financement viennent après l’admission.</p>
        <Stepper status={app?.status ?? "profile"} />

        <main className="mt-10 rounded-[32px] border border-white/10 bg-white/[.045] p-6 backdrop-blur-xl sm:p-10">
          {!app ? (
            <form onSubmit={(event) => {
              event.preventDefault();
              if (!profile.specialization) {
                setError("Choisissez une spécialisation.");
                return;
              }
              void send("POST", profile);
            }}>
              <Title overline="Étape 1 · 2 minutes">Créez votre profil Byound.</Title>
              <p className="mt-3 text-sm text-white/45">Aucune entreprise n’est demandée à cette étape.</p>
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <Input label="Prénom" value={profile.firstName} onChange={(value) => setProfile({ ...profile, firstName: value })} />
                <Input label="Nom" value={profile.lastName} onChange={(value) => setProfile({ ...profile, lastName: value })} />
                <Input label="Email" type="email" value={profile.email} onChange={(value) => setProfile({ ...profile, email: value })} />
                <Input label="Téléphone (optionnel)" type="tel" value={profile.phone} onChange={(value) => setProfile({ ...profile, phone: value })} required={false} />
                <Input label="Âge" type="number" value={profile.age} onChange={(value) => setProfile({ ...profile, age: value })} />
                <label className="text-sm text-white/80">Niveau d’études<select className={cn(control, "mt-2")} value={profile.educationLevel} onChange={(event) => setProfile({ ...profile, educationLevel: event.target.value })} required><option value="" className="text-black">Sélectionner</option>{["Bac en cours","Bac obtenu","Bac+1","Bac+2","Bac+3 ou plus"].map((level) => <option key={level} className="text-black">{level}</option>)}</select></label>
              </div>
              <p className="mb-3 mt-6 text-sm text-white/80">Spécialisation visée</p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {specializationGroups.map((group) => (
                  <section key={group} className="rounded-2xl border border-white/10 bg-white/[0.025] p-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">{group}</p>
                    <div className="grid gap-2">
                      {specializationOptions.filter((item) => item.group === group).map((item) => (
                        <button key={item.value} type="button" onClick={() => setProfile({ ...profile, specialization: item.value })} className={cn("min-h-12 rounded-xl border px-3 text-left text-sm font-semibold", profile.specialization === item.value ? "border-[#7770ff] bg-[#7770ff]/20" : "border-white/10 text-white/50")}>{item.label}</button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
              <Submit busy={busy} error={error}>Commencer le challenge</Submit>
            </form>
          ) : null}

          {app?.status === "challenge" ? (
            <form onSubmit={(event) => { event.preventDefault(); void send("PATCH", { token, action: "challenge", answers }); }}>
              <Title overline="Étape 2 · 10 à 15 minutes">Le Byound Challenge.</Title>
              <p className="mt-3 text-sm text-white/45">Il n’y a pas une seule bonne réponse. Nous cherchons votre façon de raisonner.</p>
              <div className="mt-8 space-y-7">{CFA_CHALLENGE_QUESTIONS.map((question, index) => <label key={question.id} className="block"><span className="text-xs font-semibold uppercase tracking-wider text-[#8c86ff]">{index + 1} · {question.eyebrow}</span><span className="my-3 block text-lg font-medium">{question.question}</span><textarea className={control} rows={5} value={answers[question.id] ?? ""} onChange={(event) => setAnswers({ ...answers, [question.id]: event.target.value })} required /></label>)}</div>
              <Submit busy={busy} error={error}>Valider mon challenge</Submit>
            </form>
          ) : null}

          {app?.status === "dossier" ? (
            <form onSubmit={(event) => { event.preventDefault(); void send("PATCH", { token, action: "dossier", ...dossier }); }}>
              <Title overline="Étape 3 · Dossier candidat">Votre parcours, sans lettre formatée.</Title>
              <div className="mt-8 space-y-6">
                <Area label="Parcours scolaire" value={dossier.schoolBackground} onChange={(value) => setDossier({ ...dossier, schoolBackground: value })} />
                <Area label="Expériences (optionnel)" value={dossier.experiences} onChange={(value) => setDossier({ ...dossier, experiences: value })} required={false} />
                <label className="block text-sm text-white/80">CV (optionnel)<span className="mt-2 flex min-h-14 cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-white/15 px-4 text-white/50"><Upload className="h-4 w-4" />{cvName || "Choisir un PDF ou une image"}<input type="file" className="sr-only" accept=".pdf,image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file, "cv"); }} /></span></label>
                <Area label="Pourquoi Byound ? Écrivez, parlez ou filmez-vous." value={dossier.motivationText} onChange={(value) => setDossier({ ...dossier, motivationText: value })} required={false} />
                <Recorder busy={busy} onFile={async (file) => { const path = await upload(file, "motivation"); if (!path) return false; setDossier((current) => ({ ...current, motivationMediaUrl: path })); return true; }} />
                <p className="text-sm text-white/80">Situation vis-à-vis de l’alternance</p>
                <div className="grid gap-3 sm:grid-cols-2">{[["company_found","J’ai déjà une entreprise"],["searching","Je recherche une entreprise"]].map(([value,label]) => <button key={value} type="button" onClick={() => setDossier({ ...dossier, alternanceStatus: value })} className={cn("min-h-14 rounded-2xl border text-sm font-semibold", dossier.alternanceStatus === value ? "border-[#7770ff] bg-[#7770ff]/20" : "border-white/10 text-white/50")}>{label}</button>)}</div>
              </div>
              <Submit busy={busy} error={error}>Envoyer mon dossier</Submit>
            </form>
          ) : null}

          {app && ["interview","review"].includes(app.status) ? <Waiting review={app.status === "review"} /> : null}
          {app?.status === "administrative" ? (
            <AdministrativeEnrollment
              app={app}
              token={token}
              busy={busy}
              error={error}
              upload={upload}
              save={(cerfaData) => void send("PATCH", { token, action: "administrative", cerfaData })}
            />
          ) : null}
          {app?.status === "admitted" ? <Admitted app={app} busy={busy} error={error} choose={(financingPath) => void send("PATCH", { token, action: "financing", financingPath })} /> : null}
        </main>
      </div>
    </div>
  );
}

function Stepper({ status }: { status: string }) {
  const labels = ["profile","challenge","dossier","interview","review","administrative","admitted"];
  const current = Math.max(labels.indexOf(status), 0);
  return <div className="mt-10 flex overflow-x-auto">{labels.map((item,index) => <div key={item} className="flex min-w-28 flex-1 items-center gap-2 text-xs"><span className={cn("flex h-7 w-7 items-center justify-center rounded-full border", index < current ? "border-[#7770ff] bg-[#7770ff]" : index === current ? "bg-white text-[#070b1f]" : "border-white/15 text-white/30")}>{index < current ? <Check className="h-3 w-3" /> : index + 1}</span><span className="capitalize text-white/50">{item}</span></div>)}</div>;
}

function Title({ overline, children }: { overline: string; children: React.ReactNode }) {
  return <><p className="text-xs font-semibold uppercase tracking-[.2em] text-white/35">{overline}</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.04em]">{children}</h2></>;
}

function Input({ label, value, onChange, type = "text", required = true }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="text-sm text-white/80">{label}<input className={cn(control, "mt-2")} type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} /></label>;
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <label className="text-sm text-white/80">
      {label}
      <select
        className={cn(control, "mt-2")}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      >
        <option value="" className="text-black">Sélectionner</option>
        {options.map((option) => (
          <option key={option} value={option} className="text-black">
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function CountrySelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = COUNTRY_OPTIONS.find((country) => country.label === value);
  const results = COUNTRY_OPTIONS.filter((country) =>
    country.label.toLocaleLowerCase("fr").includes(query.trim().toLocaleLowerCase("fr")),
  );

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={root} className="relative text-sm text-white/80">
      <span>Nationalité</span>
      <select className="sr-only" required value={value} onChange={(event) => onChange(event.target.value)} tabIndex={-1}>
        <option value="">Sélectionner</option>
        {COUNTRY_OPTIONS.map((country) => (
          <option key={country.code} value={country.label}>
            {country.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(control, "mt-2 flex items-center justify-between text-left")}
      >
        <span className={selected ? "text-white" : "text-white/25"}>
          {selected ? `${selected.flag} ${selected.label}` : "Sélectionner"}
        </span>
        <span className="text-white/35">▾</span>
      </button>
      {open ? (
        <div className="absolute z-30 mt-2 max-h-72 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#10153a] shadow-2xl">
          <input
            autoFocus
            className="w-full border-b border-white/10 bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-white/25"
            placeholder="Rechercher un pays"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="max-h-56 overflow-y-auto">
            {results.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => {
                  onChange(country.label);
                  setOpen(false);
                  setQuery("");
                }}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-white/10",
                  country.label === value ? "bg-[#7770ff]/20 text-white" : "text-white/80",
                )}
              >
                <span className="text-base">{country.flag}</span>
                {country.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Area({ label, value, onChange, required = true }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return <label className="block text-sm text-white/80">{label}<textarea className={cn(control, "mt-2")} rows={5} value={value} onChange={(event) => onChange(event.target.value)} required={required} /></label>;
}

function Submit({ busy, error, children }: { busy: boolean; error: string; children: React.ReactNode }) {
  return <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-7"><p className="text-sm text-rose-300">{error}</p><button disabled={busy} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-[#070b1f]">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{children}<ArrowRight className="h-4 w-4" /></button></div>;
}

function Recorder({ busy, onFile }: { busy: boolean; onFile: (file: File) => Promise<boolean> }) {
  const media = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const camera = useRef<HTMLVideoElement | null>(null);
  const [mode, setMode] = useState<"audio" | "video" | null>(null);
  const [recording, setRecording] = useState(false);
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");

  async function start(nextMode: "audio" | "video") {
    try {
      const source = await navigator.mediaDevices.getUserMedia(nextMode === "video" ? { video: true, audio: true } : { audio: true });
      stream.current = source;
      setMode(nextMode);
      const recorder = new MediaRecorder(
        source,
        nextMode === "video"
          ? { videoBitsPerSecond: 500_000, audioBitsPerSecond: 64_000 }
          : { audioBitsPerSecond: 64_000 },
      );
      media.current = recorder;
      chunks.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: recorder.mimeType || `${nextMode}/webm` });
        setPreview(URL.createObjectURL(blob));
        source.getTracks().forEach((track) => track.stop());
        const file = new File([blob], `motivation-${Date.now()}.webm`, { type: blob.type });
        void onFile(file).then((saved) =>
          setMessage(
            saved
              ? "Enregistrement ajouté au dossier."
              : "L’enregistrement n’a pas pu être envoyé. Réessayez.",
          ),
        );
      };
      recorder.start();
      setRecording(true);
      window.setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
          setRecording(false);
        }
      }, 45_000);
      setTimeout(() => { if (camera.current) camera.current.srcObject = source; }, 0);
    } catch { setMessage("Autorisez l’accès à la caméra ou au micro."); }
  }

  return <div className="rounded-2xl border border-white/10 p-4"><div className="flex flex-wrap gap-2"><button type="button" disabled={recording || busy} onClick={() => void start("audio")} className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs"><Mic className="h-4 w-4" />Parler dans le micro</button><button type="button" disabled={recording || busy} onClick={() => void start("video")} className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs"><Video className="h-4 w-4" />Allumer la caméra</button>{recording ? <button type="button" onClick={() => { media.current?.stop(); setRecording(false); }} className="flex items-center gap-2 rounded-full bg-rose-500 px-4 py-2 text-xs"><CircleStop className="h-4 w-4" />Terminer</button> : null}</div>{mode === "video" && recording ? <video ref={camera} autoPlay muted playsInline className="mt-4 aspect-video max-w-md rounded-xl bg-black" /> : null}{preview && mode === "video" ? <video controls src={preview} className="mt-4 max-w-md rounded-xl" /> : null}{preview && mode === "audio" ? <audio controls src={preview} className="mt-4 w-full max-w-md" /> : null}{message ? <p className="mt-3 text-xs text-emerald-300">{message}</p> : null}</div>;
}

function Waiting({ review }: { review: boolean }) {
  return <div className="py-12 text-center"><h2 className="text-3xl font-semibold">{review ? "Votre candidature est en cours d’étude." : "Place à la rencontre."}</h2><p className="mx-auto mt-4 max-w-xl text-white/45">{review ? "Le comité étudie votre dossier." : "Un membre du comité de projet vous contactera dans les plus brefs délais."}</p></div>;
}

const CERFA_FIELDS = [
  ["lastName", "Nom", "text"],
  ["firstNames", "Prénom(s)", "text"],
  ["sex", "Sexe", "select"],
  ["birthDate", "Date de naissance", "date"],
  ["birthCity", "Commune de naissance", "text"],
  ["birthDepartment", "Département de naissance", "text"],
  ["nationality", "Nationalité", "select"],
  ["address", "Adresse complète", "text"],
  ["phone", "Téléphone", "tel"],
  ["email", "E-mail", "email"],
  ["socialSecurityNumber", "Numéro de sécurité sociale", "text"],
  ["priorSituation", "Situation avant le contrat", "text"],
  ["lastClass", "Dernière classe suivie et spécialité du bac", "text"],
  ["highestDiploma", "Diplôme le plus élevé obtenu", "text"],
] as const;

function AdministrativeEnrollment({
  app,
  token,
  busy,
  error,
  upload,
  save,
}: {
  app: CfaApplication;
  token: string;
  busy: boolean;
  error: string;
  upload: (
    file: File,
    kind: "identity" | "social_security" | "diploma",
  ) => Promise<string | null>;
  save: (data: Record<string, string>) => void;
}) {
  const [data, setData] = useState<Record<string, string>>({
    lastName: app.last_name,
    firstNames: app.first_name,
    phone: app.phone ?? "",
    email: app.email,
    priorSituation: "Scolaire — élève de terminale",
    rqth: "",
    highLevelAthlete: "",
    ...(app.cerfa_data ?? {}),
  });
  const [documents, setDocuments] = useState<Record<string, string>>(
    app.administrative_documents ?? {},
  );
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  async function addDocument(
    file: File,
    kind: "identity" | "social_security" | "diploma",
  ) {
    const path = await upload(file, kind);
    if (path) setDocuments((current) => ({ ...current, [kind]: path }));
  }

  async function pay() {
    setPaymentBusy(true);
    setPaymentError("");
    try {
      const response = await fetch("/api/cfa/registration-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const result = await response.json();
      if (!response.ok || !result.url) throw new Error(result.error || "Paiement indisponible");
      window.location.href = result.url;
    } catch (cause) {
      setPaymentError(cause instanceof Error ? cause.message : "Paiement indisponible");
      setPaymentBusy(false);
    }
  }

  return (
    <form onSubmit={(event) => { event.preventDefault(); save(data); }}>
      <Title overline="Dernière étape · Éléments administratifs">Finalisez votre inscription.</Title>
      <p className="mt-3 text-sm text-white/45">Ces informations servent à préparer votre CERFA. Elles restent confidentielles.</p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {CERFA_FIELDS.map(([name, label, type]) => {
          if (name === "sex") {
            return (
              <SelectField
                key={name}
                label={label}
                value={data.sex ?? ""}
                onChange={(value) => setData({ ...data, sex: value })}
                options={["Homme", "Femme", "Ne pas répondre"]}
              />
            );
          }
          if (name === "nationality") {
            return (
              <CountrySelect
                key={name}
                value={data.nationality ?? ""}
                onChange={(value) => setData({ ...data, nationality: value })}
              />
            );
          }
          return <Input key={name} label={label} type={type} value={data[name] ?? ""} onChange={(value) => setData({ ...data, [name]: value })} />;
        })}
        <SelectField
          label="Reconnaissance RQTH"
          value={data.rqth ?? ""}
          onChange={(value) => setData({ ...data, rqth: value })}
          options={["Oui", "Non"]}
        />
        <SelectField
          label="Sportif de haut niveau"
          value={data.highLevelAthlete ?? ""}
          onChange={(value) => setData({ ...data, highLevelAthlete: value })}
          options={["Oui", "Non"]}
        />
      </div>
      <div className="mt-10">
        <h3 className="text-xl font-semibold">Pièces justificatives</h3>
        <div className="mt-4 grid gap-3">
          {[
            ["identity", "Pièce d’identité"],
            ["social_security", "Attestation de droits ou carte Vitale"],
            ["diploma", "Relevé de notes, attestation de réussite ou diplôme"],
          ].map(([kind, label]) => (
            <label key={kind} className="flex min-h-16 cursor-pointer items-center justify-between rounded-2xl border border-white/10 px-4 text-sm">
              <span>{documents[kind] ? <Check className="mr-2 inline h-4 w-4 text-emerald-300" /> : <Upload className="mr-2 inline h-4 w-4 text-white/40" />}{label}</span>
              <span className="text-xs text-[#8c86ff]">{documents[kind] ? "Ajouté" : "Choisir"}</span>
              <input type="file" accept=".pdf,image/*" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void addDocument(file, kind as "identity" | "social_security" | "diploma"); }} />
            </label>
          ))}
        </div>
      </div>
      <div className="mt-10 rounded-3xl border border-[#7770ff]/30 bg-[#7770ff]/10 p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#a9a4ff]">Frais d’inscription</p>
        <p className="mt-2 text-3xl font-semibold">250 €</p>
        <p className="mt-2 text-sm text-white/55">Remboursés à la signature du contrat d’alternance, après validation de la période d’essai.</p>
        {app.registration_fee_paid_at ? (
          <p className="mt-4 text-sm font-semibold text-emerald-300"><Check className="mr-2 inline h-4 w-4" />Paiement confirmé</p>
        ) : (
          <button type="button" disabled={paymentBusy} onClick={() => void pay()} className="mt-5 inline-flex min-h-11 items-center rounded-full bg-[#7770ff] px-5 text-sm font-semibold text-white">
            {paymentBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Payer les frais d’inscription
          </button>
        )}
        {paymentError ? <p className="mt-3 text-xs text-rose-300">{paymentError}</p> : null}
      </div>
      <Submit busy={busy} error={error}>Transmettre mes éléments</Submit>
    </form>
  );
}

function Admitted({ app, busy, error, choose }: { app: CfaApplication; busy: boolean; error: string; choose: (path: "alternance" | "byound_start") => void }) {
  return <div><div className="rounded-3xl bg-gradient-to-br from-[#6358ef] to-[#2668ff] p-8"><Sparkles /><p className="mt-8 text-sm">{getCfaSpecializationLabel(app.specialization)}</p><h2 className="mt-2 text-5xl font-semibold">Bienvenue chez Byound.<br />Vous êtes admis.</h2></div>{!app.financing_path ? <div className="mt-6 grid gap-3 sm:grid-cols-2"><button disabled={busy} onClick={() => choose("alternance")} className="rounded-2xl border border-white/10 p-6 text-left">J’ai une entreprise</button><button disabled={busy} onClick={() => choose("byound_start")} className="rounded-2xl border border-white/10 p-6 text-left">Je recherche une entreprise</button></div> : <p className="mt-6 text-emerald-300">Votre parcours et le Career Center sont activés.</p>}{error ? <p className="mt-3 text-rose-300">{error}</p> : null}</div>;
}
