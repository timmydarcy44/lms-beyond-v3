"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, CircleStop, Loader2, Mic, Sparkles, Upload, Video } from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  CFA_DOCUMENT_SLOTS,
  CFA_SPECIALIZATIONS,
  getCfaSpecializationLabel,
  listPrivateFiles,
  type CfaApplication,
  type CfaDocumentKind,
} from "@/lib/cfa-applications";
import { cn } from "@/lib/utils";
import { COUNTRY_OPTIONS } from "@/lib/country-options";
import { AdmissionFrieze, friezeFromStatus } from "@/components/edge-site/cfa/admission-frieze";
import { AdmissionShell } from "@/components/edge-site/cfa/admission-shell";
import { CfaChallengeParcoursFlow } from "@/components/edge-site/cfa/cfa-challenge-parcours-flow";

const TOKEN_KEY = "byound_cfa_application_token";
const NTC_SPECIALIZATIONS = new Set(["ai_business", "sport_business", "real_estate"]);
const MEM_SPECIALIZATIONS = new Set([
  "retail_experience",
  "merchandising",
  "luxury_premium",
  "sport_retail",
]);
const REM_SPECIALIZATIONS = new Set([
  "ai_management",
  "business_performance",
  "transition_innovation",
]);
const RDC_SPECIALIZATIONS = new Set([
  "growth_acquisition",
  "entrepreneurship",
  "international_business",
  "strategic_partnerships",
]);
const control =
  "w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#7770ff]";

export function CfaApplicationFlow() {
  const params = useSearchParams();
  const resume = params.get("resume");
  const requested = params.get("specialization");
  const ntcOnly = params.get("track") === "ntc";
  const memOnly = params.get("track") === "mem";
  const remOnly = params.get("track") === "rem";
  const rdcOnly = params.get("track") === "rdc";
  const specializationOptions = useMemo(
    () =>
      ntcOnly
        ? CFA_SPECIALIZATIONS.filter((item) => NTC_SPECIALIZATIONS.has(item.value))
        : memOnly
          ? CFA_SPECIALIZATIONS.filter((item) => MEM_SPECIALIZATIONS.has(item.value))
          : remOnly
            ? CFA_SPECIALIZATIONS.filter((item) => REM_SPECIALIZATIONS.has(item.value))
            : rdcOnly
              ? CFA_SPECIALIZATIONS.filter((item) => RDC_SPECIALIZATIONS.has(item.value))
              : [...CFA_SPECIALIZATIONS],
    [ntcOnly, memOnly, remOnly, rdcOnly],
  );
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
    birthDate: "",
    educationLevel: "",
    specialization: specializationOptions.some((item) => item.value === requested)
      ? requested!
      : "",
  });
  const [connected, setConnected] = useState(false);
  const [shareCompanies, setShareCompanies] = useState(false);

  useEffect(() => {
    void (async () => {
      await Promise.resolve();
      const saved = resume || localStorage.getItem(TOKEN_KEY);
      if (!saved) {
        try {
          const context = await fetch("/api/cfa/applications/context");
          const data = await context.json();
          if (data.connected) {
            setConnected(true);
            setProfile((current) => ({
              ...current,
              firstName: data.firstName || current.firstName,
              lastName: data.lastName || current.lastName,
              email: data.email || current.email,
              phone: data.phone || current.phone,
            }));
            if (data.cvName) setCvName(data.cvName);
          }
        } catch {
          /* la candidature reste possible sans compte */
        }
        return setLoading(false);
      }
      if (resume) localStorage.setItem(TOKEN_KEY, resume);
      setToken(saved);
      try {
        const fromMail = params.get("from") === "mail";
        const response = await fetch(
          `/api/cfa/applications?token=${encodeURIComponent(saved)}${fromMail ? "&from=mail" : ""}`,
        );
        if (!response.ok) throw new Error();
        const data = await response.json();
        setApp(data.application);
        setShareCompanies(Boolean(data.application.share_with_companies));
      } catch {
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        setLoading(false);
      }
    })();
  }, [resume, params]);

  useEffect(() => {
    if (!requested) return;
    setProfile((current) => {
      if (current.specialization) return current;
      const allowed = specializationOptions.some((item) => item.value === requested);
      return allowed ? { ...current, specialization: requested } : current;
    });
  }, [requested, specializationOptions]);

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
    kind: CfaDocumentKind | "motivation",
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
    return <div className="flex min-h-[70vh] items-center justify-center bg-[#070C1C]"><Loader2 className="h-7 w-7 animate-spin text-[#6E5BFF]" /></div>;
  }

  if (app && (app.status === "challenge" || app.status === "dossier")) {
    return (
      <CfaChallengeParcoursFlow
        app={app as CfaApplication & { parcours?: Record<string, unknown>; challenge_v2?: { responses?: unknown[] } }}
        token={token}
        cvName={cvName}
        setCvName={setCvName}
        onApplication={setApp}
        onRequestChangeSpecialization={() => {
          localStorage.removeItem(TOKEN_KEY);
          setApp(null);
          setToken("");
        }}
      />
    );
  }

  return (
    <AdmissionShell
      saveState="idle"
      onContinueLater={() => {
        if (!token) return;
        void send("PATCH", { token, action: "continue_later" });
      }}
    >
      <div className="mx-auto max-w-5xl text-[#F2F4FA]">
        <p className="text-sm font-semibold text-[#A99BFF]">Byound · Admission</p>
        <h1 className="mt-3 text-[clamp(2.2rem,5vw,3.25rem)] font-extrabold leading-[1.05] tracking-[-0.04em]">
          {app ? "Ta candidature Byound" : "Crée ton profil Byound."}
        </h1>
        <p className="mt-3 text-[#9AA3BD]">Ton potentiel d’abord. L’entreprise et le financement viennent après l’admission.</p>
        <AdmissionFrieze current={friezeFromStatus(app?.status ?? "profile")} />

        <main className="mt-10 rounded-[28px] border border-[#1F2850] bg-[#0E1430] p-6 sm:p-10">
          {!app ? (
            <form onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const firstName = String(form.get("firstName") ?? "").trim() || profile.firstName.trim();
              const lastName = String(form.get("lastName") ?? "").trim() || profile.lastName.trim();
              const email = String(form.get("email") ?? "").trim() || profile.email.trim();
              const phone = String(form.get("phone") ?? "").trim() || profile.phone.trim();
              const birthDate = String(form.get("birthDate") ?? "").trim() || profile.birthDate.trim();
              const educationLevel = String(form.get("educationLevel") ?? "").trim() || profile.educationLevel.trim();
              const specialization = String(form.get("specialization") ?? "").trim() || profile.specialization.trim();
              if (!specialization) {
                setError("Choisis une spécialisation.");
                return;
              }
              void send("POST", { firstName, lastName, email, phone, birthDate, educationLevel, specialization });
            }}>
              <Title overline="Profil · environ 2 minutes">Dis-nous qui tu es.</Title>
              <p className="mt-3 text-sm text-[#9AA3BD]">{connected ? "Ton compte Byound a rempli le nom, l’e-mail et le téléphone. Tu peux les corriger." : "Aucune entreprise n’est demandée à cette étape."}</p>
              <input type="hidden" name="specialization" value={profile.specialization} />
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <Input name="firstName" label="Prénom" value={profile.firstName} onChange={(value) => setProfile({ ...profile, firstName: value })} />
                <Input name="lastName" label="Nom" value={profile.lastName} onChange={(value) => setProfile({ ...profile, lastName: value })} />
                <Input name="email" label="Email" type="email" value={profile.email} onChange={(value) => setProfile({ ...profile, email: value })} />
                <Input name="phone" label="Téléphone (optionnel)" type="tel" value={profile.phone} onChange={(value) => setProfile({ ...profile, phone: value })} required={false} />
                <Input name="birthDate" label="Date de naissance" type="date" value={profile.birthDate} onChange={(value) => setProfile({ ...profile, birthDate: value })} />
                <label className="text-sm text-white/80">Niveau d’études<select name="educationLevel" className={cn(control, "mt-2")} value={profile.educationLevel} onChange={(event) => setProfile({ ...profile, educationLevel: event.target.value })} required><option value="" className="text-black">Sélectionner</option>{["Bac en cours","Bac obtenu","Bac+1","Bac+2","Bac+3 ou plus"].map((level) => <option key={level} value={level} className="text-black">{level}</option>)}</select></label>
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
              {connected && cvName ? <p className="mt-4 text-sm text-white/60">CV du compte : {cvName}</p> : null}
              <Submit busy={busy} error={error}>Commencer le challenge</Submit>
            </form>
          ) : null}

          {app?.status === "profile" ? (
            <CandidateDossier app={app} busy={busy} error={error} upload={upload} />
          ) : null}

          {app && !["profile", "challenge", "brochure", "dossier"].includes(app.status) ? (
            <label className="mb-8 flex items-start gap-3 rounded-2xl border border-white/10 p-4 text-sm text-white/80">
              <input type="checkbox" checked={shareCompanies} onChange={(event) => { const next = event.target.checked; setShareCompanies(next); void send("PATCH", { token, action: "share_companies", shareWithCompanies: next }); }} className="mt-1 h-4 w-4" />
              <span>J'accepte que mon profil soit transmis aux entreprises partenaires de Byound.</span>
            </label>
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
    </AdmissionShell>
  );
}

function Title({ overline, children }: { overline: string; children: React.ReactNode }) {
  return <><p className="text-xs font-semibold text-[#A99BFF]">{overline}</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.04em]">{children}</h2></>;
}

function Input({ label, value, onChange, type = "text", required = true, name }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; name?: string }) {
  return <label className="text-sm text-white/80">{label}<input name={name} className={cn(control, "mt-2")} type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} /></label>;
}

function FileSlots({
  app,
  slots,
  busy,
  upload,
}: {
  app: CfaApplication;
  slots: readonly { kind: CfaDocumentKind; label: string; detail: string }[];
  busy: boolean;
  upload: (file: File, kind: CfaDocumentKind | "motivation") => Promise<string | null>;
}) {
  const [files, setFiles] = useState<Record<string, Array<{ path: string; name: string }>>>(() => {
    const next: Record<string, Array<{ path: string; name: string }>> = {};
    for (const slot of slots) {
      next[slot.kind] = listPrivateFiles(app.private_files, slot.kind).map((item) => ({
        path: item.path,
        name: item.original_name || item.path.split("/").pop() || "Fichier",
      }));
      if (slot.kind === "cv" && app.cv_path && !next.cv.length) {
        next.cv = [{ path: app.cv_path, name: "CV" }];
      }
    }
    return next;
  });

  async function addDocument(file: File, kind: CfaDocumentKind) {
    const path = await upload(file, kind);
    if (!path) return;
    setFiles((current) => ({
      ...current,
      [kind]: [...(current[kind] ?? []), { path, name: file.name }],
    }));
  }

  return (
    <div className="grid gap-3">
      {slots.map((slot) => {
        const items = files[slot.kind] ?? [];
        return (
          <div key={slot.kind} className="rounded-2xl border border-white/10 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">
                  {items.length ? <Check className="mr-2 inline h-4 w-4 text-emerald-300" /> : <Upload className="mr-2 inline h-4 w-4 text-white/40" />}
                  {slot.label}
                </p>
                <p className="mt-1 text-xs text-white/40">{slot.detail}</p>
              </div>
              <label className="cursor-pointer text-xs font-semibold text-[#8c86ff]">
                {items.length ? "Ajouter un autre" : "Choisir"}
                <input
                  type="file"
                  accept=".pdf,image/*"
                  className="sr-only"
                  disabled={busy}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) void addDocument(file, slot.kind);
                  }}
                />
              </label>
            </div>
            {items.length ? (
              <ul className="mt-3 space-y-1 text-xs text-white/70">
                {items.map((item) => (
                  <li key={item.path} className="truncate">
                    {item.name}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function CandidateDossier({
  app,
  busy,
  error,
  upload,
}: {
  app: CfaApplication;
  busy: boolean;
  error: string;
  upload: (file: File, kind: CfaDocumentKind | "motivation") => Promise<string | null>;
}) {
  const rows = [
    ["Prénom", app.first_name],
    ["Nom", app.last_name],
    ["E-mail", app.email],
    ["Téléphone", app.phone || "—"],
    ["Cursus", getCfaSpecializationLabel(app.specialization)],
    ["Niveau d’études", app.education_level || "—"],
  ] as const;

  return (
    <div>
      <Title overline="Ton dossier">Dépose tes fichiers.</Title>
      <p className="mt-3 text-sm text-[#9AA3BD]">
        Tes informations ont déjà été enregistrées. Ajoute tes pièces pour que l’équipe Byound puisse avancer.
      </p>
      <dl className="mt-8 grid gap-3 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">{label}</dt>
            <dd className="mt-1 text-sm font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-10">
        <h3 className="text-xl font-semibold">Pièces à déposer</h3>
        <div className="mt-4">
          <FileSlots app={app} slots={CFA_DOCUMENT_SLOTS} busy={busy} upload={upload} />
        </div>
      </div>
      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
      {busy ? <p className="mt-3 text-sm text-white/45">Envoi en cours…</p> : null}
    </div>
  );
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
  upload: (file: File, kind: CfaDocumentKind | "motivation") => Promise<string | null>;
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
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentError, setPaymentError] = useState("");

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
      <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <label className="flex items-start gap-3 text-sm text-white/90">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-white/20"
            checked={data.accommodationNeeded === "1"}
            onChange={(e) =>
              setData({
                ...data,
                accommodationNeeded: e.target.checked ? "1" : "",
                accommodationNeeds: e.target.checked ? data.accommodationNeeds ?? "" : "",
              })
            }
          />
          <span>
            <span className="font-semibold">J&apos;ai besoin d&apos;un aménagement</span>
            <span className="mt-1 block text-xs text-white/45">
              Facultatif. La référente handicap vous contactera sous 72&nbsp;h. Décrivez le besoin,
              pas la situation médicale.
            </span>
          </span>
        </label>
        {data.accommodationNeeded === "1" ? (
          <textarea
            value={data.accommodationNeeds ?? ""}
            onChange={(e) => setData({ ...data, accommodationNeeds: e.target.value })}
            rows={3}
            placeholder="Besoins / aménagements souhaités (optionnel)"
            className="mt-4 w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
          />
        ) : null}
      </div>
      <div className="mt-10">
        <h3 className="text-xl font-semibold">Pièces justificatives</h3>
        <div className="mt-4">
          <FileSlots
            app={app}
            slots={CFA_DOCUMENT_SLOTS.filter((slot) => slot.kind !== "cv")}
            busy={busy}
            upload={upload}
          />
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
