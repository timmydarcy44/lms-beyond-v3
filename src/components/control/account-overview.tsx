"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CrmEmailsClient } from "@/app/super/crm/emails/crm-emails-client";
import { formatSiretDisplay } from "@/lib/control/address-format";
import type { loadAccountDetail } from "@/lib/control/load";
import { BanAddressAutocomplete } from "@/components/address/ban-address-autocomplete";
import { Field, SidePanel, fieldClass } from "./chrome";

type Detail = Awaited<ReturnType<typeof loadAccountDetail>>;

const SAAS_PRODUCTS = [
  { key: "beyond_lms", label: "Byound LMS" },
  { key: "beyond_connect", label: "Byound Recruit" },
  { key: "beyond_care", label: "Byound Care" },
] as const;

const ACTIVITY_LABELS: Record<string, string> = {
  account_created: "Compte créé",
  address_updated: "Adresse renseignée",
  member_joined: "A rejoint le compte",
  invite_sent: "Invitation envoyée",
  grant_lms_course: "Parcours LMS mis à disposition",
  assign_course: "Formation assignée",
  unassign_course: "Formation retirée",
  note_updated: "Note interne mise à jour",
  account_manager_assigned: "Chargé de compte assigné",
};

function shortDate(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function departmentFromZip(zip: string | null | undefined) {
  const digits = String(zip ?? "").replace(/\D/g, "");
  if (digits.length < 2) return null;
  return digits.slice(0, 2);
}

function hasSaasOpen(modules: string[]) {
  return SAAS_PRODUCTS.some((product) => {
    if (product.key === "beyond_care") {
      return modules.includes("beyond_care") || modules.includes("mental_health_tracking");
    }
    return modules.includes(product.key);
  });
}

function productEnabled(modules: string[], key: string) {
  if (key === "beyond_care") {
    return modules.includes("beyond_care") || modules.includes("mental_health_tracking");
  }
  return modules.includes(key);
}

export function AccountOverview({
  detail,
  onNewRequest,
  onOpenDossiers,
  onOpenLms,
  onOpenSaas,
  onInvite,
  onOpenJournal,
}: {
  detail: Detail;
  onNewRequest: () => void;
  onOpenDossiers: () => void;
  onOpenLms: () => void;
  onOpenSaas: () => void;
  onInvite: () => void;
  onOpenJournal: () => void;
}) {
  const account = detail.account;
  const [addressOpen, setAddressOpen] = useState(false);
  const [mailOpen, setMailOpen] = useState(false);
  if (!account) return null;

  const admin = detail.members.find((member) => member.role === "admin") ?? detail.people.find((person) => person.role === "admin");
  const setup = buildSetupSteps(detail, {
    onInvite,
    onOpenSaas,
    onNewRequest,
  });

  return (
    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-5">
        {setup.doneCount < 6 ? <SetupCard steps={setup.steps} doneCount={setup.doneCount} /> : null}
        <ServicesCard
          detail={detail}
          onOpenDossiers={onOpenDossiers}
          onOpenLms={onOpenLms}
          onOpenSaas={onOpenSaas}
        />
      </div>

      <div className="space-y-5">
        <ContactCard
          admin={admin}
          onEmail={() => setMailOpen(true)}
        />
        <CoordinatesCard account={account} onEdit={() => setAddressOpen(true)} />
        <ActivityCard
          items={detail.activity ?? []}
          name={account.name}
          onOpenJournal={onOpenJournal}
        />
        <NoteCard orgId={account.id} initial={detail.note?.body ?? ""} />
      </div>

      {addressOpen ? (
        <AddressEditPanel
          account={account}
          onClose={() => setAddressOpen(false)}
        />
      ) : null}
      {mailOpen && admin?.email ? (
        <SidePanel title="E-mail" onClose={() => setMailOpen(false)}>
          <CrmEmailsClient lockedRecipient={{ name: admin.name, email: admin.email }} />
        </SidePanel>
      ) : null}
    </div>
  );
}

type SetupStep = {
  id: string;
  title: string;
  subtitle: string;
  done: boolean;
  action?: { label: string; onClick: () => void };
};

function buildSetupSteps(
  detail: Detail,
  actions: { onInvite: () => void; onOpenSaas: () => void; onNewRequest: () => void },
) {
  const account = detail.account!;
  const admin = detail.members.find((member) => member.role === "admin");
  const addressDone = Boolean(account.addressLine && account.addressZip && account.addressCity && account.siret);
  const managerDone = Boolean(account.accountManagerId);
  const adminDone = Boolean(admin);
  const collaboratorsDone = detail.people.length > 1;
  const saasDone = hasSaasOpen(account.modules);
  const dossierDone = (detail.dossiers?.total ?? 0) > 0;

  const steps: SetupStep[] = [
    {
      id: "address",
      title: "Coordonnées et SIRET",
      subtitle: addressDone ? "Adresse et SIRET renseignés" : "Adresse, CP, ville et SIRET",
      done: addressDone,
    },
    {
      id: "manager",
      title: "Chargé de compte assigné",
      subtitle: managerDone ? account.accountManagerName || "Assigné" : "Personne n'est encore assigné",
      done: managerDone,
    },
    {
      id: "admin",
      title: "Administrateur du compte",
      subtitle: admin
        ? `${admin.name} a rejoint le ${shortDate(admin.createdAt)}`
        : "Aucun administrateur n'a encore rejoint",
      done: adminDone,
    },
    {
      id: "invite",
      title: "Inviter les collaborateurs",
      subtitle: collaboratorsDone
        ? `${detail.people.length} personnes sur le compte`
        : "Personne d'autre n'a encore accès",
      done: collaboratorsDone,
      action: collaboratorsDone ? undefined : { label: "Inviter", onClick: actions.onInvite },
    },
    {
      id: "saas",
      title: "Choisir les produits",
      subtitle: saasDone
        ? "Au moins un produit SaaS est ouvert"
        : "Byound LMS, Recruit, Care : rien d'ouvert",
      done: saasDone,
      action: saasDone ? undefined : { label: "Configurer", onClick: actions.onOpenSaas },
    },
    {
      id: "dossier",
      title: "Première demande de formation",
      subtitle: dossierDone ? `${detail.dossiers.total} dossier(s)` : "Catalogue ou sur-mesure",
      done: dossierDone,
      action: dossierDone ? undefined : { label: "Créer", onClick: actions.onNewRequest },
    },
  ];

  return { steps, doneCount: steps.filter((step) => step.done).length };
}

function SetupCard({ steps, doneCount }: { steps: SetupStep[]; doneCount: number }) {
  const progress = Math.round((doneCount / 6) * 100);
  return (
    <section
      className="overflow-hidden rounded-[24px] border border-[#1A2340] bg-[#111831]"
      style={{
        boxShadow: "inset 0 3px 0 #F2CF6B",
        backgroundImage: "linear-gradient(180deg, rgba(242,207,107,0.08) 0%, rgba(17,24,49,0) 48%)",
      }}
    >
      <div className="p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F2CF6B] text-lg font-extrabold text-[#0A0F1E]">
            ✓
          </span>
          <div>
            <h2 className="text-lg font-extrabold text-[#F2F4FA]">Mise en route du compte</h2>
            <p className="mt-1 text-sm text-[#9AA3BD]">
              {doneCount} étapes sur 6. Le statut passe à « Actif » quand tout est fait.
            </p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#1A2340]">
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #F2CF6B 0%, #FFB86B 100%)",
            }}
          />
        </div>
        <ul className="mt-4 space-y-3">
          {steps.map((step) => (
            <li key={step.id} className="flex items-start gap-3">
              <span
                className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold"
                style={
                  step.done
                    ? { background: "#163228", color: "#6BE39B" }
                    : { border: "1.5px dashed #6C7593", color: "#6C7593" }
                }
              >
                {step.done ? "✓" : ""}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <p
                    className={`text-sm font-semibold ${step.done ? "text-[#6C7593] line-through" : "text-[#F2F4FA]"}`}
                  >
                    {step.title}
                  </p>
                  {step.action ? (
                    <button
                      type="button"
                      onClick={step.action.onClick}
                      className="ml-auto rounded-full bg-[#6E5BFF]/20 px-3 py-1 text-xs font-semibold text-[#C9C2FF]"
                    >
                      {step.action.label}
                    </button>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-[#6C7593]">{step.subtitle}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ServicesCard({
  detail,
  onOpenDossiers,
  onOpenLms,
  onOpenSaas,
}: {
  detail: Detail;
  onOpenDossiers: () => void;
  onOpenLms: () => void;
  onOpenSaas: () => void;
}) {
  const account = detail.account!;
  const dossiers = detail.dossiers ?? { total: 0, inProgress: 0, nextSessionDate: null };
  const linkedLms = detail.courses.filter((course) => course.lmsGranted || course.owned).length || detail.courses.length;
  const lmsPool = linkedLms + detail.lmsCourses.length;
  const saasOpen = hasSaasOpen(account.modules);

  const rows = [
    {
      id: "qualiopi",
      iconBg: "#1A2744",
      iconFg: "#8DB8FF",
      icon: "▣",
      title: "Formation Qualiopi",
      badge: dossiers.inProgress > 0 ? `${dossiers.inProgress} en cours` : "Aucun dossier",
      badgeTone: dossiers.inProgress > 0 ? "ok" : "muted",
      subtitle: dossiers.nextSessionDate
        ? `Prochaine session le ${shortDate(dossiers.nextSessionDate)}`
        : "Catalogue ou sur-mesure → devis → convention",
      actionLabel: "Voir les dossiers",
      onAction: onOpenDossiers,
    },
    {
      id: "lms",
      iconBg: "#16332E",
      iconFg: "#5EDCC3",
      icon: "▶",
      title: "Parcours LMS",
      badge: linkedLms > 0 ? `${linkedLms} parcours` : "Aucun accès",
      badgeTone: linkedLms > 0 ? "ok" : "muted",
      subtitle: `${linkedLms} parcours liés · ${lmsPool} LMS Byound`,
      actionLabel: "Gérer les accès",
      onAction: onOpenLms,
    },
    {
      id: "saas",
      iconBg: "#241C3E",
      iconFg: "#A99BFF",
      icon: "▦",
      title: "Produits SaaS",
      badge: saasOpen
        ? SAAS_PRODUCTS.filter((product) => productEnabled(account.modules, product.key))
            .map((product) => product.label.replace("Byound ", ""))
            .join(" · ") || "Ouvert"
        : "Non configuré",
      badgeTone: saasOpen ? "ok" : "warn",
      subtitleNode: (
        <span>
          {SAAS_PRODUCTS.map((product, index) => (
            <span key={product.key}>
              {index > 0 ? " · " : null}
              <span className={productEnabled(account.modules, product.key) ? "text-[#F2F4FA]" : "text-[#6C7593]"}>
                {product.label}
              </span>
            </span>
          ))}
        </span>
      ),
      actionLabel: "Gérer",
      onAction: onOpenSaas,
    },
  ] as const;

  return (
    <section className="rounded-[24px] border border-[#1A2340] bg-[#111831] p-5">
      <h2 className="text-lg font-extrabold text-[#F2F4FA]">Services du compte</h2>
      <p className="mt-1 text-sm text-[#9AA3BD]">Ce que ce client utilise chez Byound</p>
      <ul className="mt-4 divide-y divide-[#1A2340]">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-wrap items-center gap-3 py-4 first:pt-0 last:pb-0">
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-base font-bold"
              style={{ background: row.iconBg, color: row.iconFg }}
            >
              {row.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-[#F2F4FA]">{row.title}</p>
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{
                    background: row.badgeTone === "warn" ? "#3A3118" : "#1A2340",
                    color: row.badgeTone === "warn" ? "#F2CF6B" : "#9AA3BD",
                  }}
                >
                  {row.badge}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#6C7593]">
                {"subtitleNode" in row && row.subtitleNode ? row.subtitleNode : row.subtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={row.onAction}
              className="rounded-full border border-[#26304F] bg-[#151C33] px-3 py-1.5 text-xs font-semibold text-[#E8ECF8]"
            >
              {row.actionLabel}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ContactCard({
  admin,
  onEmail,
}: {
  admin: Detail["people"][number] | undefined;
  onEmail: () => void;
}) {
  const phone = null as string | null;
  return (
    <section className="rounded-[24px] border border-[#1A2340] bg-[#111831] p-5">
      <h2 className="text-lg font-extrabold text-[#F2F4FA]">Contact principal</h2>
      {admin ? (
        <>
          <div className="mt-4 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[linear-gradient(135deg,#6E5BFF,#241C3E)] text-sm font-extrabold text-white">
              {initials(admin.name)}
            </span>
            <div>
              <p className="font-semibold text-[#F2F4FA]">{admin.name}</p>
              <p className="text-xs text-[#9AA3BD]">Administrateur du compte</p>
            </div>
          </div>
          <div className={`mt-4 grid gap-2 ${phone ? "grid-cols-2" : "grid-cols-1"}`}>
            <button
              type="button"
              onClick={onEmail}
              disabled={!admin.email}
              className="rounded-full border border-[#26304F] bg-[#151C33] px-3 py-2 text-sm font-semibold text-[#E8ECF8] disabled:opacity-40"
            >
              ✉ E-mail
            </button>
            {phone ? (
              <a
                href={`tel:${phone}`}
                className="rounded-full border border-[#26304F] bg-[#151C33] px-3 py-2 text-center text-sm font-semibold text-[#E8ECF8]"
              >
                ✆ Appeler
              </a>
            ) : null}
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm text-[#9AA3BD]">Aucun administrateur sur ce compte.</p>
      )}
    </section>
  );
}

function CoordinatesCard({
  account,
  onEdit,
}: {
  account: NonNullable<Detail["account"]>;
  onEdit: () => void;
}) {
  const siret = formatSiretDisplay(account.siret);
  const rows = [
    {
      label: "Adresse",
      value: account.addressLine ? (
        <span>
          {account.addressLine}
          <br />
          {[account.addressZip, account.addressCity].filter(Boolean).join(" ")}
        </span>
      ) : null,
    },
    { label: "SIRET", value: siret || null },
    { label: "TVA intracom.", value: null as string | null, missingHint: "Colonne absente en base" },
    { label: "OPCO", value: account.opcoName },
  ];

  return (
    <section className="rounded-[24px] border border-[#1A2340] bg-[#111831] p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold text-[#F2F4FA]">Coordonnées</h2>
        <button type="button" onClick={onEdit} className="text-sm font-semibold text-[#A99BFF]">
          Modifier
        </button>
      </div>
      <dl className="mt-4 space-y-3 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[110px_minmax(0,1fr)] gap-3">
            <dt className="text-[#6C7593]">{row.label}</dt>
            <dd className={row.value ? "text-[#F2F4FA]" : "font-semibold text-[#F2CF6B]"}>
              {row.value || "À compléter"}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ActivityCard({
  items,
  name,
  onOpenJournal,
}: {
  items: Detail["activity"];
  name: string;
  onOpenJournal: () => void;
}) {
  const recent = (items ?? []).slice(0, 3);
  const colors = ["#6E5BFF", "#5EDCC3", "#F2CF6B"];
  return (
    <section className="rounded-[24px] border border-[#1A2340] bg-[#111831] p-5">
      <h2 className="text-lg font-extrabold text-[#F2F4FA]">Activité récente</h2>
      {recent.length === 0 ? (
        <p className="mt-3 text-sm text-[#9AA3BD]">Aucune activité pour l’instant.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {recent.map((item, index) => {
            const author = item.actor_type === "byound_on_behalf" ? `Byound pour ${name}` : "Client";
            const label = ACTIVITY_LABELS[String(item.action)] || String(item.action).replace(/_/g, " ");
            return (
              <li key={item.id} className="flex items-start gap-3">
                <span
                  className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: colors[index % colors.length] }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[#F2F4FA]">{label}</p>
                  <p className="text-xs text-[#6C7593]">
                    par {author} · {shortDate(item.created_at)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <button
        type="button"
        onClick={onOpenJournal}
        className="mt-4 text-sm font-semibold text-[#A99BFF]"
      >
        Tout le journal ›
      </button>
    </section>
  );
}

function NoteCard({ orgId, initial }: { orgId: string; initial: string }) {
  const [body, setBody] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef(initial);

  useEffect(() => {
    setBody(initial);
    lastSaved.current = initial;
  }, [initial]);

  useEffect(() => {
    if (body === lastSaved.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setStatus("saving");
      try {
        const response = await fetch(`/api/super/comptes-clients/${orgId}/note`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        });
        if (!response.ok) throw new Error("save");
        lastSaved.current = body;
        setStatus("saved");
        window.setTimeout(() => setStatus("idle"), 1600);
      } catch {
        setStatus("error");
      }
    }, 800);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [body, orgId]);

  return (
    <section className="rounded-[24px] border border-[#2E2A1A] bg-[#15182A] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-extrabold text-[#F2CF6B]">✎ Note interne</h2>
        <p className="text-[11px] text-[#6C7593]">Visible par l&apos;équipe Byound uniquement</p>
      </div>
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Écrire une note… (enregistrement automatique)"
        className="mt-3 min-h-28 w-full resize-y bg-transparent text-sm text-[#F2F4FA] outline-none placeholder:text-[#6C7593]"
      />
      <p className="mt-2 text-xs text-[#6C7593]">
        {status === "saving" ? "Enregistrement…" : null}
        {status === "saved" ? "Enregistré" : null}
        {status === "error" ? "Enregistrement impossible" : null}
      </p>
    </section>
  );
}

function AddressEditPanel({
  account,
  onClose,
}: {
  account: NonNullable<Detail["account"]>;
  onClose: () => void;
}) {
  const router = useRouter();
  const [line, setLine] = useState(account.addressLine ?? "");
  const [zip, setZip] = useState(account.addressZip ?? "");
  const [city, setCity] = useState(account.addressCity ?? "");
  const [siret, setSiret] = useState(account.siret ?? "");
  const [opco, setOpco] = useState(account.opcoName ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <SidePanel title="Modifier les coordonnées" onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={async (event) => {
          event.preventDefault();
          setSaving(true);
          setMsg(null);
          try {
            const res = await fetch(`/api/super/comptes-clients/${account.id}/address`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                address_line: line.trim(),
                address_zip: zip.trim(),
                address_city: city.trim(),
                siret: siret.replace(/\D/g, "") || undefined,
                opco_name: opco.trim() || null,
              }),
            });
            const json = (await res.json()) as { error?: string };
            if (!res.ok) throw new Error(json.error || "Enregistrement impossible");
            setMsg("Coordonnées enregistrées.");
            router.refresh();
            onClose();
          } catch (error) {
            setMsg(error instanceof Error ? error.message : "Enregistrement impossible");
          } finally {
            setSaving(false);
          }
        }}
      >
        <Field label="Adresse">
          <BanAddressAutocomplete
            value={line}
            onChange={setLine}
            onSelect={(hit) => {
              setLine(hit.addressLine);
              setZip(hit.addressZip);
              setCity(hit.addressCity);
            }}
            className={fieldClass}
          />
        </Field>
        <div className="grid grid-cols-[100px_1fr] gap-3">
          <Field label="CP">
            <input value={zip} onChange={(e) => setZip(e.target.value)} className={fieldClass} required />
          </Field>
          <Field label="Ville">
            <input value={city} onChange={(e) => setCity(e.target.value)} className={fieldClass} required />
          </Field>
        </div>
        <Field label="SIRET">
          <input
            value={siret}
            onChange={(e) => setSiret(e.target.value)}
            className={fieldClass}
            placeholder="14 chiffres"
          />
        </Field>
        <Field label="OPCO">
          <input value={opco} onChange={(e) => setOpco(e.target.value)} className={fieldClass} placeholder="Optionnel" />
        </Field>
        <p className="text-xs text-[#F2CF6B]">
          TVA intracom. : aucune colonne dédiée sur `organizations` — non éditable pour l’instant.
        </p>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0A0F1E] disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        {msg ? <p className="text-sm text-[#8A93AE]">{msg}</p> : null}
      </form>
    </SidePanel>
  );
}

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "B";
}

export function accountHeaderMeta(account: NonNullable<Detail["account"]>) {
  const dept = departmentFromZip(account.addressZip);
  const city = account.addressCity;
  const location = city ? (dept ? `${city} (${dept})` : city) : null;
  const siret = formatSiretDisplay(account.siret);
  const since = account.clientSince ? `Client depuis le ${shortDate(account.clientSince)}` : null;
  return [location, siret ? `SIRET ${siret}` : null, since].filter(Boolean).join(" · ");
}

export function useAccountKpis(detail: Detail) {
  return useMemo(() => {
    const account = detail.account;
    if (!account) return [];
    const invited = account.invitedUsers;
    const connected = account.connectedUsers || account.activeUsers;
    const total = Math.max(account.totalUsers, connected, invited);
    const dossiers = detail.dossiers ?? { total: 0, inProgress: 0, nextSessionDate: null };
    const badges = detail.assertions.length;
    return [
      {
        label: "Utilisateurs actifs",
        value: `${connected} / ${total || connected || 0}`,
        sub:
          invited || connected
            ? `${invited} invité${invited > 1 ? "s" : ""}, ${connected} connecté${connected > 1 ? "s" : ""}`
            : "Aucun utilisateur",
        color: "#5EDCC3",
      },
      {
        label: "Formations",
        value: String(dossiers.inProgress),
        sub:
          dossiers.inProgress > 0
            ? `${dossiers.inProgress} dossier${dossiers.inProgress > 1 ? "s" : ""} en cours`
            : "Aucun dossier en cours",
        color: "#8DB8FF",
      },
      {
        label: "Open Badges",
        value: String(badges),
        sub: badges > 0 ? `${badges} émis` : "Aucun badge émis",
        color: "#A99BFF",
      },
      {
        label: "CA 12 mois",
        value: formatEuroHt(account.revenue12HtCents),
        sub:
          account.invoiceCount12 > 0
            ? `${account.invoiceCount12} facture${account.invoiceCount12 > 1 ? "s" : ""}`
            : "Aucune facture rattachée",
        color: "#6BE39B",
      },
    ];
  }, [detail]);
}

function formatEuroHt(cents: number) {
  return `${(cents / 100).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} € HT`;
}
