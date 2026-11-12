export type AccountManager = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  photoUrl: string | null;
  isActive: boolean;
  fullName: string;
};

export function mapAccountManagerRow(row: {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  photo_url?: string | null;
  is_active?: boolean | null;
}): AccountManager {
  const firstName = String(row.first_name ?? "").trim();
  const lastName = String(row.last_name ?? "").trim();
  return {
    id: String(row.id),
    firstName,
    lastName,
    email: String(row.email ?? "").trim().toLowerCase(),
    phone: row.phone ? String(row.phone).trim() : null,
    photoUrl: row.photo_url ? String(row.photo_url).trim() : null,
    isActive: row.is_active !== false,
    fullName: [firstName, lastName].filter(Boolean).join(" ").trim() || "Gestionnaire",
  };
}
