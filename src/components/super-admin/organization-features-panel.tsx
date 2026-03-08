"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

type FeatureRow = { feature_key: string; is_enabled: boolean | null };

type Props = {
  orgId: string;
  initialFeatures: FeatureRow[];
};

const FEATURE_LIST = [
  {
    key: "beyond_connect",
    label: "Beyond Connect",
    description: "Matching, talents, recrutement et accès Connect.",
  },
  {
    key: "beyond_lms",
    label: "Beyond LMS",
    description: "Formations, parcours et contenus pédagogiques.",
  },
  {
    key: "beyond_care",
    label: "Beyond Care",
    description: "Suivi d'accompagnement et indicateurs care.",
  },
  {
    key: "beyond_play",
    label: "Beyond Play",
    description: "Expériences interactives et gamification.",
  },
  {
    key: "beyond_note",
    label: "Beyond Note",
    description: "Notes, ressources personnelles et mémoire.",
  },
];

export function OrganizationFeaturesPanel({ orgId, initialFeatures }: Props) {
  const initialMap = useMemo(() => {
    const map = new Map<string, boolean>();
    initialFeatures.forEach((feature) => {
      map.set(feature.feature_key, Boolean(feature.is_enabled));
    });
    return map;
  }, [initialFeatures]);

  const [featureState, setFeatureState] = useState<Record<string, boolean>>(() =>
    FEATURE_LIST.reduce<Record<string, boolean>>((acc, feature) => {
      acc[feature.key] = initialMap.get(feature.key) ?? false;
      return acc;
    }, {})
  );

  const handleToggle = async (featureKey: string, value: boolean) => {
    setFeatureState((prev) => ({ ...prev, [featureKey]: value }));
    try {
      const response = await fetch(`/api/super/organisations/${orgId}/features`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature_key: featureKey, is_enabled: value }),
      });
      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour du produit");
      }
      const label = FEATURE_LIST.find((item) => item.key === featureKey)?.label ?? "Produit";
      toast.success(`Accès ${label} ${value ? "activé" : "désactivé"}`);
    } catch (error) {
      console.error("Error updating feature:", error);
      setFeatureState((prev) => ({ ...prev, [featureKey]: !value }));
      toast.error("Erreur lors de la mise à jour");
    }
  };

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {FEATURE_LIST.map((feature) => (
        <div
          key={feature.key}
          className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4"
        >
          <div>
            <p className="text-sm font-semibold text-gray-900">{feature.label}</p>
            <p className="text-xs text-gray-600 mt-1">{feature.description}</p>
          </div>
          <input
            type="checkbox"
            className="h-4 w-4 mt-1"
            checked={featureState[feature.key]}
            onChange={(e) => handleToggle(feature.key, e.target.checked)}
          />
        </div>
      ))}
    </div>
  );
}
