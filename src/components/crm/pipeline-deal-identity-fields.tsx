"use client";

import { Loader2, Mail, Phone, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { normalizeLinkedInUrl } from "@/lib/crm/pipeline-deal-intelligence";

export type PipelineDealIdentityValues = {
  siret: string;
  company_name: string;
  contact_first_name: string;
  contact_last_name: string;
  phone: string;
  email: string;
  city: string;
  zip_code: string;
  contact_linkedin: string;
  company_linkedin: string;
  opco_name?: string;
  naf_code?: string;
};

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</Label>
      {children}
    </div>
  );
}

function LinkedInInput({
  value,
  onChange,
  placeholder,
  viewLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  viewLabel: string;
}) {
  const href = normalizeLinkedInUrl(value);
  return (
    <div className="flex gap-2">
      <Input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1"
      />
      {href ? (
        <Button type="button" variant="outline" size="icon" className="shrink-0" asChild>
          <a href={href} target="_blank" rel="noopener noreferrer" title={viewLabel}>
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      ) : null}
    </div>
  );
}

export function PipelineDealIdentityFields({
  value,
  onChange,
  siretLoading,
  onLookupSiret,
}: {
  value: PipelineDealIdentityValues;
  onChange: (patch: Partial<PipelineDealIdentityValues>) => void;
  siretLoading?: boolean;
  onLookupSiret?: () => void;
}) {
  const phoneDigits = value.phone.replace(/\s/g, "");
  const mailHref = value.email.trim() ? `mailto:${value.email.trim()}` : null;

  return (
    <section className="space-y-4 rounded-xl border border-gray-200 bg-gray-50/50 p-4">
      <p className="text-sm font-semibold text-gray-900">Identité du prospect</p>

      <FieldRow label="SIRET">
        <div className="flex gap-2">
          <Input
            value={value.siret}
            onChange={(e) => onChange({ siret: e.target.value })}
            placeholder="14 chiffres"
          />
          {onLookupSiret ? (
            <Button type="button" variant="outline" disabled={siretLoading} onClick={onLookupSiret}>
              {siretLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Rechercher"}
            </Button>
          ) : null}
        </div>
        {value.opco_name || value.naf_code ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {value.opco_name ? <Badge variant="secondary">OPCO : {value.opco_name}</Badge> : null}
            {value.naf_code ? <Badge variant="secondary">NAF : {value.naf_code}</Badge> : null}
          </div>
        ) : null}
      </FieldRow>

      <FieldRow label="Nom de l'entreprise *">
        <Input
          value={value.company_name}
          onChange={(e) => onChange({ company_name: e.target.value })}
        />
      </FieldRow>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FieldRow label="Prénom du contact">
          <Input
            value={value.contact_first_name}
            onChange={(e) => onChange({ contact_first_name: e.target.value })}
          />
        </FieldRow>
        <FieldRow label="Nom du contact">
          <Input
            value={value.contact_last_name}
            onChange={(e) => onChange({ contact_last_name: e.target.value })}
          />
        </FieldRow>
      </div>

      <FieldRow label="Téléphone du contact">
        <div className="flex gap-2">
          <Input
            value={value.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="06 12 34 56 78"
            className="min-w-0 flex-1"
          />
          {phoneDigits ? (
            <Button type="button" variant="outline" size="icon" className="shrink-0" asChild>
              <a href={`tel:${phoneDigits}`} title="Appeler">
                <Phone className="h-4 w-4" />
              </a>
            </Button>
          ) : null}
        </div>
      </FieldRow>

      <FieldRow label="Email du contact">
        <div className="flex gap-2">
          <Input
            type="email"
            value={value.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="contact@entreprise.fr"
            className="min-w-0 flex-1"
          />
          {mailHref ? (
            <Button type="button" variant="outline" size="icon" className="shrink-0" asChild>
              <a href={mailHref} title="Envoyer un email">
                <Mail className="h-4 w-4" />
              </a>
            </Button>
          ) : null}
        </div>
      </FieldRow>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FieldRow label="Ville">
          <Input value={value.city} onChange={(e) => onChange({ city: e.target.value })} />
        </FieldRow>
        <FieldRow label="Code postal">
          <Input
            value={value.zip_code}
            onChange={(e) => onChange({ zip_code: e.target.value })}
            placeholder="75001"
          />
        </FieldRow>
      </div>

      <FieldRow label="Profil LinkedIn du contact">
        <LinkedInInput
          value={value.contact_linkedin}
          onChange={(contact_linkedin) => onChange({ contact_linkedin })}
          placeholder="https://linkedin.com/in/..."
          viewLabel="Voir le profil contact"
        />
      </FieldRow>

      <FieldRow label="Profil LinkedIn de l'entreprise">
        <LinkedInInput
          value={value.company_linkedin}
          onChange={(company_linkedin) => onChange({ company_linkedin })}
          placeholder="https://linkedin.com/company/..."
          viewLabel="Voir la page entreprise"
        />
      </FieldRow>
    </section>
  );
}
