"use client";

import {
  EXPERT_AUDIENCES,
  EXPERT_AVAILABILITY_OPTIONS,
  EXPERT_DOMAINS,
  EXPERT_EXPERIENCE_OPTIONS,
  EXPERT_GEOGRAPHIC_ZONES,
  EXPERT_INTERVENTION_FORMATS,
  EXPERT_LANGUAGE_OPTIONS,
  getAggregatedSpecialtyGroups,
  getDomainsByIds,
  pruneSpecialtyKeys,
  toggleDomainId,
  type ExpertSpecialtiesProfile,
} from "@/lib/expert/specialties-referential";
import {
  DomainCard,
  SelectChip,
  SpecialtiesSection,
} from "@/components/expert/register/expert-register-ui";

type Props = {
  value: ExpertSpecialtiesProfile;
  onChange: (next: ExpertSpecialtiesProfile) => void;
};

function toggleItem(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

export function ExpertSpecialtiesStep({ value, onChange }: Props) {
  const selectedDomains = getDomainsByIds(value.domainIds);
  const specialtyGroups = getAggregatedSpecialtyGroups(value.domainIds);

  const set = (patch: Partial<ExpertSpecialtiesProfile>) => onChange({ ...value, ...patch });

  const toggleDomain = (domainId: string) => {
    const nextDomainIds = toggleDomainId(value.domainIds, domainId);
    onChange({
      ...value,
      domainIds: nextDomainIds,
      specialtyKeys: pruneSpecialtyKeys(value.specialtyKeys, nextDomainIds),
    });
  };

  const groupedByDomain = selectedDomains.map((domain) => ({
    domain,
    items: specialtyGroups.filter((g) => g.domain.id === domain.id),
  }));

  return (
    <div className="space-y-12">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#635BFF]/80">
          Construisez votre identité EDGE
        </p>
        <p className="mt-2 text-sm text-white/50">
          Sélectionnez vos domaines, spécialités et modalités d&apos;intervention. Le premier domaine
          choisi devient votre domaine principal sur le profil public.
        </p>
      </div>

      <SpecialtiesSection
        step={1}
        title="Vos domaines d'expertise"
        subtitle="Sélectionnez un ou plusieurs domaines. Le premier sélectionné sera affiché comme domaine principal."
        visible
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EXPERT_DOMAINS.map((d) => {
            const index = value.domainIds.indexOf(d.id);
            const isSelected = index !== -1;
            return (
              <DomainCard
                key={d.id}
                label={d.label}
                selected={isSelected}
                isPrimary={index === 0}
                onSelect={() => toggleDomain(d.id)}
              />
            );
          })}
        </div>
        {value.domainIds.length > 1 ? (
          <p className="mt-4 text-xs text-white/40">
            {value.domainIds.length} domaines —{" "}
            <span className="text-[#a8a3ff]">{selectedDomains[0]?.label}</span> est le domaine principal
          </p>
        ) : null}
      </SpecialtiesSection>

      <SpecialtiesSection
        step={2}
        title="Vos spécialités"
        subtitle={
          selectedDomains.length > 0
            ? "Spécialités proposées selon vos domaines. Sélectionnez autant de spécialités que vous le souhaitez."
            : undefined
        }
        visible={value.domainIds.length > 0}
      >
        <div className="space-y-6">
          {groupedByDomain.map(({ domain, items }) => (
            <div key={domain.id}>
              <p className="text-xs font-medium text-white/45">{domain.label}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {items.map(({ key, label }) => (
                  <SelectChip
                    key={key}
                    label={label}
                    selected={value.specialtyKeys.includes(key)}
                    onToggle={() => set({ specialtyKeys: toggleItem(value.specialtyKeys, key) })}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        {value.specialtyKeys.length > 0 ? (
          <p className="mt-4 text-xs text-white/40">
            {value.specialtyKeys.length} spécialité{value.specialtyKeys.length > 1 ? "s" : ""} sélectionnée
            {value.specialtyKeys.length > 1 ? "s" : ""}
          </p>
        ) : null}
      </SpecialtiesSection>

      <SpecialtiesSection
        step={3}
        title="Formats d'intervention"
        subtitle="Comment intervenez-vous auprès des apprenants et des organisations ?"
        visible={value.specialtyKeys.length > 0}
      >
        <div className="flex flex-wrap gap-2">
          {EXPERT_INTERVENTION_FORMATS.map((f) => (
            <SelectChip
              key={f}
              label={f}
              selected={value.formats.includes(f)}
              onToggle={() => set({ formats: toggleItem(value.formats, f) })}
            />
          ))}
        </div>
      </SpecialtiesSection>

      <SpecialtiesSection
        step={4}
        title="Public accompagné"
        subtitle="À qui s'adressent vos interventions ? Sélection multiple sans limite."
        visible={value.formats.length > 0}
      >
        <div className="flex flex-wrap gap-2">
          {EXPERT_AUDIENCES.map((a) => (
            <SelectChip
              key={a}
              label={a}
              selected={value.audiences.includes(a)}
              onToggle={() => set({ audiences: toggleItem(value.audiences, a) })}
            />
          ))}
        </div>
      </SpecialtiesSection>

      <SpecialtiesSection
        step={5}
        title="Informations complémentaires"
        subtitle="Affinez votre profil pour faciliter le matching avec les entreprises."
        visible={value.audiences.length > 0}
      >
        <div className="space-y-6">
          <div>
            <label className="text-xs font-medium text-white/45">Années d&apos;expérience</label>
            <div className="mt-3 flex flex-wrap gap-2">
              {EXPERT_EXPERIENCE_OPTIONS.map((opt) => (
                <SelectChip
                  key={opt}
                  label={opt}
                  size="md"
                  selected={value.yearsExperience === opt}
                  onToggle={() =>
                    set({ yearsExperience: value.yearsExperience === opt ? "" : opt })
                  }
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-white/45">Zones géographiques</label>
            <div className="mt-3 flex flex-wrap gap-2">
              {EXPERT_GEOGRAPHIC_ZONES.map((z) => (
                <SelectChip
                  key={z}
                  label={z}
                  selected={value.geographicZones.includes(z)}
                  onToggle={() => set({ geographicZones: toggleItem(value.geographicZones, z) })}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-white/45">Langues parlées</label>
            <div className="mt-3 flex flex-wrap gap-2">
              {EXPERT_LANGUAGE_OPTIONS.map((lang) => (
                <SelectChip
                  key={lang}
                  label={lang}
                  selected={value.languages.includes(lang)}
                  onToggle={() => set({ languages: toggleItem(value.languages, lang) })}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-white/45">Disponibilités</label>
            <div className="mt-3 flex flex-wrap gap-2">
              {EXPERT_AVAILABILITY_OPTIONS.map((opt) => (
                <SelectChip
                  key={opt}
                  label={opt}
                  selected={value.availabilities.includes(opt)}
                  onToggle={() => set({ availabilities: toggleItem(value.availabilities, opt) })}
                />
              ))}
            </div>
          </div>
        </div>
      </SpecialtiesSection>
    </div>
  );
}
