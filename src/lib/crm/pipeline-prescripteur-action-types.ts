/** Types d'actions relationnelles — style emoji Apple / Revolut */
export const PRESCRIPTEUR_ACTION_TYPES = [
  { value: "linkedin_contact", label: "Contact LinkedIn", icon: "💼", hint: "Message ou interaction LinkedIn" },
  { value: "phone", label: "Appel téléphone", icon: "📞", hint: "Contact téléphonique" },
  { value: "email", label: "Contact par mail", icon: "✉️", hint: "Échange email" },
  { value: "informal_meeting", label: "Rendez-vous informel", icon: "🤝", hint: "Échange informel" },
  { value: "coffee", label: "Boire un café", icon: "☕", hint: "Café / pause" },
  { value: "restaurant_invite", label: "Invitation restaurant", icon: "🍽️", hint: "Déjeuner ou dîner" },
  { value: "meeting", label: "Rendez-vous", icon: "📅", hint: "RDV formel / visio" },
  { value: "note", label: "Note", icon: "📝", hint: "Mémo libre" },
  { value: "other", label: "Autre", icon: "✨", hint: "Autre action" },
] as const;

export type PrescripteurActionType = (typeof PRESCRIPTEUR_ACTION_TYPES)[number]["value"];

export function isPrescripteurActionType(value: string): value is PrescripteurActionType {
  return PRESCRIPTEUR_ACTION_TYPES.some((t) => t.value === value);
}

export function prescripteurActionLabel(type: string): string {
  return PRESCRIPTEUR_ACTION_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function prescripteurActionIcon(type: string): string {
  return PRESCRIPTEUR_ACTION_TYPES.find((t) => t.value === type)?.icon ?? "•";
}
