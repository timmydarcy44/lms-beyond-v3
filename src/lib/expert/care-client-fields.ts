export const CARE_FOLLOW_UPS = [
  { value: "self", label: "Le suivi concerne le client" },
  { value: "one_child", label: "Le suivi concerne un enfant" },
  { value: "two_children", label: "Le suivi concerne deux enfants" },
] as const;

export type CareFollowUp = (typeof CARE_FOLLOW_UPS)[number]["value"];

export type CareClientIdentity = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address_line: string;
  postal_code: string;
  city: string;
  follow_up: CareFollowUp;
  child_one_first_name: string;
  child_one_last_name: string;
  child_two_first_name: string;
  child_two_last_name: string;
};

export function parseFollowUp(value: unknown): CareFollowUp {
  return value === "one_child" || value === "two_children" ? value : "self";
}

function nameOf(first?: string | null, last?: string | null) {
  return [first, last].filter((part) => part?.trim()).join(" ").trim();
}

export function followUpLabel(client: {
  follow_up?: string | null;
  child_one_first_name?: string | null;
  child_one_last_name?: string | null;
  child_two_first_name?: string | null;
  child_two_last_name?: string | null;
}) {
  const kind = parseFollowUp(client.follow_up);
  const one = nameOf(client.child_one_first_name, client.child_one_last_name);
  const two = nameOf(client.child_two_first_name, client.child_two_last_name);
  if (kind === "one_child") return one ? `Enfant suivi : ${one}` : "Suivi d'un enfant";
  if (kind === "two_children") {
    const names = [one, two].filter(Boolean).join(" · ");
    return names ? `Enfants suivis : ${names}` : "Suivi de deux enfants";
  }
  return null;
}

export function validateCareClient(input: Partial<CareClientIdentity>): string | null {
  if (!input.first_name?.trim()) return "Prénom du client requis";
  if (!input.last_name?.trim()) return "Nom du client requis";
  if (!input.email?.trim()?.includes("@")) return "Adresse e-mail requise";
  if (!input.phone?.trim()) return "Numéro de téléphone requis";
  if (!input.address_line?.trim()) return "Adresse postale requise";
  if (!input.postal_code?.trim()) return "Code postal requis";
  if (!input.city?.trim()) return "Ville requise";
  const followUp = parseFollowUp(input.follow_up);
  if (followUp === "one_child" || followUp === "two_children") {
    if (!input.child_one_first_name?.trim() || !input.child_one_last_name?.trim()) {
      return "Nom et prénom du premier enfant requis";
    }
  }
  if (followUp === "two_children") {
    if (!input.child_two_first_name?.trim() || !input.child_two_last_name?.trim()) {
      return "Nom et prénom du second enfant requis";
    }
  }
  return null;
}
